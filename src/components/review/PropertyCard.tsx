import { useState, useMemo, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  MapPin,
  ExternalLink,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { PropertyNotesPanel } from '../property/PropertyNotesPanel';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import type { QueueProperty } from './types';
import { REJECTION_REASONS, TAG_COLORS } from './constants';
import { parseTags, getPreDenialSuggestions } from './helpers';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
}

/** Get background color class for the card based on approval status */
const getStatusBackground = (status: string | null | undefined) => {
  switch (status) {
    case 'approved': return 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800';
    case 'rejected': return 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800';
    default: return 'bg-yellow-50/30 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
  }
};

export const PropertyCard = ({ property, allProperties, onScoreSaved, avgCompPrice }: PropertyCardProps) => {
  const [activeTab, setActiveTab] = useState<'avaliacao' | 'notas'>('avaliacao');
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

  useEffect(() => {
    setActiveTab('avaliacao');
  }, [property.id]);

  const tagList = parseTags(property.tags);
  const suggestions = getPreDenialSuggestions(property);

  // Hide action tags (CALL_NOW, HOT) on rejected properties
  const shouldHideActionTags = property.approval_status === 'rejected';
  const filteredTags = shouldHideActionTags
    ? tagList.filter(tag => !['HOT', '1-CALL_NOW', '2-CALL_SOON'].includes(tag))
    : tagList;

  return (
    <div className={`rounded-lg border-2 ${getStatusBackground(property.approval_status)}`} data-property-id={property.id}>
      {/* Tabs: Avaliação | Notas */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('avaliacao')}
          className={`flex-1 px-2 py-1 text-xs font-bold transition-colors ${
            activeTab === 'avaliacao'
              ? 'bg-white dark:bg-card border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:bg-white/50'
          }`}
        >
          Avaliação
        </button>
        <button
          onClick={() => setActiveTab('notas')}
          className={`flex-1 px-2 py-1 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'notas'
              ? 'bg-white dark:bg-card border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:bg-white/50'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Notas
          {noteCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 min-w-[18px]">{noteCount}</Badge>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'avaliacao' ? (
        <div className="p-1.5 sm:p-2">
          {/* COMPACT 3-COLUMN LAYOUT: Photo | Address+Info | Scores */}
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr] gap-1.5 sm:gap-2">
            {/* COL 1: Photo (compact) */}
            <div className="space-y-1">
              <div className="h-[110px] sm:h-[130px] overflow-hidden rounded-lg">
                <PropertyImageDisplay
                  imageUrl={property.property_image_url}
                  address={property.address}
                />
              </div>
              {/* Decision photos - tiny */}
              {property.decision_photos && property.decision_photos.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {property.decision_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-8 h-8 rounded overflow-hidden border hover:ring-1 hover:ring-primary">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {/* External Links - compact icons */}
              <div className="flex flex-wrap gap-1" data-section="external-links">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold hover:bg-blue-100">
                  <MapPin className="w-2.5 h-2.5" />Maps
                </a>
                <a href={property.zillow_url || `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold hover:bg-blue-100">
                  <span className="font-bold">Z</span>illow
                </a>
                <a href={`https://www.redfin.com/search#query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-semibold hover:bg-red-100">
                  <span className="font-bold">R</span>edfin
                </a>
                <a href={`https://www.trulia.com/homes/${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-semibold hover:bg-green-100">
                  <span className="font-bold">T</span>rulia
                </a>
                <a href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(property.address.replace(/\s+/g, '-'))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-semibold hover:bg-orange-100">
                  <span className="font-bold">Re</span>altor
                </a>
              </div>
            </div>

            {/* COL 2: Address + Owner + Tags + Warnings + Status */}
            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Address - prominent */}
              <div>
                <h3 className="text-sm sm:text-base font-extrabold leading-tight line-clamp-2" data-field="address">
                  {property.address}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                </p>
              </div>

              {/* Owner info */}
              {property.owner_name && (
                <p className="text-xs text-muted-foreground" data-field="owner-name">
                  <span className="font-semibold">Dono:</span> {property.owner_name}
                </p>
              )}
              {property.owner_phone && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Tel:</span> {property.owner_phone}
                </p>
              )}

              {/* Tags - hide action tags on rejected */}
              {filteredTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filteredTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-[10px] font-semibold ${TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}
                    >
                      {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Pre-denial warnings */}
              {suggestions.length > 0 && (
                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] font-bold text-amber-800">ALERTA:</span>
                    {suggestions.map(s => (
                      <Badge key={s.reason} variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-100">
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval/Rejection status banner - compact */}
              {property.approval_status === 'approved' && property.approved_by_name && (
                <div className="px-2 py-1 bg-green-100 dark:bg-green-950/60 border border-green-300 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-green-800">APROVADO</span>
                    <span className="text-[10px] text-green-700">
                      por {property.approved_by_name}
                      {property.approved_at && (
                        <> — {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </span>
                  </div>
                  {property.rejection_notes && (
                    <p className="text-[10px] text-green-700 mt-0.5 italic">{property.rejection_notes}</p>
                  )}
                </div>
              )}
              {property.approval_status === 'rejected' && property.approved_by_name && (
                <div className="px-2 py-1 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span className="text-xs font-bold text-red-800">REJEITADO</span>
                    {property.rejection_reason && (
                      <span className="text-[10px] text-red-700 font-semibold">
                        — {REJECTION_REASONS.find(r => r.value === property.rejection_reason)?.label || property.rejection_reason}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-red-600">
                    por {property.approved_by_name}
                    {property.approved_at && (
                      <> — {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </span>
                  {property.rejection_notes && (
                    <p className="text-[10px] text-red-700 mt-0.5 italic">{property.rejection_notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* COL 3: Scores Table */}
            <div>
              <ScoresTable property={property} onScoreSaved={onScoreSaved} avgCompPrice={avgCompPrice} />
            </div>
          </div>
        </div>
      ) : (
        /* NOTES TAB */
        <div className="p-2 sm:p-3" data-section="notes-panel">
          <PropertyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
        </div>
      )}
    </div>
  );
};
