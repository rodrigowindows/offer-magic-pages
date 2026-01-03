// Utility functions for combining and processing CSV fields

import type { CombinedField, CleanupRule } from "@/components/FieldCombiner";

/**
 * Apply cleanup rules to a value
 */
export function applyCleanup(value: string, rules: CleanupRule[]): string {
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

/**
 * Combine multiple field values into one based on configuration
 */
export function combineFieldValues(
  row: Record<string, string>,
  config: CombinedField
): string {
  // Get values from source columns
  let values = config.sourceColumns.map(col => row[col] || '');

  // Remove empty values if rule is enabled
  if (config.cleanupRules.includes('removeEmptyValues')) {
    values = values.filter(v => v.trim() !== '');
  }

  // Apply cleanup rules to each value
  values = values.map(v => applyCleanup(v, config.cleanupRules));

  // Join with separator
  const actualSeparator = config.separator === "__NONE__" ? "" : config.separator; return values.join(actualSeparator);
}

/**
 * Process a CSV row and add combined fields
 */
export function processRowWithCombinedFields(
  row: Record<string, string>,
  combinedFields: CombinedField[]
): Record<string, string> {
  const processedRow = { ...row };

  combinedFields.forEach(field => {
    const combinedValue = combineFieldValues(row, field);
    processedRow[field.name] = combinedValue;
  });

  return processedRow;
}

/**
 * Get all column names including combined fields
 */
export function getAllColumnNames(
  originalColumns: string[],
  combinedFields: CombinedField[]
): string[] {
  const combinedFieldNames = combinedFields.map(f => f.name);
  return [...originalColumns, ...combinedFieldNames];
}

/**
 * Check if a column is a combined field
 */
export function isCombinedField(
  columnName: string,
  combinedFields: CombinedField[]
): boolean {
  return combinedFields.some(f => f.name === columnName);
}

/**
 * Get source columns for a combined field
 */
export function getSourceColumns(
  combinedFieldName: string,
  combinedFields: CombinedField[]
): string[] {
  const field = combinedFields.find(f => f.name === combinedFieldName);
  return field?.sourceColumns || [];
}

/**
 * Validate combined field configuration
 */
export function validateCombinedField(
  field: CombinedField,
  availableColumns: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!field.name || field.name.trim() === '') {
    errors.push('Nome do campo é obrigatório');
  }

  if (field.sourceColumns.length === 0) {
    errors.push('Selecione pelo menos uma coluna');
  }

  // Check if source columns exist
  const missingColumns = field.sourceColumns.filter(
    col => !availableColumns.includes(col)
  );

  if (missingColumns.length > 0) {
    errors.push(`Colunas não encontradas: ${missingColumns.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a preset combined field
 */
export function createPresetField(
  preset: 'fullAddress' | 'propertyAddressOnly' | 'fullName' | 'ownerFullName',
  availableColumns: string[]
): CombinedField | null {
  const presets = {
    fullAddress: {
      name: 'Full Address',
      sourceColumns: ['Owner Fix - Mailing Address', 'Owner Fix - Mailing City', 'Owner Fix - Mailing State'],
      separator: ' ',
      cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
    },
    propertyAddressOnly: {
      name: 'Property Address Only',
      sourceColumns: ['Owner Fix - Mailing Address'],
      separator: '__NONE__',
      cleanupRules: ['trim'] as CleanupRule[],
    },
    fullName: {
      name: 'Full Name',
      sourceColumns: ['Input First Name', 'Input Last Name'],
      separator: ' ',
      cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
    },
    ownerFullName: {
      name: 'Owner Full Name',
      sourceColumns: ['Owner Fix - First Name', 'Owner Fix - Last Name'],
      separator: ' ',
      cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
    },
  };

  const config = presets[preset];

  // Filter only existing columns
  const existingColumns = config.sourceColumns.filter(col =>
    availableColumns.includes(col)
  );

  if (existingColumns.length === 0) {
    return null;
  }

  return {
    id: `preset_${preset}_${Date.now()}`,
    ...config,
    sourceColumns: existingColumns,
  };
}

/**
 * Smart detect which combined fields to create based on available columns
 */
export function autoDetectCombinedFields(
  availableColumns: string[]
): CombinedField[] {
  const fields: CombinedField[] = [];

  // Check for Owner Fix address fields
  const hasOwnerFixAddress = availableColumns.includes('Owner Fix - Mailing Address');
  const hasOwnerFixCity = availableColumns.includes('Owner Fix - Mailing City');

  if (hasOwnerFixAddress && !hasOwnerFixCity) {
    // Just address, no city - create "Property Address Only"
    const field = createPresetField('propertyAddressOnly', availableColumns);
    if (field) fields.push(field);
  } else if (hasOwnerFixAddress && hasOwnerFixCity) {
    // Has both - create "Full Address"
    const field = createPresetField('fullAddress', availableColumns);
    if (field) fields.push(field);
  }

  // Check for name fields
  const hasInputFirstName = availableColumns.includes('Input First Name');
  const hasInputLastName = availableColumns.includes('Input Last Name');

  if (hasInputFirstName && hasInputLastName) {
    const field = createPresetField('fullName', availableColumns);
    if (field) fields.push(field);
  }

  // Check for Owner Fix name fields
  const hasOwnerFixFirstName = availableColumns.includes('Owner Fix - First Name');
  const hasOwnerFixLastName = availableColumns.includes('Owner Fix - Last Name');

  if (hasOwnerFixFirstName && hasOwnerFixLastName) {
    const field = createPresetField('ownerFullName', availableColumns);
    if (field) fields.push(field);
  }

  return fields;
}
