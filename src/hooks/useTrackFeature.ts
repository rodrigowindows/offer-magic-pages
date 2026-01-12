import { useUsageAnalytics } from '@/contexts/UsageAnalyticsContext';

export const useTrackFeature = (featureId: string) => {
  const { trackUsage } = useUsageAnalytics();

  return (action?: string, metadata?: Record<string, any>) => {
    trackUsage(featureId, action, metadata);
  };
};