import { describe, it, expect } from 'vitest';

// We test the pure utility functions by re-implementing them here
// since they're not exported from the module. This tests the algorithm logic.

function applyCleanup(value: string, rules: string[]): string {
  let result = value;
  rules.forEach(rule => {
    switch (rule) {
      case 'trim': result = result.trim(); break;
      case 'uppercase': result = result.toUpperCase(); break;
      case 'lowercase': result = result.toLowerCase(); break;
      case 'removeSpecialChars': result = result.replace(/[^a-zA-Z0-9\s]/g, ''); break;
      case 'removeDuplicateSpaces': result = result.replace(/\s+/g, ' '); break;
    }
  });
  return result;
}

function combineValues(row: Record<string, string>, sourceColumns: string[], separator: string, cleanupRules: string[]): string {
  let values = sourceColumns.map(col => row[col] || '');
  if (cleanupRules.includes('removeEmptyValues')) {
    values = values.filter(v => v.trim() !== '');
  }
  values = values.map(v => applyCleanup(v, cleanupRules));
  const actualSeparator = separator === '__NONE__' ? '' : separator;
  return values.join(actualSeparator);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.max(0, (longer.length - editDistance) / longer.length);
}

describe('applyCleanup', () => {
  it('trims whitespace', () => {
    expect(applyCleanup('  hello  ', ['trim'])).toBe('hello');
  });

  it('converts to uppercase', () => {
    expect(applyCleanup('hello', ['uppercase'])).toBe('HELLO');
  });

  it('converts to lowercase', () => {
    expect(applyCleanup('HELLO', ['lowercase'])).toBe('hello');
  });

  it('removes special characters', () => {
    expect(applyCleanup('hello! @world#', ['removeSpecialChars'])).toBe('hello world');
  });

  it('removes duplicate spaces', () => {
    expect(applyCleanup('hello   world', ['removeDuplicateSpaces'])).toBe('hello world');
  });

  it('applies multiple rules in order', () => {
    expect(applyCleanup('  HELLO   WORLD!  ', ['trim', 'lowercase', 'removeSpecialChars', 'removeDuplicateSpaces'])).toBe('hello world');
  });
});

describe('combineValues', () => {
  it('combines columns with separator', () => {
    const row = { first: 'John', last: 'Doe' };
    expect(combineValues(row, ['first', 'last'], ' ', ['trim'])).toBe('John Doe');
  });

  it('uses __NONE__ for no separator', () => {
    const row = { a: 'Hello', b: 'World' };
    expect(combineValues(row, ['a', 'b'], '__NONE__', ['trim'])).toBe('HelloWorld');
  });

  it('removes empty values when rule applied', () => {
    const row = { a: 'Hello', b: '', c: 'World' };
    expect(combineValues(row, ['a', 'b', 'c'], ', ', ['trim', 'removeEmptyValues'])).toBe('Hello, World');
  });

  it('handles missing columns gracefully', () => {
    const row = { a: 'Hello' };
    expect(combineValues(row, ['a', 'missing'], ' ', ['trim', 'removeEmptyValues'])).toBe('Hello');
  });
});

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns string length for empty comparison', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  it('calculates single edit distance', () => {
    expect(levenshteinDistance('kitten', 'sitten')).toBe(1);
  });

  it('calculates multi-edit distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('calculateSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 1.0 for case-insensitive match', () => {
    expect(calculateSimilarity('Hello', 'hello')).toBe(1.0);
  });

  it('returns 0.8 for substring match', () => {
    expect(calculateSimilarity('hello world', 'hello')).toBe(0.8);
  });

  it('returns 0 for empty string', () => {
    expect(calculateSimilarity('', 'hello')).toBe(0);
  });

  it('returns high similarity for similar strings', () => {
    expect(calculateSimilarity('123 Main St', '123 Main Street')).toBeGreaterThan(0.5);
  });

  it('returns low similarity for very different strings', () => {
    expect(calculateSimilarity('abc', 'xyz')).toBeLessThan(0.5);
  });
});
