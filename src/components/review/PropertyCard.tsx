import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyNotesPanel } from '../property/PropertyNotesPanel';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import { ExternalLinks } from './ExternalLinks';
import { PropertyInfoColumn } from './PropertyInfoColumn';
import { AIScoreButton } from '../ai/AIScoreButton';
import type { QueueProperty } from './types';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
  onOpenComps?: () => void;
  compsCount?: number;
}

const getStatusBackground = (status: string | null | undefined) => {
  switch (status) {
    case 'approved': return 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800';
    case 'rejected': return 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800';
    default: return 'bg-yellow-50/30 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
  }
};

export const PropertyCard = ({ property, allProperties, onScoreSaved, avgCompPrice, onOpenComps, compsCount }: PropertyCardProps) => {
  const [activeTab, setActiveTab] = useState<'avaliacao' | 'notas'>('avaliacao');
  const [noteCount, setNoteCount] = useState<number>(0);

  const fetchNoteCount = useCallback(async () => {
    const { count } = await supabase
      .from('property_notes')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', property.id);
    setNoteCount(count || 0);
  }, [property.id]);

  useEffect(() => { fetchNoteCount(); }, [fetchNoteCount]);
  useEffect(() => { setActiveTab('avaliacao'); }, [property.id]);

  return (
    <div className={`rounded-lg border-2 ${getStatusBackground(property.approval_status)}`} data-property-id={property.id}>
      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
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
          type="button"
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

      {activeTab === 'avaliacao' ? (
        <div className="p-2 sm:p-3">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_1fr] gap-2 sm:gap-3">
            {/* COL 1: Photo + Links */}
            <div className="space-y-1.5">

              <div className="h-[260px] sm:h-[320px] overflow-hidden rounded-lg">

                <PropertyImageDisplay imageUrl={property.property_image_url} address={property.address} />
              </div>
              {property.decision_photos && property.decision_photos.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {property.decision_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded overflow-hidden border hover:ring-1 hover:ring-primary">
                      <img src={url} alt={`Foto ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <AIScoreButton property={property} onScoreUpdate={onScoreSaved ? () => onScoreSaved() : undefined} />
              {onOpenComps && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenComps}
                  className="w-full text-sm font-semibold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  <BarChart3 className="h-4 w-4" />
                  + Adicionar Comp
                  {compsCount != null && compsCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 min-w-[18px] ml-1">{compsCount}</Badge>
                  )}
                </Button>
              )}
              <ExternalLinks address={property.address} zillowUrl={property.zillow_url} />
            </div>

            {/* COL 2: Info */}
            <PropertyInfoColumn property={property} />

            {/* COL 3: Scores */}
            <div>
              <ScoresTable property={property} onScoreSaved={onScoreSaved} avgCompPrice={avgCompPrice} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 sm:p-3" data-section="notes-panel">
          <PropertyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
        </div>
      )}
    </div>
  );
};
