/**
 * Clicks Analytics Dashboard
 * Refactored: data logic in useClicksAnalytics hook, UI split into sub-components
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, MousePointerClick, Calendar, RefreshCw, ExternalLink, Filter } from 'lucide-react';
import { useClicksAnalytics, getSourceIcon, getSourceColor } from '@/hooks/useClicksAnalytics';
import { RecentClicksList } from './clicks/RecentClicksList';

export const ClicksAnalytics = () => {
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { loading, metrics, refresh } = useClicksAnalytics(dateRange, sourceFilter);

  const topSource = Object.entries(metrics.bySource).sort((a, b) => b[1] - a[1])[0];
  const topCampaign = Object.entries(metrics.byCampaign).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clicks Analytics</h2>
          <p className="text-sm text-muted-foreground">Track and analyze property page clicks from your campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="email">Email Only</SelectItem>
              <SelectItem value="sms">SMS Only</SelectItem>
              <SelectItem value="carta">Carta Only</SelectItem>
              <SelectItem value="call">Call Only</SelectItem>
              <SelectItem value="direct">Direct Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topSource ? (
              <><div className="text-2xl font-bold capitalize">{topSource[0]}</div><p className="text-xs text-muted-foreground">{topSource[1]} clicks ({((topSource[1] / metrics.total) * 100).toFixed(1)}%)</p></>
            ) : <div className="text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Campaign</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topCampaign ? (
              <><div className="text-2xl font-bold capitalize">{topCampaign[0]}</div><p className="text-xs text-muted-foreground">{topCampaign[1]} clicks ({((topCampaign[1] / metrics.total) * 100).toFixed(1)}%)</p></>
            ) : <div className="text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(metrics.bySource).length}</div>
            <p className="text-xs text-muted-foreground">Active channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Clicks by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks by Source</CardTitle>
          <CardDescription>Distribution of clicks across different channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
              const Icon = getSourceIcon(source);
              const pct = (count / metrics.total) * 100;
              return (
                <div key={source} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32">
                    <Icon className={`w-4 h-4 ${getSourceColor(source)}`} />
                    <span className="text-sm font-medium capitalize">{source}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary flex items-center justify-end px-2" style={{ width: `${pct}%` }}>
                        <span className="text-xs font-medium text-primary-foreground">{count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right"><span className="text-sm text-muted-foreground">{pct.toFixed(1)}%</span></div>
                </div>
              );
            })}
            {Object.keys(metrics.bySource).length === 0 && <div className="text-center py-8 text-muted-foreground">No clicks data available</div>}
          </div>
        </CardContent>
      </Card>

      {/* Clicks by Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks by Campaign</CardTitle>
          <CardDescription>Performance of each marketing campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.byCampaign).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([campaign, count]) => {
              const pct = (count / metrics.total) * 100;
              return (
                <div key={campaign} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="capitalize">{campaign}</Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm font-medium">{count} clicks</span>
                    <span className="text-sm text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(metrics.byCampaign).length === 0 && <div className="text-center py-8 text-muted-foreground">No campaign data available</div>}
          </div>
        </CardContent>
      </Card>

      {/* Recent Clicks */}
      <RecentClicksList clicks={metrics.recentClicks} />
    </div>
  );
};
