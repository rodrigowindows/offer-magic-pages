/**
 * AI-Powered Smart Follow-Up Scheduler
 * Analyzes lead engagement and suggests optimal follow-up timing/channels
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Clock, Phone, Mail, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowUpSuggestion {
  propertyId: string;
  address: string;
  ownerName: string | null;
  leadScore: number;
  channel: 'sms' | 'email' | 'call';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  daysSinceLastContact: number | null;
}

export const SmartFollowUpScheduler = () => {
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch properties that need follow-up: contacted but no response, or high lead score
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, address, owner_name, lead_score, sms_sent, email_sent, phone_call_made, answer_flag, last_contact_date, lead_captured, approval_status, phone1, email1')
        .or('approval_status.is.null,approval_status.eq.pending')
        .order('lead_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      const now = new Date();
      const result: FollowUpSuggestion[] = [];

      for (const p of properties || []) {
        const daysSince = p.last_contact_date
          ? Math.floor((now.getTime() - new Date(p.last_contact_date).getTime()) / 86400000)
          : null;

        // High lead score, not yet contacted
        if ((p.lead_score || 0) >= 60 && !p.sms_sent && !p.email_sent && !p.phone_call_made) {
          result.push({
            propertyId: p.id,
            address: p.address,
            ownerName: p.owner_name,
            leadScore: p.lead_score || 0,
            channel: p.phone1 ? 'call' : 'sms',
            reason: '🔥 Hot lead não contactado — prioridade máxima',
            priority: 'high',
            daysSinceLastContact: daysSince,
          });
        }
        // Contacted but no response after 3+ days
        else if ((p.sms_sent || p.email_sent) && !p.answer_flag && daysSince && daysSince >= 3) {
          const nextChannel = p.sms_sent && !p.email_sent ? 'email' : p.email_sent && !p.phone_call_made ? 'call' : 'sms';
          result.push({
            propertyId: p.id,
            address: p.address,
            ownerName: p.owner_name,
            leadScore: p.lead_score || 0,
            channel: nextChannel,
            reason: `Sem resposta há ${daysSince} dias — tentar ${nextChannel}`,
            priority: daysSince >= 7 ? 'high' : 'medium',
            daysSinceLastContact: daysSince,
          });
        }
        // Warm lead with some engagement
        else if ((p.lead_score || 0) >= 30 && (p.lead_score || 0) < 60 && !p.lead_captured) {
          result.push({
            propertyId: p.id,
            address: p.address,
            ownerName: p.owner_name,
            leadScore: p.lead_score || 0,
            channel: 'sms',
            reason: '🌤️ Lead morno — enviar follow-up amigável',
            priority: 'low',
            daysSinceLastContact: daysSince,
          });
        }

        if (result.length >= 15) break;
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setSuggestions(result);
    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const channelIcon = (ch: string) => {
    switch (ch) {
      case 'call': return <Phone className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-muted-foreground">Analisando leads para follow-up...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Smart Follow-Up Suggestions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generateSuggestions}>
            <Clock className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sugestão de follow-up no momento. Todos os leads estão em dia! ✅
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suggestions.map((s, i) => (
              <div key={`${s.propertyId}-${i}`} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Badge variant={priorityColor(s.priority) as any} className="text-[10px] w-16 justify-center">
                  {s.priority}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.address}</div>
                  <div className="text-xs text-muted-foreground">{s.reason}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    {channelIcon(s.channel)} {s.channel}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Score: {s.leadScore}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {suggestions.length} follow-ups sugeridos
          </div>
          <div>
            {suggestions.filter(s => s.priority === 'high').length} urgentes
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
