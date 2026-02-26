import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, BarChart3 } from 'lucide-react';
import type { SavedComp } from '@/hooks/useComps';

interface InlineCompsListProps {
  comps: SavedComp[];
  onOpenComps: () => void;
}

export const InlineCompsList = ({ comps, onOpenComps }: InlineCompsListProps) => {
  if (comps.length === 0) return null;

  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Comps Salvos ({comps.length})
        </p>
        <Button variant="ghost" size="sm" onClick={onOpenComps} className="text-xs text-blue-600 hover:text-blue-800 h-6 px-2">
          + Adicionar
        </Button>
      </div>
      <div className="space-y-1.5">
        {comps.map((comp) => {
          const price = comp.comp_data?.sale_price;
          const sqft = comp.comp_data?.square_feet;
          const pricePerSqft = price && sqft && sqft > 0 ? Math.round(price / sqft) : null;
          const address = comp.comp_data?.address;

          return (
            <div key={comp.id} className="flex items-center justify-between px-2.5 py-1.5 bg-muted/50 rounded-md border text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[9px] shrink-0 uppercase">{comp.source}</Badge>
                {price && <span className="font-bold text-green-700">${price.toLocaleString()}</span>}
                {sqft && <span className="text-muted-foreground">{sqft} sqft</span>}
                {pricePerSqft && <Badge variant="secondary" className="text-[9px]">${pricePerSqft}/sqft</Badge>}
                {address && <span className="text-muted-foreground truncate max-w-[120px]">{address}</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.open(comp.url, '_blank')} className="h-6 w-6 p-0 shrink-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
