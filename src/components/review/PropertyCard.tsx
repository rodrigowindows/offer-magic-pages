import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, User, BarChart3, Mail, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertyNotesPanel } from '../property/PropertyNotesPanel';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import { ExternalLinks } from './ExternalLinks';
import { PropertyInfoColumn } from './PropertyInfoColumn';
import { AIScoreButton } from '../ai/AIScoreButton';
import { InlineCompsList } from './InlineCompsList';
import { InlineCompForm } from './InlineCompForm';
import type { QueueProperty } from './types';
import { getVisualCategory } from './helpers';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
  onScoreSaved?: () => void;
  avgCompPrice?: number | null;
  comps?: any[];
  onCompAdded?: () => void;
  onDeleteComp?: (compId: string) => Promise<void>;
}

const getStatusBackground = (status: string | null | undefined) => {
  switch (status) {
    case 'approved': return 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800';
    case 'rejected': return 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800';
    default: return 'bg-yellow-50/30 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
  }
};

const TEMP_COLORS: Record<string, string> = {
  HOT: 'bg-red-500 text-white',
  WARM: 'bg-amber-400 text-black',
  COLD: 'bg-blue-400 text-white',
  LAND: 'bg-stone-500 text-white',
};

type TabKey = 'avaliacao' | 'contatos' | 'comps' | 'comunicacoes' | 'notas';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { key: 'avaliacao', label: 'Avaliação', icon: <FileText className="h-3 w-3" />, shortLabel: 'Aval' },
  { key: 'contatos', label: 'Contatos', icon: <User className="h-3 w-3" />, shortLabel: 'Dono' },
  { key: 'comps', label: 'Comps', icon: <BarChart3 className="h-3 w-3" />, shortLabel: 'Comps' },
  { key: 'comunicacoes', label: 'Comunicações', icon: <Mail className="h-3 w-3" />, shortLabel: 'Com' },
  { key: 'notas', label: 'Notas', icon: <MessageSquare className="h-3 w-3" />, shortLabel: 'Notas' },
];

