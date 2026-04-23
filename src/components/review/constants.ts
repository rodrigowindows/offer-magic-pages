import type { DetailField } from './types';

export interface RejectionReason {
  value: string;
  label: string;
  /** Detailed reason explaining WHY this rule blocks the deal (shown in tooltips). */
  explanation: string;
}

export const REJECTION_REASONS: RejectionReason[] = [
  { value: "new-construction", label: "Casa Nova (menos de 20 anos)", explanation: "Casas com menos de 20 anos raramente têm distress visual ou margem para wholesale. Regra: year_built > (ano atual − 20)." },
  { value: "recent-sale", label: "Recém Vendida (menos de 2 anos)", explanation: "Vendida nos últimos 24 meses → owner ainda pagando hipoteca e sem equity suficiente para wholesale." },
  { value: "too-good-condition", label: "Casa em Bom Estado", explanation: "Sem sinais visuais de distress (telhado, jardim, exterior). Owner não tem motivação para vender abaixo do mercado." },
  { value: "multi-family", label: "Multi-Family", explanation: "Duplex/triplex/4-plex saem do nosso buy-box (avaliação e financiamento diferentes). Não fazemos wholesale destes." },
  { value: "hoa-restrictions", label: "Propriedade com HOA / HOI", explanation: "HOA ativa pode bloquear cessão de contrato e impõe taxas/restrições que matam a margem do wholesale." },
  { value: "condominium", label: "Condomínio", explanation: "Condos têm taxas mensais altas, regras de associação e baixa liquidez para cash buyers." },
  { value: "apartment", label: "Apartamento", explanation: "Apartamentos não fazem parte do nosso buy-box de single-family / tax deed." },
  { value: "land", label: "Terreno (Land)", explanation: "Sem estrutura construída — cash buyers da nossa lista compram casas, não terrenos." },
  { value: "no-equity", label: "Low-Equity", explanation: "Equity estimada < 30% do valor. Sem espaço para oferta + margem do wholesaler." },
  { value: "agent-listed", label: "Anunciada por Corretor", explanation: "⛔ Imóvel listado em MLS/com agent. Não fazemos wholesale em listings ativos — pular skip trace, comps, oferta e comunicação." },
  { value: "commercial", label: "Imóvel Comercial", explanation: "Comercial requer due diligence diferente (zoning, leases, NOI). Fora do nosso buy-box residencial." },
  { value: "photo-unavailable", label: "Foto Indisponível", explanation: "Sem foto = não conseguimos avaliar condição visual (HOT/WARM/COLD) nem validar distress." },
  { value: "llc-owned", label: "Proprietário LLC/Empresa", explanation: "Owner LLC/INC/CORP/TRUST é tipicamente investidor profissional — não vai vender com desconto wholesale." },
  { value: "no-address-number", label: "Endereço sem Número", explanation: "Endereço sem street number impede skip trace, envio de carta e geolocalização." },
  { value: "no-wholesale-margin", label: "Sem Margem p/ Wholesale", explanation: "Margem < 15% sobre ARV. Após assignment fee não sobra spread para o cash buyer fechar." },
  { value: "investor-owned", label: "Proprietário Investidor / Repetido", explanation: "Owner aparece em múltiplos deals do banco — perfil de investidor profissional, não motivado seller." },
  { value: "mobile-home", label: "Mobile Home / Trailer", explanation: "Mobile/manufactured homes têm financiamento e revenda muito específicos — fora do buy-box." },
  { value: "public-property", label: "Propriedade Pública / Governo", explanation: "Owner é município/estado/governo. Aquisição segue processo de leilão público, não wholesale." },
  { value: "too-expensive", label: "Valor Muito Alto", explanation: "estimated_value acima do teto da estratégia. Cash buyers do nosso pool não cobrem essa faixa." },
  { value: "rural", label: "Área Rural / Roça", explanation: "Fora de zona urbana alvo. Revenda lenta, poucos comps e cash buyers limitados." },
  { value: "vacant-lot", label: "Lote Vazio (sem estrutura)", explanation: "Lote sem casa — mesma lógica de Land. Não temos buyers para lote puro." },
  { value: "duplicate", label: "Duplicado", explanation: "Já existe no banco em outro registro. Evita retrabalho e contatos duplicados ao mesmo owner." },
  { value: "wrong-location", label: "Localização errada", explanation: "Fora do mercado alvo (FL — Miami / Orlando). Não atendemos esta região." },
  { value: "unwanted-area", label: "Área não desejada", explanation: "Bairro fora da lista de targets (alta criminalidade, sem demanda de cash buyer, etc.)." },
  { value: "flood-zone", label: "Área de Alagamento (Flood Zone)", explanation: "Zona FEMA de alto risco (AE/VE/A/V/AH/AO). Seguro caro + revenda difícil. Analista decide caso a caso." },
  { value: "other", label: "Outro motivo", explanation: "Motivo livre — preencha as notas explicando a razão da rejeição." },
];

