/**
 * Comps Analysis - Modular Components
 * Refactored from monolithic 3408-line component
 */

// Phase 1 Components
export { OnboardingTour } from './OnboardingTour';
export { CommandPalette } from './CommandPalette';
export { SmartInsights } from './SmartInsights';
export { ExecutiveSummary } from './ExecutiveSummary';

// Phase 2 Components
export { PropertySelector } from './PropertySelector';
export { CompsFilters } from './CompsFilters';
export { CompsTable } from './CompsTable';
export { AnalysisHistory } from './AnalysisHistory';
export { CompareDialog } from './CompareDialog';

// Types
export type {
  Property,
  ComparableProperty,
  MarketAnalysis,
  AnalysisHistoryItem,
  OfferHistoryItem,
  SmartInsights as SmartInsightsType,
  OfferStatusFilter,
  TabType,
  SortBy,
  DataSource,
} from './types';

// Component Props
export type { OnboardingTourProps } from './OnboardingTour';
export type { CommandPaletteProps } from './CommandPalette';
export type { SmartInsightsProps } from './SmartInsights';
export type { ExecutiveSummaryProps } from './ExecutiveSummary';
export type { PropertySelectorProps } from './PropertySelector';
export type { CompsFiltersProps, CompsFiltersConfig } from './CompsFilters';
export type { CompsTableProps } from './CompsTable';
export type { AnalysisHistoryProps } from './AnalysisHistory';
export type { CompareDialogProps } from './CompareDialog';
