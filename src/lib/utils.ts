import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency (no cents).
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Safe includes check for arrays or strings. Returns false for null/undefined.
 */
export function safeIncludes<T = any>(value: T[] | string | undefined | null, needle: any) {
  if (Array.isArray(value)) return value.includes(needle);
  if (typeof value === 'string') return value.includes(String(needle));
  return false;
}
