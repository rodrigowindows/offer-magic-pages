import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Send, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyAnalyticsProps {
  propertyId: string;
}

interface AnalyticsSummary {
  pageViews: number;
  inquiries: number;
  uniqueCountries: number;
  mobileViews: number;
  desktopViews: number;
  tabletViews: number;
  recentActivity: Array<{
    event_type: string;
    city: string;
    country: string;
    created_at: string;
    device_type: string;
    ip_address?: string;
  }>;
}

export const PropertyAnalytics = ({ propertyId }: PropertyAnalyticsProps) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    pageViews: 0,
    inquiries: 0,
    uniqueCountries: 0,
    mobileViews: 0,
    desktopViews: 0,
    tabletViews: 0,
    recentActivity: [],
  });

  useEffect(() => {
    fetchAnalytics();
    
    // Subscribe to real-time analytics updates
    const channel = supabase
      .channel('property-analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_analytics',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload: any) => {
          console.log('New analytics event:', payload);
          
          // Show toast notification
          const eventType = payload.new.event_type;
          const city = payload.new.city || 'Unknown';
          const country = payload.new.country || 'Unknown';
          
          let title = '';
          let description = '';
          
          if (eventType === 'page_view') {
            title = '👀 New Visitor!';
            description = `Someone from ${city}, ${country} viewed this property`;
          } else if (eventType === 'inquiry_submitted') {
            title = '📬 New Inquiry!';
            description = `Someone from ${city}, ${country} submitted an inquiry`;
          }
          
          toast({
            title,
            description,
          });
          
          // Refresh analytics
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from('property_analytics')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return;
    }

    if (data) {
      const pageViews = data.filter(d => d.event_type === 'page_view').length;
      const inquiries = data.filter(d => d.event_type === 'inquiry_submitted').length;
      const countries = new Set(data.map(d => d.country).filter(Boolean));
      const mobileViews = data.filter(d => d.device_type === 'mobile').length;
      const desktopViews = data.filter(d => d.device_type === 'desktop').length;
      const tabletViews = data.filter(d => d.device_type === 'tablet').length;
      
      setAnalytics({
        pageViews,
        inquiries,
        uniqueCountries: countries.size,
        mobileViews,
        desktopViews,
        tabletViews,
        recentActivity: data.slice(0, 10),
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pageViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.inquiries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueCountries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desktop</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.desktopViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.mobileViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tablet</CardTitle>
            <Tablet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.tabletViews}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {activity.event_type === 'page_view' && <Eye className="h-4 w-4 text-blue-500" />}
                    {activity.event_type === 'inquiry_submitted' && <Send className="h-4 w-4 text-green-500" />}
                    <div>
                      <div className="font-medium">
                        {activity.event_type === 'page_view' ? 'Page View' : 'Inquiry'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.city || 'Unknown'}, {activity.country || 'Unknown'} • {activity.device_type}
                        {activity.ip_address && ` • IP: ${activity.ip_address}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
