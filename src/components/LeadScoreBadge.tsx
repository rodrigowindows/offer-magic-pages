import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { calculateLeadScore, getGradeColor, LeadScore } from "@/lib/leadScoring";
import { TrendingUp } from "lucide-react";

interface LeadScoreBadgeProps {
  propertyId: string;
  leadStatus: string;
  hasPhone: boolean;
  hasEmail?: boolean;
}

export function LeadScoreBadge({ propertyId, leadStatus, hasPhone, hasEmail = false }: LeadScoreBadgeProps) {
  const [scoreData, setScoreData] = useState<LeadScore | null>(null);

  useEffect(() => {
    calculateScore();
  }, [propertyId, leadStatus]);

  const calculateScore = async () => {
    try {
      // Fetch campaign data for this property
      const { data: campaigns } = await supabase
        .from("campaign_logs")
        .select("link_clicked, click_count")
        .eq("property_id", propertyId);

      const { data: emailCampaigns } = await supabase
        .from("email_campaigns")
        .select("opened_count")
        .eq("property_id", propertyId);

      const campaignsSent = campaigns?.length || 0;
      const linkClicked = campaigns?.some(c => c.link_clicked) || false;
      const totalClicks = campaigns?.reduce((sum, c) => sum + (c.click_count || 0), 0) || 0;
      const emailOpened = emailCampaigns?.some(c => c.opened_count > 0) || false;

      const score = calculateLeadScore({
        hasPhone,
        hasEmail,
        emailOpened,
        linkClicked,
        clickCount: totalClicks,
        campaignsSent,
        leadStatus,
      });

      setScoreData(score);
    } catch (error) {
      console.error("Error calculating lead score:", error);
    }
  };

  if (!scoreData) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getGradeColor(scoreData.grade)} cursor-help`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {scoreData.grade} ({scoreData.score})
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Lead Score: {scoreData.score}/100</p>
            <ul className="text-xs space-y-0.5">
              {scoreData.factors.map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
