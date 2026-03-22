import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, BarChart3, Trash2 } from 'lucide-react';
import type { SavedComp } from '@/hooks/useComps';
import { formatCurrency } from '@/lib/utils';

interface InlineCompsListProps {
  comps: SavedComp[];
  onOpenComps: () => void;
  subjectSqft?: number | null;
}

export const InlineCompsList = ({ comps, onOpenComps, subjectSqft }: InlineCompsListProps) => {
  if (comps.length === 0) return null;

  // Calculate summary stats
  const validComps = comps.filter(c => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0);
  const avgPsf = validComps.length > 0
    ? Math.round(validComps.reduce((s, c) => s + (c.comp_data!.sale_price! / c.comp_data!.square_feet!), 0) / validComps.length)
    : null;
  const arv = avgPsf && subjectSqft && subjectSqft > 0 ? Math.round(avgPsf * subjectSqft) : null;

  return (
    <div className="border-t pt-3 space-y-2.5" data-section="comps-list">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Comps Salvos ({comps.length})
        </p>
        <Button variant="ghost" size="sm" onClick={onOpenComps} className="text-sm text-blue-600 hover:text-blue-800 h-7 px-2" data-action="add-comp">
          + Adicionar
        </Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="text-sm py-2 h-auto">Endereço</TableHead>
              <TableHead className="text-sm py-2 h-auto text-right">Preço</TableHead>
              <TableHead className="text-sm py-2 h-auto text-right">Sqft</TableHead>
              <TableHead className="text-sm py-2 h-auto text-right">$/Sqft</TableHead>
              <TableHead className="text-sm py-2 h-auto w-8"></TableHead>
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
                  <TableCell className="py-2 text-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant="outline" className="text-[10px] shrink-0 uppercase">{comp.source}</Badge>
                      <span className="truncate max-w-[200px]">{address || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {price ? formatCurrency(price) : '—'}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right text-muted-foreground">
                    {sqft ? sqft.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right">
                    {psf && <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">${psf}</Badge>}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(comp.url, '_blank')} className="h-6 w-6 p-0 shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary bar */}
      {validComps.length > 0 && (
        <div className="flex gap-4 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm" data-section="comps-summary">
          <span className="font-bold text-emerald-700 dark:text-emerald-400">Avg $/sqft: ${avgPsf}</span>
          {arv && <span className="font-bold text-emerald-700 dark:text-emerald-400">ARV: {formatCurrency(arv)}</span>}
          {arv && subjectSqft && (
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Margem: {formatCurrency(arv - (comps[0]?.comp_data?.sale_price || 0))}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
