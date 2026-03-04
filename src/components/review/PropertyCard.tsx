import { useState, useMemo, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  MapPin,
  ExternalLink,
  CheckCircle,
  XCircle,
  StickyNote,
  MessageSquare,
} from 'lucide-react';
import { PropertyNotesPanel } from '../property/PropertyNotesPanel';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import type { QueueProperty } from './types';
import { DETAIL_FIELDS, CATEGORY_LABELS, TAG_COLORS, REJECTION_REASONS } from './constants';
import { parseTags, hasRealValue, getPreDenialSuggestions, computeFillRates, saveVisibleFields, loadVisibleFields } from './helpers';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
  onScoreSaved?: () => void;
}

/** Get background color class for the card based on approval status */
const getStatusBackground = (status: string | null | undefined) => {
  switch (status) {
    case 'approved': return 'bg-green-50/60 border-green-300';
    case 'rejected': return 'bg-red-50/60 border-red-300';
    default: return 'bg-yellow-50/30 border-yellow-200';
  }
};

export const PropertyCard = ({ property, allProperties, onScoreSaved }: PropertyCardProps) => {
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

  // Reset to evaluation tab when property changes
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
    <div className={`rounded-xl border-2 ${getStatusBackground(property.approval_status)}`} data-property-id={property.id}>
      {/* Tabs: Avaliação | Notas */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('avaliacao')}
          className={`flex-1 px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === 'avaliacao'
              ? 'bg-white border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:bg-white/50'
          }`}
        >
          Avaliação
        </button>
        <button
          onClick={() => setActiveTab('notas')}
          className={`flex-1 px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'notas'
              ? 'bg-white border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:bg-white/50'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Notas
          {noteCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 min-w-[20px]">{noteCount}</Badge>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'avaliacao' ? (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Main layout: Photo + Address left | Scores right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* LEFT: Photo + Address + Links */}
            <div className="space-y-2">
              {/* Photo - compact */}
              <div className="max-h-[200px] overflow-hidden rounded-lg">
                <PropertyImageDisplay
                  imageUrl={property.property_image_url}
                  address={property.address}
                />
              </div>
              {/* Decision photos */}
              {property.decision_photos && property.decision_photos.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {property.decision_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {/* Address - large font */}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold leading-tight line-clamp-2" data-field="address">
                  {property.address}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                </p>
                {property.owner_name && (
                  <p className="text-sm text-muted-foreground mt-0.5" data-field="owner-name">
                    <span className="font-semibold">Proprietário:</span> {property.owner_name}
                  </p>
                )}
              </div>

              {/* External Links - compact */}
              <div className="flex flex-wrap gap-1" data-section="external-links">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <MapPin className="w-3 h-3" />Maps
                </a>
                <a href={property.zillow_url || `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <span className="font-bold">Z</span>Zillow{property.zillow_url && <ExternalLink className="w-2.5 h-2.5" />}
                </a>
                <a href={`https://www.redfin.com/search#query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors">
                  <span className="font-bold">R</span>Redfin
                </a>
                <a href={`https://www.trulia.com/homes/${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors">
                  <span className="font-bold">T</span>Trulia
                </a>
                <a href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(property.address.replace(/\s+/g, '-'))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold hover:bg-orange-100 transition-colors">
                  <span className="font-bold">Re</span>Realtor
                </a>
              </div>
            </div>

            {/* RIGHT: Scores + Tags + Warnings */}
            <div className="flex flex-col gap-2">
              {/* Scores Table */}
              <ScoresTable property={property} onScoreSaved={onScoreSaved} />

              {/* Approval/Rejection status banner */}
              {property.approval_status === 'approved' && property.approved_by_name && (
                <div className="px-2.5 py-1.5 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm font-bold text-green-800">APROVADO</span>
                    <span className="text-xs text-green-700">
                      por {property.approved_by_name}
                      {property.approved_at && (
                        <> — {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </span>
                  </div>
                  {property.rejection_notes && (
                    <p className="text-xs text-green-700 mt-1 italic">{property.rejection_notes}</p>
                  )}
                </div>
              )}
              {property.approval_status === 'rejected' && property.approved_by_name && (
                <div className="px-2.5 py-1.5 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-sm font-bold text-red-800">REJEITADO</span>
                    {property.rejection_reason && (
                      <span className="text-xs text-red-700 font-semibold">
                        — {REJECTION_REASONS.find(r => r.value === property.rejection_reason)?.label || property.rejection_reason}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-red-600">
                    por {property.approved_by_name}
                    {property.approved_at && (
                      <> — {new Date(property.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </span>
                  {property.rejection_notes && (
                    <p className="text-xs text-red-700 mt-1 italic">{property.rejection_notes}</p>
                  )}
                </div>
              )}

              {/* Tags - hide action tags on rejected */}
              {filteredTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filteredTags.map(tag => (
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
                  <p className="text-xs font-semibold text-amber-800 mb-1">ALERTA:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map(s => (
                      <Badge key={s.reason} variant="outline" className="text-[10px] sm:text-xs border-amber-400 text-amber-700 bg-amber-100">
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* NOTES TAB */
        <div className="p-3 sm:p-4" data-section="notes-panel">
          <PropertyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
        </div>
      )}
    </div>
  );
};
