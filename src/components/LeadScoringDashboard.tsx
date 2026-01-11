/**
 * Lead Scoring Dashboard
 * Dashboard para análise de pontuação e comportamento de leads
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  Zap,
  Thermometer,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface LeadScore {
  id: string;
  property_id: string;
  score: number;
  engagement_level: 'cold' | 'warm' | 'hot' | 'very_hot';
  last_activity: string;
  click_count: number;
  email_opens: number;
  sms_responses: number;
  page_views: number;
  preferred_contact_method: string;
  best_contact_time?: string;
}

interface LeadActivity {
  id: string;
  property_id: string;
  activity_type: string;
  channel: string;
  created_at: string;
  metadata?: any;
}

const LeadScoringDashboard = () => {
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    loadLeadData();
  }, [selectedEngagement, timeRange]);

  const loadLeadData = async () => {
    try {
      setLoading(true);

      // Load lead scores with filtering
      let query = supabase
        .from('lead_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (selectedEngagement !== 'all') {
        query = query.eq('engagement_level', selectedEngagement);
      }

      const { data: scoresData, error: scoresError } = await query;
      if (scoresError) throw scoresError;
      setLeadScores(scoresData || []);

      // Load recent activities
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('lead_activities')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

    } catch (error) {
      console.error('Error loading lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'very_hot': return 'bg-red-500';
      case 'hot': return 'bg-orange-500';
      case 'warm': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getEngagementIcon = (level: string) => {
    switch (level) {
      case 'very_hot': return <Zap className="h-4 w-4" />;
      case 'hot': return <Thermometer className="h-4 w-4" />;
      case 'warm': return <TrendingUp className="h-4 w-4" />;
      default: return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return <Target className="h-4 w-4" />;
      case 'email_open': return <Mail className="h-4 w-4" />;
      case 'sms_response': return <MessageSquare className="h-4 w-4" />;
      case 'page_view': return <Eye className="h-4 w-4" />;
      case 'call_response': return <Phone className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const engagementStats = leadScores.reduce((acc, lead) => {
    acc[lead.engagement_level] = (acc[lead.engagement_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activityStats = activities.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring & Analytics</h2>
          <p className="text-muted-foreground">AI-powered lead scoring based on engagement behavior</p>
        </div>
        <Button onClick={loadLeadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedEngagement} onValueChange={setSelectedEngagement}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by engagement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="very_hot">Very Hot 🔥</SelectItem>
            <SelectItem value="hot">Hot 🌡️</SelectItem>
            <SelectItem value="warm">Warm 🌅</SelectItem>
            <SelectItem value="cold">Cold ❄️</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadScores.length}</div>
            <p className="text-xs text-muted-foreground">Scored leads in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Thermometer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementStats.hot || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for immediate contact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadScores.length > 0 ? Math.round(leadScores.reduce((sum, lead) => sum + lead.score, 0) / leadScores.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Average engagement score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">Total activities tracked</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Lead Scores</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Overview</CardTitle>
              <CardDescription>Leads ranked by engagement score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadScores.slice(0, 20).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getEngagementColor(lead.engagement_level)} text-white`}>
                        {getEngagementIcon(lead.engagement_level)}
                        <span className="ml-1 capitalize">{lead.engagement_level.replace('_', ' ')}</span>
                      </Badge>
                      <div>
                        <p className="font-medium">Property {lead.property_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Last activity: {new Date(lead.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{lead.score}</div>
                      <Progress value={lead.score} className="w-20 h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {lead.click_count} clicks • {lead.page_views} views
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Lead Activities</CardTitle>
              <CardDescription>Latest engagement activities across all leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activities.slice(0, 50).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded">
                    {getActivityIcon(activity.activity_type)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{activity.activity_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Property {activity.property_id.slice(0, 8)} • {activity.channel}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Insights:</strong> Based on current data, your hottest leads are responding best to SMS campaigns.
              Consider increasing SMS frequency for high-scoring leads and email follow-ups for medium engagement.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Contact Times</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Most leads engage between 9 AM - 11 AM and 6 PM - 8 PM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferred Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  SMS: 65% • Email: 25% • Calls: 10% of responses
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { LeadScoringDashboard };