/**
 * AI Message Generator - Generate campaign messages with AI
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { useAIMessage, type AIMessageResult } from '@/hooks/useAIMessage';
import { useToast } from '@/hooks/use-toast';

interface AIMessageGeneratorProps {
  property: Record<string, any>;
  channel: 'sms' | 'email' | 'call' | 'letter';
  onApplyMessage?: (body: string, subject?: string) => void;
}

export const AIMessageGenerator = ({ property, channel, onApplyMessage }: AIMessageGeneratorProps) => {
  const { generateMessage, loading } = useAIMessage();
  const [result, setResult] = useState<AIMessageResult | null>(null);
  const [showVariantB, setShowVariantB] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const tones = ['friendly', 'urgent', 'professional', 'empathetic'] as const;
  const toneLabels = { friendly: '😊 Amigável', urgent: '⚡ Urgente', professional: '💼 Profissional', empathetic: '🤝 Empático' };
  const [tone, setTone] = useState<typeof tones[number]>('friendly');

  const handleGenerate = async () => {
    const r = await generateMessage(property, channel, tone);
    if (r) setResult(r);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!result) return;
    const body = showVariantB && result.variant_b ? result.variant_b : result.body;
    onApplyMessage?.(body, result.subject);
    toast({ title: '✅ Mensagem aplicada', description: 'Template atualizado com a mensagem gerada.' });
  };

  return (
    <div className="space-y-2">
      {/* Tone selector */}
      <div className="flex gap-1 flex-wrap">
        {tones.map(t => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`px-2 py-1 rounded text-[10px] border transition-colors ${
              tone === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
            }`}
          >
            {toneLabels[t]}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full gap-2 text-xs h-8 border-violet-300 text-violet-700 hover:bg-violet-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? 'Gerando...' : 'Gerar Mensagem com IA'}
      </Button>

      {result && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="p-3 space-y-2">
            {result.subject && (
              <div>
                <span className="text-[10px] font-semibold text-violet-800">Assunto:</span>
                <p className="text-xs font-medium">{result.subject}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-violet-800">
                  {showVariantB ? 'Variante B' : 'Mensagem'}
                </span>
                <div className="flex gap-1">
                  {result.variant_b && (
                    <button
                      onClick={() => setShowVariantB(!showVariantB)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-violet-200 text-violet-800 hover:bg-violet-300"
                    >
                      <RefreshCw className="h-2.5 w-2.5 inline mr-0.5" />
                      {showVariantB ? 'Ver A' : 'Ver B'}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(showVariantB && result.variant_b ? result.variant_b : result.body)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-violet-200 text-violet-800 hover:bg-violet-300"
                  >
                    {copied ? <Check className="h-2.5 w-2.5 inline" /> : <Copy className="h-2.5 w-2.5 inline" />}
                  </button>
                </div>
              </div>
              <p className="text-xs whitespace-pre-wrap bg-white rounded p-2 border text-foreground">
                {showVariantB && result.variant_b ? result.variant_b : result.body}
              </p>
            </div>

            <p className="text-[10px] text-violet-600 italic">💡 {result.tips}</p>

            {onApplyMessage && (
              <Button
                onClick={handleApply}
                size="sm"
                className="w-full h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              >
                Aplicar ao Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