/** Detailed explanations for FEMA flood zones (used in TriageChecklist tooltip). */
export const FLOOD_ZONE_EXPLANATIONS: Record<string, { risk: 'high' | 'safe'; explanation: string }> = {
  AE: { risk: 'high', explanation: 'Zone AE — Risco ALTO. Inundação anual de 1% (100-year flood). Seguro federal obrigatório, prêmios altos, revenda difícil.' },
  VE: { risk: 'high', explanation: 'Zone VE — Risco ALTO costeiro com ondas. Construção restrita, seguro caríssimo. Quase sempre rejeitar.' },
  A: { risk: 'high', explanation: 'Zone A — Risco ALTO sem estudo detalhado de elevação. Seguro federal obrigatório.' },
  V: { risk: 'high', explanation: 'Zone V — Risco ALTO costeiro (sem estudo). Sujeito a ondas e maré. Restrições severas de construção.' },
  AH: { risk: 'high', explanation: 'Zone AH — Risco ALTO de inundação rasa (1-3ft). Seguro federal obrigatório.' },
  AO: { risk: 'high', explanation: 'Zone AO — Risco ALTO de inundação por enxurrada (sheet flow). Seguro federal obrigatório.' },
  X: { risk: 'safe', explanation: 'Zone X — Risco mínimo de inundação. Seguro não obrigatório. OK para wholesale.' },
  B: { risk: 'safe', explanation: 'Zone B (Shaded X) — Risco moderado entre 100-500-year flood. Seguro opcional.' },
  C: { risk: 'safe', explanation: 'Zone C — Acima do 500-year flood. Risco mínimo, sem exigência de seguro.' },
  D: { risk: 'safe', explanation: 'Zone D — Não estudado. Tratado como risco indeterminado, mas sem exigência de seguro.' },
};

