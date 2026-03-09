/**
 * Integrations Settings Panel
 * Configure WhatsApp/Twilio, Calendly, and Zapier integrations
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  MessageSquare, Calendar, Zap, Send, Loader2, 
  ExternalLink, Phone, CheckCircle2, XCircle 
} from "lucide-react";

// ─── WhatsApp Tab ───
const WhatsAppTab = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendWhatsApp = async () => {
    if (!phone || !message) {
      toast({ title: "Preencha telefone e mensagem", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to: phone, message },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "WhatsApp enviado!", description: `SID: ${data?.sid}` });
      setMessage("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Phone className="h-4 w-4" />
        <span>Configure as credenciais Twilio nos segredos do projeto para ativar o envio.</span>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Número do destinatário</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+5511999999999"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Mensagem</Label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Olá, temos uma oferta para o seu imóvel..."
            className="mt-1"
          />
        </div>
        <Button onClick={sendWhatsApp} disabled={isSending} className="w-full">
          {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Enviar WhatsApp
        </Button>
      </div>
    </div>
  );
};

// ─── Calendly Tab ───
const CalendlyTab = () => {
  const [calendlyUrl, setCalendlyUrl] = useState(() => 
    localStorage.getItem("calendly_url") || ""
  );
  const { toast } = useToast();

  const saveUrl = () => {
    localStorage.setItem("calendly_url", calendlyUrl);
    toast({ title: "Link do Calendly salvo!" });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">URL do Calendly</Label>
        <Input
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
          placeholder="https://calendly.com/seu-usuario/reuniao"
          className="mt-1"
        />
      </div>
      <Button onClick={saveUrl} variant="secondary" className="w-full">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Salvar Link
      </Button>
      {calendlyUrl && (
        <div className="border rounded-lg overflow-hidden bg-background">
          <div className="flex items-center justify-between p-3 bg-muted/30">
            <span className="text-sm font-medium">Preview do Agendamento</span>
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <iframe
            src={calendlyUrl}
            width="100%"
            height="500"
            frameBorder="0"
            title="Calendly"
            className="border-t"
          />
        </div>
      )}
    </div>
  );
};

// ─── Zapier Tab ───
const ZapierTab = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState(() => 
    localStorage.getItem("zapier_webhook_url") || ""
  );
  const [payload, setPayload] = useState('{"event": "test", "source": "offer-magic"}');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(null);

  const saveUrl = () => {
    localStorage.setItem("zapier_webhook_url", webhookUrl);
    toast({ title: "Webhook Zapier salvo!" });
  };

  const triggerWebhook = async () => {
    if (!webhookUrl) {
      toast({ title: "Configure o webhook URL primeiro", variant: "destructive" });
      return;
    }
    setIsSending(true);
    setLastResult(null);
    try {
      let body: any;
      try {
        body = JSON.parse(payload);
      } catch {
        body = { message: payload };
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      setLastResult("success");
      toast({
        title: "Webhook disparado!",
        description: "Verifique o histórico do seu Zap para confirmar.",
      });
    } catch (error) {
      setLastResult("error");
      toast({ title: "Erro ao disparar webhook", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Zapier Webhook URL</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
          />
          <Button onClick={saveUrl} variant="outline" size="icon">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <Label className="text-sm">Payload (JSON)</Label>
        <Input
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{"key": "value"}'
          className="mt-1 font-mono text-xs"
        />
      </div>
      <Button onClick={triggerWebhook} disabled={isSending} className="w-full">
        {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
        Disparar Webhook
      </Button>
      {lastResult && (
        <div className={`flex items-center gap-2 p-2 rounded text-sm ${
          lastResult === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
        }`}>
          {lastResult === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {lastResult === "success" ? "Webhook enviado com sucesso" : "Falha ao enviar"}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───
export const IntegrationsPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Integrações Externas
          </CardTitle>
          <CardDescription>
            Configure WhatsApp, Calendly e Zapier para automatizar seu fluxo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whatsapp">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="whatsapp" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="calendly" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Calendly
              </TabsTrigger>
              <TabsTrigger value="zapier" className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Zapier
              </TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
              <TabsContent value="calendly"><CalendlyTab /></TabsContent>
              <TabsContent value="zapier"><ZapierTab /></TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
