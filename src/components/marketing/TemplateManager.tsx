/**
 * Template Manager - Orchestrator component
 * Refactored from 1198 lines into focused sub-modules
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, Plus, Star } from 'lucide-react';
import { Eye } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplatesDB';
import type { Channel, SavedTemplate } from '@/types/marketing.types';
import { TEMPLATE_CATEGORIES } from '@/constants/defaultTemplates';
import { INITIAL_FORM_DATA, type TemplateFormData } from './template-manager/types';
import { TemplateListCard } from './template-manager/TemplateListCard';
import { TemplateEditorPanel } from './template-manager/TemplateEditorPanel';
import { TemplatePreviewDialog } from './template-manager/TemplatePreviewDialog';
import { useToast } from '@/hooks/use-toast';

export const TemplateManager = () => {
  const { toast } = useToast();
  const { templates, templateStats, getTemplatesByChannel, addTemplate, updateTemplate, deleteTemplate, setAsDefault } = useTemplates();

  const [activeChannel, setActiveChannel] = useState<Channel>('email');
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SavedTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({ ...INITIAL_FORM_DATA });

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_DATA, channel: activeChannel });
    setEditingTemplate(null);
    setIsCreating(false);
    setShowHtmlEditor(false);
  };

  const handleEdit = (template: SavedTemplate) => {
    setEditingTemplate(template);
    const isHtml = template.body.includes('<!DOCTYPE') || template.body.includes('<html');
    setFormData({ name: template.name, channel: template.channel, subject: template.subject || '', body: template.body, is_default: template.is_default, is_html: isHtml });
    setIsCreating(true);
    setShowHtmlEditor(isHtml);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
    if (!formData.body.trim()) { toast({ title: 'Conteúdo é obrigatório', variant: 'destructive' }); return; }

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, { name: formData.name, subject: formData.subject, body: formData.body, is_default: formData.is_default });
    } else {
      addTemplate({ id: crypto.randomUUID(), name: formData.name, channel: formData.channel, body: formData.body, subject: formData.subject, is_default: formData.is_default, created_at: new Date(), updated_at: new Date() });
    }
    resetForm();
  };

  const handleCopy = (template: SavedTemplate) => {
    addTemplate({ id: crypto.randomUUID(), name: `${template.name} (Copy)`, channel: template.channel, body: template.body, subject: template.subject, is_default: false, created_at: new Date(), updated_at: new Date() });
  };

  const handleDelete = (id: string) => { deleteTemplate(id); setDeleteConfirm(null); };

  const handleUseTemplate = (template: SavedTemplate) => {
    addTemplate({ id: crypto.randomUUID(), name: template.name, channel: template.channel, body: template.body, subject: template.subject, is_default: template.is_default, created_at: new Date(), updated_at: new Date() });
  };

  const channelTemplates = getTemplatesByChannel(activeChannel) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Template Manager</h1>
          <p className="text-muted-foreground">Crie e gerencie templates de SMS, Email e Voicemail</p>
        </div>
        <Button onClick={() => { setIsCreating(true); setFormData({ ...formData, channel: activeChannel }); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{templateStats.total}</div><div className="text-sm text-muted-foreground">Total Templates</div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><div><div className="text-2xl font-bold">{templateStats.bySMS}</div><div className="text-sm text-muted-foreground">SMS</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /><div><div className="text-2xl font-bold">{templateStats.byEmail}</div><div className="text-sm text-muted-foreground">Email</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /><div><div className="text-2xl font-bold">{templateStats.byCall}</div><div className="text-sm text-muted-foreground">Voicemail</div></div></CardContent></Card>
      </div>

      {/* Suggested Templates (when no templates exist for channel) */}
      {channelTemplates.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Templates Sugeridos para {activeChannel.toUpperCase()}</CardTitle>
            <CardDescription>Comece com templates pré-configurados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATE_CATEGORIES[activeChannel].templates.map((t) => (
                <div key={t.id} className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" onClick={() => handleUseTemplate(t)}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{TEMPLATE_CATEGORIES[activeChannel].icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{t.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.body.replace(/{[^}]+}/g, '...').substring(0, 80)}...</p>
                      {t.is_default && <Badge variant="secondary" className="text-xs mt-2"><Star className="w-3 h-3 mr-1" />Padrão</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" variant="outline" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}>
                      <Eye className="w-3 h-3 mr-1" />Preview
                    </Button>
                    <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}>
                      <Plus className="w-3 h-3 mr-1" />Usar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main layout: List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TemplateListCard
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
            templates={channelTemplates}
            deleteConfirm={deleteConfirm}
            onDeleteConfirmChange={setDeleteConfirm}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onSetDefault={setAsDefault}
            onPreview={setPreviewTemplate}
            onCreateNew={() => { setIsCreating(true); setFormData({ ...formData, channel: activeChannel }); }}
          />
        </div>
        <div>
          <TemplateEditorPanel
            isCreating={isCreating}
            isEditing={!!editingTemplate}
            formData={formData}
            showHtmlEditor={showHtmlEditor}
            showPreview={showPreview}
            onFormChange={setFormData}
            onShowHtmlEditorChange={setShowHtmlEditor}
            onShowPreviewChange={setShowPreview}
            onSave={handleSave}
            onReset={resetForm}
          />
        </div>
      </div>

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
};

export default TemplateManager;
