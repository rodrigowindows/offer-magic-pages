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
  variant: 'primary' | 'warning' | 'success' | 'accent' | 'destructive' | 'secondary' | 'muted';
}

const variantStyles: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  success: { bg: "bg-secondary/10", text: "text-secondary" },
  accent: { bg: "bg-accent/10", text: "text-accent" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
  secondary: { bg: "bg-secondary/10", text: "text-secondary" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
};

const MetricCard = ({ title, value, change, trend = 'neutral', icon, variant }: MetricCardProps) => {
  const style = variantStyles[variant] || variantStyles.muted;
  
  const trendBadge = () => {
    if (!change) return null;
    const colors = trend === 'up'
      ? 'bg-secondary/10 text-secondary border-secondary/20'
      : trend === 'down'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : 'bg-muted text-muted-foreground border-border';
    return (
      <Badge variant="outline" className={`text-[10px] font-medium px-1.5 py-0.5 ${colors}`}>
        {change}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${style.bg}`}>
            <div className={style.text}>{icon}</div>
          </div>
          {trendBadge()}
        </div>
        <div className="space-y-0.5">
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground font-medium">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MetricsDashboard = ({ properties }: MetricsDashboardProps) => {
  const totalProperties = properties.length;
  const pendingReview = properties.filter(p => !p.approval_status || p.approval_status === 'pending').length;
  const approved = properties.filter(p => p.approval_status === 'approved').length;
  const rejected = properties.filter(p => p.approval_status === 'rejected').length;
  const totalOfferValue = properties.filter(p => p.approval_status === 'approved').reduce((sum, p) => sum + (p.cash_offer_amount || 0), 0);
  const avgOfferValue = approved > 0 ? totalOfferValue / approved : 0;
  const avgOfferPercentage = properties
    .filter(p => p.approval_status === 'approved' && p.estimated_value > 0)
    .reduce((sum, p) => sum + (p.cash_offer_amount / p.estimated_value) * 100, 0) / (approved || 1);
  const activeLeads = properties.filter(p => ['contacted', 'negotiating', 'offer_made'].includes(p.lead_status || '')).length;

  const formatCurrency = (value: number) =>
    value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}k`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard title="Total Properties" value={totalProperties} change="+12%" trend="up"
        icon={<Home className="h-5 w-5" />} variant="primary" />
      <MetricCard title="Pending Review" value={pendingReview}
        change={pendingReview > 20 ? 'High' : 'Normal'} trend={pendingReview > 20 ? 'up' : 'neutral'}
        icon={<Clock className="h-5 w-5" />} variant="warning" />
      <MetricCard title="Total Offer Value" value={formatCurrency(totalOfferValue)} change="+15%" trend="up"
        icon={<DollarSign className="h-5 w-5" />} variant="success" />
      <MetricCard title="Avg. Offer Ratio" value={`${avgOfferPercentage.toFixed(0)}%`}
        change="of market value" trend="neutral"
        icon={<TrendingUp className="h-5 w-5" />} variant="accent" />
      <MetricCard title="Approved" value={approved}
        change={`${((approved / totalProperties) * 100 || 0).toFixed(0)}% approval rate`} trend="up"
        icon={<CheckCircle2 className="h-5 w-5" />} variant="success" />
      <MetricCard title="Rejected" value={rejected}
        change={`${((rejected / totalProperties) * 100 || 0).toFixed(0)}% rejection rate`}
        trend={rejected > approved ? 'up' : 'down'}
        icon={<XCircle className="h-5 w-5" />} variant="destructive" />
      <MetricCard title="Active Leads" value={activeLeads}
        change={activeLeads > 10 ? 'High activity' : 'Moderate'}
        trend={activeLeads > 10 ? 'up' : 'neutral'}
        icon={<Users className="h-5 w-5" />} variant="primary" />
      <MetricCard title="Avg. Offer Amount" value={formatCurrency(avgOfferValue)}
        change="per approved property" trend="neutral"
        icon={<DollarSign className="h-5 w-5" />} variant="muted" />
    </div>
  );
};
