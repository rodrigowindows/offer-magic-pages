import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Loader2 } from 'lucide-react';
import type { ProgressStats } from '@/hooks/useCampaignSender';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProps: CampaignProperty[];
  selectedChannel: Channel;
  selectedTemplate: any;
  smsDelay: number;
  setSmsDelay: (d: number) => void;
  sending: boolean;
  progressStats: ProgressStats;
  getAllPhones: (p: CampaignProperty) => string[];
  getAllEmails: (p: CampaignProperty) => string[];
  renderTemplatePreview: (prop: CampaignProperty, type?: 'body' | 'subject') => string;
  onConfirmSend: () => void;
}

export function CampaignSendPreviewDialog({
  open, onOpenChange, selectedProps, selectedChannel, selectedTemplate,
  smsDelay, setSmsDelay, sending, progressStats,
  getAllPhones, getAllEmails, renderTemplatePreview, onConfirmSend,
}: Props) {
  const totalContacts = selectedProps.reduce((t, p) => t + (selectedChannel === 'email' ? getAllEmails(p).length : getAllPhones(p).length), 0);
  const validContacts = selectedProps.filter(p => selectedChannel === 'email' ? getAllEmails(p).length > 0 : getAllPhones(p).length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Confirmar Envio da Campanha</DialogTitle>
          <DialogDescription>Revise os detalhes abaixo antes de enviar a campanha.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Resumo da Campanha</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium">Template</Label><p className="text-sm text-muted-foreground">{selectedTemplate?.name}</p></div>
                <div><Label className="text-sm font-medium">Canal</Label><p className="text-sm text-muted-foreground">{selectedChannel.toUpperCase()}</p></div>
                {selectedChannel === 'sms' && (
                  <div className="col-span-2 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Label className="text-sm font-medium flex items-center gap-2">⏱️ Delay entre envios de SMS</Label>
                    <p className="text-xs text-muted-foreground mb-2">Tempo de espera entre cada mensagem SMS</p>
                    <Select value={smsDelay.toString()} onValueChange={(v) => setSmsDelay(parseInt(v))}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[['500', '500ms (rápido)'], ['1000', '1 segundo'], ['2000', '2 segundos'], ['5000', '5 segundos'], ['10000', '10 segundos'], ['15000', '15 segundos'], ['30000', '30 segundos'], ['60000', '1 minuto']].map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center"><div className="text-2xl font-bold text-blue-600">{selectedProps.length}</div><div className="text-sm text-muted-foreground">Propriedades</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-green-600">{validContacts}</div><div className="text-sm text-muted-foreground">Contatos Válidos</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-purple-600">{totalContacts}</div><div className="text-sm text-muted-foreground">Mensagens</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Propriedades Selecionadas</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedProps.slice(0, 10).map((prop) => {
                  const contacts = selectedChannel === 'email' ? getAllEmails(prop) : getAllPhones(prop);
                  return (
                    <div key={prop.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1"><div className="font-medium text-sm">{prop.address}</div><div className="text-xs text-muted-foreground">{prop.owner_name || 'Proprietário não informado'}</div></div>
                      <div className="flex gap-1">{contacts.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{selectedChannel === 'email' ? '✉️' : '📱'} {c}</Badge>)}</div>
                    </div>
                  );
                })}
                {selectedProps.length > 10 && <div className="text-center text-sm text-muted-foreground py-2">... e mais {selectedProps.length - 10} propriedades</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Preview do Conteúdo</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedChannel === 'email' && selectedTemplate?.subject && selectedProps[0] && (
                  <div><Label className="text-sm font-medium">Assunto</Label><p className="text-sm bg-muted p-2 rounded">{renderTemplatePreview(selectedProps[0], 'subject')}</p></div>
                )}
                {selectedProps[0] && (
                  <div>
                    <Label className="text-sm font-medium">Mensagem</Label>
                    {selectedChannel === 'email' ? (
                      <iframe srcDoc={renderTemplatePreview(selectedProps[0], 'body')} className="w-full border-0 rounded bg-muted" style={{ height: '200px' }} title="Send Preview" sandbox="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">{renderTemplatePreview(selectedProps[0], 'body')}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {sending && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Enviando campanha...</span><span>{Math.round((progressStats.completed / (progressStats.total || 1)) * 100)}%</span></div>
                  <Progress value={(progressStats.completed / (progressStats.total || 1)) * 100} className="w-full" />
                  <div className="text-xs text-muted-foreground text-center">{progressStats.successCount} sucesso • {progressStats.failCount} falhas • {progressStats.estimatedTimeRemaining} restantes</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={onConfirmSend} disabled={sending} className="min-w-32 bg-green-600 hover:bg-green-700">
            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="mr-2 h-4 w-4" /> Confirmar Envio</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
