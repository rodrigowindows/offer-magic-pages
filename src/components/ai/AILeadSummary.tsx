/**
 * AI Lead Summary - Generate executive briefing for a property lead
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AILeadSummaryProps {
  propertyIds: string[];
  trigger?: React.ReactNode;
}

export const AILeadSummary = ({ propertyIds, trigger }: AILeadSummaryProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (propertyIds.length === 0) return;
    setLoading(true);
    setSummary(null);

    try {
      // Fetch properties data
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, owner_name, owner_phone, estimated_value, cash_offer_amount, lead_status, last_contact_date, email_sent, sms_sent, card_sent, letter_sent, phone_call_made, meeting_scheduled, ai_score, lead_score, bedrooms, bathrooms, square_feet, year_built, tags, next_followup_date')
        .in('id', propertyIds);

      if (error) throw error;

      // Fetch campaign logs
      const { data: campaigns } = await supabase
        .from('campaign_logs')
        .select('property_id, campaign_type, channel, status, link_clicked, sent_at, first_response_at')
        .in('property_id', propertyIds)
        .order('sent_at', { ascending: false })
        .limit(50);

      // Fetch leads
      const { data: leads } = await supabase
        .from('property_leads')
        .select('property_id, full_name, email, phone, status, interest_level, selling_timeline, created_at')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch notes
      const { data: notes } = await supabase
        .from('property_notes')
        .select('property_id, note_text, created_at')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: result, error: fnError } = await supabase.functions.invoke('ai-lead-summary', {
        body: {
          properties,
          campaigns: campaigns || [],
          leads: leads || [],
          notes: notes || [],
        },
      });

      if (fnError) throw fnError;
      setSummary(result?.summary || 'Nenhum resumo gerado.');
    } catch (err) {
      console.error('AI Lead Summary error:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar resumo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !summary) generateSummary(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-violet-300 text-violet-700 hover:bg-violet-50">
            <Brain className="h-3.5 w-3.5" />
            Resumo IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            Resumo Executivo IA
            {summary && (
              <button onClick={handleCopy} className="ml-auto text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-sm text-muted-foreground">Analisando {propertyIds.length} lead(s)...</p>
            </div>
          ) : summary ? (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardContent className="p-4">
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Clique para gerar o resumo.
            </div>
          )}
        </ScrollArea>

        {summary && (
          <Button variant="outline" size="sm" onClick={generateSummary} disabled={loading} className="w-full gap-2">
            <Brain className="h-3.5 w-3.5" />
            Regenerar Resumo
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
