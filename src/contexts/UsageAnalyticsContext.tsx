import React, { createContext, useContext, useEffect, useState } from 'react';

export interface FeatureUsage {
  featureId: string;
  name: string;
  description: string;
  category: string;
  lastUsed?: Date;
  usageCount: number;
  firstUsed?: Date;
  isActive: boolean;
}

export interface UsageEvent {
  featureId: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface UsageAnalyticsContextType {
  features: FeatureUsage[];
  trackUsage: (featureId: string, action?: string, metadata?: Record<string, any>) => void;
  getFeatureStats: (featureId: string) => FeatureUsage | undefined;
  getCategoryStats: (category: string) => FeatureUsage[];
  getMostUsedFeatures: (limit?: number) => FeatureUsage[];
  getLeastUsedFeatures: (limit?: number) => FeatureUsage[];
  getUnusedFeatures: () => FeatureUsage[];
  resetUsageData: () => void;
}

const UsageAnalyticsContext = createContext<UsageAnalyticsContextType | undefined>(undefined);

// Define all features in the application
const FEATURE_DEFINITIONS: Omit<FeatureUsage, 'lastUsed' | 'usageCount' | 'firstUsed' | 'isActive'>[] = [
  // Core Navigation & Pages
  { featureId: 'dashboard', name: 'Main Dashboard', description: 'Main property overview and management dashboard', category: 'Navigation' },
  { featureId: 'property_details', name: 'Property Details Page', description: 'Individual property information and management', category: 'Navigation' },
  { featureId: 'admin_panel', name: 'Admin Panel', description: 'Administrative settings and system management', category: 'Administration' },

  // Property Management
  { featureId: 'property_filters', name: 'Property Filters', description: 'Advanced filtering and search capabilities', category: 'Property Management' },
  { featureId: 'bulk_actions', name: 'Bulk Actions', description: 'Batch operations on multiple properties', category: 'Property Management' },
  { featureId: 'property_import', name: 'Property Import', description: 'CSV import functionality for properties', category: 'Property Management' },
  { featureId: 'skip_tracing', name: 'Skip Tracing', description: 'Phone and email data enrichment', category: 'Property Management' },
  { featureId: 'property_tags', name: 'Property Tags', description: 'Tagging system for property organization', category: 'Property Management' },

  // Marketing & Campaigns
  { featureId: 'campaign_manager', name: 'Campaign Manager', description: 'Create and manage marketing campaigns', category: 'Marketing' },
  { featureId: 'email_campaigns', name: 'Email Campaigns', description: 'Automated email marketing sequences', category: 'Marketing' },
  { featureId: 'sms_campaigns', name: 'SMS Campaigns', description: 'Text message marketing campaigns', category: 'Marketing' },
  { featureId: 'call_campaigns', name: 'Call Campaigns', description: 'Automated calling campaigns', category: 'Marketing' },
  { featureId: 'campaign_analytics', name: 'Campaign Analytics', description: 'Performance tracking and reporting', category: 'Marketing' },
  { featureId: 'ab_testing', name: 'A/B Testing', description: 'Split testing for campaign optimization', category: 'Marketing' },

  // Communication Tools
  { featureId: 'chatbot', name: 'AI Chatbot', description: 'Conversational AI assistant', category: 'Communication' },
  { featureId: 'offer_chatbot', name: 'Offer Chatbot', description: 'Property-specific offer negotiation bot', category: 'Communication' },
  { featureId: 'follow_up_manager', name: 'Follow-up Manager', description: 'Automated follow-up sequences', category: 'Communication' },
  { featureId: 'sequence_manager', name: 'Sequence Manager', description: 'Multi-step communication sequences', category: 'Communication' },

  // Analytics & Reporting
  { featureId: 'property_analytics', name: 'Property Analytics', description: 'Individual property performance metrics', category: 'Analytics' },
  { featureId: 'channel_analytics', name: 'Channel Analytics', description: 'Communication channel performance', category: 'Analytics' },
  { featureId: 'response_analytics', name: 'Response Analytics', description: 'Lead response time tracking', category: 'Analytics' },
  { featureId: 'roi_analytics', name: 'ROI Analytics', description: 'Return on investment calculations', category: 'Analytics' },

  // Financial Tools
  { featureId: 'cash_offer_calculator', name: 'Cash Offer Calculator', description: 'Automated cash offer generation', category: 'Financial' },
  { featureId: 'savings_calculator', name: 'Savings Calculator', description: 'Buyer savings calculations', category: 'Financial' },
  { featureId: 'neighborhood_comps', name: 'Neighborhood Comparables', description: 'Comparable property analysis', category: 'Financial' },

  // AI & Automation
  { featureId: 'ai_property_review', name: 'AI Property Review', description: 'Automated property evaluation', category: 'AI' },
  { featureId: 'smart_matching', name: 'Smart Matching', description: 'AI-powered lead matching', category: 'AI' },
  { featureId: 'auto_follow_ups', name: 'Auto Follow-ups', description: 'Intelligent automated follow-up system', category: 'AI' },

  // Feature Toggles (Admin)
  { featureId: 'feature_toggles', name: 'Feature Toggles', description: 'Dynamic feature enable/disable system', category: 'Administration' },
  { featureId: 'usage_analytics', name: 'Usage Analytics', description: 'Feature usage tracking and analytics', category: 'Administration' },

  // Maps & Visualization
  { featureId: 'property_map', name: 'Property Map', description: 'Interactive property location mapping', category: 'Visualization' },
  { featureId: 'property_comparison', name: 'Property Comparison', description: 'Side-by-side property comparison', category: 'Visualization' },

  // Import & Export
  { featureId: 'csv_export', name: 'CSV Export', description: 'Data export functionality', category: 'Data Management' },
  { featureId: 'bulk_import', name: 'Bulk Import', description: 'Mass data import capabilities', category: 'Data Management' },

  // Notifications & Alerts
  { featureId: 'notifications', name: 'Notifications', description: 'System notifications and alerts', category: 'Communication' },
  { featureId: 'real_time_updates', name: 'Real-time Updates', description: 'Live data updates and notifications', category: 'Communication' },
];

const STORAGE_KEY = 'usage_analytics_data';

export const UsageAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureUsage[]>(() => {
    // Load from localStorage or initialize with defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with current feature definitions to handle new features
        return FEATURE_DEFINITIONS.map(def => {
          const existing = parsed.find((f: FeatureUsage) => f.featureId === def.featureId);
          return existing ? {
            ...def,
            ...existing,
            lastUsed: existing.lastUsed ? new Date(existing.lastUsed) : undefined,
            firstUsed: existing.firstUsed ? new Date(existing.firstUsed) : undefined,
          } : {
            ...def,
            usageCount: 0,
            isActive: false,
          };
        });
      } catch (error) {
        console.warn('Failed to parse usage analytics data:', error);
      }
    }
    return FEATURE_DEFINITIONS.map(def => ({
      ...def,
      usageCount: 0,
      isActive: false,
    }));
  });

  // Save to localStorage whenever features change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
  }, [features]);

  const trackUsage = (featureId: string, action: string = 'used', metadata?: Record<string, any>) => {
    setFeatures(prev => prev.map(feature => {
      if (feature.featureId === featureId) {
        const now = new Date();
        return {
          ...feature,
          usageCount: feature.usageCount + 1,
          lastUsed: now,
          firstUsed: feature.firstUsed || now,
          isActive: true,
        };
      }
      return feature;
    }));

    // Log the event for debugging
    console.log(`Feature used: ${featureId} - ${action}`, metadata);
  };

  const getFeatureStats = (featureId: string) => {
    return features.find(f => f.featureId === featureId);
  };

  const getCategoryStats = (category: string) => {
    return features.filter(f => f.category === category);
  };

  const getMostUsedFeatures = (limit: number = 10) => {
    return [...features]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  };

  const getLeastUsedFeatures = (limit: number = 10) => {
    return [...features]
      .filter(f => f.usageCount > 0)
      .sort((a, b) => a.usageCount - b.usageCount)
      .slice(0, limit);
  };

  const getUnusedFeatures = () => {
    return features.filter(f => f.usageCount === 0);
  };

  const resetUsageData = () => {
    setFeatures(FEATURE_DEFINITIONS.map(def => ({
      ...def,
      usageCount: 0,
      isActive: false,
    })));
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: UsageAnalyticsContextType = {
    features,
    trackUsage,
    getFeatureStats,
    getCategoryStats,
    getMostUsedFeatures,
    getLeastUsedFeatures,
    getUnusedFeatures,
    resetUsageData,
  };

  return (
    <UsageAnalyticsContext.Provider value={value}>
      {children}
    </UsageAnalyticsContext.Provider>
  );
};

export const useUsageAnalytics = () => {
  const context = useContext(UsageAnalyticsContext);
  if (context === undefined) {
    throw new Error('useUsageAnalytics must be used within a UsageAnalyticsProvider');
  }
  return context;
};

// Hook for tracking feature usage in components
export const useTrackFeature = (featureId: string) => {
  const { trackUsage } = useUsageAnalytics();

  return (action?: string, metadata?: Record<string, any>) => {
    trackUsage(featureId, action, metadata);
  };
};