import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContactSettings {
  whatsapp_number: string | null;
  sms_number: string | null;
  support_email: string | null;
  calendly_url: string | null;
  retell_phone_number: string | null;
  retell_agent_id: string | null;
  whatsapp_message_template: string | null;
  sms_message_template: string | null;
  email_subject_template: string | null;
}

const DEFAULT_SETTINGS: ContactSettings = {
  whatsapp_number: "+17868828251",
  sms_number: "+17868828251",
  support_email: "offers@mylocalinvest.com",
  calendly_url: null,
  retell_phone_number: "+17868828251",
  retell_agent_id: null,
  whatsapp_message_template: "Hi! I'm interested in discussing the offer for property {{address}}.",
  sms_message_template: "Hi! Re: offer for {{address}}. ",
  email_subject_template: "Re: Cash offer for {{address}}",
};

export const useContactSettings = () => {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("contact_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (active && data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { settings, loading };
};

export const renderTemplate = (template: string | null | undefined, vars: Record<string, string>) => {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
};
