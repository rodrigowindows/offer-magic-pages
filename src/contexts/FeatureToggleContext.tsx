/**
 * Feature Toggle System - Controle centralizado de features da aplicação
 * Permite ativar/desativar funcionalidades sem deploy
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FeatureFlags {
  // Contact Management Features
  useTagsForContacts: boolean;          // true = tags approach (current), false = database columns
  showPreferredContactsFilter: boolean;  // Show "Only with Preferred Contacts" filter
  enableSkipTracingData: boolean;        // Use skip_tracing_data field
  
  // Campaign Wizard Features
  enableCampaignPreview: boolean;        // Show preview step in wizard
  enableBatchProcessing: boolean;        // Use batch processing for sends
  showCostEstimates: boolean;           // Show cost estimates in confirmation
  enableRetryLogic: boolean;            // Auto-retry failed sends
  
  // UI/UX Features
  useModernGradients: boolean;          // Modern gradient UI design
  showAnimations: boolean;              // Animated transitions
  enableDarkMode: boolean;              // Dark mode support
  showMetricCards: boolean;             // Show metric cards in wizard
  
  // Advanced Features
  enableQRCodes: boolean;               // QR code generation
  enableURLTracking: boolean;           // UTM tracking on URLs
  enableABTesting: boolean;             // A/B testing features
  showAnalyticsDashboard: boolean;      // Analytics dashboard
  
  // Data Display
  showPropertyImages: boolean;          // Show property images in lists
  enableCompactView: boolean;           // Compact property card view
  showOwnerInfo: boolean;               // Display owner information
  
  // Campaign Features
  enableQuickCampaign: boolean;         // Quick campaign dialog
  enableScheduledSends: boolean;        // Schedule campaigns
  enableTestMode: boolean;              // Test mode for campaigns
  showCampaignTemplates: boolean;       // Template selector
  
  // Property Page Variants
  forcePropertyVariant: 'default' | 'ultra-simple' | 'email-first' | 'minimal' | null;  // Force specific variant (null = A/B test)
}

// Preset Configurations
export const FEATURE_PRESETS = {
  full: {
    useTagsForContacts: true,
    showPreferredContactsFilter: true,
    enableSkipTracingData: false,
    enableCampaignPreview: true,
    enableBatchProcessing: true,
    showCostEstimates: true,
    enableRetryLogic: true,
    useModernGradients: true,
    showAnimations: true,
    enableDarkMode: false,
    showMetricCards: true,
    enableQRCodes: true,
    enableURLTracking: true,
    enableABTesting: true,
    showAnalyticsDashboard: true,
    showPropertyImages: true,
    enableCompactView: false,
    showOwnerInfo: true,
    enableQuickCampaign: true,
    enableScheduledSends: true,
    enableTestMode: true,
    showCampaignTemplates: true,
    forcePropertyVariant: null,  // A/B test
  },
  legacy: {
    useTagsForContacts: false,
    showPreferredContactsFilter: true,
    enableSkipTracingData: true,
    enableCampaignPreview: true,
    enableBatchProcessing: true,
    showCostEstimates: true,
    enableRetryLogic: true,
    useModernGradients: false,
    showAnimations: false,
    enableDarkMode: false,
    showMetricCards: true,
    enableQRCodes: false,
    enableURLTracking: false,
    enableABTesting: true,
    showAnalyticsDashboard: true,
    showPropertyImages: true,
    enableCompactView: false,
    showOwnerInfo: true,
    enableQuickCampaign: true,
    enableScheduledSends: true,
    enableTestMode: true,
    showCampaignTemplates: true,
    forcePropertyVariant: 'default',  // Classic offer page
  },
  modern: {
    useTagsForContacts: false,
    showPreferredContactsFilter: true,
    enableSkipTracingData: false,
    enableCampaignPreview: true,
    enableBatchProcessing: true,
    showCostEstimates: true,
    enableRetryLogic: true,
    useModernGradients: true,
    showAnimations: true,
    enableDarkMode: false,
    showMetricCards: true,
    enableQRCodes: true,
    enableURLTracking: true,
    enableABTesting: true,
    showAnalyticsDashboard: true,
    showPropertyImages: true,
    enableCompactView: false,
    showOwnerInfo: true,
    enableQuickCampaign: true,
    enableScheduledSends: true,
    enableTestMode: true,
    showCampaignTemplates: true,
    forcePropertyVariant: 'ultra-simple',  // Modern variant
  },
  minimal: {
    useTagsForContacts: true,
    showPreferredContactsFilter: false,
    enableSkipTracingData: false,
    enableCampaignPreview: false,
    enableBatchProcessing: false,
    showCostEstimates: false,
    enableRetryLogic: false,
    useModernGradients: false,
    showAnimations: false,
    enableDarkMode: false,
    showMetricCards: false,
    enableQRCodes: false,
    enableURLTracking: false,
    enableABTesting: false,
    showAnalyticsDashboard: false,
    showPropertyImages: false,
    enableCompactView: true,
    showOwnerInfo: true,
    enableQuickCampaign: false,
    enableScheduledSends: false,
    enableTestMode: false,
    showCampaignTemplates: false,
    forcePropertyVariant: 'minimal',  // Minimal variant
  },
} as const;

const DEFAULT_FLAGS: FeatureFlags = FEATURE_PRESETS.full;

interface FeatureToggleContextType {
  flags: FeatureFlags;
  updateFlag: (key: keyof FeatureFlags, value: boolean) => void;
  resetToDefaults: () => void;
  loadPreset: (preset: 'legacy' | 'modern' | 'minimal' | 'full') => void;
  isFeatureEnabled: (key: keyof FeatureFlags) => boolean;
}

const FeatureToggleContext = createContext<FeatureToggleContextType | undefined>(undefined);

const STORAGE_KEY = 'campaign_feature_flags';

export const FeatureToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_FLAGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
    return DEFAULT_FLAGS;
  });

  // Save to localStorage whenever flags change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch (error) {
      console.error('Failed to save feature flags:', error);
    }
  }, [flags]);

  const updateFlag = (key: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setFlags(DEFAULT_FLAGS);
  };

  const loadPreset = (preset: 'legacy' | 'modern' | 'minimal' | 'full') => {
    setFlags(FEATURE_PRESETS[preset]);
  };

  const isFeatureEnabled = (key: keyof FeatureFlags): boolean => {
    return Boolean(flags[key]);
  };

  return (
    <FeatureToggleContext.Provider
      value={{ flags, updateFlag, resetToDefaults, loadPreset, isFeatureEnabled }}
    >
      {children}
    </FeatureToggleContext.Provider>
  );
};

export const useFeatureToggle = () => {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggle must be used within FeatureToggleProvider');
  }
  return context;
};

// Convenience hook for checking a single feature
export const useFeature = (key: keyof FeatureFlags): boolean => {
  const { isFeatureEnabled } = useFeatureToggle();
  return isFeatureEnabled(key);
};
