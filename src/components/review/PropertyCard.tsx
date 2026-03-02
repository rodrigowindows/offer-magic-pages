import { useState, useMemo, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  StickyNote,
} from 'lucide-react';
import { PropertyNotesPanel } from '../property/PropertyNotesPanel';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import type { QueueProperty } from './types';
import { DETAIL_FIELDS, CATEGORY_LABELS, TAG_COLORS } from './constants';
import { parseTags, hasRealValue, getPreDenialSuggestions, computeFillRates, saveVisibleFields, loadVisibleFields } from './helpers';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
  onScoreSaved?: () => void;
}

export const PropertyCard = ({ property, allProperties, onScoreSaved }: PropertyCardProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(loadVisibleFields);
  const [noteCount, setNoteCount] = useState<number>(0);

  const fetchNoteCount = useCallback(async () => {
    const { count } = await supabase
      .from('property_notes')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', property.id);
    setNoteCount(count || 0);
  }, [property.id]);

  useEffect(() => {
    fetchNoteCount();
  }, [fetchNoteCount]);

  const fillRates = useMemo(() => computeFillRates(allProperties), [allProperties]);
  const tagList = parseTags(property.tags);
  const suggestions = getPreDenialSuggestions(property);

  const toggleField = (key: string) => {
    setVisibleFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveVisibleFields(next);
      return next;
    });
  };

  const activeFields = DETAIL_FIELDS.filter(f => visibleFields.has(f.key));

  const renderDetailItem = (field: typeof DETAIL_FIELDS[number]) => {
    const formatted = field.format(property);
    const realValue = hasRealValue(formatted);
    const isHighlight = realValue && (field.highlight?.(property) ?? false);
    return (
      <div key={field.key} className={`px-3 py-2 border-b border-r last:border-r-0 ${isHighlight ? 'bg-emerald-50' : ''}`}>
        <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
        <p className={`text-sm font-bold truncate ${realValue ? (isHighlight ? 'text-emerald-700' : '') : 'text-muted-foreground/40'}`}>
          {realValue ? formatted : '—'}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3" data-property-id={property.id}>
      {/* Main layout: Image left + Scores/Info right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Image */}
        <div>
          <PropertyImageDisplay
            imageUrl={property.property_image_url}
            address={property.address}
          />
          {/* Decision photos */}
          {property.decision_photos && property.decision_photos.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {property.decision_photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Info + Scores column */}
        <div className="flex flex-col gap-3">
          {/* Scores Table */}
          <ScoresTable property={property} onScoreSaved={onScoreSaved} />
          {/* Address */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-0.5 line-clamp-2" data-field="address">{property.address}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
            </p>
            {property.owner_name && (
              <p className="text-xs text-muted-foreground mt-0.5" data-field="owner-name">
                <span className="font-medium">Proprietário:</span> {property.owner_name}
              </p>
            )}
          </div>

          {/* Approval/Rejection info */}
          {property.approval_status === 'approved' && property.approved_by_name && (
            <div className="px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="text-xs text-green-800">
                  Aprovado por <strong>{property.approved_by_name}</strong>
                  {property.approved_at && (
                    <> em {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </span>
              </div>
              {property.rejection_notes && (
                <p className="text-[11px] text-green-700 pl-5">
                  <span className="font-semibold">Nota de decisão:</span>{' '}
                  <span className="italic">{property.rejection_notes}</span>
                </p>
              )}
            </div>
          )}
          {property.approval_status === 'rejected' && property.approved_by_name && (
            <div className="px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span className="text-xs text-red-800">
                  Rejeitado por <strong>{property.approved_by_name}</strong>
                {property.rejection_reason && (() => {
                  const REASON_LABELS: Record<string, string> = {
                    'new-construction': 'Casa Nova (menos de 20 anos)',
                    'recent-sale': 'Recém Vendida (menos de 2 anos)',
                    'too-good-condition': 'Casa em Bom Estado',
                    'multi-family': 'Multi-Family',
                    'hoa-restrictions': 'Propriedade com HOA',
                    'land': 'Terreno (Land)',
                    'no-equity': 'Low-Equity',
                    'agent-listed': 'Anunciada por Corretor',
                    'commercial': 'Imóvel Comercial',
                    'duplicate': 'Duplicado',
                    'wrong-location': 'Localização errada',
                    'other': 'Outro motivo',
                  };
                  return <> — <strong>{REASON_LABELS[property.rejection_reason] || property.rejection_reason}</strong></>;
                })()}
                  {property.approved_at && (
                    <> em {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </span>
              </div>
              {property.rejection_notes && (
                <p className="text-[11px] text-red-700 pl-5">
                  <span className="font-semibold">Nota de decisão:</span>{' '}
                  <span className="italic">{property.rejection_notes}</span>
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagList.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[10px] sm:text-xs font-semibold ${TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}
                >
                  {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Pre-denial warnings */}
          {suggestions.length > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">PRE-NEGACAO SUGERIDA:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map(s => (
                  <Badge key={s.reason} variant="outline" className="text-[10px] sm:text-xs border-amber-400 text-amber-700 bg-amber-100">
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="flex flex-wrap gap-1.5" data-section="external-links">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" data-action="open-google-maps" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
              <MapPin className="w-3 h-3" />Maps
            </a>
            <a href={property.zillow_url || `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`} target="_blank" rel="noopener noreferrer" data-action="open-zillow" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
              <span className="font-bold">Z</span>Zillow{property.zillow_url && <ExternalLink className="w-2.5 h-2.5" />}
            </a>
            <a href={`https://www.redfin.com/search#query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" data-action="open-redfin" className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors">
              <span className="font-bold">R</span>Redfin
            </a>
            <a href={`https://www.trulia.com/homes/${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" data-action="open-trulia" className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors">
              <span className="font-bold">T</span>Trulia
            </a>
            <a href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(property.address.replace(/\s+/g, '-'))}`} target="_blank" rel="noopener noreferrer" data-action="open-realtor" className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold hover:bg-orange-100 transition-colors">
              <span className="font-bold">Re</span>Realtor
            </a>
          </div>
        </div>
      </div>

      {/* Notes — always visible */}
      <div className="border rounded-lg p-3 bg-muted/10" data-section="notes-panel">
        <PropertyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
      </div>

      {/* Keyboard hints */}
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground px-1">
        <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">A</kbd> Aprovar</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">R</kbd> Rejeitar</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">&rarr;</kbd><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">&larr;</kbd> Nav</span>
      </div>
    </div>
  );
};
