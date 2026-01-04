import type { DatabaseFieldKey } from "@/components/ColumnMappingDialog";

/**
 * Calcula similaridade entre duas strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Quantos caracteres em comum (ordem preservada)
  let matches = 0;
  let pos = 0;

  for (const char of s1) {
    const index = s2.indexOf(char, pos);
    if (index >= 0) {
      matches++;
      pos = index + 1;
    }
  }

  return matches / Math.max(s1.length, s2.length);
}

/**
 * Detecta tipo de campo baseado no conteúdo
 */
export function detectFieldByContent(values: string[]): DatabaseFieldKey | null {
  const sample = values.filter(v => v && v.trim()).slice(0, 20);
  if (sample.length === 0) return null;

  // Endereços: contém número + nome de rua
  const addressPattern = /\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|ct|court|way|pl|place)/i;
  if (sample.filter(v => addressPattern.test(v)).length > sample.length * 0.5) {
    return 'address';
  }

  // Telefones: (XXX) XXX-XXXX ou XXX-XXX-XXXX
  const phonePattern = /(\(\d{3}\)\s*\d{3}[-.]?\d{4})|(\d{3}[-.]?\d{3}[-.]?\d{4})/;
  if (sample.filter(v => phonePattern.test(v)).length > sample.length * 0.5) {
    return 'owner_phone';
  }

  // Valores monetários: $X,XXX.XX
  const moneyPattern = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/;
  if (sample.filter(v => moneyPattern.test(v.trim())).length > sample.length * 0.5) {
    return 'estimated_value';
  }

  // CEP: 12345 ou 12345-6789
  const zipPattern = /^\d{5}(-\d{4})?$/;
  if (sample.filter(v => zipPattern.test(v.trim())).length > sample.length * 0.5) {
    return 'zip_code';
  }

  // Email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (sample.filter(v => emailPattern.test(v.trim())).length > sample.length * 0.5) {
    return null; // Não temos campo de email ainda
  }

  // Anos: 1900-2100
  const yearPattern = /^(19|20)\d{2}$/;
  if (sample.filter(v => yearPattern.test(v.trim())).length > sample.length * 0.5) {
    return 'year_built';
  }

  // Estados: FL, CA, NY (2 letras uppercase)
  const statePattern = /^[A-Z]{2}$/;
  if (sample.filter(v => statePattern.test(v.trim())).length > sample.length * 0.5) {
    return 'state';
  }

  return null;
}

/**
 * Calcula score combinado de nome + conteúdo
 */
export function calculateMatchScore(
  csvColumn: string,
  dbFieldKey: string,
  dbFieldLabel: string,
  values: string[]
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Score por similaridade de nome (peso 40%)
  const nameScoreKey = calculateSimilarity(csvColumn, dbFieldKey);
  const nameScoreLabel = calculateSimilarity(csvColumn, dbFieldLabel);
  const nameScore = Math.max(nameScoreKey, nameScoreLabel);

  if (nameScore > 0) {
    score += nameScore * 0.4;
    if (nameScore > 0.8) {
      reasons.push(`Nome muito similar (${(nameScore * 100).toFixed(0)}%)`);
    } else if (nameScore > 0.5) {
      reasons.push(`Nome similar (${(nameScore * 100).toFixed(0)}%)`);
    }
  }

  // Score por conteúdo (peso 60%)
  const contentMatch = detectFieldByContent(values);
  if (contentMatch === dbFieldKey) {
    score += 0.6;
    reasons.push('Formato de dados detectado');
  }

  // Boost para matches parciais comuns
  const csvLower = csvColumn.toLowerCase();
  const keyLower = dbFieldKey.toLowerCase();

  if (csvLower.includes('owner') && keyLower.includes('owner')) {
    score += 0.1;
    reasons.push('Contém "owner"');
  }
  if (csvLower.includes('address') && keyLower.includes('address')) {
    score += 0.1;
    reasons.push('Contém "address"');
  }
  if (csvLower.includes('value') && keyLower.includes('value')) {
    score += 0.1;
    reasons.push('Contém "value"');
  }

  return {
    score: Math.min(score, 1),
    reason: reasons.join(' + ') || 'Sem correspondência clara'
  };
}

/**
 * Encontra melhor match para uma coluna CSV
 */
export function findBestMatch(
  csvColumn: string,
  values: string[],
  availableFields: Array<{ key: string; label: string; required: boolean }>
): {
  field: DatabaseFieldKey | 'skip';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  score: number;
} {
  const results = availableFields.map(field => {
    const { score, reason } = calculateMatchScore(
      csvColumn,
      field.key,
      field.label,
      values
    );

    return {
      field: field.key as DatabaseFieldKey,
      score,
      reason,
      required: field.required
    };
  });

  // Ordenar por score
  results.sort((a, b) => {
    // Priorizar campos obrigatórios se score é similar
    if (Math.abs(a.score - b.score) < 0.1) {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
    }
    return b.score - a.score;
  });

  const best = results[0];

  // Determinar confiança
  let confidence: 'high' | 'medium' | 'low';
  if (best.score >= 0.8) {
    confidence = 'high';
  } else if (best.score >= 0.5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Se score muito baixo, marcar como skip
  if (best.score < 0.3) {
    return {
      field: 'skip',
      confidence: 'low',
      reason: 'Nenhuma correspondência encontrada',
      score: 0
    };
  }

  return {
    field: best.field,
    confidence,
    reason: best.reason,
    score: best.score
  };
}
