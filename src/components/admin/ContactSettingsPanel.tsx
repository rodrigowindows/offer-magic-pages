import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Phone } from "lucide-react";

interface ContactSettingsRow {
  id?: string;
  whatsapp_number: string;
  sms_number: string;
  support_email: string;
  calendly_url: string;
  retell_phone_number: string;
  retell_agent_id: string;
  whatsapp_message_template: string;
  sms_message_template: string;
  email_subject_template: string;
}

const EMPTY: ContactSettingsRow = {
  whatsapp_number: "",
  sms_number: "",
  support_email: "",
  calendly_url: "",
  retell_phone_number: "",
  retell_agent_id: "",
  whatsapp_message_template: "Hi! I'm interested in discussing the offer for property {{address}}.",
  sms_message_template: "Hi! Re: offer for {{address}}. ",
  email_subject_template: "Re: Cash offer for {{address}}",
};

export const ContactSettingsPanel = () => {
  const { toast } = useToast();
  const [data, setData] = useState<ContactSettingsRow>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: row } = await supabase
          .from("contact_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (row) {
          setData({
            id: row.id,
            whatsapp_number: row.whatsapp_number ?? "",
            sms_number: row.sms_number ?? "",
            support_email: row.support_email ?? "",
            calendly_url: row.calendly_url ?? "",
            retell_phone_number: row.retell_phone_number ?? "",
            retell_agent_id: row.retell_agent_id ?? "",
            whatsapp_message_template: row.whatsapp_message_template ?? EMPTY.whatsapp_message_template,
            sms_message_template: row.sms_message_template ?? EMPTY.sms_message_template,
            email_subject_template: row.email_subject_template ?? EMPTY.email_subject_template,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...data };
      delete (payload as any).id;

      if (data.id) {
        const { error } = await supabase.from("contact_settings").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("contact_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (inserted?.id) setData((d) => ({ ...d, id: inserted.id }));
      }
      toast({ title: "Configurações salvas" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-4 w-4" /> Contato Público (Página de Oferta)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Esses valores aparecem nos botões de contato da página pública. Use{" "}
          <code className="bg-muted px-1 rounded">{"{{address}}"}</code> e{" "}
          <code className="bg-muted px-1 rounded">{"{{propertyId}}"}</code> nos templates.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="wpp">WhatsApp Number</Label>
            <Input id="wpp" placeholder="+17868828251" value={data.whatsapp_number}
              onChange={(e) => setData({ ...data, whatsapp_number: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sms">SMS Number</Label>
            <Input id="sms" placeholder="+17868828251" value={data.sms_number}
              onChange={(e) => setData({ ...data, sms_number: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Support Email</Label>
            <Input id="email" type="email" placeholder="offers@mylocalinvest.com" value={data.support_email}
              onChange={(e) => setData({ ...data, support_email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="cal">Calendly URL</Label>
            <Input id="cal" placeholder="https://calendly.com/..." value={data.calendly_url}
              onChange={(e) => setData({ ...data, calendly_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="retellnum">Retell Phone Number</Label>
            <Input id="retellnum" placeholder="+17868828251" value={data.retell_phone_number}
              onChange={(e) => setData({ ...data, retell_phone_number: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="retellid">Retell Agent ID</Label>
            <Input id="retellid" placeholder="agent_..." value={data.retell_agent_id}
              onChange={(e) => setData({ ...data, retell_agent_id: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <Label htmlFor="wppmsg">WhatsApp Message Template</Label>
            <Textarea id="wppmsg" rows={2} value={data.whatsapp_message_template}
              onChange={(e) => setData({ ...data, whatsapp_message_template: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="smsmsg">SMS Message Template</Label>
            <Textarea id="smsmsg" rows={2} value={data.sms_message_template}
              onChange={(e) => setData({ ...data, sms_message_template: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="emailsubj">Email Subject Template</Label>
            <Input id="emailsubj" value={data.email_subject_template}
              onChange={(e) => setData({ ...data, email_subject_template: e.target.value })} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
};
