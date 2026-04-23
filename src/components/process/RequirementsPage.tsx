import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Ban, Waves, UserX, Thermometer, FileText, Layers } from 'lucide-react';
import { REJECTION_REASONS } from '@/components/review/constants';

const HIGH_RISK_FLOOD_ZONES = ['AE', 'VE', 'A', 'V', 'AH', 'AO'];
const SAFE_FLOOD_ZONES = ['X', 'B', 'C', 'D'];

const REJECTION_RULES: Record<string, string> = {
  'agent-listed': 'Listado com corretor / MLS ativo → não fazemos wholesale em listings',
  'new-construction': 'year_built > (anoAtual - 20)',
  'recent-sale': 'last_sale_date dentro dos últimos 24 meses',
  'too-good-condition': 'Condition score alto / sem distress visual',
  'multi-family': 'property_type = duplex/triplex/4-plex',
  'hoa-restrictions': 'HOA ativa que impede wholesale',
  'condominium': 'property_type = condo',
  'apartment': 'property_type = apartment',
  'land': 'Sem estrutura construída',
  'vacant-lot': 'Lote sem casa',
  'no-equity': 'Equity estimada < 30% do estimated_value',
  'commercial': 'property_type comercial',
  'photo-unavailable': 'Sem foto = impossível avaliar visualmente',
  'llc-owned': 'owner_name contém LLC / INC / CORP / TRUST',
  'no-address-number': 'address sem street number',
  'no-wholesale-margin': 'Margem < 15% sobre ARV',
  'investor-owned': 'Owner aparece em múltiplos deals',
  'mobile-home': 'property_type mobile / manufactured',
  'public-property': 'Owner = governo / município',
  'too-expensive': 'estimated_value acima do teto da estratégia',
  'rural': 'Fora de zona urbana alvo',
  'duplicate': 'Já existe no banco',
  'wrong-location': 'Fora do mercado alvo (FL)',
  'unwanted-area': 'Bairro fora da lista de targets',
  'flood-zone': 'Zona FEMA de alto risco — ver regra dedicada',
  'other': 'Texto livre obrigatório',
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <Card className="p-4 space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
    </div>
    {children}
  </Card>
);

