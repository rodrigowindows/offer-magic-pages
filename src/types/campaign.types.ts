/**
 * Campaign-specific types used across campaign wizard components and hooks.
 * Extracted for proper type safety (no more `any`).
 */

import type { Channel } from './marketing.types';

/** Template shape used in campaign wizard */
export interface CampaignTemplate {
  id: string;
  name: string;
  body: string;
  subject?: string;
  channel: string;
  is_default?: boolean;
  description?: string;
}

/** Result of campaign simulation */
export interface SimulationResult {
  total: number;
  wouldSend: number;
  wouldFail: number;
  contactBreakdown: Array<{
    property: string;
    contacts: string[];
    channel: string;
  }>;
  estimatedCost: number;
  estimatedTime: number;
}

/** System health check result */
export interface SystemHealthStatus {
  api: boolean;
  database: boolean;
  services: string[];
  warnings: string[];
}

/** Validation issue from campaign readiness check */
export interface CampaignValidationIssue {
  type: 'error' | 'warning';
  message: string;
  action?: string;
}

/** Contact validation stats */
export interface ContactValidationStats {
  totalContacts: number;
  propertiesWithContacts: number;
  propertiesWithoutContacts: number;
}
