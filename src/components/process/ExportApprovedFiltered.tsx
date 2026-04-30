import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  selectedBatch: string;
}

const csvEscape = (val: any): string => {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toCsv = (rows: Record<string, any>[]): string => {
  if (rows.length === 0) return '';
  const set = new Set<string>();
  for (const r of rows) Object.keys(r).forEach((k) => set.add(k));
  const headers = Array.from(set);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
};

export const ExportApprovedFiltered = ({ selectedBatch }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('approval_status', 'approved')
        .order('lead_score', { ascending: false, nullsFirst: false });

      if (selectedBatch && selectedBatch !== 'all') {
        query = query.or(`batch_name.eq.${selectedBatch},import_batch.eq.${selectedBatch}`);
      }

      const { data, error } = await query.limit(5000);
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning('Nenhuma propriedade aprovada encontrada na lista atual');
        return;
      }

      const csv = toCsv(data);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      const label = selectedBatch === 'all' ? 'TODOS' : selectedBatch;
      a.href = url;
      a.download = `APROVADOS_${label}_${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`${data.length} aprovados exportados`);
    } catch (e: any) {
      console.error('export approved error', e);
      toast.error(e.message || 'Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="h-7 gap-1 px-2 text-xs"
      data-action="export-approved-filtered"
      title={`Baixar aprovados ${selectedBatch === 'all' ? 'de todos os lotes' : `do lote ${selectedBatch}`}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      )}
      <span className="hidden sm:inline">Aprovados</span>
    </Button>
  );
};
