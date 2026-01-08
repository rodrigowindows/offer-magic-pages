/**
 * Template Manager - Gerenciamento de Templates de Email/SMS/Call
 * Permite criar, editar, visualizar e deletar templates
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/hooks/useTemplates';
import type { SavedTemplate, Channel } from '@/types/marketing.types';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Star,
  Mail,
  MessageSquare,
  Phone,
  Code,
  Eye,
  Save,
  X,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

// Variáveis disponíveis para templates
const TEMPLATE_VARIABLES = [
  { key: '{name}', description: 'Nome do destinatário' },
  { key: '{address}', description: 'Endereço da propriedade' },
  { key: '{city}', description: 'Cidade' },
  { key: '{state}', description: 'Estado' },
  { key: '{cash_offer}', description: 'Valor da oferta em cash' },
  { key: '{company_name}', description: 'Nome da empresa' },
  { key: '{phone}', description: 'Telefone de contato' },
  { key: '{seller_name}', description: 'Nome do vendedor/agente' },
];

// Templates HTML pré-definidos
const HTML_TEMPLATES = {
  modern: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cash Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Cash Offer for Your Property</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear <strong>{name}</strong>,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">We are pleased to present you with a cash offer for your property at:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">{address}</p>
          <p style="margin: 5px 0 0; color: #666;">{city}, {state}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0;">Our Cash Offer</p>
          <p style="font-size: 36px; color: #28a745; font-weight: bold; margin: 10px 0;">{cash_offer}</p>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">This offer is valid for 7 days. Contact us to discuss!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:{phone}" style="background-color: #667eea; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call Us: {phone}</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">{company_name}</p>
        <p style="margin: 5px 0 0; color: #999; font-size: 12px;">This email was sent regarding your property inquiry.</p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  minimal: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Property Offer</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">Property Offer</h2>
    <p>Hello {name},</p>
    <p>We would like to make a cash offer of <strong style="color: #28a745;">{cash_offer}</strong> for your property at <strong>{address}, {city}, {state}</strong>.</p>
    <p>Please contact us at <a href="tel:{phone}">{phone}</a> to discuss this offer.</p>
    <p>Best regards,<br><strong>{company_name}</strong></p>
  </div>
</body>
</html>`,
  professional: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 650px; margin: 20px auto; background-color: #ffffff; border: 1px solid #ddd;">
    <tr>
      <td style="padding: 30px; border-bottom: 3px solid #1a365d;">
        <h1 style="color: #1a365d; margin: 0; font-size: 24px; font-weight: normal;">{company_name}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Dear {name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Thank you for considering our services. We are writing to present a formal cash offer for your property located at:</p>
        <table style="width: 100%; margin: 25px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px; background-color: #f8f9fa; border: 1px solid #e9ecef;">
              <strong>Property Address:</strong><br>
              {address}<br>
              {city}, {state}
            </td>
            <td style="padding: 15px; background-color: #1a365d; color: #fff; text-align: center; border: 1px solid #1a365d;">
              <strong>Cash Offer</strong><br>
              <span style="font-size: 24px;">{cash_offer}</span>
            </td>
          </tr>
        </table>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">We believe this offer represents fair market value and are prepared to close quickly at your convenience.</p>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Please do not hesitate to contact us at <strong>{phone}</strong> to discuss this opportunity.</p>
        <p style="font-size: 16px; color: #333; line-height: 1.8; margin-top: 30px;">Respectfully yours,<br><br><strong>{seller_name}</strong><br>{company_name}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; background-color: #1a365d; text-align: center;">
        <p style="margin: 0; color: #fff; font-size: 12px;">© {company_name} | All Rights Reserved</p>
      </td>
    </tr>
  </table>
</body>
</html>`,
};

const channelIcons = {
  sms: MessageSquare,
  email: Mail,
  call: Phone,
};

export const TemplateManager = () => {
  const { toast } = useToast();
  const {
    templates,
    templateStats,
    getTemplatesByChannel,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setAsDefault,
  } = useTemplates();

  const [activeChannel, setActiveChannel] = useState<Channel>('email');
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    channel: 'email' as Channel,
    subject: '',
    body: '',
    is_default: false,
    is_html: false,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      channel: activeChannel,
      subject: '',
      body: '',
      is_default: false,
      is_html: false,
    });
    setEditingTemplate(null);
    setIsCreating(false);
    setShowHtmlEditor(false);
  };

  // Start editing
  const handleEdit = (template: SavedTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      channel: template.channel,
      subject: template.subject || '',
      body: template.body,
      is_default: template.is_default,
      is_html: template.body.includes('<!DOCTYPE') || template.body.includes('<html'),
    });
    setIsCreating(true);
    setShowHtmlEditor(template.body.includes('<!DOCTYPE') || template.body.includes('<html'));
  };

  // Save template
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formData.body.trim()) {
      toast({ title: 'Conteúdo é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        is_default: formData.is_default,
      });
    } else {
      createTemplate(
        formData.name,
        formData.channel,
        formData.body,
        formData.subject,
        formData.is_default
      );
    }

    resetForm();
  };

  // Delete template
  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setDeleteConfirm(null);
  };

  // Copy template
  const handleCopy = (template: SavedTemplate) => {
    createTemplate(
      `${template.name} (Copy)`,
      template.channel,
      template.body,
      template.subject,
      false
    );
  };

  // Insert variable
  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  // Load HTML template
  const loadHtmlTemplate = (templateKey: keyof typeof HTML_TEMPLATES) => {
    setFormData((prev) => ({
      ...prev,
      body: HTML_TEMPLATES[templateKey],
      is_html: true,
    }));
    setShowHtmlEditor(true);
  };

  const channelTemplates = getTemplatesByChannel(activeChannel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Template Manager</h1>
          <p className="text-muted-foreground">
            Crie e gerencie templates de SMS, Email e Voicemail
          </p>
        </div>
        <Button onClick={() => { setIsCreating(true); setFormData({ ...formData, channel: activeChannel }); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{templateStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{templateStats.bySMS}</div>
              <div className="text-sm text-muted-foreground">SMS</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{templateStats.byEmail}</div>
              <div className="text-sm text-muted-foreground">Email</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{templateStats.byCall}</div>
              <div className="text-sm text-muted-foreground">Voicemail</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as Channel)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sms" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="call" className="gap-2">
                    <Phone className="w-4 h-4" />
                    Voicemail
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {channelTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template de {activeChannel.toUpperCase()} encontrado</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setIsCreating(true); setFormData({ ...formData, channel: activeChannel }); }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {channelTemplates.map((template) => {
                      const Icon = channelIcons[template.channel];
                      const isHtml = template.body.includes('<!DOCTYPE') || template.body.includes('<html');
                      return (
                        <div
                          key={template.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{template.name}</span>
                                {template.is_default && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Star className="w-3 h-3" />
                                    Default
                                  </Badge>
                                )}
                                {isHtml && (
                                  <Badge variant="outline" className="gap-1">
                                    <Code className="w-3 h-3" />
                                    HTML
                                  </Badge>
                                )}
                              </div>
                              {template.subject && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Subject: {template.subject}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {isHtml ? '(HTML Template)' : template.body}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!template.is_default && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAsDefault(template.id)}
                                  title="Set as default"
                                >
                                  <Star className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(template)}
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Dialog open={deleteConfirm === template.id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm(template.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Deletar Template</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja deletar o template "{template.name}"? Esta ação não pode ser desfeita.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                      Cancelar
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDelete(template.id)}>
                                      Deletar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor Panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingTemplate ? 'Editar Template' : 'Novo Template'}</span>
                {isCreating && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {isCreating
                  ? 'Preencha os campos abaixo'
                  : 'Clique em "Novo Template" ou edite um existente'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCreating ? (
                <>
                  {/* Name */}
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      placeholder="Ex: Oferta Inicial"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Channel */}
                  <div className="space-y-2">
                    <Label>Canal</Label>
                    <Select
                      value={formData.channel}
                      onValueChange={(v) => setFormData({ ...formData, channel: v as Channel })}
                      disabled={!!editingTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="call">Voicemail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject (email only) */}
                  {formData.channel === 'email' && (
                    <div className="space-y-2">
                      <Label>Assunto</Label>
                      <Input
                        placeholder="Ex: Cash Offer for {address}"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                  )}

                  {/* HTML Editor Toggle (email only) */}
                  {formData.channel === 'email' && (
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Editor HTML
                      </Label>
                      <Switch
                        checked={showHtmlEditor}
                        onCheckedChange={setShowHtmlEditor}
                      />
                    </div>
                  )}

                  {/* HTML Templates */}
                  {showHtmlEditor && formData.channel === 'email' && (
                    <div className="space-y-2">
                      <Label>Templates HTML Prontos</Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('modern')}>
                          Modern
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('minimal')}>
                          Minimal
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => loadHtmlTemplate('professional')}>
                          Professional
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="space-y-2">
                    <Label>{showHtmlEditor ? 'Código HTML' : 'Mensagem'}</Label>
                    <Textarea
                      placeholder={showHtmlEditor ? '<html>...</html>' : 'Digite sua mensagem...'}
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className={showHtmlEditor ? 'font-mono text-xs h-64' : 'h-32'}
                    />
                  </div>

                  {/* Variables */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Variáveis Disponíveis</Label>
                    <div className="flex flex-wrap gap-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Button
                          key={v.key}
                          size="sm"
                          variant="outline"
                          className="text-xs h-6"
                          onClick={() => insertVariable(v.key)}
                          title={v.description}
                        >
                          {v.key}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Default toggle */}
                  <div className="flex items-center justify-between">
                    <Label>Definir como padrão</Label>
                    <Switch
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Preview Button */}
                  {showHtmlEditor && formData.body && (
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview HTML
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Preview do Email</DialogTitle>
                        </DialogHeader>
                        <div
                          className="border rounded-lg overflow-hidden"
                          dangerouslySetInnerHTML={{
                            __html: formData.body
                              .replace(/{name}/g, 'John Doe')
                              .replace(/{address}/g, '123 Main Street')
                              .replace(/{city}/g, 'Miami')
                              .replace(/{state}/g, 'FL')
                              .replace(/{cash_offer}/g, '$250,000')
                              .replace(/{company_name}/g, 'Your Company')
                              .replace(/{phone}/g, '(555) 123-4567')
                              .replace(/{seller_name}/g, 'Agent Name'),
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Save Button */}
                  <Button className="w-full" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingTemplate ? 'Atualizar Template' : 'Salvar Template'}
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
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
