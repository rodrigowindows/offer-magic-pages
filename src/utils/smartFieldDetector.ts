// Smart field detector that tests combinations against database
import { supabase } from "@/integrations/supabase/client";
import type { CombinedField, CleanupRule } from "@/components/FieldCombiner";

export interface DetectionResult {
  field: CombinedField;
  dbField: string;
  matchCount: number;
  totalRows: number;
  matchPercentage: number;
  sampleMatches: string[];
}

interface FieldCombination {
  name: string;
  dbField: string;
  sourceColumns: string[];
  separator: string;
  cleanupRules: CleanupRule[];
}

/**
 * Smart detect which field combinations work best with the database
 */
export async function autoDetectBestCombinations(
  availableColumns: string[],
  sampleData: Record<string, string>,
  onProgress?: (status: string) => void
): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  // Define potential combinations to test
  const combinations: FieldCombination[] = [
    // Owner Name combinations
    {
      name: 'Owner Full Name',
      dbField: 'owner_name',
      sourceColumns: ['Input First Name', 'Input Last Name'],
      separator: ' ',
      cleanupRules: ['trim', 'removeEmptyValues'],
    },
    {
      name: 'Owner Full Name (Fixed)',
      dbField: 'owner_name',
      sourceColumns: ['Owner Fix - First Name', 'Owner Fix - Last Name'],
      separator: ' ',
      cleanupRules: ['trim', 'removeEmptyValues'],
    },
    {
      name: 'Owner Name (Last, First)',
      dbField: 'owner_name',
      sourceColumns: ['Input Last Name', 'Input First Name'],
      separator: ', ',
      cleanupRules: ['trim', 'removeEmptyValues'],
    },

    // Owner Address combinations
    {
      name: 'Owner Full Address',
      dbField: 'owner_address',
      sourceColumns: ['Input Mailing Address', 'Input Mailing City', 'Input Mailing State', 'Input Mailing Zip'],
      separator: ', ',
      cleanupRules: ['trim', 'removeEmptyValues'],
    },
    {
      name: 'Owner Full Address (Fixed)',
      dbField: 'owner_address',
      sourceColumns: ['Owner Fix - Mailing Address', 'Owner Fix - Mailing City', 'Owner Fix - Mailing State', 'Owner Fix - Mailing Zip'],
      separator: ', ',
      cleanupRules: ['trim', 'removeEmptyValues'],
    },
    {
      name: 'Owner Mailing Address',
      dbField: 'owner_address',
      sourceColumns: ['Input Mailing Address'],
      separator: '__NONE__',
      cleanupRules: ['trim'],
    },
  ];

  // Filter combinations to only those where all columns exist
  const validCombinations = combinations.filter(combo =>
    combo.sourceColumns.every(col => availableColumns.includes(col))
  );

  onProgress?.(`Testando ${validCombinations.length} combinações contra o banco de dados...`);

  // Test each valid combination
  for (let i = 0; i < validCombinations.length; i++) {
    const combo = validCombinations[i];
    onProgress?.(`Testando ${combo.name} (${i + 1}/${validCombinations.length})...`);

    const result = await testCombination(combo, sampleData);
    if (result && result.matchPercentage > 0) {
      results.push(result);
    }
  }

  // Sort by match percentage (best matches first)
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);

  onProgress?.(`✓ Encontradas ${results.length} combinações com matches!`);

  return results;
}

/**
 * Test a specific field combination against the database
 */
async function testCombination(
  combo: FieldCombination,
  sampleData: Record<string, string>
): Promise<DetectionResult | null> {
  try {
    // Generate the combined value from sample data
    const combinedValue = combineValues(
      sampleData,
      combo.sourceColumns,
      combo.separator,
      combo.cleanupRules
    );

    if (!combinedValue) {
      return null;
    }

    // Search database for matches
    const { data, error, count } = await supabase
      .from('properties')
      .select(combo.dbField, { count: 'exact' })
      .ilike(combo.dbField, `%${combinedValue}%`)
      .limit(5);

    if (error) {
      console.error(`Error testing ${combo.name}:`, error);
      return null;
    }

    const matchCount = count || 0;
    const sampleMatches = data?.map(row => row[combo.dbField]).filter(Boolean) || [];

    // Get total rows for percentage calculation
    const { count: totalRows } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const matchPercentage = totalRows ? (matchCount / totalRows) * 100 : 0;

    const field: CombinedField = {
      id: `auto_${combo.name.replace(/\s/g, '_')}_${Date.now()}`,
      name: combo.name,
      sourceColumns: combo.sourceColumns,
      separator: combo.separator,
      cleanupRules: combo.cleanupRules as CleanupRule[],
      preview: combinedValue,
    };

    return {
      field,
      dbField: combo.dbField,
      matchCount,
      totalRows: totalRows || 0,
      matchPercentage,
      sampleMatches,
    };
  } catch (error) {
    console.error(`Error testing combination ${combo.name}:`, error);
    return null;
  }
}

/**
 * Combine field values using the same logic as FieldCombiner
 */
function combineValues(
  row: Record<string, string>,
  sourceColumns: string[],
  separator: string,
  cleanupRules: string[]
): string {
  let values = sourceColumns.map(col => row[col] || '');

  if (cleanupRules.includes('removeEmptyValues')) {
    values = values.filter(v => v.trim() !== '');
  }

  values = values.map(v => applyCleanup(v, cleanupRules));

  const actualSeparator = separator === '__NONE__' ? '' : separator;
  return values.join(actualSeparator);
}

/**
 * Apply cleanup rules to a value
 */
function applyCleanup(value: string, rules: string[]): string {
  let result = value;

  rules.forEach(rule => {
    switch (rule) {
      case 'trim':
        result = result.trim();
        break;
      case 'uppercase':
        result = result.toUpperCase();
        break;
      case 'lowercase':
        result = result.toLowerCase();
        break;
      case 'removeSpecialChars':
        result = result.replace(/[^a-zA-Z0-9\s]/g, '');
        break;
      case 'removeDuplicateSpaces':
        result = result.replace(/\s+/g, ' ');
        break;
    }
  });

  return result;
}
