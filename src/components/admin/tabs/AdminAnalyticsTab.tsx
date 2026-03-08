import { ChannelAnalytics } from "@/components/dashboard/ChannelAnalytics";
import { ABTestAnalytics } from "@/components/ab-testing/ABTestAnalytics";

export const AdminAnalyticsTab = () => (
  <div className="space-y-6">
    <div><h2 className="text-2xl font-semibold mb-4">Campaign Performance</h2></div>
    <ChannelAnalytics />
    <div>
      <h2 className="text-2xl font-semibold mb-4">A/B Test Results</h2>
      <div className="bg-card rounded-lg border border-border p-6"><ABTestAnalytics /></div>
    </div>
  </div>
);
