/**
 * Smart Scheduling Optimizer
 * Sistema inteligente para otimizar horários de envio baseado em dados de engajamento
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Clock,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Sun,
  Moon,
  RefreshCw,
  Lightbulb,
  Mail,
  Phone
} from 'lucide-react';

interface EngagementData {
  hour: number;
  day_of_week: number;
  channel: string;
  engagement_rate: number;
  total_sends: number;
  total_responses: number;
}

interface OptimalTime {
  hour: number;
  dayOfWeek: number;
  channel: string;
  score: number;
  confidence: number;
}

const SmartScheduling = () => {
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const { toast } = useToast();

  useEffect(() => {
    loadEngagementData();
  }, [selectedChannel, timeRange]);

  const loadEngagementData = async () => {
    try {
      setLoading(true);

      // Load engagement data from campaign_logs
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get campaign performance by hour
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign_logs')
        .select('sent_at, channel, first_response_at, link_clicked')
        .gte('sent_at', startDate.toISOString());

      if (campaignError) throw campaignError;

      // Process and aggregate data
      const processedData = processEngagementData(campaignData || []);
      setEngagementData(processedData);

      // Calculate optimal times
      const optimal = calculateOptimalTimes(processedData, selectedChannel);
      setOptimalTimes(optimal);

    } catch (error) {
      console.error('Error loading engagement data:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduling data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processEngagementData = (campaignData: any[]): EngagementData[] => {
    // Group by hour and day
    const hourlyData: Record<string, { sends: number; responses: number; channel: string }> = {};

    campaignData.forEach(item => {
      const date = new Date(item.sent_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const channel = item.channel || 'sms';
      const key = `${hour}-${dayOfWeek}-${channel}`;

      if (!hourlyData[key]) {
        hourlyData[key] = { sends: 0, responses: 0, channel };
      }

      hourlyData[key].sends++;
      if (item.link_clicked || item.first_response_at) {
        hourlyData[key].responses++;
      }
    });

    // Convert to array format
    return Object.entries(hourlyData).map(([key, data]) => {
      const [hour, dayOfWeek] = key.split('-').map(Number);
      return {
        hour,
        day_of_week: dayOfWeek,
        channel: data.channel,
        engagement_rate: data.sends > 0 ? (data.responses / data.sends) * 100 : 0,
        total_sends: data.sends,
        total_responses: data.responses
      };
    });
  };

  const calculateOptimalTimes = (data: EngagementData[], channel: string): OptimalTime[] => {
    // Filter by channel if needed
    const filteredData = channel === 'all' 
      ? data 
      : data.filter(d => d.channel === channel);

    // Calculate scores for each time slot
    const timeSlots: OptimalTime[] = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        const slotData = filteredData.filter(d => d.hour === hour && d.day_of_week === day);
        
        if (slotData.length > 0) {
          const totalSends = slotData.reduce((sum, d) => sum + d.total_sends, 0);
          const totalResponses = slotData.reduce((sum, d) => sum + d.total_responses, 0);
          const avgEngagement = slotData.reduce((sum, d) => sum + d.engagement_rate, 0) / slotData.length;
          
          timeSlots.push({
            hour,
            dayOfWeek: day,
            channel: channel === 'all' ? 'all' : channel,
            score: avgEngagement,
            confidence: Math.min(totalSends / 10, 1) * 100 // Confidence based on sample size
          });
        }
      }
    }

    // Sort by score descending
    return timeSlots.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatHour = (hour: number): string => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 18) {
      return <Sun className="h-4 w-4 text-yellow-500" />;
    }
    return <Moon className="h-4 w-4 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Smart Scheduling
              </CardTitle>
              <CardDescription>
                AI-optimized send times based on engagement data
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadEngagementData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Phone</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : optimalTimes.length === 0 ? (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Not enough data to calculate optimal times. Send more campaigns to get recommendations.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Top Recommended Times
              </h3>
              
              <div className="grid gap-3">
                {optimalTimes.slice(0, 5).map((time, index) => (
                  <div 
                    key={`${time.hour}-${time.dayOfWeek}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                      {getTimeIcon(time.hour)}
                      <div>
                        <p className="font-medium">
                          {getDayName(time.dayOfWeek)} at {formatHour(time.hour)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {time.score.toFixed(1)}% engagement rate
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Confidence</p>
                        <Progress value={time.confidence} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Heatmap
          </CardTitle>
          <CardDescription>
            View engagement patterns across different times and days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sms">
                <Phone className="h-4 w-4 mr-1" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-1" />
                Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Engagement heatmap visualization</p>
                <p className="text-sm">Based on {engagementData.length} data points</p>
              </div>
            </TabsContent>
            
            <TabsContent value="sms" className="pt-4">
              <div className="text-center text-muted-foreground py-8">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>SMS engagement patterns</p>
              </div>
            </TabsContent>
            
            <TabsContent value="email" className="pt-4">
              <div className="text-center text-muted-foreground py-8">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Email engagement patterns</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartScheduling;
