import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchInfo {
  name: string;
  count: number;
}

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-batch-csv`;

export const BatchExportButton = () => {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadBatches = async () => {
    if (batches.length > 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-batch-csv', {
        body: null,
        method: 'GET' as any,
      });
      // Fallback to direct fetch since invoke doesn't easily handle GET query params
      const resp = await fetch(`${FUNCTIONS_URL}?action=list`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const json = await resp.json();
      setBatches(json.batches || []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar batches');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (batch: string, approvedOnly = false) => {
    const key = `${batch}${approvedOnly ? ':approved' : ''}`;
    setDownloading(key);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const qs = new URLSearchParams({ batch });
      if (approvedOnly) qs.set('approved_only', '1');
      const resp = await fetch(`${FUNCTIONS_URL}?${qs.toString()}`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!resp.ok) throw new Error('Falha no download');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch}${approvedOnly ? '_APPROVED' : '_FULL'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${batch} exportado${approvedOnly ? ' (aprovados)' : ''}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar batch');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && loadBatches()}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Download className="h-3 w-3 text-emerald-500" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs">
          Batches disponíveis (100+ propriedades)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin mr-2" /> Carregando...
          </div>
        )}
        {!loading && batches.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Nenhum batch encontrado
          </div>
        )}
        {batches.map((b) => {
          const fullKey = b.name;
          const apprKey = `${b.name}:approved`;
          return (
            <div key={b.name} className="px-1 py-1 border-b last:border-0">
              <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground flex justify-between">
                <span className="truncate">{b.name}</span>
                <span>{b.count}</span>
              </div>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); handleDownload(b.name, false); }}
                disabled={downloading === fullKey}
                className="text-xs flex items-center gap-2"
              >
                {downloading === fullKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Todos (Full)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); handleDownload(b.name, true); }}
                disabled={downloading === apprKey}
                className="text-xs flex items-center gap-2 text-emerald-600 focus:text-emerald-700"
              >
                {downloading === apprKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Somente Aprovados + Notas
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
