import { useState } from "react";
import { Thermometer, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Temp = "COLD" | "WARM" | "HOT";

const NEXT: Record<Temp, Temp> = { COLD: "WARM", WARM: "HOT", HOT: "COLD" };

const COLORS: Record<Temp, string> = {
  HOT: "bg-red-500 text-white border-red-600",
  WARM: "bg-amber-400 text-black border-amber-500",
  COLD: "bg-blue-400 text-white border-blue-500",
};

interface LeadTemperatureBadgeProps {
  propertyId: string;
  value: string | null | undefined;
  isManual?: boolean | null;
  onChange?: (newValue: Temp) => void;
}

export const LeadTemperatureBadge = ({ propertyId, value, isManual, onChange }: LeadTemperatureBadgeProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const current = (value as Temp) || "COLD";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    const next = NEXT[current];
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({ lead_temperature: next, lead_temperature_manual: true })
        .eq("id", propertyId);
      if (error) throw error;
      onChange?.(next);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Temperatura: ${current}${isManual ? " (manual)" : " (automático)"} — clique para mudar`}
      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border ${COLORS[current]} hover:brightness-110 transition`}
    >
      {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Thermometer className="h-2.5 w-2.5" />}
      {current}
      {isManual && <span className="opacity-70 text-[8px]">·M</span>}
    </button>
  );
};
