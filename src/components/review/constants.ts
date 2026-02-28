import type { DetailField } from './types';

export const REJECTION_REASONS = [
  { value: "new-construction", label: "Casa Nova (menos de 20 anos)" },
  { value: "recent-sale", label: "Recém Vendida (menos de 2 anos)" },
  { value: "too-good-condition", label: "Casa em Bom Estado" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "hoa-restrictions", label: "Propriedade com HOA" },
  { value: "land", label: "Terreno (Land)" },
  { value: "no-equity", label: "Low-Equity" },
  { value: "agent-listed", label: "Anunciada por Corretor" },
  { value: "commercial", label: "Imóvel Comercial" },
  { value: "duplicate", label: "Duplicado" },
  { value: "wrong-location", label: "Localização errada" },
  { value: "other", label: "Outro motivo" },
];

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
  { key: 'tags', label: 'Tags', category: 'decisao', defaultVisible: false,
    format: (p) => {
      const t = p.tags;
      if (Array.isArray(t) && t.length) return t.join(', ');
      if (typeof t === 'string' && t !== '[]' && t) return t;
      return null;
    },
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
