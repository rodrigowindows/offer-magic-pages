import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, MapPin, DollarSign, Home } from "lucide-react";
import { PropertyScore } from "@/utils/propertyScoring";

interface PropertyScoreCardProps {
  score: PropertyScore;
  onApprove?: () => void;
  onReject?: () => void;
  compact?: boolean;
}

export const PropertyScoreCard = ({
  score,
  onApprove,
  onReject,
  compact = false,
}: PropertyScoreCardProps) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 80) return "bg-green-50 border-green-200";
    if (value >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getRecommendationBadge = () => {
    switch (score.recommendation) {
      case 'approve':
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Auto-Approve
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-yellow-500 text-white gap-1">
            <AlertCircle className="h-3 w-3" />
            Needs Review
          </Badge>
        );
      case 'reject':
        return (
          <Badge className="bg-red-500 text-white gap-1">
            <XCircle className="h-3 w-3" />
            Auto-Reject
          </Badge>
        );
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getScoreBgColor(score.total)}`}>
        <div className={`text-lg font-bold ${getScoreColor(score.total)}`}>
          {score.total}
        </div>
        <div className="text-xs text-gray-600">/ 100</div>
        {getRecommendationBadge()}
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-4">
        {/* Header with total score */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-medium mb-1">AI Score</div>
            <div className="flex items-baseline gap-2">
              <div className={`text-4xl font-bold ${getScoreColor(score.total)}`}>
                {score.total}
              </div>
              <div className="text-gray-400 text-lg">/ 100</div>
            </div>
          </div>
          <div className="text-right">
            {getRecommendationBadge()}
            <div className="text-xs text-gray-500 mt-1">
              {(score.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-medium text-gray-700 mb-2">Score Breakdown:</div>

          <TooltipProvider>
            {/* Location Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Location</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`font-semibold ${getScoreColor(score.factors.location)}`}>
                    {score.factors.location}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Based on city desirability and market strength</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Value Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Deal Value</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`font-semibold ${getScoreColor(score.factors.value)}`}>
                    {score.factors.value}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Offer price vs estimated market value</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Condition Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600">Condition</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`font-semibold ${getScoreColor(score.factors.condition)}`}>
                    {score.factors.condition}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Property condition and maintenance</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Market Trend Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">Market Trend</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`font-semibold ${getScoreColor(score.factors.marketTrend)}`}>
                    {score.factors.marketTrend}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Market appreciation and demand trends</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* AI Reasoning */}
        {score.reasoning.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-gray-700 mb-2">AI Analysis:</div>
            <ul className="space-y-1">
              {score.reasoning.map((reason, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        {(onApprove || onReject) && (
          <div className="flex gap-2 pt-2 border-t">
            {score.recommendation === 'approve' && onApprove && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Accept Recommendation
              </Button>
            )}
            {score.recommendation === 'reject' && onReject && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={onReject}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Accept Recommendation
              </Button>
            )}
            {score.recommendation === 'review' && (
              <div className="text-xs text-gray-500 text-center w-full py-2">
                Manual review recommended
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact inline version for property cards
export const PropertyScoreBadge = ({ score }: { score: PropertyScore }) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getScoreColor(score.total)} text-white gap-1 cursor-help`}>
            <span className="font-bold">{score.total}</span>
            <span className="text-xs opacity-80">/ 100</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <div className="space-y-1 text-xs">
            <div className="font-semibold mb-2">AI Score Breakdown</div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-semibold">{score.factors.location}</span>
            </div>
            <div className="flex justify-between">
              <span>Deal Value:</span>
              <span className="font-semibold">{score.factors.value}</span>
            </div>
            <div className="flex justify-between">
              <span>Condition:</span>
              <span className="font-semibold">{score.factors.condition}</span>
            </div>
            <div className="flex justify-between">
              <span>Market:</span>
              <span className="font-semibold">{score.factors.marketTrend}</span>
            </div>
            <div className="pt-2 mt-2 border-t">
              <div className="font-semibold">Recommendation:</div>
              <div className="capitalize">{score.recommendation}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
