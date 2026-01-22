import { Card, CardContent } from '@/components/ui/card';
import type { SmartInsights as SmartInsightsType, Property } from './types';

interface SmartInsightsProps {
  insights: SmartInsightsType;
  property: Property;
}

export const SmartInsights = ({ insights, property }: SmartInsightsProps) => {
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💡</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-2">Smart Market Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {insights.marketHeat === 'hot' ? '🔥' : insights.marketHeat === 'cold' ? '❄️' : '📊'}
                <span>
                  <strong>{insights.marketHeat === 'hot' ? 'Hot' : insights.marketHeat === 'cold' ? 'Cold' : 'Stable'} market:</strong>
                  {' '}{insights.trend > 0 ? '+' : ''}{insights.trend.toFixed(1)}% vs last month
                </span>
              </div>
              <div className="flex items-center gap-2">
                ⏱️ <span><strong>Avg time on market:</strong> {insights.avgDays} days</span>
              </div>
              {property.cash_offer_amount > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    💰 <span><strong>Your offer:</strong> {insights.offerVsMarket > 0 ? '+' : ''}{insights.offerVsMarket.toFixed(1)}% vs market avg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    💡 <span className="text-purple-700"><strong>{insights.suggestion}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
