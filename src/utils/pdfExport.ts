/**
 * PDF Export — barrel re-export
 * Refactored from 1169-line monolith into focused modules:
 *   pdf/types.ts            — shared interfaces
 *   pdf/helpers.ts          — header, footer, image, address, validation utils
 *   pdf/exportSingleCMA.ts  — single property CMA (full + simple)
 *   pdf/exportConsolidatedCMA.ts — multi-property consolidated report
 */
export type { PropertyData, ComparableProperty, MarketAnalysis } from './pdf/types';
export { exportCompsToPDF, exportCompsToSimplePDF } from './pdf/exportSingleCMA';
export { exportConsolidatedCompsPDF } from './pdf/exportConsolidatedCMA';
