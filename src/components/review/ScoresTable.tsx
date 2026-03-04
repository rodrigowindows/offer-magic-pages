import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { QueueProperty } from './types';
import { getScoreColor, getLeadScoreColor } from './constants';
import { AIScoreInput } from './AIScoreInput';
import { formatCurrency } from '@/lib/utils';

interface ScoresTableProps {
  property: QueueProperty;
  onScoreSaved?: () => void;
}

/** Tooltip wrapper for technical terms */
const Tip = ({ text, tip }: { text: string; tip: string }) => (
  <span title={tip} className="cursor-help border-b border-dotted border-muted-foreground/50">
    {text}
  </span>
);

export const ScoresTable = ({ property, onScoreSaved }: ScoresTableProps) => {
  const aiC = getScoreColor(property.ai_score);
  const ldC = getLeadScoreColor(property.lead_score);
  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;
  const offerPct = property.cash_offer_amount && property.estimated_value && property.estimated_value > 0
    ? Math.round((property.cash_offer_amount / property.estimated_value) * 100)
    : null;

  // Detect UNINCORPORATED in address
  const isUnincorporated = (property.address || '').toUpperCase().includes('UNINCORPORATED');

  return (
    <div className="border rounded-lg overflow-hidden" data-section="scores-table">
      {/* Unincorporated warning */}
      {isUnincorporated && (
        <div className="px-2 py-1 bg-amber-50 border-b border-amber-200 text-[10px] text-amber-800">
          <Tip
            text="UNINCORPORATED"
            tip="Área não incorporada = fora dos limites da cidade."
          /> — Fora dos limites da cidade.
        </div>
      )}
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1 w-20">
              <Tip text="AI Score" tip="70+ = COMPRAR, 50-69 = AVALIAR, <30 = FRACO" />
            </TableCell>
            <TableCell className="py-1" data-field="ai-score">
              <span className={`font-bold text-base ${aiC.text}`}>{property.ai_score ?? '—'}</span>
              {property.ai_score != null && (
                <Badge variant="outline" className={`ml-1 text-[8px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>
                  {aiC.label}
                </Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">
              <Tip text="Lead" tip="230+ = ALTA, 150-229 = PADRÃO, <150 = BAIXA" />
            </TableCell>
            <TableCell className="py-1" data-field="lead-score">
              <span className={`font-bold text-base ${ldC.text}`}>{property.lead_score ?? '—'}</span>
              {property.lead_score != null && (
                <span className={`ml-1 text-[9px] font-bold ${ldC.text}`}>{ldC.label}</span>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Meu Score</TableCell>
            <TableCell className="py-0.5">
              <AIScoreInput
                propertyId={property.id}
                currentScore={property.ai_score}
                currentReasoning={property.ai_reasoning}
                onSaved={onScoreSaved}
                inline
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Preço</TableCell>
            <TableCell className="py-1" data-field="price">
              <span className="font-bold text-base">{property.estimated_value ? formatCurrency(property.estimated_value) : '—'}</span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Oferta</TableCell>
            <TableCell className="py-1" data-field="offer">
              <span className="font-bold text-base">{property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}</span>
              {offerPct != null && (
                <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="ml-1 text-[9px]">
                  {offerPct}%
                </Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Sqft</TableCell>
            <TableCell className="py-1 font-bold text-sm" data-field="sqft">
              {property.square_feet ? property.square_feet.toLocaleString() : '—'}
              {pricePsf && <span className="text-muted-foreground text-[10px] ml-1 font-normal">(${pricePsf}/sqft)</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Q/B</TableCell>
            <TableCell className="py-1 font-bold text-sm">{property.bedrooms || '—'} / {property.bathrooms || '—'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Ano</TableCell>
            <TableCell className="py-1 font-bold text-sm">{property.year_built || '—'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-[10px] text-muted-foreground font-medium py-1">Tipo</TableCell>
            <TableCell className="py-1 font-bold text-sm">{property.property_type || '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
