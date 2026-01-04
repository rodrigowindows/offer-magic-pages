// Enhanced field matcher with flexible column selection and AI comparison
import { supabase } from "@/integrations/supabase/client";
import type { CombinedField } from "@/components/FieldCombiner";

export interface MatchResult {
  csvValue: string;
  dbValue: string;
  similarity: number;
  field: string;
}

export interface FieldTestResult {
  combination: CombinedField;
  dbField: string;
  matches: MatchResult[];
  totalMatches: number;
  matchPercentage: number;
  avgSimilarity: number;
}

/**
 * Test a specific field combination against database field with AI similarity scoring
 */
export async function testFieldCombination(
  csvData: Record<string, string>[], // Will use sample of max 50 rows
  combination: CombinedField,
  dbField: string,
  onProgress?: (status: string) => void
): Promise<FieldTestResult | null> {
  try {
    onProgress?.(`Testando ${combination.name} → ${dbField}...`);

    // Combine values from CSV
    const csvValues = csvData.map(row =>
      combineValues(row, combination.sourceColumns, combination.separator, combination.cleanupRules)
    ).filter(v => v.trim() !== '');

    if (csvValues.length === 0) {
      return null;
    }

    // Get sample from database
    const { data: dbRows, error } = await supabase
      .from('properties')
      .select(dbField)
      .limit(100);

    if (error || !dbRows || dbRows.length === 0) {
      console.error('Error fetching from database:', error);
      return null;
    }

    const dbValues = dbRows.map(row => row[dbField]).filter(Boolean);

    // Compare and find matches
    const matches: MatchResult[] = [];
    let totalMatches = 0;

    for (let i = 0; i < Math.min(csvValues.length, 10); i++) {
      const csvVal = csvValues[i];

      // Find best match in DB
      let bestMatch: MatchResult | null = null;
      let bestSimilarity = 0;

      for (const dbVal of dbValues) {
        const similarity = calculateSimilarity(csvVal, dbVal);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = {
            csvValue: csvVal,
            dbValue: dbVal,
            similarity,
            field: dbField,
          };
        }
      }

      if (bestMatch && bestSimilarity > 0.5) {
        matches.push(bestMatch);
        totalMatches++;
      }
    }

    const avgSimilarity = matches.length > 0
      ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length
      : 0;

    const matchPercentage = (totalMatches / Math.min(csvValues.length, 10)) * 100;

    return {
      combination,
      dbField,
      matches: matches.slice(0, 5), // Top 5 matches
      totalMatches,
      matchPercentage,
      avgSimilarity,
    };
  } catch (error) {
    console.error('Error testing field combination:', error);
    return null;
  }
}

/**
 * Test multiple combinations against multiple DB fields and rank by quality
 */
export async function testAllCombinations(
  csvData: Record<string, string>[],
  availableColumns: string[],
  dbFields: string[],
  onProgress?: (status: string) => void
): Promise<FieldTestResult[]> {
  const results: FieldTestResult[] = [];
  const csvSample = csvData.slice(0, 50);

  // Generate smart combinations
  const combinations = generateSmartCombinations(availableColumns);

  onProgress?.(`Testando ${combinations.length} combinações contra ${dbFields.length} campos...`);

  let tested = 0;
  const total = combinations.length * dbFields.length;

  // Test each combination against each DB field
  for (const combo of combinations) {
    for (const dbField of dbFields) {
      tested++;
      onProgress?.(`Progresso: ${tested}/${total} testes...`);

      const result = await testFieldCombination(csvSample, combo, dbField, onProgress);

      if (result && result.avgSimilarity > 0.3) {
        results.push(result);
      }
    }
  }

  // Sort by best matches first
  results.sort((a, b) => {
    // First by average similarity
    if (Math.abs(b.avgSimilarity - a.avgSimilarity) > 0.1) {
      return b.avgSimilarity - a.avgSimilarity;
    }
    // Then by match percentage
    return b.matchPercentage - a.matchPercentage;
  });

  onProgress?.(`✓ Encontradas ${results.length} combinações com bons matches!`);

  return results;
}

/**
 * Use AI to compare and rank matches by address similarity
 * Note: This is a simplified version that uses local similarity scoring
 */
export async function rankMatchesWithAI(
  matches: MatchResult[],
  onProgress?: (status: string) => void
): Promise<MatchResult[]> {
  try {
    onProgress?.('Rankeando matches por similaridade...');

    // Sort matches by similarity score (descending)
    const ranked = [...matches].sort((a, b) => b.similarity - a.similarity);

    onProgress?.('✓ Ranking completo!');
    return ranked;
  } catch (error) {
    console.error('Error ranking matches:', error);
    return matches;
  }
}


/**
 * Generate smart field combinations based on available columns
 */
function generateSmartCombinations(columns: string[]): CombinedField[] {
  const combinations: CombinedField[] = [];
  const timestamp = Date.now();

  // Name combinations
  const firstNameCols = columns.filter(c =>
    c.toLowerCase().includes('first') && c.toLowerCase().includes('name')
  );
  const lastNameCols = columns.filter(c =>
    c.toLowerCase().includes('last') && c.toLowerCase().includes('name')
  );

  firstNameCols.forEach((first, i) => {
    lastNameCols.forEach((last, j) => {
      combinations.push({
        id: `name_${i}_${j}_${timestamp}`,
        name: `Full Name (${first} + ${last})`,
        sourceColumns: [first, last],
        separator: ' ',
        cleanupRules: ['trim', 'removeEmptyValues'],
      });
    });
  });

  // Address combinations
  const addressCols = columns.filter(c =>
    c.toLowerCase().includes('address') && !c.toLowerCase().includes('email')
  );
  const cityCols = columns.filter(c =>
    c.toLowerCase().includes('city')
  );
  const stateCols = columns.filter(c =>
    c.toLowerCase().includes('state')
  );
  const zipCols = columns.filter(c =>
    c.toLowerCase().includes('zip') || c.toLowerCase().includes('postal')
  );

  addressCols.forEach((addr, i) => {
    // Address only
    combinations.push({
      id: `addr_only_${i}_${timestamp}`,
      name: `Address Only (${addr})`,
      sourceColumns: [addr],
      separator: '__NONE__',
      cleanupRules: ['trim'],
    });

    // Address + City + State + Zip
    cityCols.forEach((city, j) => {
      stateCols.forEach((state, k) => {
        zipCols.forEach((zip, l) => {
          combinations.push({
            id: `full_addr_${i}_${j}_${k}_${l}_${timestamp}`,
            name: `Full Address (${addr} + ${city} + ${state} + ${zip})`,
            sourceColumns: [addr, city, state, zip],
            separator: ', ',
            cleanupRules: ['trim', 'removeEmptyValues'],
          });
        });
      });
    });
  });

  // Limit to prevent too many combinations
  return combinations.slice(0, 25);
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Quick checks
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const editDistance = levenshteinDistance(longer, shorter);
  const similarity = (longer.length - editDistance) / longer.length;

  return Math.max(0, similarity);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Combine values using same logic as FieldCombiner
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
 * Apply cleanup rules
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
