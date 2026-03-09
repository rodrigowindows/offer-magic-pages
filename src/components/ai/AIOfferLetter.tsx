/**
 * AI Offer Letter Generator - Generate personalized offer letters
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileSignature, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfferLetter {
  letter_text: string;
  subject_line: string;
  key_selling_points: string[];
  personalization_notes: string;
}

interface AIOfferLetterProps {
  property: Record<string, any>;
  trigger?: React.ReactNode;
}

const tones = [
  { id: 'friendly', label: '😊 Amigável' },
  { id: 'professional', label: '💼 Profissional' },
  { id: 'empathetic', label: '🤝 Empático' },
  { id: 'urgent', label: '⚡ Urgente' },
] as const;

const languages = [
  { id: 'English', label: '🇺🇸 English' },
  { id: 'Spanish', label: '🇪🇸 Español' },
  { id: 'Portuguese', label: '🇧🇷 Português' },
] as const;

export const AIOfferLetter = ({ property, trigger }: AIOfferLetterProps) => {
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<OfferLetter | null>(null);
  const [tone, setTone] = useState<string>('professional');
  const [language, setLanguage] = useState<string>('English');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-offer-letter', {
        body: { property, tone, language, sellerName: 'MyLocalInvest', includeOfferRange: true },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setLetter(data?.letter || null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (letter) {
      navigator.clipboard.writeText(letter.letter_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            <FileSignature className="h-3 w-3" />
            Carta IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-indigo-600" />
            Gerador de Carta de Oferta IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {tones.map(t => (
              <button key={t.id} onClick={() => setTone(t.id)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${tone === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {languages.map(l => (
              <button key={l.id} onClick={() => setLanguage(l.id)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${language === l.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}>
                {l.label}
              </button>
            ))}
          </div>
          <Button onClick={generate} disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {loading ? 'Gerando...' : 'Gerar Carta de Oferta'}
          </Button>
        </div>

        <ScrollArea className="max-h-[50vh]">
          {letter && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-indigo-800">📧 {letter.subject_line}</p>
                <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{letter.letter_text}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {letter.key_selling_points?.map((p, i) => (
                  <Badge key={i} className="text-[9px] bg-indigo-100 text-indigo-800">✓ {p}</Badge>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground italic">💡 {letter.personalization_notes}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
