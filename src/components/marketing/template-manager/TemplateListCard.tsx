/**
 * Template List Card — displays templates for a given channel with actions
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Code, Copy, Edit2, Eye, FileText, Mail, MessageSquare, Phone, Plus, Star, Trash2 } from 'lucide-react';
import type { Channel, SavedTemplate } from '@/types/marketing.types';
import { validateTemplate, getTemplateScoreColor, getTemplateScoreLabel } from '@/utils/templateValidator';

const channelIcons: Record<Channel, typeof Mail> = {
  sms: MessageSquare,
  email: Mail,
  call: Phone,
};

interface Props {
  activeChannel: Channel;
  onChannelChange: (channel: Channel) => void;
  templates: SavedTemplate[];
  deleteConfirm: string | null;
  onDeleteConfirmChange: (id: string | null) => void;
  onEdit: (template: SavedTemplate) => void;
  onCopy: (template: SavedTemplate) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, channel: Channel) => void;
  onPreview: (template: SavedTemplate) => void;
  onCreateNew: () => void;
}

export function TemplateListCard({
  activeChannel, onChannelChange, templates, deleteConfirm,
  onDeleteConfirmChange, onEdit, onCopy, onDelete, onSetDefault, onPreview, onCreateNew,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <Tabs value={activeChannel} onValueChange={(v) => onChannelChange(v as Channel)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sms" className="gap-2"><MessageSquare className="w-4 h-4" />SMS</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4" />Email</TabsTrigger>
            <TabsTrigger value="call" className="gap-2"><Phone className="w-4 h-4" />Voicemail</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template de {activeChannel.toUpperCase()} encontrado</p>
            <Button variant="outline" className="mt-4" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />Criar Primeiro Template
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {templates.map((template) => {
                const Icon = channelIcons[template.channel];
                const isHtml = template.body.includes('<!DOCTYPE') || template.body.includes('<html');
                const validation = validateTemplate(template);
                return (
                  <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{template.name}</span>
                          {template.is_default && <Badge variant="secondary" className="gap-1"><Star className="w-3 h-3" />Default</Badge>}
                          {isHtml && <Badge variant="outline" className="gap-1"><Code className="w-3 h-3" />HTML</Badge>}
                          <Badge variant={validation.isValid ? 'default' : 'destructive'} className={`gap-1 ${getTemplateScoreColor(validation.score)}`}>
                            {validation.score}/100 - {getTemplateScoreLabel(validation.score)}
                          </Badge>
                        </div>
                        {template.subject && <p className="text-sm text-muted-foreground mt-1">Subject: {template.subject}</p>}
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{isHtml ? '(HTML Template)' : template.body}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!template.is_default && (
                          <Button variant="ghost" size="sm" onClick={() => onSetDefault(template.id, template.channel)} title="Set as default"><Star className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onPreview(template)} title="Preview"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onCopy(template)} title="Duplicate"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(template)} title="Edit"><Edit2 className="w-4 h-4" /></Button>
                        <Dialog open={deleteConfirm === template.id} onOpenChange={(open) => !open && onDeleteConfirmChange(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteConfirmChange(template.id)} title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Deletar Template</DialogTitle>
                              <DialogDescription>Tem certeza que deseja deletar o template "{template.name}"? Esta ação não pode ser desfeita.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => onDeleteConfirmChange(null)}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => onDelete(template.id)}>Deletar</Button>
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
  );
}
