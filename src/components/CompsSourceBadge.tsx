import { Badge } from '@/components/ui/badge';
import { Zap, Home, Database, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CompsSourceBadgeProps {
  source: string;
  count?: number;
  showTooltip?: boolean;
}

export const CompsSourceBadge = ({ source, count, showTooltip = true }: CompsSourceBadgeProps) => {
  const sourceConfig = {
    'attom': {
      label: 'MLS Data',
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400',
      tooltip: '🏆 Premium MLS data from Attom - Most accurate and up-to-date'
    },
    'zillow-api': {
      label: 'Zillow API',
      icon: Home,
      color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-400',
      tooltip: '🏠 Real data from Zillow API - Good coverage and quality'
    },
    'county-csv': {
      label: 'Public Records',
      icon: Database,
      color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-400',
      tooltip: '🍊 Public sales records from Orange County, FL - Free and unlimited'
    },
    'county': {
      label: 'County Data',
      icon: Database,
      color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-400',
      tooltip: '🏛️ County public records - Official government data'
    },
    'demo': {
      label: 'Demo Data',
      icon: Sparkles,
      color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
      tooltip: '🎭 Sample data for demonstration - Configure API keys in Settings for real data'
    }
  };

  const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.demo;
  const Icon = config.icon;

  const badge = (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1.5 px-2 py-1`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{config.label}</span>
      {count !== undefined && <span className="text-xs opacity-75">({count})</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
