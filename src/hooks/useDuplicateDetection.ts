/**
 * Hook to detect duplicate addresses during import.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateMatch {
  importRow: number;
  importAddress: string;
  existingId: string;
  existingAddress: string;
  similarity: number; // 0-1
}

const normalizeAddress = (addr: string): string => {
  return addr
    .toUpperCase()
    .replace(/[.,#\-]/g, ' ')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bCIRCLE\b/g, 'CIR')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
    .replace(/\s+/g, ' ')
    .trim();
};

const similarityScore = (a: string, b: string): number => {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  // Simple containment check
  if (longer.includes(shorter)) return shorter.length / longer.length;

  // Levenshtein-based
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  return (longer.length - costs[longer.length]) / longer.length;
};

export const useDuplicateDetection = () => {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = useCallback(async (addresses: { row: number; address: string }[]): Promise<DuplicateMatch[]> => {
    if (addresses.length === 0) return [];
    setIsChecking(true);

    try {
      // Fetch existing addresses
      const { data } = await supabase
        .from('properties')
        .select('id, address')
        .limit(1000);

      if (!data || data.length === 0) {
        setDuplicates([]);
        return [];
      }

      const existingNormalized = data.map(p => ({
        ...p,
        normalized: normalizeAddress(p.address),
      }));

      const matches: DuplicateMatch[] = [];

      for (const importItem of addresses) {
        const normalized = normalizeAddress(importItem.address);

        for (const existing of existingNormalized) {
          const sim = similarityScore(normalized, existing.normalized);
          if (sim >= 0.85) {
            matches.push({
              importRow: importItem.row,
              importAddress: importItem.address,
              existingId: existing.id,
              existingAddress: existing.address,
              similarity: sim,
            });
          }
        }
      }

      // Sort by similarity desc
      matches.sort((a, b) => b.similarity - a.similarity);
      setDuplicates(matches);
      return matches;
    } catch (err) {
      console.error('Duplicate check error:', err);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { duplicates, isChecking, checkDuplicates, clearDuplicates: () => setDuplicates([]) };
};
