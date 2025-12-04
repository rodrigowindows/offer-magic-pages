import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CallSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallSettingsDialog({ open, onOpenChange }: CallSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    apiEndpoint: "",
    apiKey: "",
    httpMethod: "POST",
    headers: "",
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("call_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          apiEndpoint: data.api_endpoint,
          apiKey: data.api_key || "",
          httpMethod: data.http_method,
          headers: data.headers ? JSON.stringify(data.headers, null, 2) : "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Call settings:", error);
      toast.error("Failed to load Call settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.apiEndpoint) {
      toast.error("API Endpoint é obrigatório");
      return;
    }

    let parsedHeaders = {};
    if (formData.headers.trim()) {
      try {
        parsedHeaders = JSON.parse(formData.headers);
      } catch {
        toast.error("Headers inválidos. Use formato JSON válido.");
        return;
      }
    }

    try {
      setLoading(true);

      const callData = {
        api_endpoint: formData.apiEndpoint,
        api_key: formData.apiKey || null,
        http_method: formData.httpMethod,
        headers: parsedHeaders,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("call_settings")
          .update(callData)
          .eq("id", settingsId);

        if (error) throw error;
        toast.success("Configurações de chamada atualizadas!");
      } else {
        const { data, error } = await supabase
          .from("call_settings")
          .insert(callData)
          .select()
          .single();

        if (error) throw error;
        setSettingsId(data.id);
        toast.success("Configurações de chamada salvas!");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving Call settings:", error);
      toast.error("Falha ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuração de Chamadas</DialogTitle>
          <DialogDescription>
            Configure o endpoint REST do seu servidor para fazer chamadas
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiEndpoint">API Endpoint *</Label>
              <Input
                id="apiEndpoint"
                placeholder="https://seu-servidor.com/api/make-call"
                value={formData.apiEndpoint}
                onChange={(e) =>
                  setFormData({ ...formData, apiEndpoint: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="httpMethod">Método HTTP</Label>
              <Select
                value={formData.httpMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, httpMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key (opcional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua chave de API"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="headers">Headers Adicionais (JSON)</Label>
              <Textarea
                id="headers"
                placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                value={formData.headers}
                onChange={(e) =>
                  setFormData({ ...formData, headers: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Headers extras para a requisição em formato JSON
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || fetching}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
