/**
 * Real-time Click Notifications
 * Componente para notificações push quando leads clicam em links
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Phone, Mail, MessageSquare, ExternalLink, Clock } from 'lucide-react';
import { useMarketingStore } from '@/store/marketingStore';

interface ClickNotification {
  id: string;
  property_id: string;
  property_address: string;
  owner_name: string;
  click_source: 'sms' | 'email' | 'call';
  clicked_at: string;
  campaign_name?: string;
}

export const RealTimeClickNotifications = () => {
  const [notifications, setNotifications] = useState<ClickNotification[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const settings = useMarketingStore((state) => state.settings);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  // Show browser notification
  const showBrowserNotification = (notification: ClickNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = notification.click_source === 'email' ? '📧' :
                   notification.click_source === 'sms' ? '📱' : '📞';

      const browserNotification = new Notification(
        `🏠 New Lead Activity!`,
        {
          body: `${notification.owner_name} just viewed your offer for ${notification.property_address}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `click-${notification.id}`,
          requireInteraction: true
        }
      );

      browserNotification.onclick = () => {
        // Focus on the marketing dashboard
        window.focus();
        // Could navigate to property details or campaign manager
        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => browserNotification.close(), 10000);
    }
  };

  // Subscribe to real-time clicks
  const subscribeToClicks = () => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('property-clicks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_clicks'
        },
        async (payload) => {
          console.log('🔔 New click detected:', payload);

          try {
            // Get property details
            const { data: property } = await supabase
              .from('properties')
              .select('address, city, state, zip_code, owner_name')
              .eq('id', payload.new.property_id)
              .single();

            if (property) {
              const notification: ClickNotification = {
                id: payload.new.id,
                property_id: payload.new.property_id,
                property_address: `${property.address}, ${property.city}, ${property.state}`,
                owner_name: property.owner_name || 'Property Owner',
                click_source: payload.new.click_source,
                clicked_at: payload.new.created_at,
                campaign_name: payload.new.campaign_name
              };

              // Add to notifications list
              setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

              // Show browser notification
              showBrowserNotification(notification);

              // Play notification sound (optional)
              if ('Audio' in window) {
                try {
                  const audio = new Audio('/notification.mp3');
                  audio.volume = 0.3;
                  audio.play().catch(() => {}); // Ignore if audio fails
                } catch (error) {
                  // Audio not available, continue silently
                }
              }
            }
          } catch (error) {
            console.error('Error processing click notification:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  };

  // Initialize notifications
  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }

    // Subscribe to clicks
    const unsubscribe = subscribeToClicks();

    return unsubscribe;
  }, []);

  // Handle notification action
  const handleNotificationAction = (notification: ClickNotification, action: 'call' | 'email') => {
    if (action === 'call') {
      // Get phone number and initiate call
      window.open(`tel:${settings.company.contact_phone}`, '_blank');
    } else if (action === 'email') {
      // Open email client with follow-up template
      const subject = encodeURIComponent(`Follow-up: Interest in ${notification.property_address}`);
      const body = encodeURIComponent(
        `Hi ${notification.owner_name},\n\n` +
        `I noticed you viewed our offer for ${notification.property_address}.\n\n` +
        `I'd love to discuss this opportunity with you. Are you available for a quick call?\n\n` +
        `Best regards,\n${settings.company.company_name}\n${settings.company.contact_phone}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }

    // Remove notification from list
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  // Get icon for click source
  const getClickSourceIcon = (source: string) => {
    switch (source) {
      case 'email': return <Mail className="w-4 h-4 text-green-600" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'call': return <Phone className="w-4 h-4 text-purple-600" />;
      default: return <ExternalLink className="w-4 h-4 text-gray-600" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const clickTime = new Date(timestamp);
    const diffMs = now.getTime() - clickTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Real-time Lead Activity
          {notifications.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {notifications.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Get instant notifications when leads click on your property links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notification Settings */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">Browser Notifications</span>
            <span className={`text-xs px-2 py-1 rounded-full ${permissionGranted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {permissionGranted ? "Enabled" : "Disabled"}
            </span>
          </div>
          {!permissionGranted && (
            <Button
              size="sm"
              variant="outline"
              onClick={requestNotificationPermission}
            >
              Enable
            </Button>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isSubscribed ? 'Connected - Monitoring clicks' : 'Connecting...'}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No recent activity</p>
            <p className="text-sm">Lead clicks will appear here instantly</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getClickSourceIcon(notification.click_source)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {notification.owner_name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded border border-gray-300 bg-white">
                          {notification.click_source.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Viewed offer for <span className="font-medium">{notification.property_address}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notification.clicked_at)}
                        {notification.campaign_name && (
                          <>
                            <span>•</span>
                            <span>{notification.campaign_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNotificationAction(notification, 'call')}
                      className="text-xs"
                    >
                      📞 Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNotificationAction(notification, 'email')}
                      className="text-xs"
                    >
                      ✉️ Email
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotifications([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { RealTimeClickNotifications };