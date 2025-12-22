import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Phone, Calendar, X, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface FollowUpSuggestion {
  id: string;
  propertyId: string;
  propertyAddress: string;
  ownerName?: string;
  type: 'email' | 'call' | 'visit';
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  suggestedMessage?: string;
  lastContactDate?: string;
  leadValue: number;
}

interface FollowUpSuggestionsPanelProps {
  suggestions: FollowUpSuggestion[];
  onExecuteFollowUp: (suggestion: FollowUpSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

export const FollowUpSuggestionsPanel = ({
  suggestions,
  onExecuteFollowUp,
  onDismiss,
}: FollowUpSuggestionsPanelProps) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'visit':
        return <Calendar className="h-4 w-4" />;
    }
  };

  const urgencyOrder = { high: 3, medium: 2, low: 1 };
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
  );

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Follow-Up Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-400" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs mt-1">No follow-ups needed at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            🔔 Follow-Up Suggestions
            <Badge variant="secondary">{suggestions.length}</Badge>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {sortedSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border-l-4 ${
                  suggestion.urgency === 'high'
                    ? 'border-l-red-500 bg-red-50'
                    : suggestion.urgency === 'medium'
                    ? 'border-l-yellow-500 bg-yellow-50'
                    : 'border-l-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getUrgencyColor(suggestion.urgency)}>
                        {suggestion.urgency.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(suggestion.type)}
                        {suggestion.type}
                      </Badge>
                    </div>
                    <div className="font-medium text-sm text-gray-900">
                      {suggestion.propertyAddress}
                    </div>
                    {suggestion.ownerName && (
                      <div className="text-xs text-gray-600">
                        Owner: {suggestion.ownerName}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onDismiss(suggestion.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-700 mb-2">{suggestion.reason}</div>

                {suggestion.lastContactDate && (
                  <div className="text-xs text-gray-500 mb-2">
                    Last contact:{' '}
                    {formatDistanceToNow(new Date(suggestion.lastContactDate), {
                      addSuffix: true,
                    })}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-3">
                  Lead value: ${suggestion.leadValue.toLocaleString()}
                </div>

                {suggestion.suggestedMessage && (
                  <div className="mb-3 p-2 bg-white rounded border text-xs">
                    <div className="font-medium text-gray-700 mb-1">
                      Suggested message:
                    </div>
                    <div className="text-gray-600 italic">
                      "{suggestion.suggestedMessage}"
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onExecuteFollowUp(suggestion)}
                    className="flex-1"
                  >
                    {getTypeIcon(suggestion.type)}
                    <span className="ml-1 capitalize">{suggestion.type} Now</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Utility function to generate follow-up suggestions
export const generateFollowUpSuggestions = (properties: any[]): FollowUpSuggestion[] => {
  const suggestions: FollowUpSuggestion[] = [];
  const now = new Date();

  properties.forEach((property) => {
    const lastContactDate = property.last_contact_date
      ? new Date(property.last_contact_date)
      : null;
    const daysSinceLastContact = lastContactDate
      ? Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // High urgency: No contact in 7 days for contacted leads
    if (daysSinceLastContact > 7 && property.lead_status === 'contacted') {
      suggestions.push({
        id: `${property.id}_email_7days`,
        propertyId: property.id,
        propertyAddress: property.address,
        ownerName: property.owner_name,
        type: 'email',
        urgency: 'high',
        reason: 'No contact in over 7 days',
        suggestedMessage: `Hi ${property.owner_name || 'there'}, just following up on our conversation about ${property.address}. Are you still interested in discussing our cash offer?`,
        lastContactDate: property.last_contact_date,
        leadValue: property.cash_offer_amount,
      });
    }

    // High urgency: Offer made but no response
    if (daysSinceLastContact > 3 && property.lead_status === 'offer_made') {
      suggestions.push({
        id: `${property.id}_call_offer`,
        propertyId: property.id,
        propertyAddress: property.address,
        ownerName: property.owner_name,
        type: 'call',
        urgency: 'high',
        reason: 'Offer pending response for 3+ days',
        suggestedMessage: `Call to discuss the offer of $${property.cash_offer_amount.toLocaleString()} for ${property.address}`,
        lastContactDate: property.last_contact_date,
        leadValue: property.cash_offer_amount,
      });
    }

    // Medium urgency: Negotiating but stalled
    if (daysSinceLastContact > 5 && property.lead_status === 'negotiating') {
      suggestions.push({
        id: `${property.id}_email_negotiating`,
        propertyId: property.id,
        propertyAddress: property.address,
        ownerName: property.owner_name,
        type: 'email',
        urgency: 'medium',
        reason: 'Negotiation stalled for 5+ days',
        suggestedMessage: `Hi ${property.owner_name}, I wanted to check in on our negotiations for ${property.address}. Is there anything we can do to move forward?`,
        lastContactDate: property.last_contact_date,
        leadValue: property.cash_offer_amount,
      });
    }

    // Medium urgency: High-value lead going cold
    if (
      daysSinceLastContact > 14 &&
      property.cash_offer_amount > 200000 &&
      property.lead_status !== 'closed' &&
      property.lead_status !== 'lost'
    ) {
      suggestions.push({
        id: `${property.id}_visit_highvalue`,
        propertyId: property.id,
        propertyAddress: property.address,
        ownerName: property.owner_name,
        type: 'visit',
        urgency: 'medium',
        reason: 'High-value lead inactive for 2+ weeks',
        suggestedMessage: `Schedule a visit to re-engage this high-value opportunity ($${property.cash_offer_amount.toLocaleString()})`,
        lastContactDate: property.last_contact_date,
        leadValue: property.cash_offer_amount,
      });
    }

    // Low urgency: New lead not yet contacted
    if (!lastContactDate && property.approval_status === 'approved') {
      suggestions.push({
        id: `${property.id}_email_new`,
        propertyId: property.id,
        propertyAddress: property.address,
        ownerName: property.owner_name,
        type: 'email',
        urgency: 'low',
        reason: 'Newly approved - initial contact needed',
        suggestedMessage: `Hi ${property.owner_name || 'there'}, I wanted to reach out regarding your property at ${property.address}. We're interested in making a fair cash offer...`,
        leadValue: property.cash_offer_amount,
      });
    }
  });

  return suggestions;
};
