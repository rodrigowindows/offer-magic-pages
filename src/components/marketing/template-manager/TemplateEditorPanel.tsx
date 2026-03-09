/**
 * Template Editor Panel — form for creating/editing templates
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Eye, FileText, Save, X } from 'lucide-react';
import type { Channel } from '@/types/marketing.types';
import type { TemplateFormData } from './types';
import { TEMPLATE_VARIABLES } from './types';
import { HTML_TEMPLATES, type HtmlTemplateKey } from './htmlTemplates';
import { generatePropertyUrl, generateQrCodeUrl, generateTrackingPixel, generateUnsubscribeUrl } from './urlHelpers';

interface Props {
  isCreating: boolean;
  isEditing: boolean;
  formData: TemplateFormData;
  showHtmlEditor: boolean;
  showPreview: boolean;
  onFormChange: (data: TemplateFormData) => void;
  onShowHtmlEditorChange: (v: boolean) => void;
  onShowPreviewChange: (v: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

export function TemplateEditorPanel({
  isCreating, isEditing, formData, showHtmlEditor, showPreview,
  onFormChange, onShowHtmlEditorChange, onShowPreviewChange, onSave, onReset,
}: Props) {
  const insertVariable = (variable: string) => {
    onFormChange({ ...formData, body: formData.body + variable });
  };

  const loadHtmlTemplate = (key: HtmlTemplateKey) => {
    onFormChange({ ...formData, body: HTML_TEMPLATES[key], is_html: true });
    onShowHtmlEditorChange(true);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEditing ? 'Editar Template' : 'Novo Template'}</span>
          {isCreating && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {isCreating ? 'Preencha os campos abaixo' : 'Clique em "Novo Template" ou edite um existente'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating ? (
          <>
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input placeholder="Ex: Oferta Inicial" value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={formData.channel} onValueChange={(v) => onFormChange({ ...formData, channel: v as Channel })} disabled={isEditing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Voicemail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.channel === 'email' && (
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input placeholder="Ex: Cash Offer for {address}" value={formData.subject} onChange={(e) => onFormChange({ ...formData, subject: e.target.value })} />
              </div>
            )}

            {formData.channel === 'email' && (
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Code className="w-4 h-4" />Editor HTML</Label>
                <Switch checked={showHtmlEditor} onCheckedChange={onShowHtmlEditorChange} />
              </div>
            )}

            {showHtmlEditor && formData.channel === 'email' && (
              <div className="space-y-2">
                <Label>Templates HTML Prontos</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('modern')}>Modern</Button>
                  <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('minimal')}>Minimal</Button>
                  <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('professional')}>Professional</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{showHtmlEditor ? 'Código HTML' : 'Mensagem'}</Label>
              <Textarea
                placeholder={showHtmlEditor ? '<html>...</html>' : 'Digite sua mensagem...'}
                value={formData.body}
                onChange={(e) => onFormChange({ ...formData, body: e.target.value })}
                className={showHtmlEditor ? 'font-mono text-xs h-64' : 'h-32'}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Variáveis Disponíveis</Label>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button key={v.key} size="sm" variant="outline" className="text-xs h-6" onClick={() => insertVariable(v.key)} title={v.description}>
                    {v.key}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Definir como padrão</Label>
              <Switch checked={formData.is_default} onCheckedChange={(checked) => onFormChange({ ...formData, is_default: checked })} />
            </div>

            <Separator />

            {showHtmlEditor && formData.body && (
              <Dialog open={showPreview} onOpenChange={onShowPreviewChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full"><Eye className="w-4 h-4 mr-2" />Preview HTML</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                  <DialogHeader><DialogTitle>Preview do Email</DialogTitle></DialogHeader>
                  <div
                    className="border rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(formData.body
                        .replace(/{name}/g, 'João Silva')
                        .replace(/{address}/g, '123 Main Street')
                        .replace(/{city}/g, 'Orlando')
                        .replace(/{state}/g, 'FL')
                        .replace(/{cash_offer}/g, '$250,000')
                        .replace(/{company_name}/g, 'Your Real Estate Company')
                        .replace(/{phone}/g, '(555) 123-4567')
                        .replace(/{seller_name}/g, 'Maria Santos')
                        .replace(/{property_url}/g, generatePropertyUrl('sample-property-id', formData.channel))
                        .replace(/{qr_code_url}/g, generateQrCodeUrl('sample-property-id', formData.channel))
                        .replace(/{source_channel}/g, formData.channel.toUpperCase())
                        .replace(/{tracking_pixel}/g, generateTrackingPixel('sample-property-id', formData.channel))
                        .replace(/{unsubscribe_url}/g, generateUnsubscribeUrl('sample-property-id'))),
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}

            <Button className="w-full" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Atualizar Template' : 'Salvar Template'}
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um template para editar ou crie um novo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