export const PropertyCard = ({ property, allProperties, onScoreSaved, avgCompPrice, comps, onCompAdded, onDeleteComp }: PropertyCardProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>('avaliacao');
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

  const visual = getVisualCategory(property.evaluation);

  return (
    <div className={`rounded-lg border-2 ${getStatusBackground(property.approval_status)} flex flex-col`} data-property-id={property.id}>
      {/* Temperature badge + Tabs row */}
      <div className="flex items-stretch border-b">
        {/* Temperature indicator */}
        {visual && (
          <div className={`flex items-center px-2 text-[10px] font-bold ${TEMP_COLORS[visual] || 'bg-gray-400 text-white'}`}>
            {visual}
          </div>
        )}

        {/* 5 Tabs */}
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-1 py-1 text-[10px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-0.5 ${
              activeTab === tab.key
                ? 'bg-white dark:bg-card border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:bg-white/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.key === 'notas' && noteCount > 0 && (
              <Badge variant="secondary" className="text-[8px] px-0.5 min-w-[14px] h-3.5">{noteCount}</Badge>
            )}
            {tab.key === 'comps' && comps && comps.length > 0 && (
              <Badge variant="secondary" className="text-[8px] px-0.5 min-w-[14px] h-3.5">{comps.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Avaliação - Property data, photo, scores */}
      {activeTab === 'avaliacao' && (
        <div className="p-1.5">
          {/* 2-column: photo | data */}
          <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-1.5">
            {/* Photo + AI Score */}
            <div className="space-y-1">
              <div className="h-[90px] sm:h-[100px] overflow-hidden rounded-md">
                <PropertyImageDisplay imageUrl={property.property_image_url} address={property.address} />
              </div>
              {property.decision_photos && property.decision_photos.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {property.decision_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-6 h-6 rounded overflow-hidden border hover:ring-1 hover:ring-primary">
                      <img src={url} alt={`Foto ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <AIScoreButton property={property} onScoreUpdate={onScoreSaved ? () => onScoreSaved() : undefined} />
            </div>

            {/* Right column: Address + Owner + Links + Scores */}
            <div className="space-y-1 min-w-0">
              {/* Address line */}
              <div>
                <div className="flex items-start gap-1">
                  <h3 className="text-sm sm:text-base font-extrabold leading-tight line-clamp-1 flex-1" data-field="address">
                    {property.address}
                  </h3>
                  <ExternalLinks address={property.address} zillowUrl={property.zillow_url} compact />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                </p>
              </div>

              {/* Owner name inline */}
              {property.owner_name && (
                <p className="text-xs font-semibold text-muted-foreground truncate" data-field="owner-name">
                  Dono: {property.owner_name}
                </p>
              )}

              {/* Compact scores grid - 1 score only + key data */}
              <ScoresTable property={property} onScoreSaved={onScoreSaved} avgCompPrice={avgCompPrice} expanded />

              {/* Pre-denial warnings + Status banner */}
              <PropertyInfoColumn property={property} hideAddress hideOwner compactAlerts />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Contatos/Dono - Owner details, phones, emails */}
      {activeTab === 'contatos' && (
        <div className="p-2 space-y-2">
          <h4 className="text-sm font-bold">Dados do Proprietário</h4>
          {/* Company name on top if LLC */}
          {property.owner_name && (
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground font-medium">Proprietário</p>
              <p className="text-base font-bold">{property.owner_name}</p>
            </div>
          )}
          {/* Owner address */}
          {property.owner_address && (
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground font-medium">Endereço do Dono</p>
              <p className="text-sm font-semibold">{property.owner_address}</p>
            </div>
          )}
          {/* Phones */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Telefones</p>
            <div className="flex flex-wrap gap-1">
              {property.owner_phone ? (
                <Badge variant="outline" className="text-sm font-mono px-2 py-1">{property.owner_phone}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">Sem telefone</span>
              )}
              {(property as any).pref_phone_1 && <Badge variant="outline" className="text-sm font-mono px-2 py-1">{(property as any).pref_phone_1}</Badge>}
              {(property as any).pref_phone_2 && <Badge variant="outline" className="text-sm font-mono px-2 py-1">{(property as any).pref_phone_2}</Badge>}
              {(property as any).pref_phone_3 && <Badge variant="outline" className="text-sm font-mono px-2 py-1">{(property as any).pref_phone_3}</Badge>}
            </div>
          </div>
          {/* Emails */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Emails</p>
            <div className="flex flex-wrap gap-1">
              {(property as any).pref_email_1 && <Badge variant="outline" className="text-sm px-2 py-1">{(property as any).pref_email_1}</Badge>}
              {(property as any).pref_email_2 && <Badge variant="outline" className="text-sm px-2 py-1">{(property as any).pref_email_2}</Badge>}
              {!(property as any).pref_email_1 && <span className="text-xs text-muted-foreground italic">Sem email</span>}
            </div>
          </div>
          {/* Tags */}
          <PropertyInfoColumn property={property} hideAddress hideOwner showTagsOnly />
        </div>
      )}

      {/* TAB 3: Comps */}
      {activeTab === 'comps' && (
        <div className="p-2 space-y-2" id="inline-comps-section">
          <InlineCompForm
            property={{
              id: property.id,
              address: property.address,
              city: property.city ?? null,
              state: property.state ?? null,
              zip_code: (property as any).zip_code ?? null,
              square_feet: property.square_feet ?? null,
            }}
            onCompAdded={onCompAdded || (() => {})}
          />
          {comps && comps.length > 0 && (
            <InlineCompsList
              comps={comps}
              subjectSqft={property.square_feet}
              onDeleteComp={onDeleteComp || (async () => {})}
            />
          )}
          {(!comps || comps.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum comp adicionado ainda.</p>
          )}
        </div>
      )}

      {/* TAB 4: Comunicações */}
      {activeTab === 'comunicacoes' && (
        <div className="p-2 space-y-2">
          <h4 className="text-sm font-bold">Comunicações</h4>
          <p className="text-xs text-muted-foreground text-center py-4">
            Histórico de emails, cartas e SMS enviados para esta propriedade.
          </p>
          {/* TODO: integrate with campaign_logs filtered by property */}
        </div>
      )}

      {/* TAB 5: Notas */}
      {activeTab === 'notas' && (
        <div className="p-2" data-section="notes-panel">
          <PropertyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
        </div>
      )}
    </div>
  );
};
