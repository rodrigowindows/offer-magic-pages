import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, User, BarChart3, Mail, FileText, Phone, AtSign, AlertTriangle, Skull, PhoneOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertyImageDisplay } from '../property/PropertyImageDisplay';
import { ScoresTable } from './ScoresTable';
import { ExternalLinks } from './ExternalLinks';
import { PropertyInfoColumn } from './PropertyInfoColumn';
import { AIScoreButton } from '../ai/AIScoreButton';
import type { QueueProperty } from './types';
import { getVisualCategory } from './helpers';

/** Calculate data completeness percentage */
const getCompleteness = (p: QueueProperty): { pct: number; missing: string[] } => {
  const fields: [string, any][] = [
    ['Preço', p.estimated_value],
    ['Sqft', p.square_feet],
    ['Quartos', p.bedrooms],
    ['Banheiros', p.bathrooms],
    ['Ano', p.year_built],
    ['Tipo', p.property_type],
    ['Lote', p.lot_size],
    ['Dono', p.owner_name],
    ['Foto', p.property_image_url],
    ['Oferta', p.cash_offer_amount],
  ];
  const filled = fields.filter(([, v]) => v != null && v !== '' && v !== 0).length;
  const missing = fields.filter(([, v]) => !v || v === 0).map(([k]) => k);
  return { pct: Math.round((filled / fields.length) * 100), missing };
};

/** Detect critical issues for inline badges */
const getInlineBadges = (p: QueueProperty): { label: string; color: string }[] => {
  const badges: { label: string; color: string }[] = [];
  // Ghost property
  if (!p.square_feet && !p.bedrooms && !p.bathrooms && !p.year_built) {
    badges.push({ label: 'DADOS INCOMPLETOS', color: 'bg-red-100 text-red-700 border-red-300' });
  }
  // No photo
  if (!p.property_image_url) {
    badges.push({ label: 'SEM FOTO', color: 'bg-amber-100 text-amber-700 border-amber-300' });
  }
  // Low $/sqft
  if (p.avg_price_per_sqft && p.square_feet && p.estimated_value) {
    const psf = p.estimated_value / p.square_feet;
    if (psf < 80) badges.push({ label: `$/sqft: $${Math.round(psf)} ⚠️`, color: 'bg-amber-100 text-amber-700 border-amber-300' });
  }
  return badges;
};

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

/** Lazy-loaded tab content components */
const LazyNotesPanel = lazy(() => import('../property/PropertyNotesPanel').then(m => ({ default: m.PropertyNotesPanel })));

