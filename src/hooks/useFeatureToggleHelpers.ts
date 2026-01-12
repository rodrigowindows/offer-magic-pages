/**
 * Feature Toggle Hook Utilities - Helpers para usar feature toggles
 */

import { useFeatureToggle, type FeatureFlags } from '@/contexts/FeatureToggleContext';

/**
 * Hook para obter helper functions adaptativas baseadas em feature flags
 */
export const useAdaptiveContactHelpers = () => {
  const { flags } = useFeatureToggle();

  const getPreferredPhones = (property: any): string[] => {
    if (flags.useTagsForContacts) {
      // Tags approach
      const tags = Array.isArray(property.tags) ? property.tags : [];
      return tags
        .filter((t: any): t is string => typeof t === 'string' && t.startsWith('pref_phone:'))
        .map((t: string) => t.replace('pref_phone:', ''));
    } else {
      // Database columns approach
      return property.preferred_phones || [];
    }
  };

  const getPreferredEmails = (property: any): string[] => {
    if (flags.useTagsForContacts) {
      // Tags approach
      const tags = Array.isArray(property.tags) ? property.tags : [];
      return tags
        .filter((t: any): t is string => typeof t === 'string' && t.startsWith('pref_email:'))
        .map((t: string) => t.replace('pref_email:', ''));
    } else {
      // Database columns approach
      return property.preferred_emails || [];
    }
  };

  const hasPreferredContacts = (property: any): boolean => {
    return getPreferredPhones(property).length > 0 || getPreferredEmails(property).length > 0;
  };

  const getTotalContacts = (property: any): number => {
    return (
      getPreferredPhones(property).length +
      getPreferredEmails(property).length +
      (property.owner_phone ? 1 : 0) +
      (property.owner_email || property.email1 ? 1 : 0)
    );
  };

  return {
    getPreferredPhones,
    getPreferredEmails,
    hasPreferredContacts,
    getTotalContacts,
  };
};

/**
 * Hook para detectar qual preset está ativo
 */
export const useActivePreset = (): 'full' | 'legacy' | 'modern' | 'minimal' | 'custom' => {
  const { flags } = useFeatureToggle();

  // Check exact matches with presets
  const isFullMatch = (
    flags.useTagsForContacts === true &&
    flags.enableBatchProcessing === true &&
    flags.useModernGradients === true &&
    flags.enableQRCodes === true
  );

  const isLegacyMatch = (
    flags.useTagsForContacts === false &&
    flags.enableSkipTracingData === true &&
    flags.useModernGradients === false &&
    flags.enableQRCodes === false
  );

  const isModernMatch = (
    flags.useTagsForContacts === false &&
    flags.useModernGradients === true &&
    flags.enableQRCodes === true
  );

  const isMinimalMatch = (
    flags.enableCampaignPreview === false &&
    flags.enableBatchProcessing === false &&
    flags.useModernGradients === false &&
    flags.enableQRCodes === false &&
    flags.showMetricCards === false
  );

  if (isFullMatch) return 'full';
  if (isLegacyMatch) return 'legacy';
  if (isModernMatch) return 'modern';
  if (isMinimalMatch) return 'minimal';
  return 'custom';
};