export const RequirementsPage = () => {
  return (
    <div className="space-y-3 pb-6">
      <Helmet>
        <title>Requisitos da Triagem | MyLocalInvest</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Requisitos da Página /process</h1>
        <span className="text-[10px] text-muted-foreground">Atualizado: 2026-04-23</span>
      </div>

      {/* Agent rule — most critical */}
      <Section icon={UserX} title="1. Regra: Se tem Agent → não fazer nada">
        <p className="text-xs">
          Se a propriedade está <strong>listada com corretor</strong> (MLS active, agent_listed flag, ou identificado durante revisão):
        </p>
        <ol className="text-xs space-y-1 list-decimal pl-5">
          <li>Marcar como <Badge variant="destructive" className="text-[10px]">rejected</Badge> com motivo <code className="text-[11px] bg-muted px-1 rounded">agent-listed</code>.</li>
          <li>
            <strong>Pular completamente:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>Skip tracing</li>
              <li>Geração de comps</li>
              <li>Cálculo de oferta (cash_offer_amount)</li>
              <li>Envio de carta / SMS / email</li>
              <li>Criação de página pública de oferta</li>
            </ul>
          </li>
          <li>Manter no histórico apenas para evitar reimportar.</li>
        </ol>
      </Section>

      {/* Flood Zone */}
      <Section icon={Waves} title="2. Flood Zone (FEMA)">
        <p className="text-xs">
          Verificação <strong>automática</strong> via Edge Function FEMA na entrada do funil. Campos:{' '}
          <code className="text-[11px] bg-muted px-1 rounded">flood_zone</code> +{' '}
          <code className="text-[11px] bg-muted px-1 rounded">flood_zone_checked_at</code>.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-red-700">🌊 Alto Risco (badge vermelho):</p>
            <div className="flex flex-wrap gap-1">
              {HIGH_RISK_FLOOD_ZONES.map(z => (
                <Badge key={z} className="bg-red-100 text-red-700 border-red-300 text-[10px]" variant="outline">
                  Zone {z}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-emerald-700">✓ Zonas Seguras (sem badge):</p>
            <div className="flex flex-wrap gap-1">
              {SAFE_FLOOD_ZONES.map(z => (
                <Badge key={z} className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]" variant="outline">
                  Zone {z}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900">
          <strong>Comportamento:</strong> badge aparece no topo do <code>ScoresTable</code> quando flood_zone está em alto risco.{' '}
          <strong>Não bloqueia automático</strong> — analista decide. Se rejeitar, usar motivo{' '}
          <code className="bg-white/60 px-1 rounded">flood-zone</code>.
        </div>
      </Section>

      {/* Rejection reasons */}
      <Section icon={Ban} title={`3. Motivos de Rejeição (${REJECTION_REASONS.length})`}>
        <p className="text-xs text-muted-foreground">
          Quando qualquer motivo se aplica → <strong>rejeitar imediatamente</strong>. Não rodar comps, skip trace, oferta nem comunicação.
        </p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-[11px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-2 py-1 font-semibold">Código</th>
                <th className="text-left px-2 py-1 font-semibold">Label PT-BR</th>
                <th className="text-left px-2 py-1 font-semibold">Regra de bloqueio</th>
              </tr>
            </thead>
            <tbody>
              {REJECTION_REASONS.map((r, i) => {
                const isCritical = ['agent-listed', 'flood-zone', 'too-expensive', 'unwanted-area'].includes(r.value);
                return (
                  <tr key={r.value} className={`border-t ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'} ${isCritical ? 'font-semibold' : ''}`}>
                    <td className="px-2 py-1 font-mono text-[10px]">{r.value}</td>
                    <td className="px-2 py-1">{r.label}</td>
                    <td className="px-2 py-1 text-muted-foreground">{REJECTION_RULES[r.value] || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Scores */}
      <Section icon={AlertTriangle} title="4. Lead Score & AI Score">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-bold mb-1">Lead Score (0–500)</p>
            <ul className="space-y-0.5">
              <li><Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]" variant="outline">≥ 230</Badge> ALTA prioridade</li>
              <li><Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]" variant="outline">150–229</Badge> PADRÃO</li>
              <li><Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]" variant="outline">&lt; 150</Badge> BAIXA</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-1">AI Score (0–100)</p>
            <ul className="space-y-0.5">
              <li><Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]" variant="outline">≥ 70</Badge> BUY (forte)</li>
              <li><Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]" variant="outline">50–69</Badge> HOLD (revisar)</li>
              <li><Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px]" variant="outline">30–49</Badge> ATENÇÃO</li>
              <li><Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]" variant="outline">&lt; 30</Badge> FRACO</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Temperature */}
      <Section icon={Thermometer} title="5. Lead Temperature (COLD / WARM / HOT)">
        <ul className="text-xs space-y-1">
          <li><strong>Default:</strong> COLD</li>
          <li><strong>Auto:</strong> ao primeiro clique em link rastreado (<code className="bg-muted px-1 rounded text-[10px]">track-link-click</code>) → COLD vira WARM, <strong>se</strong> <code className="bg-muted px-1 rounded text-[10px]">lead_temperature_manual = false</code>.</li>
          <li><strong>Manual:</strong> badge clicável cicla COLD → WARM → HOT → COLD e seta <code className="bg-muted px-1 rounded text-[10px]">lead_temperature_manual = true</code> (impede sobrescrita automática).</li>
        </ul>
      </Section>

      {/* Card structure */}
      <Section icon={Layers} title="6. Estrutura do Card de Propriedade (5 abas)">
        <ol className="text-xs space-y-1 list-decimal pl-5">
          <li><strong>Avaliação</strong> — Foto + scores + dados financeiros + critical alerts (incluindo flood badge)</li>
          <li><strong>Contatos</strong> — Skip trace, telefones, emails, DNC/deceased flags</li>
          <li><strong>Comps</strong> — Análise de comparáveis (ATTOM V2 + manuais)</li>
          <li><strong>Comunicações</strong> — Histórico de SMS / email / letter / call enviados</li>
          <li><strong>Notas</strong> — PropertyNotesPanel com contador em tempo real</li>
        </ol>
      </Section>

      {/* Notes */}
      <Section icon={FileText} title="7. Notas de Aprovação / Rejeição">
        <ul className="text-xs space-y-1">
          <li>Aprovação: prefixar com <code className="bg-emerald-50 text-emerald-700 px-1 rounded">✅ APROVADO — [observações]</code></li>
          <li>Rejeição: prefixar com <code className="bg-red-50 text-red-700 px-1 rounded">❌ REJEITADO — [Motivo do REJECTION_REASONS]</code></li>
          <li>Notas críticas (alertas bloqueantes) impedem aprovação até serem resolvidas.</li>
        </ul>
      </Section>

      {/* Public page */}
      <Section icon={FileText} title="8. Página Pública de Oferta (/property/:slug)">
        <p className="text-xs">
          Disparada apenas para propriedades <strong>aprovadas</strong> (não para agent-listed, flood-rejeitadas, etc):
        </p>
        <ul className="text-xs space-y-1 list-disc pl-5">
          <li>Disclaimer beige no topo</li>
          <li>5 botões dinâmicos (WhatsApp, SMS, Email, Calendly, Retell Call) puxando de <code className="bg-muted px-1 rounded text-[10px]">contact_settings</code></li>
          <li>Tracking de cliques → bump automático de temperatura</li>
        </ul>
      </Section>
    </div>
  );
};

export default RequirementsPage;
