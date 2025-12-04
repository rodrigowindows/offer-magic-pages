import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cash_offer_amount: number;
  owner_name?: string;
  owner_address?: string;
}

interface EmailCampaignDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onOpenSettings?: () => void;
}

interface EmailSettings {
  api_endpoint: string;
  api_key: string | null;
  http_method: string;
  headers: Record<string, string>;
}

export function EmailCampaignDialog({
  properties,
  open,
  onOpenChange,
  onSuccess,
  onOpenSettings,
}: EmailCampaignDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [hasSettings, setHasSettings] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    subject: "Cash Offer for Your Property",
  });

  useEffect(() => {
    if (open) {
      loadEmailSettings();
    }
  }, [open]);

  const loadEmailSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasSettings(true);
        setEmailSettings({
          api_endpoint: data.api_endpoint,
          api_key: data.api_key,
          http_method: data.http_method,
          headers: (data.headers as Record<string, string>) || {},
        });
      } else {
        setHasSettings(false);
        setEmailSettings(null);
      }
    } catch (error) {
      console.error("Error loading email settings:", error);
      setHasSettings(false);
      setEmailSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSend = async () => {
    if (!formData.recipientEmail || !emailSettings) {
      toast({
        title: "Informação Faltando",
        description: "Preencha todos os campos obrigatórios e configure o servidor de email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const property of properties) {
        try {
          // Prepare headers
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...emailSettings.headers,
          };
          
          if (emailSettings.api_key) {
            headers["Authorization"] = `Bearer ${emailSettings.api_key}`;
          }

          // Call the user's REST API directly
          const response = await fetch(emailSettings.api_endpoint, {
            method: emailSettings.http_method,
            headers,
            body: JSON.stringify({
              propertyId: property.id,
              recipientEmail: formData.recipientEmail,
              recipientName: formData.recipientName || property.owner_name || "Property Owner",
              subject: formData.subject,
              property: {
                address: property.address,
                city: property.city,
                state: property.state,
                zip_code: property.zip_code,
                cash_offer_amount: property.cash_offer_amount,
                owner_name: property.owner_name,
              },
            }),
          });

          if (!response.ok) {
            console.error("Error sending email for property:", property.id);
            failCount++;
          } else {
            // Record campaign in database
            await supabase.from("email_campaigns").insert({
              property_id: property.id,
              recipient_email: formData.recipientEmail,
              subject: formData.subject,
            });
            
            // Mark property as email sent
            await supabase
              .from("properties")
              .update({ email_sent: true })
              .eq("id", property.id);
              
            successCount++;
          }
        } catch (err) {
          console.error("Error sending email:", err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Emails Enviados",
          description: `${successCount} email${successCount > 1 ? "s" : ""} enviado${successCount > 1 ? "s" : ""} com sucesso${
            failCount > 0 ? `, ${failCount} falhou` : ""
          }`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error("Todos os emails falharam");
      }
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Campanha de Email ({properties.length} {properties.length === 1 ? "propriedade" : "propriedades"})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!hasSettings && !loadingSettings && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Nenhuma configuração de email. Configure seu servidor primeiro.</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSettings?.();
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email do Destinatário *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="proprietario@exemplo.com"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Nome do Destinatário</Label>
            <Input
              id="recipientName"
              placeholder="João Silva"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto do Email *</Label>
            <Input
              id="subject"
              placeholder="Oferta para sua propriedade"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          {hasSettings && emailSettings && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Servidor configurado</span>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {emailSettings.api_endpoint}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenSettings?.();
                }}
              >
                Editar
              </Button>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Propriedades a enviar:</h4>
            <ul className="text-sm space-y-1">
              {properties.map((prop) => (
                <li key={prop.id} className="text-muted-foreground">
                  {prop.address}, {prop.city} - ${prop.cash_offer_amount.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending || !hasSettings || loadingSettings}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email{properties.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
