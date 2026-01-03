import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { ColumnMapping } from "./ColumnMappingDialog";

interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  mappings: ColumnMapping[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface MappingTemplatesProps {
  currentMappings: ColumnMapping[];
  onLoadTemplate: (mappings: ColumnMapping[]) => void;
}

const STORAGE_KEY = "column_mapping_templates";

const MappingTemplates = ({ currentMappings, onLoadTemplate }: MappingTemplatesProps) => {
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const { toast } = useToast();

  // Load templates from localStorage on mount
  useEffect(() => {
    loadTemplatesFromStorage();
  }, []);

  const loadTemplatesFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTemplates(parsed);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates salvos",
        variant: "destructive",
      });
    }
  };

  const saveTemplatesToStorage = (newTemplates: MappingTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error("Error saving templates:", error);
      toast({
        title: "Erro ao salvar templates",
        description: "Não foi possível salvar os templates",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o template",
        variant: "destructive",
      });
      return;
    }

    if (currentMappings.length === 0) {
      toast({
        title: "Nenhum mapeamento",
        description: "Configure pelo menos um mapeamento antes de salvar",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: MappingTemplate = {
      id: `template_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      mappings: currentMappings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplatesToStorage(updatedTemplates);

    toast({
      title: "Template salvo!",
      description: `"${templateName}" foi salvo com sucesso`,
    });

    setTemplateName("");
    setTemplateDescription("");
    setIsSaveDialogOpen(false);
  };

  const handleLoadTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast({
        title: "Template não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Increment usage count
    const updatedTemplates = templates.map(t =>
      t.id === selectedTemplateId
        ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() }
        : t
    );
    saveTemplatesToStorage(updatedTemplates);

    onLoadTemplate(template.mappings);

    toast({
      title: "Template carregado!",
      description: `"${template.name}" foi aplicado com sucesso`,
    });

    setIsLoadDialogOpen(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplatesToStorage(updatedTemplates);

    toast({
      title: "Template excluído",
      description: `"${template?.name}" foi removido`,
    });
  };

  const handleExportTemplate = (template: MappingTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template_${template.name.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template exportado",
      description: `"${template.name}" foi exportado como JSON`,
    });
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as MappingTemplate;

        // Generate new ID to avoid conflicts
        const newTemplate: MappingTemplate = {
          ...imported,
          id: `template_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedTemplates = [...templates, newTemplate];
        saveTemplatesToStorage(updatedTemplates);

        toast({
          title: "Template importado!",
          description: `"${newTemplate.name}" foi importado com sucesso`,
        });
      } catch (error) {
        console.error("Error importing template:", error);
        toast({
          title: "Erro ao importar",
          description: "Arquivo inválido ou corrompido",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const mappedCount = currentMappings.filter(m => m.dbField && m.dbField !== 'skip').length;

  return (
    <div className="flex items-center gap-2">
      {/* Save Template Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={mappedCount === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Template de Mapeamento</DialogTitle>
            <DialogDescription>
              Salve este mapeamento para reutilizar em futuros imports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template *</Label>
              <Input
                id="template-name"
                placeholder="Ex: PropStream Orlando, Tax Roll FL, etc."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Descrição (opcional)</Label>
              <Input
                id="template-desc"
                placeholder="Ex: Mapeamento para dados do PropStream"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-semibold mb-1">Este template incluirá:</p>
              <Badge variant="secondary">{mappedCount} colunas mapeadas</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Button */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={templates.length === 0}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Carregar Template ({templates.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregar Template de Mapeamento</DialogTitle>
            <DialogDescription>
              Selecione um template salvo para aplicar os mapeamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.mappings.filter(m => m.dbField && m.dbField !== 'skip').length} colunas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template List */}
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className={selectedTemplateId === template.id ? "border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportTemplate(template)}
                            title="Exportar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {template.mappings.filter(m => m.dbField && m.dbField !== 'skip').length} colunas
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {template.usageCount} usos
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div>
              <Label htmlFor="import-template" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar JSON
                  </span>
                </Button>
              </Label>
              <Input
                id="import-template"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportTemplate}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLoadTemplate} disabled={!selectedTemplateId}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Aplicar Template
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MappingTemplates;