/** Communications tab - fetches sent messages from campaign_logs */
const CommunicationsTab = ({ propertyId, propertyAddress }: { propertyId: string; propertyAddress: string }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('campaign_logs')
          .select('id, channel, status, recipient_name, recipient_phone, recipient_email, created_at, tracking_id, campaign_type, link_clicked, click_count, first_response_at')
          .or(`property_id.eq.${propertyId},recipient_name.ilike.%${propertyAddress.split(' ').slice(0, 3).join(' ')}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        setLogs(data || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [propertyId, propertyAddress]);

  if (loading) return <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>;

  const totalSent = logs.length;
  const totalClicked = logs.filter(l => l.link_clicked).length;
  const totalResponded = logs.filter(l => l.first_response_at).length;

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">Comunicações ({totalSent})</h4>
        {totalSent > 0 && (
          <div className="flex gap-2 text-[10px]">
            <span className="text-muted-foreground">Cliques: <strong className="text-blue-600">{totalClicked}</strong></span>
            <span className="text-muted-foreground">Respostas: <strong className="text-emerald-600">{totalResponded}</strong></span>
          </div>
        )}
      </div>
      {logs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma comunicação enviada.</p>
      ) : (
        <div className="space-y-1 max-h-[250px] overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-2 p-1.5 bg-muted/30 rounded text-xs">
              <Badge variant="outline" className="text-[9px] shrink-0">
                {log.channel === 'sms' ? '💬 SMS' : log.channel === 'email' ? '📧 Email' : log.channel === 'call' ? '📞 Call' : log.channel}
              </Badge>
              <span className="text-muted-foreground truncate flex-1">
                {log.recipient_name || log.recipient_phone || log.recipient_email || '—'}
              </span>
              {log.link_clicked && <Badge variant="default" className="text-[7px] px-0.5 bg-blue-500">clicou</Badge>}
              {log.first_response_at && <Badge variant="default" className="text-[7px] px-0.5 bg-emerald-500">respondeu</Badge>}
              <Badge variant={log.status === 'sent' || log.status === 'delivered' ? 'default' : 'secondary'} className="text-[8px] shrink-0">
                {log.status}
              </Badge>
              <span className="text-[9px] text-muted-foreground shrink-0">
                {new Date(log.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const isDnc = !!property.dnc_flag || (Array.isArray(property.tags) && property.tags.some(t => t?.includes?.('DNC')));
  const isDeceased = !!property.deceased || (Array.isArray(property.tags) && property.tags.some(t => t?.includes?.('DECEASED')));
  const inlineBadges = getInlineBadges(property);
  const hasContact = !!(property.owner_phone || (property as any).pref_phone_1 || property.email1 || (property as any).pref_email_1);

  return (
    <div className={`rounded-lg border-2 ${getStatusBackground(property.approval_status)} flex flex-col`} data-property-id={property.id}>
      {/* Temperature badge + DNC/Deceased + Tabs row */}
      <div className="flex items-stretch border-b">
        {/* Temperature indicator */}
        {visual && (
          <div className={`flex items-center px-2 text-[10px] font-bold ${TEMP_COLORS[visual] || 'bg-gray-400 text-white'}`}>
            {visual}
          </div>
        )}
        {/* DNC badge */}
        {isDnc && (
          <div className="flex items-center px-1.5 text-[9px] font-bold bg-red-600 text-white gap-0.5">
            <PhoneOff className="h-2.5 w-2.5" /> DNC
          </div>
        )}
        {/* Deceased badge */}
        {isDeceased && (
          <div className="flex items-center px-1.5 text-[9px] font-bold bg-gray-700 text-white gap-0.5">
            <Skull className="h-2.5 w-2.5" /> FALECIDO
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

      {/* TAB 1: Avaliação */}
      {activeTab === 'avaliacao' && (
        <div className="p-1.5">
          <div className="grid grid-cols-[160px_1fr] sm:grid-cols-[200px_1fr] gap-1.5">
            {/* Photo + AI Score */}
            <div className="space-y-1">
              <div className="h-[140px] sm:h-[180px] overflow-hidden rounded-md">
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

            {/* Right column */}
            <div className="space-y-1 min-w-0">
              {/* Address + neighborhood + links */}
              <div>
                <div className="flex items-start gap-1">
                  <h3 className="text-sm sm:text-base font-extrabold leading-tight line-clamp-1 flex-1" data-field="address">
                    {property.address}
                  </h3>
                  <ExternalLinks address={property.address} zillowUrl={property.zillow_url} compact />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                  {property.neighborhood && <span className="italic ml-1">· {property.neighborhood}</span>}
                </p>
              </div>

              {/* Owner + contact + completeness + flags */}
              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                {property.owner_name && (
                  <p className="text-xs font-semibold text-muted-foreground truncate" data-field="owner-name">
                    Dono: {property.owner_name}
                  </p>
                )}
                {hasContact && <Phone className="h-3 w-3 text-emerald-600 shrink-0" />}
                {property.email1 && <AtSign className="h-3 w-3 text-blue-600 shrink-0" />}
                {/* Completeness badge */}
                {(() => {
                  const { pct, missing } = getCompleteness(property);
                  const color = pct >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                pct >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                'text-red-600 bg-red-50 border-red-200';
                  return (
                    <Badge variant="outline" className={`text-[8px] px-1 shrink-0 ${color}`} title={missing.length > 0 ? `Falta: ${missing.join(', ')}` : 'Dados completos'}>
                      {pct}%
                    </Badge>
                  );
                })()}
              </div>

              {/* Inline alert badges */}
              {inlineBadges.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {inlineBadges.map((b, i) => (
                    <Badge key={i} variant="outline" className={`text-[8px] px-1 ${b.color}`}>{b.label}</Badge>
                  ))}
                </div>
              )}

              {/* Scores */}
              <ScoresTable property={property} onScoreSaved={onScoreSaved} avgCompPrice={avgCompPrice} expanded />

              {/* Pre-denial + Status */}
              <PropertyInfoColumn property={property} hideAddress hideOwner compactAlerts />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Contatos - expanded with all contact data */}
      {activeTab === 'contatos' && (
        <div className="p-2 space-y-2">
          <h4 className="text-sm font-bold flex items-center gap-2">
            Dados do Proprietário
            {isDnc && <Badge variant="destructive" className="text-[9px]"><PhoneOff className="h-2.5 w-2.5 mr-0.5" /> DNC - Não Ligar</Badge>}
            {isDeceased && <Badge variant="secondary" className="text-[9px] bg-gray-600 text-white"><Skull className="h-2.5 w-2.5 mr-0.5" /> Falecido</Badge>}
          </h4>
          {/* Owner name */}
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
          {/* All Phones */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Telefones</p>
            <div className="flex flex-wrap gap-1">
              {[property.owner_phone, (property as any).pref_phone_1, (property as any).pref_phone_2, (property as any).pref_phone_3,
                (property as any).person2_phone1, (property as any).person3_phone1
              ].filter(Boolean).map((phone, i) => (
                <Badge key={i} variant="outline" className="text-sm font-mono px-2 py-1">{phone}</Badge>
              ))}
              {!property.owner_phone && !(property as any).pref_phone_1 && (
                <span className="text-xs text-muted-foreground italic">Sem telefone</span>
              )}
            </div>
          </div>
          {/* All Emails */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Emails</p>
            <div className="flex flex-wrap gap-1">
              {[property.email1, property.email2, (property as any).pref_email_1, (property as any).pref_email_2,
                (property as any).person2_email1, (property as any).person3_email1
              ].filter(Boolean).map((email, i) => (
                <Badge key={i} variant="outline" className="text-sm px-2 py-1">{email}</Badge>
              ))}
              {!property.email1 && !(property as any).pref_email_1 && (
                <span className="text-xs text-muted-foreground italic">Sem email</span>
              )}
            </div>
          </div>
          {/* Additional contacts (person2, person3) */}
          {((property as any).person2_first_name || (property as any).person3_first_name) && (
            <div className="space-y-1 pt-1 border-t">
              <p className="text-xs text-muted-foreground font-medium">Contatos Adicionais</p>
              {(property as any).person2_first_name && (
                <div className="text-xs">
                  <span className="font-semibold">{(property as any).person2_first_name} {(property as any).person2_last_name}</span>
                  {(property as any).person2_phone1 && <span className="ml-2 font-mono">{(property as any).person2_phone1}</span>}
                </div>
              )}
              {(property as any).person3_first_name && (
                <div className="text-xs">
                  <span className="font-semibold">{(property as any).person3_first_name} {(property as any).person3_last_name}</span>
                  {(property as any).person3_phone1 && <span className="ml-2 font-mono">{(property as any).person3_phone1}</span>}
                </div>
              )}
            </div>
          )}
          {/* Tags */}
          <PropertyInfoColumn property={property} hideAddress hideOwner showTagsOnly />
        </div>
      )}

      {/* TAB 3: Comps - lazy loaded */}
      {activeTab === 'comps' && (
        <div className="p-2 space-y-2" id="inline-comps-section">
          <Suspense fallback={<div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>}>
            <CompsTabContent property={property} comps={comps} onCompAdded={onCompAdded} onDeleteComp={onDeleteComp} />
          </Suspense>
        </div>
      )}

      {/* TAB 4: Comunicações - lazy loaded */}
      {activeTab === 'comunicacoes' && (
        <CommunicationsTab propertyId={property.id} propertyAddress={property.address} />
      )}

      {/* TAB 5: Notas - lazy loaded */}
      {activeTab === 'notas' && (
        <div className="p-2" data-section="notes-panel">
          <Suspense fallback={<div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>}>
            <LazyNotesPanel propertyId={property.id} propertyAddress={property.address} onNoteChanged={fetchNoteCount} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

/** Comps tab content - separated for lazy loading */
import { InlineCompsList } from './InlineCompsList';
import { InlineCompForm } from './InlineCompForm';
import { InlineMAOCalculator } from './InlineMAOCalculator';

const CompsTabContent = ({ property, comps, onCompAdded, onDeleteComp }: {
  property: QueueProperty; comps?: any[]; onCompAdded?: () => void; onDeleteComp?: (id: string) => Promise<void>;
}) => (
  <>
    <InlineCompForm
      property={{
        id: property.id,
        address: property.address,
        city: property.city ?? null,
        state: property.state ?? null,
        zip_code: property.zip_code ?? null,
        square_feet: property.square_feet ?? null,
      }}
      onCompAdded={onCompAdded || (() => {})}
    />
    {comps && comps.length > 0 && (
      <InlineCompsList
        comps={comps}
        subjectSqft={property.square_feet}
        onDeleteComp={onDeleteComp ? onDeleteComp : async () => {}}
      />
    )}
    {(!comps || comps.length === 0) && (
      <p className="text-xs text-muted-foreground text-center py-4">Nenhum comp adicionado ainda.</p>
    )}
    {/* Inline MAO Calculator */}
    <InlineMAOCalculator
      property={property}
      compsARV={null}
      onSaved={() => {}}
    />
  </>
);
