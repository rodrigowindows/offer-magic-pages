import { useState } from 'react';
import { Columns2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { QueueProperty } from './types';

interface PropertyComparisonProps {
  properties: QueueProperty[];
  currentProperty?: QueueProperty;
}

const CompareField = ({ label, a, b, highlight }: { label: string; a: string | number | null; b: string | number | null; highlight?: boolean }) => {
  const valA = a ?? '—';
  const valB = b ?? '—';
  const diff = typeof a === 'number' && typeof b === 'number' ? a !== b : false;
  return (
    <div className="grid grid-cols-[80px_1fr_1fr] gap-1 py-0.5 border-b text-[11px]">
      <span className="text-muted-foreground font-medium truncate">{label}</span>
      <span className={`font-semibold ${highlight && diff ? 'text-green-700' : ''}`}>{typeof valA === 'number' ? valA.toLocaleString() : valA}</span>
      <span className={`font-semibold ${highlight && diff ? 'text-blue-700' : ''}`}>{typeof valB === 'number' ? valB.toLocaleString() : valB}</span>
    </div>
  );
};

export const PropertyComparison = ({ properties, currentProperty }: PropertyComparisonProps) => {
  const [open, setOpen] = useState(false);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  if (!currentProperty || properties.length < 2) return null;

  const compareWith = compareIdx != null ? properties[compareIdx] : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-5 px-1.5 text-[10px] gap-1"
      >
        <Columns2 className="h-2.5 w-2.5" />
        Comparar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Columns2 className="h-4 w-4" /> Comparação Lado a Lado
            </DialogTitle>
          </DialogHeader>

          {!compareWith ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selecione uma propriedade para comparar com <strong>{currentProperty.address}</strong>:</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {properties
                  .filter(p => p.id !== currentProperty.id)
                  .slice(0, 50)
                  .map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setCompareIdx(properties.indexOf(p))}
                      className="w-full text-left px-2 py-1.5 rounded border hover:bg-muted text-xs flex items-center justify-between"
                    >
                      <span className="truncate">{p.address}</span>
                      <div className="flex gap-1 shrink-0">
                        {p.estimated_value && <Badge variant="secondary" className="text-[10px]">{formatCurrency(p.estimated_value)}</Badge>}
                        {p.approval_status && (
                          <Badge variant={p.approval_status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                            {p.approval_status === 'approved' ? '✅' : '❌'}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => setCompareIdx(null)} className="text-xs gap-1 h-6">
                  <X className="h-3 w-3" /> Trocar
                </Button>
              </div>

              {/* Headers */}
              <div className="grid grid-cols-[80px_1fr_1fr] gap-1 text-[10px] font-bold text-muted-foreground border-b pb-1">
                <span>Campo</span>
                <span className="text-green-700 truncate">{currentProperty.address}</span>
                <span className="text-blue-700 truncate">{compareWith.address}</span>
              </div>

              <CompareField label="Preço" a={currentProperty.estimated_value} b={compareWith.estimated_value} highlight />
              <CompareField label="Oferta" a={currentProperty.cash_offer_amount} b={compareWith.cash_offer_amount} highlight />
              <CompareField label="AI Score" a={currentProperty.ai_score} b={compareWith.ai_score} highlight />
              <CompareField label="Lead Score" a={currentProperty.lead_score} b={compareWith.lead_score} highlight />
              <CompareField label="Sqft" a={currentProperty.square_feet} b={compareWith.square_feet} highlight />
              <CompareField label="Quartos" a={currentProperty.bedrooms} b={compareWith.bedrooms} />
              <CompareField label="Banheiros" a={currentProperty.bathrooms} b={compareWith.bathrooms} />
              <CompareField label="Ano" a={currentProperty.year_built} b={compareWith.year_built} />
              <CompareField label="Lote" a={currentProperty.lot_size} b={compareWith.lot_size} highlight />
              <CompareField label="Tipo" a={currentProperty.property_type} b={compareWith.property_type} />
              <CompareField label="Dono" a={currentProperty.owner_name} b={compareWith.owner_name} />
              <CompareField label="Status" a={currentProperty.approval_status || 'pending'} b={compareWith.approval_status || 'pending'} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
