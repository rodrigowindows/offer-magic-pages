import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Star, Loader2 } from "lucide-react";

interface CampaignTemplate {
  id: string;
  name: string;
  template_type: string;
  api_endpoint: string | null;
  seller_name: string | null;
  message_template: string | null;
  is_default: boolean;
  created_at: string;
}

interface CampaignTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (template: CampaignTemplate) => void;
}

export function CampaignTemplatesDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: CampaignTemplatesDialogProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    api_endpoint: "",
    seller_name: "",
    message_template: "",
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaign_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("campaign_templates").insert({
        name: formData.name,
        api_endpoint: formData.api_endpoint || null,
        seller_name: formData.seller_name || null,
        message_template: formData.message_template || null,
      });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Template saved successfully",
      });

      setFormData({ name: "", api_endpoint: "", seller_name: "", message_template: "" });
      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const { error } = await supabase
        .from("campaign_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTemplates(templates.filter((t) => t.id !== id));
      toast({
        title: "Deleted",
        description: "Template deleted",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, remove default from all templates
      await supabase
        .from("campaign_templates")
        .update({ is_default: false })
        .neq("id", "placeholder");

      // Set the selected one as default
      const { error } = await supabase
        .from("campaign_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Default Set",
        description: "Template set as default",
      });
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Campaign Templates</DialogTitle>
          <DialogDescription>
            Save and reuse campaign configurations
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {!showForm ? (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {templates.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No templates yet
                      </p>
                    ) : (
                      templates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {template.name}
                                </span>
                                {template.is_default && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              {template.api_endpoint && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {template.api_endpoint}
                                </p>
                              )}
                              {template.seller_name && (
                                <p className="text-xs text-muted-foreground">
                                  Seller: {template.seller_name}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {onSelectTemplate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    onSelectTemplate(template);
                                    onOpenChange(false);
                                  }}
                                >
                                  Use
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSetDefault(template.id)}
                                title="Set as default"
                              >
                                <Star className={`h-4 w-4 ${template.is_default ? "fill-current" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    placeholder="My Campaign Template"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input
                    placeholder="https://api.example.com/campaign"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Seller Name</Label>
                  <Input
                    placeholder="Alex"
                    value={formData.seller_name}
                    onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message Template</Label>
                  <Textarea
                    placeholder="Use {{name}}, {{address}}, {{offer}} as placeholders..."
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
