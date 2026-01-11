/**
 * Real-time Notifications System
 * Sistema de notificações em tempo real para leads quentes e atividades importantes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  BellOff,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  type: 'lead_score' | 'activity' | 'campaign_performance' | 'system_alert';
  condition: {
    threshold?: number;
    operator?: 'gt' | 'lt' | 'eq';
    activity_type?: string;
    engagement_level?: string;
  };
  channels: ('browser' | 'email' | 'sms')[];
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered?: string;
}

interface RealTimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  metadata?: any;
}

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationRules();
    loadRecentNotifications();

    // Request browser notification permission
    if ('Notification' in window) {
      setBrowserNotifications(Notification.permission === 'granted');
    }

    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
  }, []);

  const loadNotificationRules = async () => {
    try {
      // For now, use default rules (in production, load from database)
      const defaultRules: NotificationRule[] = [
        {
          id: 'hot_lead',
          name: 'Hot Lead Alert',
          type: 'lead_score',
          condition: { threshold: 80, operator: 'gt', engagement_level: 'hot' },
          channels: ['browser'],
          enabled: true,
          cooldown_minutes: 60
        },
        {
          id: 'high_activity',
          name: 'High Activity Alert',
          type: 'activity',
          condition: { activity_type: 'click', threshold: 5 },
          channels: ['browser'],
          enabled: true,
          cooldown_minutes: 30
        },
        {
          id: 'campaign_success',
          name: 'Campaign Success',
          type: 'campaign_performance',
          condition: { threshold: 70 },
          channels: ['browser'],
          enabled: true,
          cooldown_minutes: 120
        }
      ];
      setRules(defaultRules);
    } catch (error) {
      console.error('Error loading notification rules:', error);
    }
  };

  const loadRecentNotifications = async () => {
    try {
      // Load recent notifications (in production, from database)
      const recentNotifications: RealTimeNotification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Hot Lead Detected',
          message: 'Property 12345 reached hot status with score 85',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          action_url: '/property/12345'
        },
        {
          id: '2',
          type: 'info',
          title: 'Campaign Completed',
          message: 'SMS campaign "Hot Leads" completed with 68% response rate',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false
        }
      ];
      setNotifications(recentNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to lead score changes
    const leadScoreSubscription = supabase
      .channel('lead_scores')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lead_scores'
      }, (payload) => {
        handleLeadScoreUpdate(payload.new);
      })
      .subscribe();

    // Subscribe to new activities
    const activitySubscription = supabase
      .channel('lead_activities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lead_activities'
      }, (payload) => {
        handleNewActivity(payload.new);
      })
      .subscribe();

    return () => {
      leadScoreSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  };

  const handleLeadScoreUpdate = (leadScore: any) => {
    const score = leadScore.score;
    const engagementLevel = leadScore.engagement_level;

    // Check if this triggers any rules
    rules.forEach(rule => {
      if (!rule.enabled) return;

      let shouldTrigger = false;

      if (rule.type === 'lead_score') {
        if (rule.condition.operator === 'gt' && score > (rule.condition.threshold || 0)) {
          shouldTrigger = true;
        }
        if (rule.condition.engagement_level && engagementLevel === rule.condition.engagement_level) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        triggerNotification({
          type: 'success',
          title: 'Lead Status Update',
          message: `Property ${leadScore.property_id} is now ${engagementLevel} (${score} points)`,
          action_url: `/property/${leadScore.property_id}`
        }, rule);
      }
    });
  };

  const handleNewActivity = (activity: any) => {
    // Check activity-based rules
    rules.forEach(rule => {
      if (!rule.enabled || rule.type !== 'activity') return;

      if (rule.condition.activity_type === activity.activity_type) {
        // Count recent activities of this type
        const recentCount = 1; // In production, query database for count

        if (recentCount >= (rule.condition.threshold || 1)) {
          triggerNotification({
            type: 'info',
            title: 'High Activity Detected',
            message: `Multiple ${activity.activity_type} activities detected for property ${activity.property_id}`,
            action_url: `/property/${activity.property_id}`
          }, rule);
        }
      }
    });
  };

  const triggerNotification = (notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'>, rule: NotificationRule) => {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add to notifications list
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50

    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
      action: notification.action_url ? (
        <Button size="sm" onClick={() => window.open(notification.action_url, '_blank')}>
          View
        </Button>
      ) : undefined
    });

    // Browser notification
    if (browserNotifications && rule.channels.includes('browser')) {
      showBrowserNotification(notification.title, notification.message);
    }

    // Sound
    if (soundEnabled) {
      playNotificationSound();
    }
  };

  const showBrowserNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotifications(permission === 'granted');
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleRule = (ruleId: string, enabled: boolean) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Real-time Notifications
            </h2>
            <p className="text-muted-foreground">Stay updated with lead activities and system alerts</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {!browserNotifications && (
            <Button variant="outline" size="sm" onClick={requestBrowserPermission}>
              <Bell className="h-4 w-4 mr-2" />
              Enable Browser Notifications
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={clearAllNotifications}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Notification Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Rules
          </CardTitle>
          <CardDescription>
            Configure when and how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {rule.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Triggers every {rule.cooldown_minutes} minutes
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {rule.channels.join(', ')}
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Latest alerts and updates from your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">Notifications will appear here as leads engage with your campaigns</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Alert
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${
                    !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <AlertDescription className="font-medium">
                          {notification.title}
                        </AlertDescription>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <AlertDescription className="mt-1">
                        {notification.message}
                      </AlertDescription>
                      {notification.action_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(notification.action_url, '_blank');
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => n.type === 'success').length}</p>
                <p className="text-xs text-muted-foreground">Success Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => !n.read).length}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</p>
                <p className="text-xs text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(notifications.length / Math.max(1, (Date.now() - Date.parse(notifications[0]?.timestamp || Date.now())) / (1000 * 60 * 60 * 24))).toString()}</p>
                <p className="text-xs text-muted-foreground">Per Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { RealTimeNotifications };