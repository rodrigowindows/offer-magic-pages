import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, ExternalLink, CheckCircle } from "lucide-react";

interface GeminiAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GeminiAPIKeyDialog = ({
  open,
  onOpenChange,
}: GeminiAPIKeyDialogProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    // Load existing key from localStorage
    if (typeof window !== 'undefined') {
      const existingKey = localStorage.getItem('gemini_api_key');
      if (existingKey) {
        setApiKey(existingKey);
        setHasKey(true);
      }
    }
  }, [open]);

  const handleSave = () => {
    if (!apiKey || apiKey.trim().length < 10) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API key válida",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setHasKey(true);

    toast({
      title: "API Key Salva! ✅",
      description: "Google Gemini AI agora está ativo para análises",
    });

    onOpenChange(false);
  };

  const handleRemove = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey("");
    setHasKey(false);

    toast({
      title: "API Key Removida",
      description: "Usando análise rule-based (sem AI)",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Gemini AI - API Key (FREE)
          </DialogTitle>
          <DialogDescription>
            Configure sua API key gratuita do Google Gemini para análises mais inteligentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          {hasKey && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Google Gemini AI está ativo! ✨
              </span>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold text-sm">Como obter sua API key GRATUITA:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>
                Visite{" "}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Faça login com sua conta Google</li>
              <li>Clique em "Get API Key" ou "Create API Key"</li>
              <li>Copie a API key gerada</li>
              <li>Cole aqui abaixo e clique em "Salvar"</li>
            </ol>
          </div>

          {/* Benefits */}
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold text-sm">Benefícios do Gemini AI:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>✅ 100% GRATUITO (60 requisições por minuto)</li>
              <li>📊 Análises mais precisas e contextualizadas</li>
              <li>🎯 Recomendações personalizadas por propriedade</li>
              <li>🏙️ Insights de mercado para cada cidade</li>
              <li>⚡ Avaliação de riscos e oportunidades</li>
            </ul>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Gemini API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Sua API key é armazenada localmente no navegador e nunca é enviada para nossos servidores
            </p>
          </div>

          {/* Usage Info */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
            <p><strong>Limite Gratuito:</strong> 60 requisições/minuto, 1500/dia</p>
            <p><strong>Privacidade:</strong> API key salva apenas no seu navegador</p>
            <p><strong>Fallback:</strong> Se Gemini falhar, usa análise rule-based automática</p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {hasKey && (
                <Button variant="destructive" onClick={handleRemove} size="sm">
                  Remover API Key
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {hasKey ? "Atualizar" : "Salvar"} API Key
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
