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
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
          <Tip
            text="UNINCORPORATED"
            tip="Área não incorporada = fora dos limites da cidade. Pode ter menos serviços públicos, regras de zoneamento diferentes, e menor demanda de compradores."
          /> — Área fora dos limites da cidade. Pode afetar interesse do comprador.
        </div>
      )}
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5 w-28">
              <Tip text="AI Score" tip="Pontuação do AI: 70+ = COMPRAR, 50-69 = AVALIAR, 30-49 = CUIDADO, <30 = FRACO" />
            </TableCell>
            <TableCell className="py-1.5" data-field="ai-score">
              <span className={`font-bold text-lg ${aiC.text}`}>{property.ai_score ?? '—'}</span>
              {property.ai_score != null && (
                <Badge variant="outline" className={`ml-2 text-[9px] ${aiC.text} ${aiC.bg} ${aiC.border}`}>
                  {aiC.label}
                </Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">
              <Tip text="Lead Score" tip="Pontuação do lead: 230+ = ALTA prioridade, 150-229 = PADRÃO, <150 = BAIXA prioridade" />
            </TableCell>
            <TableCell className="py-1.5" data-field="lead-score">
              <span className={`font-bold text-lg ${ldC.text}`}>{property.lead_score ?? '—'}</span>
              {property.lead_score != null && (
                <span className={`ml-2 text-[10px] font-bold ${ldC.text}`}>{ldC.label}</span>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">Meu Score</TableCell>
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
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">
              <Tip text="Preço" tip="Valor estimado da propriedade baseado em dados do county e avaliação automática" />
            </TableCell>
            <TableCell className="py-1.5" data-field="price">
              <span className="font-bold text-lg">{property.estimated_value ? formatCurrency(property.estimated_value) : '—'}</span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">
              <Tip text="Oferta" tip="Valor da oferta de compra. Idealmente 60-70% do valor estimado para ter margem de lucro no wholesale" />
            </TableCell>
            <TableCell className="py-1.5" data-field="offer">
              <span className="font-bold text-lg">{property.cash_offer_amount ? formatCurrency(property.cash_offer_amount) : '—'}</span>
              {offerPct != null && (
                <Badge variant={offerPct <= 70 ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                  {offerPct}%
                </Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">
              <Tip text="Sqft" tip="Área construída em pés quadrados. Usado para calcular preço por sqft e comparar com comps" />
            </TableCell>
            <TableCell className="py-1.5 font-bold" data-field="sqft">
              {property.square_feet ? property.square_feet.toLocaleString() : '—'}
              {pricePsf && <span className="text-muted-foreground text-xs ml-2 font-normal">(${pricePsf}/sqft)</span>}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">Quartos/Banh.</TableCell>
            <TableCell className="py-1.5 font-bold">{property.bedrooms || '—'} / {property.bathrooms || '—'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs text-muted-foreground font-medium py-1.5">Ano</TableCell>
            <TableCell className="py-1.5 font-bold">{property.year_built || '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
