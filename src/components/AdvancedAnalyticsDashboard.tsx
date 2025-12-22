import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  MapPin,
  Calendar,
  Percent,
} from "lucide-react";

interface Property {
  id: string;
  city: string;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  lead_status?: string;
  created_at?: string;
  tags?: string[];
}

interface AdvancedAnalyticsDashboardProps {
  properties: Property[];
}

export const AdvancedAnalyticsDashboard = ({ properties }: AdvancedAnalyticsDashboardProps) => {
  // City Distribution
  const cityDistribution = properties.reduce((acc, p) => {
    acc[p.city] = (acc[p.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(cityDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Monthly Trend (mock data - in real app, group by month)
  const currentMonth = new Date().getMonth();
  const monthlyData = properties.reduce((acc, p) => {
    if (p.created_at) {
      const month = new Date(p.created_at).getMonth();
      if (month === currentMonth) {
        acc.current++;
      } else if (month === currentMonth - 1) {
        acc.previous++;
      }
    }
    return acc;
  }, { current: 0, previous: 0 });

  const monthlyGrowth = monthlyData.previous > 0
    ? ((monthlyData.current - monthlyData.previous) / monthlyData.previous) * 100
    : 0;

  // Conversion Metrics
  const totalLeads = properties.length;
  const contacted = properties.filter((p) =>
    ['contacted', 'negotiating', 'offer_made', 'closed'].includes(p.lead_status || '')
  ).length;
  const negotiating = properties.filter((p) => p.lead_status === 'negotiating').length;
  const closed = properties.filter((p) => p.lead_status === 'closed').length;

  const contactRate = totalLeads > 0 ? (contacted / totalLeads) * 100 : 0;
  const negotiationRate = contacted > 0 ? (negotiating / contacted) * 100 : 0;
  const closeRate = negotiating > 0 ? (closed / negotiating) * 100 : 0;

  // Value Metrics
  const approvedProperties = properties.filter((p) => p.approval_status === 'approved');
  const totalMarketValue = approvedProperties.reduce((sum, p) => sum + p.estimated_value, 0);
  const totalOfferValue = approvedProperties.reduce((sum, p) => sum + p.cash_offer_amount, 0);
  const avgDiscount = approvedProperties.length > 0
    ? ((totalMarketValue - totalOfferValue) / totalMarketValue) * 100
    : 0;

  // Tag Analysis
  const tagDistribution = properties.reduce((acc, p) => {
    (p.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Leads</span>
                <span className="text-lg font-bold">{totalLeads}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Contacted</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{contacted}</span>
                  <Badge variant="secondary" className="text-xs">
                    {contactRate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${contactRate}%` }}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Negotiating</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{negotiating}</span>
                  <Badge variant="secondary" className="text-xs">
                    {negotiationRate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${negotiationRate}%` }}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Closed</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{closed}</span>
                  <Badge variant="secondary" className="text-xs">
                    {closeRate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${closeRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-green-600" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCities.map(([city, count], index) => {
                const percentage = (count / totalLeads) * 100;
                return (
                  <div key={city}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{city}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{count}</span>
                        <Badge variant="outline" className="text-xs">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          index === 0
                            ? 'bg-green-500'
                            : index === 1
                            ? 'bg-blue-500'
                            : index === 2
                            ? 'bg-purple-500'
                            : index === 3
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-purple-600" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">This Month</div>
                  <div className="text-2xl font-bold">{monthlyData.current}</div>
                </div>
                {monthlyGrowth !== 0 && (
                  <div
                    className={`flex items-center gap-1 ${
                      monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {monthlyGrowth > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="font-semibold">
                      {Math.abs(monthlyGrowth).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Last Month</div>
                <div className="text-2xl font-bold">{monthlyData.previous}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Value Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Total Market Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalMarketValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Offer Value</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalOfferValue)}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Percent className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Avg. Discount:</span>
                <Badge variant="secondary">{avgDiscount.toFixed(1)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-orange-600" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTags.length > 0 ? (
                topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">
                      {tag}
                    </Badge>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No tags added yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
