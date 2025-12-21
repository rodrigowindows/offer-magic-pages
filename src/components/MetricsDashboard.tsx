import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Clock, DollarSign, TrendingUp, CheckCircle2, XCircle, Users } from "lucide-react";

interface Property {
  id: string;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  lead_status?: string;
  created_at?: string;
}

interface MetricsDashboardProps {
  properties: Property[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const MetricCard = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  iconBgColor,
  iconColor,
}: MetricCardProps) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50 border-green-200';
    if (trend === 'down') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          {change && (
            <Badge variant="secondary" className={`text-xs font-medium px-2 py-1 ${getTrendColor()}`}>
              {change}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
          <div className="text-sm text-gray-600 font-medium">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MetricsDashboard = ({ properties }: MetricsDashboardProps) => {
  // Calculate metrics
  const totalProperties = properties.length;

  const pendingReview = properties.filter(
    p => !p.approval_status || p.approval_status === 'pending'
  ).length;

  const approved = properties.filter(p => p.approval_status === 'approved').length;
  const rejected = properties.filter(p => p.approval_status === 'rejected').length;

  const totalOfferValue = properties
    .filter(p => p.approval_status === 'approved')
    .reduce((sum, p) => sum + (p.cash_offer_amount || 0), 0);

  const avgOfferValue = approved > 0 ? totalOfferValue / approved : 0;

  const avgOfferPercentage = properties
    .filter(p => p.approval_status === 'approved' && p.estimated_value > 0)
    .reduce((sum, p) => {
      const percentage = (p.cash_offer_amount / p.estimated_value) * 100;
      return sum + percentage;
    }, 0) / (approved || 1);

  // Calculate active leads (contacted, negotiating, etc.)
  const activeLeads = properties.filter(
    p => ['contacted', 'negotiating', 'offer_made'].includes(p.lead_status || '')
  ).length;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Properties"
        value={totalProperties}
        change="+12%"
        trend="up"
        icon={<Home className="h-5 w-5" />}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
      />

      <MetricCard
        title="Pending Review"
        value={pendingReview}
        change={pendingReview > 20 ? 'High' : 'Normal'}
        trend={pendingReview > 20 ? 'up' : 'neutral'}
        icon={<Clock className="h-5 w-5" />}
        iconBgColor="bg-yellow-50"
        iconColor="text-yellow-600"
      />

      <MetricCard
        title="Total Offer Value"
        value={formatCurrency(totalOfferValue)}
        change="+15%"
        trend="up"
        icon={<DollarSign className="h-5 w-5" />}
        iconBgColor="bg-green-50"
        iconColor="text-green-600"
      />

      <MetricCard
        title="Avg. Offer Ratio"
        value={`${avgOfferPercentage.toFixed(0)}%`}
        change="of market value"
        trend="neutral"
        icon={<TrendingUp className="h-5 w-5" />}
        iconBgColor="bg-purple-50"
        iconColor="text-purple-600"
      />

      <MetricCard
        title="Approved"
        value={approved}
        change={`${((approved / totalProperties) * 100).toFixed(0)}% approval rate`}
        trend="up"
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconBgColor="bg-emerald-50"
        iconColor="text-emerald-600"
      />

      <MetricCard
        title="Rejected"
        value={rejected}
        change={`${((rejected / totalProperties) * 100).toFixed(0)}% rejection rate`}
        trend={rejected > approved ? 'up' : 'down'}
        icon={<XCircle className="h-5 w-5" />}
        iconBgColor="bg-red-50"
        iconColor="text-red-600"
      />

      <MetricCard
        title="Active Leads"
        value={activeLeads}
        change={activeLeads > 10 ? 'High activity' : 'Moderate'}
        trend={activeLeads > 10 ? 'up' : 'neutral'}
        icon={<Users className="h-5 w-5" />}
        iconBgColor="bg-indigo-50"
        iconColor="text-indigo-600"
      />

      <MetricCard
        title="Avg. Offer Amount"
        value={formatCurrency(avgOfferValue)}
        change="per approved property"
        trend="neutral"
        icon={<DollarSign className="h-5 w-5" />}
        iconBgColor="bg-teal-50"
        iconColor="text-teal-600"
      />
    </div>
  );
};
