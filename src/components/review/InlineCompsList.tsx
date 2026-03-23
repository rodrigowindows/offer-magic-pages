import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, BarChart3, Trash2, Loader2 } from 'lucide-react';
import type { SavedComp } from '@/hooks/useComps';
import { formatCurrency } from '@/lib/utils';

interface InlineCompsListProps {
  comps: SavedComp[];
  subjectSqft?: number | null;
  onDeleteComp?: (compId: string) => Promise<void>;
}

export const InlineCompsList = ({ comps, subjectSqft, onDeleteComp }: InlineCompsListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (comps.length === 0) return null;

  // Calculate summary stats
  const validComps = comps.filter(c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0);
  const avgPsf = validComps.length > 0
    ? Math.round(validComps.reduce((s, c) => s + (c.comp_data!.sale_price! / c.comp_data!.square_feet!), 0) / validComps.length)
    : null;
  const arv = avgPsf && subjectSqft && subjectSqft > 0 ? Math.round(avgPsf * subjectSqft) : null;

  const scrollToForm = () => {
    document.querySelector('[data-section="inline-comp-form"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async (compId: string) => {
    if (!onDeleteComp) return;
    if (!window.confirm('Remover este comp?')) return;
    setDeletingId(compId);
    try { await onDeleteComp(compId); } finally { setDeletingId(null); }
  };

  return (
    <div className="border-t pt-2 space-y-2" data-section="comps-list">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5" />
          Comps Salvos ({comps.length})
        </p>
        <Button variant="ghost" size="sm" onClick={scrollToForm} className="text-xs text-blue-600 hover:text-blue-800 h-6 px-1.5" data-action="add-comp">
          + Adicionar
        </Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="text-xs py-1.5 h-auto">Endereço</TableHead>
              <TableHead className="text-xs py-1.5 h-auto text-right">Preço</TableHead>
              <TableHead className="text-xs py-1.5 h-auto text-right">Sqft</TableHead>
              <TableHead className="text-xs py-1.5 h-auto text-right">$/Sqft</TableHead>
              <TableHead className="text-xs py-1.5 h-auto w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comps.map((comp) => {
              const price = comp.comp_data?.sale_price;
              const sqft = comp.comp_data?.square_feet;
              const psf = price && sqft && sqft > 0 ? Math.round(price / sqft) : null;
              const address = comp.comp_data?.address;

              return (
                <TableRow key={comp.id} data-comp-id={comp.id}>
                  <TableCell className="py-1.5 text-xs">
                    <div className="flex items-center gap-1 min-w-0">
                      <Badge variant="outline" className="text-[9px] shrink-0 uppercase">{comp.source}</Badge>
                      <span className="truncate max-w-[180px]">{address || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {price ? formatCurrency(price) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-right text-muted-foreground">
                    {sqft ? sqft.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-right">
                    {psf && <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">${psf}</Badge>}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => window.open(comp.url, '_blank')} className="h-5 w-5 p-0 shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      {onDeleteComp && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comp.id)}
                          disabled={deletingId === comp.id}
                          className="h-5 w-5 p-0 shrink-0 text-red-400 hover:text-red-600"
                        >
                          {deletingId === comp.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />
                          }
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary bar - always visible with $/Sqft, ARV, Sqft */}
      {validComps.length > 0 && (
        <div className="flex gap-3 px-2.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs" data-section="comps-summary">
          <span className="font-bold text-emerald-700 dark:text-emerald-400">Avg $/sqft: ${avgPsf}</span>
          {subjectSqft && <span className="text-emerald-600 dark:text-emerald-500">Sqft: {subjectSqft.toLocaleString()}</span>}
          {arv && <span className="font-bold text-emerald-700 dark:text-emerald-400">ARV: {formatCurrency(arv)}</span>}
        </div>
      )}
    </div>
  );
};
