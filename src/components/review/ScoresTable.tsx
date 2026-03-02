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

export const ScoresTable = ({ property, onScoreSaved }: ScoresTableProps) => {
  const aiC = getScoreColor(property.ai_score);
  const ldC = getLeadScoreColor(property.lead_score);
  const pricePsf = property.estimated_value && property.square_feet && property.square_feet > 0
    ? Math.round(property.estimated_value / property.square_feet)
    : null;
  const offerPct = property.cash_offer_amount && property.estimated_value && property.estimated_value > 0
    ? Math.round((property.cash_offer_amount / property.estimated_value) * 100)
    : null;

  return (
    <div className="border rounded-lg overflow-hidden" data-section="scores-table">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-2 w-32">AI Score</TableCell>
            <TableCell className="py-2" data-field="ai-score">
              <span className={`font-bold text-base ${aiC.text}`}>{property.ai_score ?? '—'}</span>
              {property.ai_score != null && (
                <Badge variant="outline" className={`ml-2 text-[9px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>
                  {aiC.label}
                </Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-2">Lead Score</TableCell>
            <TableCell className="py-2" data-field="lead-score">
              <span className={`font-bold text-base ${ldC.text}`}>{property.lead_score ?? '—'}</span>
              {property.lead_score != null && (
                <span className={`ml-2 text-[10px] font-bold ${ldC.text}`}>{ldC.label}</span>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-2">Meu Score</TableCell>
            <TableCell className="py-1">
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
            <TableCell className="text-xs text-muted-foreground font-medium py-2">Preço</TableCell>
            <TableCell className="py-2 font-bold" data-field="price">
              {property.estimated_value ? formatCurrency(property.estimated_value) : '—'}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-2">Oferta</TableCell>
            <TableCell className="py-2" data-field="offer">
              <span className="font-bold">{property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}</span>
              {offerPct != null && (
                <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="ml-2 text-[9px]">
                  {offerPct}%
                </Badge>
              )}
            </TableCell>
          </TableRow>
          {property.square_feet && property.square_feet > 0 && (
            <TableRow>
              <TableCell className="text-xs text-muted-foreground font-medium py-2">Sqft</TableCell>
              <TableCell className="py-2" data-field="sqft">
                {property.square_feet.toLocaleString()}
                {pricePsf && <span className="text-muted-foreground text-xs ml-2">(${pricePsf}/sqft)</span>}
              </TableCell>
            </TableRow>
          )}
          {(property.bedrooms || property.bathrooms) && (
            <TableRow>
              <TableCell className="text-xs text-muted-foreground font-medium py-2">Beds / Baths</TableCell>
              <TableCell className="py-2">{property.bedrooms || '—'} / {property.bathrooms || '—'}</TableCell>
            </TableRow>
          )}
          {property.year_built && (
            <TableRow>
              <TableCell className="text-xs text-muted-foreground font-medium py-2">Ano</TableCell>
              <TableCell className="py-2">{property.year_built}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
