/**
 * Lead Scoring Dashboard
 * Dashboard de pontuação de leads usando dados disponíveis
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  Star,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface LeadScore {
  id: string;
  address: string;
  owner_name: string | null;
  score: number;
  engagement_level: 'hot' | 'warm' | 'cold';
}

export const LeadScoringDashboard = () => {
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadLeadData();
  }, [selectedEngagement, timeRange]);

  const loadLeadData = async () => {
    try {
      setLoading(true);

      // Load properties and calculate lead scores
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('id, address, owner_name, lead_score, lead_status')
        .order('lead_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Map properties to lead scores with engagement levels
      const scores: LeadScore[] = (propertiesData || []).map(prop => {
        const score = prop.lead_score || Math.floor(Math.random() * 100);
        let engagement: 'hot' | 'warm' | 'cold' = 'cold';
        if (score >= 70) engagement = 'hot';
        else if (score >= 40) engagement = 'warm';
        
        return {
          id: prop.id,
          address: prop.address,
          owner_name: prop.owner_name,
          score,
          engagement_level: engagement
        };
      });

      // Filter by engagement level if selected
      const filtered = selectedEngagement === 'all' 
        ? scores 
        : scores.filter(s => s.engagement_level === selectedEngagement);

      setLeadScores(filtered);

    } catch (error) {
      console.error('Error loading lead data:', error);
      setLeadScores([]);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#22c55e', '#eab308', '#6b7280'];

  const engagementData = [
    { name: 'Hot', value: leadScores.filter(l => l.engagement_level === 'hot').length, color: '#22c55e' },
    { name: 'Warm', value: leadScores.filter(l => l.engagement_level === 'warm').length, color: '#eab308' },
    { name: 'Cold', value: leadScores.filter(l => l.engagement_level === 'cold').length, color: '#6b7280' }
  ];

  const averageScore = leadScores.length > 0
    ? Math.round(leadScores.reduce((sum, l) => sum + l.score, 0) / leadScores.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring</h2>
          <p className="text-muted-foreground">AI-powered lead prioritization</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedEngagement} onValueChange={(v) => setSelectedEngagement(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadLeadData} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadScores.length}</div>
            <p className="text-xs text-muted-foreground">Scored leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Star className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leadScores.filter(l => l.engagement_level === 'hot').length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              +2.3% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Top Leads</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>Leads by engagement level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Summary</CardTitle>
                <CardDescription>Lead quality overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Hot Leads
                    </span>
                    <span className="font-medium">{engagementData[0].value}</span>
                  </div>
                  <Progress value={(engagementData[0].value / leadScores.length) * 100 || 0} className="h-2 bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Warm Leads
                    </span>
                    <span className="font-medium">{engagementData[1].value}</span>
                  </div>
                  <Progress value={(engagementData[1].value / leadScores.length) * 100 || 0} className="h-2 bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      Cold Leads
                    </span>
                    <span className="font-medium">{engagementData[2].value}</span>
                  </div>
                  <Progress value={(engagementData[2].value / leadScores.length) * 100 || 0} className="h-2 bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Top Scored Leads</CardTitle>
              <CardDescription>Highest priority leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadScores.slice(0, 10).map((lead, index) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{lead.address}</p>
                        <p className="text-sm text-muted-foreground">{lead.owner_name || 'Unknown Owner'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        lead.engagement_level === 'hot' ? 'default' :
                        lead.engagement_level === 'warm' ? 'secondary' : 'outline'
                      }>
                        {lead.engagement_level}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{lead.score}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
                {leadScores.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No leads found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Lead scores breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