export const DETAIL_FIELDS: DetailField[] = [
  // Decisao
  { key: 'tier', label: 'Tier', category: 'decisao', defaultVisible: true,
    format: (p) => {
      if (!p.evaluation) return null;
      const tier = p.evaluation.match(/Tier:(\S+)/)?.[1] || '';
      const visual = p.evaluation.match(/Visual:(\S+)/)?.[1] || '';
      const cond = p.evaluation.match(/Cond:(\d+)/)?.[1] || '';
      return `${tier.replace(/^\d+-/, '').replace(/_/g, ' ')}${visual ? ` (${visual})` : ''}${cond ? ` Cond:${cond}` : ''}`;
    },
    highlight: (p) => !!p.evaluation?.includes('1-CALL_NOW') || !!p.evaluation?.includes('Visual:HOT'),
  },
  { key: 'lead_score', label: 'Lead Score', category: 'decisao', defaultVisible: true,
    format: (p) => p.lead_score ? String(p.lead_score) : null,
    highlight: (p) => (p.lead_score ?? 0) >= 230,
  },
  { key: 'ai_score', label: 'AI Score', category: 'decisao', defaultVisible: true,
    format: (p) => p.ai_score != null ? `${p.ai_score}/100` : null,
    highlight: (p) => (p.ai_score ?? 0) >= 70,
  },
  { key: 'tags', label: 'Tags', category: 'decisao', defaultVisible: false,
    format: (p) => {
      const t = p.tags;
      if (Array.isArray(t) && t.length) return t.join(', ');
      if (typeof t === 'string' && t !== '[]' && t) return t;
      return null;
    },
  },
  // ai_score with recommendation label (replaces simple format above)
  { key: 'ai_score_rec', label: 'AI Recomendação', category: 'decisao', defaultVisible: false,
    format: (p) => {
      if (p.ai_score == null) return null;
      const rec = p.ai_score >= 70 ? 'BUY' : p.ai_score >= 50 ? 'HOLD' : 'PASS';
      return `${p.ai_score}/100 (${rec})`;
    },
    highlight: (p) => (p.ai_score ?? 0) >= 70,
  },
  { key: 'focar', label: 'Focar', category: 'decisao', defaultVisible: true,
    format: (p) => p.focar || null,
    highlight: (p) => p.focar === 'SIM',
  },
  // Financeiro
  { key: 'estimated_value', label: 'Valor Estimado', category: 'financeiro', defaultVisible: true,
    format: (p) => p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : null,
  },
  { key: 'cash_offer_amount', label: 'Oferta', category: 'financeiro', defaultVisible: true,
    format: (p) => p.cash_offer_amount ? `$${p.cash_offer_amount.toLocaleString()}` : null,
  },
  { key: 'offer_pct', label: '% Oferta', category: 'financeiro', defaultVisible: true,
    format: (p) => {
      if (!p.cash_offer_amount || !p.estimated_value || p.estimated_value === 0) return null;
      const pct = (p.cash_offer_amount / p.estimated_value) * 100;
      return `${pct.toFixed(0)}%`;
    },
    highlight: (p) => {
      if (!p.cash_offer_amount || !p.estimated_value || p.estimated_value === 0) return false;
      const pct = (p.cash_offer_amount / p.estimated_value) * 100;
      return pct <= 70;
    },
  },
  // Imovel
  { key: 'year_built', label: 'Ano Construção', category: 'imovel', defaultVisible: true,
    format: (p) => p.year_built ? String(p.year_built) : null,
  },
  { key: 'bedrooms', label: 'Quartos', category: 'imovel', defaultVisible: true,
    format: (p) => p.bedrooms ? String(p.bedrooms) : null,
  },
  { key: 'bathrooms', label: 'Banheiros', category: 'imovel', defaultVisible: true,
    format: (p) => p.bathrooms ? String(p.bathrooms) : null,
  },
  { key: 'lot_size', label: 'Lote', category: 'imovel', defaultVisible: true,
    format: (p) => {
      if (!p.lot_size) return null;
      const v = Number(p.lot_size);
      return v >= 1 ? `${v.toFixed(1)} acres` : `${(v * 43560).toFixed(0)} sqft`;
    },
  },
  { key: 'square_feet', label: 'Área (sqft)', category: 'imovel', defaultVisible: true,
    format: (p) => p.square_feet ? p.square_feet.toLocaleString() : null,
  },
  { key: 'property_type', label: 'Tipo', category: 'imovel', defaultVisible: true,
    format: (p) => p.property_type || null,
  },
  { key: 'neighborhood', label: 'Bairro', category: 'imovel', defaultVisible: false,
    format: (p) => p.neighborhood || null,
  },
  { key: 'zip_code', label: 'CEP', category: 'imovel', defaultVisible: false,
    format: (p) => p.zip_code || null,
  },
  // Dono
  { key: 'owner_name', label: 'Proprietário', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_name || null,
  },
  { key: 'owner_address', label: 'End. Dono', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_address || null,
  },
  { key: 'owner_phone', label: 'Telefone', category: 'dono', defaultVisible: true,
    format: (p) => p.owner_phone || null,
  },
  { key: 'origem', label: 'Parcel ID', category: 'dono', defaultVisible: false,
    format: (p) => p.origem || null,
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  decisao: 'Decisão',
  financeiro: 'Financeiro',
  imovel: 'Imóvel',
  dono: 'Proprietário',
};

export const VISUAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HOT: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  WARM: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  COLD: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  LAND: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
};

export const TAG_COLORS: Record<string, string> = {
  'HOT': 'bg-red-100 text-red-700 border-red-300',
  'WARM': 'bg-orange-100 text-orange-700 border-orange-300',
  'COLD': 'bg-blue-100 text-blue-700 border-blue-300',
  'LAND': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '1-CALL_NOW': 'bg-red-100 text-red-700 border-red-300',
  '2-CALL_SOON': 'bg-orange-100 text-orange-700 border-orange-300',
  '3-EVALUATE': 'bg-amber-100 text-amber-700 border-amber-300',
  '5-NO_VISUAL': 'bg-gray-100 text-gray-600 border-gray-300',
  '6-LOW_PRIORITY': 'bg-slate-100 text-slate-600 border-slate-300',
};

export const VISIBLE_FIELDS_STORAGE_KEY = 'review-queue-visible-fields-v2';

/** Score color helpers for AI-operability and semaphore display */
export const getScoreColor = (score: number | null) => {
  if (score == null) return { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: '—' };
  if (score >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', label: 'FORTE' };
  if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', label: 'REVISAR' };
  if (score >= 30) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', label: 'ATENÇÃO' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', label: 'FRACO' };
};

export const getLeadScoreColor = (score: number | null) => {
  if (score == null) return { text: 'text-muted-foreground', label: '—' };
  if (score >= 230) return { text: 'text-emerald-600', label: 'ALTA' };
  if (score >= 150) return { text: 'text-amber-600', label: 'PADRÃO' };
  return { text: 'text-red-600', label: 'BAIXA' };
};
