/**
 * Template Preview Dialog — shows full preview with tracking info
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Plus, Mail, MessageSquare, Phone, AlertCircle, Check } from 'lucide-react';
import type { SavedTemplate } from '@/types/marketing.types';
import { validateTemplate, getTemplateScoreColor, getTemplateScoreLabel } from '@/utils/templateValidator';
import { generatePropertyUrl, generateQrCodeUrl, generateTrackingPixel, generateUnsubscribeUrl, replaceTemplateVariables } from './urlHelpers';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface Props {
  template: SavedTemplate | null;
  onClose: () => void;
  onUseTemplate: (template: SavedTemplate) => void;
}

const ChannelIcon = ({ channel }: { channel: string }) => {
  if (channel === 'sms') return <MessageSquare className="w-4 h-4 text-blue-500" />;
  if (channel === 'email') return <Mail className="w-4 h-4 text-green-500" />;
  return <Phone className="w-4 h-4 text-purple-500" />;
};

export function TemplatePreviewDialog({ template, onClose, onUseTemplate }: Props) {
  if (!template) return null;

  const validation = validateTemplate(template);
  const isHtml = template.body?.includes('<!DOCTYPE') || template.body?.includes('<html');

  return (
    <Dialog open={!!template} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />Preview: {template.name}
          </DialogTitle>
          <DialogDescription>Veja como este template ficará quando enviado</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <ChannelIcon channel={template.channel} />
            <span className="text-sm font-medium capitalize">{template.channel}</span>
            {template.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
          </div>

          {/* Subject */}
          {template.channel === 'email' && template.subject && (
            <div>
              <Label className="text-sm font-medium">Assunto:</Label>
              <div className="p-3 bg-muted rounded mt-1">{template.subject}</div>
            </div>
          )}

          {/* Message body */}
          <div>
            <Label className="text-sm font-medium">{template.channel === 'email' ? 'Conteúdo:' : 'Mensagem:'}</Label>
            <div className="border rounded-lg p-4 bg-white min-h-[200px]">
              {isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(replaceTemplateVariables(template.body, template.channel)) }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {replaceTemplateVariables(template.body || 'No content available', template.channel)}
                </pre>
              )}
            </div>
          </div>

          {/* URL & QR */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Link da Oferta & QR Code:</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">URL da Propriedade (Exemplo):</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm font-mono break-all">
                {generatePropertyUrl('25217 MATHEW ST', 'UNINCORPORATED', '32709', template.channel)}
              </div>
            </div>
            {template.channel === 'email' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">QR Code Preview:</Label>
                <div className="p-4 bg-gray-50 rounded border flex items-center justify-center">
                  <img src={generateQrCodeUrl('25217 MATHEW ST', 'UNINCORPORATED', '32709', template.channel)} alt="QR Code Preview" className="w-32 h-32 border-2 border-white shadow-md" />
                </div>
              </div>
            )}
          </div>

          {/* Tracking info */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analytics & Tracking:</Label>
            <div className="space-y-2">
              {['Links de tracking UTM incluídos automaticamente', 'Pixel de tracking para abertura de emails', 'QR codes gerados dinamicamente por propriedade', 'Links de unsubscribe para conformidade'].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'][i]}`} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <Alert><Check className="h-4 w-4" /><AlertDescription className="text-sm">Todas as métricas de engajamento serão automaticamente rastreadas e disponíveis no dashboard.</AlertDescription></Alert>
          </div>

          {/* Validation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Qualidade do Template:</Label>
              <Badge variant={validation.isValid ? 'default' : 'destructive'} className={getTemplateScoreColor(validation.score)}>
                {validation.score}/100 - {getTemplateScoreLabel(validation.score)}
              </Badge>
            </div>
            {validation.issues.length > 0 && validation.issues.map((issue, i) => (
              <Alert key={i} variant={issue.type === 'error' ? 'destructive' : 'default'}><AlertCircle className="h-4 w-4" /><AlertDescription>{issue.message}</AlertDescription></Alert>
            ))}
            {validation.suggestions.length > 0 && validation.suggestions.map((s, i) => (
              <Alert key={i}><Check className="h-4 w-4" /><AlertDescription>{s}</AlertDescription></Alert>
            ))}
          </div>

          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription><strong>Dados de exemplo:</strong> As variáveis foram substituídas por valores de exemplo para preview.</AlertDescription></Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={() => { onUseTemplate(template); onClose(); }}>
            <Plus className="w-4 h-4 mr-2" />Usar Este Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
