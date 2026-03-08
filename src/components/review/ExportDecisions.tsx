import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ExportDecisions = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('address, city, state, zip_code, owner_name, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, ai_score, lead_score, property_type, bedrooms, bathrooms, square_feet, year_built, mao, arv')
        .in('approval_status', ['approved', 'rejected'])
        .order('approved_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      if (!data?.length) {
        toast({ title: 'Nenhuma decisão', description: 'Não há propriedades aprovadas/rejeitadas para exportar.' });
        return;
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row =>
          headers.map(h => {
            const val = (row as any)[h];
            if (val == null) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decisoes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exportado!', description: `${data.length} decisões exportadas.` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }, [toast]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="h-5 px-1.5 text-[10px] gap-1"
    >
      <Download className="h-2.5 w-2.5" />
      {exporting ? '...' : 'CSV'}
    </Button>
  );
};
