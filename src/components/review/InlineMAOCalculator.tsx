import { useState, useCallback } from 'react';
import { Calculator, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { QueueProperty } from './types';

interface InlineMAOCalculatorProps {
  property: QueueProperty;
  compsARV?: number | null;
  onSaved?: () => void;
}

export const InlineMAOCalculator = ({ property, compsARV, onSaved }: InlineMAOCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [arv, setArv] = useState('');
  const [repairPct, setRepairPct] = useState('25');
  const [wholesalePct, setWholesalePct] = useState('10');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleOpen = useCallback(() => {
    setArv((compsARV || property.estimated_value || 0).toString());
    setIsOpen(true);
  }, [compsARV, property.estimated_value]);

  const arvNum = parseFloat(arv) || 0;
  const repairVal = arvNum * (parseFloat(repairPct) / 100);
  const wholesaleVal = arvNum * (parseFloat(wholesalePct) / 100);
  const mao = Math.round(arvNum * 0.7 - repairVal - wholesaleVal);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          arv: arvNum,
          renovation_pct: parseFloat(repairPct),
          renovation_value: repairVal,
          wholesale_pct: parseFloat(wholesalePct),
          wholesale_value: wholesaleVal,
          mao,
        })
        .eq('id', property.id);
      if (error) throw error;
      toast({ title: 'MAO salvo', description: `MAO: ${formatCurrency(mao)}` });
      setIsOpen(false);
      onSaved?.();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [property.id, arvNum, repairPct, repairVal, wholesalePct, wholesaleVal, mao, toast, onSaved]);

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
      >
        <Calculator className="h-3 w-3" />
        MAO
        {property.mao ? `: ${formatCurrency(property.mao)}` : ''}
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-2 bg-accent/30 space-y-1.5 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs flex items-center gap-1">
          <Calculator className="h-3.5 w-3.5" /> MAO Calculator
        </span>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-muted-foreground">ARV</label>
          <Input value={arv} onChange={e => setArv(e.target.value)} type="number" className="h-7 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Reparo %</label>
          <Input value={repairPct} onChange={e => setRepairPct(e.target.value)} type="number" className="h-7 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Wholesale %</label>
          <Input value={wholesalePct} onChange={e => setWholesalePct(e.target.value)} type="number" className="h-7 text-xs" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-primary/10 rounded px-2 py-1">
        <span className="text-xs">MAO = ARV × 70% − Reparo − Wholesale</span>
        <span className={`font-bold text-sm ${mao > 0 ? 'text-green-700' : 'text-red-600'}`}>
          {formatCurrency(mao)}
        </span>
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full h-7 text-xs gap-1">
        <Save className="h-3 w-3" />
        {saving ? '...' : 'Salvar MAO'}
      </Button>
    </div>
  );
};
