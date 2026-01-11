/**
 * Real-time Click Notifications
 * Notificações push em tempo real quando leads clicam nos links
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  BellOff,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  X,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ClickNotification {
  id: string;
  property_id: string;
  property_address: string;
  owner_name?: string;
  click_source: 'sms' | 'email' | 'call';
  clicked_at: string;
  ip_address?: string;
  user_agent?: string;
  campaign_name?: string;
  template_id?: string;
  cash_offer_amount?: number;
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showBrowserNotifications: boolean;
  autoHideDelay: number; // seconds
  maxNotifications: number;
}

export const RealTimeClickNotifications = () => {
  const [notifications, setNotifications] = useState<ClickNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    showBrowserNotifications: true,
    autoHideDelay: 30,
    maxNotifications: 10,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Request browser notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');

      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive real-time click notifications"
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Browser notifications are disabled",
          variant: "destructive"
        });
      }
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (settings.soundEnabled) {
      try {
        const audio = new Audio('/notification.mp3'); // You'll need to add this sound file
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Fallback: create a simple beep
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillator.frequency.setValueAtTime(800, context.currentTime);
          oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);

          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
        });
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  };

  // Show browser notification
  const showBrowserNotification = (click: ClickNotification) => {
    if (settings.showBrowserNotifications && permissionGranted && 'Notification' in window) {
      const notification = new Notification(`New Lead Activity! 🚀`, {
        body: `${click.owner_name || 'Someone'} viewed ${click.property_address}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `click-${click.id}`,
        requireInteraction: false,
        silent: !settings.soundEnabled,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after delay
      setTimeout(() => {
        notification.close();
      }, settings.autoHideDelay * 1000);
    }
  };

  // Handle new click
  const handleNewClick = (click: ClickNotification) => {
    // Add to notifications list
    setNotifications(prev => {
      const newNotifications = [click, ...prev];
      return newNotifications.slice(0, settings.maxNotifications);
    });

    // Play sound
    playNotificationSound();

    // Show browser notification
    showBrowserNotification(click);

    // Show toast notification
    toast({
      title: "New Lead Activity! 🚀",
      description: `${click.owner_name || 'Someone'} just viewed ${click.property_address}`,
      duration: settings.autoHideDelay * 1000,
    });
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!settings.enabled) return;

    console.log('Setting up real-time click notifications...');

    const channel = supabase
      .channel('click-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_clicks',
        },
        (payload) => {
          console.log('New click received:', payload);

          const click: ClickNotification = {
            id: payload.new.id,
            property_id: payload.new.property_id,
            property_address: payload.new.property_address || 'Unknown Address',
            owner_name: payload.new.owner_name,
            click_source: payload.new.click_source,
            clicked_at: payload.new.clicked_at || payload.new.created_at,
            ip_address: payload.new.ip_address,
            user_agent: payload.new.user_agent,
            campaign_name: payload.new.campaign_name,
            template_id: payload.new.template_id,
            cash_offer_amount: payload.new.cash_offer_amount,
          };

          handleNewClick(click);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          toast({
            title: "Real-time Connected",
            description: "Now monitoring for lead clicks"
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Lost",
            description: "Real-time notifications may be delayed",
            variant: "destructive"
          });
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [settings.enabled, settings.soundEnabled, settings.showBrowserNotifications, settings.autoHideDelay, settings.maxNotifications]);

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'email': return <Mail className="w-4 h-4 text-green-600" />;
      case 'call': return <Phone className="w-4 h-4 text-purple-600" />;
      default: return <ExternalLink className="w-4 h-4 text-gray-600" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {settings.enabled ? (
              <Bell className="w-6 h-6 text-green-600" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-400" />
            )}
            Real-time Click Notifications
          </h2>
          <p className="text-muted-foreground">
            Get instant notifications when leads click your property links
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            {isConnected ? 'Live' : 'Connecting...'}
          </Badge>

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
          >
            {settings.enabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {settings.enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* Settings & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-green-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm">Sound Notifications</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              >
                {settings.soundEnabled ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Browser Notifications</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => settings.showBrowserNotifications ? setSettings(prev => ({ ...prev, showBrowserNotifications: false })) : requestPermission()}
              >
                {settings.showBrowserNotifications ? 'On' : 'Request'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-hide Delay</span>
              <select
                value={settings.autoHideDelay}
                onChange={(e) => setSettings(prev => ({ ...prev, autoHideDelay: parseInt(e.target.value) }))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Connection</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Browser Permissions</span>
              <Badge variant={permissionGranted ? "default" : "destructive"}>
                {permissionGranted ? 'Granted' : 'Denied'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Active Notifications</span>
              <Badge variant="outline">{notifications.length}</Badge>
            </div>

            {!permissionGranted && (
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Enable browser notifications to receive alerts even when the app is not focused.
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto ml-1"
                    onClick={requestPermission}
                  >
                    Enable now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Lead Activity</CardTitle>
              <CardDescription>
                Real-time notifications of clicks and engagement
              </CardDescription>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                Clear All ({notifications.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-lg mb-2">No Recent Activity</p>
              <p className="text-sm">Click notifications will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30"
                >
                  {/* Channel Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getChannelIcon(notification.click_source)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          <span className="text-green-600">New click!</span>{' '}
                          {notification.owner_name || 'Someone'} viewed your property
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {notification.property_address}
                        </p>
                        {notification.cash_offer_amount && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <DollarSign className="w-3 h-3" />
                            ${notification.cash_offer_amount.toLocaleString()} cash offer
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.clicked_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="h-7 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Call Now
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Send Follow-up
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Property
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> When someone clicks a property link in your SMS, email, or call campaigns,
          you'll receive an instant notification both in the app and as a browser alert (if enabled).
          Use the action buttons to respond immediately to hot leads!
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RealTimeClickNotifications;