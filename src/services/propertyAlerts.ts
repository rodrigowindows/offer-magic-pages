/**
 * propertyAlerts - Shared service for property data quality alerts
 * Used by QualityMonitor and approval blocking logic
 */

export interface PropertyAlertInput {
  id: string;
  address: string;
  estimated_value: number;
  cash_offer_amount: number;
  arv?: number | null;
  mao?: number | null;
  square_feet?: number | null;
  avg_price_per_sqft?: number | null;
  approval_status?: string | null;
  owner_name?: string | null;
  tags?: string[] | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  ai_score?: number | null;
  property_type?: string | null;
  lot_size?: number | null;
}

export interface PropertyAlert {
  message: string;
  severity: 'critical' | 'moderate';
  code: string; // machine-readable code for blocking logic
}

/**
 * Checks if property is classified as land/terrain
 */
export function isLandProperty(prop: PropertyAlertInput): boolean {
  const tags = Array.isArray(prop.tags) ? prop.tags.map(t => t.toLowerCase()) : [];
  const type = (prop.property_type || '').toLowerCase();
  return (
    tags.includes('land') ||
    tags.includes('vacant land') ||
    type.includes('land') ||
    type.includes('vacant') ||
    type === 'vacantland'
  );
}

/**
 * Analyze a property for data quality alerts
 */
export function analyzePropertyAlerts(prop: PropertyAlertInput): PropertyAlert[] {
  const alerts: PropertyAlert[] = [];
  const tags = Array.isArray(prop.tags) ? prop.tags : [];
  const isLand = isLandProperty(prop);

  // ── CRITICAL ALERTS ──

  // Offer > ARV (ex: 710 Columbia)
  if (prop.arv && prop.arv > 0 && prop.cash_offer_amount > prop.arv) {
    alerts.push({
      code: 'offer_above_arv',
      message: `Oferta ($${prop.cash_offer_amount.toLocaleString()}) acima do ARV ($${prop.arv.toLocaleString()})`,
      severity: 'critical',
    });
  }

  // Offer > Estimated Value (offer should always be below)
  if (prop.cash_offer_amount > prop.estimated_value) {
    alerts.push({
      code: 'offer_above_price',
      message: `Oferta ($${prop.cash_offer_amount.toLocaleString()}) ACIMA do preço ($${prop.estimated_value.toLocaleString()})`,
      severity: 'critical',
    });
  }

  // Suspicious price: too low (ex: 1687 W Miller $3k)
  if (prop.estimated_value > 0 && prop.estimated_value < 5000) {
    alerts.push({
      code: 'price_too_low',
      message: `Preço suspeitamente baixo: $${prop.estimated_value.toLocaleString()} — verificar dados`,
      severity: 'critical',
    });
  }

  // Suspicious price: too high
  if (prop.estimated_value > 2000000) {
    alerts.push({
      code: 'price_too_high',
      message: `Preço muito alto: $${prop.estimated_value.toLocaleString()}`,
      severity: 'critical',
    });
  }

  // MAO > ARV
  if (prop.mao && prop.arv && prop.mao > prop.arv) {
    alerts.push({
      code: 'mao_above_arv',
      message: `MAO ($${prop.mao.toLocaleString()}) maior que ARV ($${prop.arv.toLocaleString()})`,
      severity: 'critical',
    });
  }

  // Approved with DNC tag
  if (tags.some(t => t.toLowerCase() === 'dnc') && prop.approval_status === 'approved') {
    alerts.push({
      code: 'approved_dnc',
      message: 'Aprovada com tag DNC',
      severity: 'critical',
    });
  }

  // Approved with Deceased tag
  if (tags.some(t => t.toLowerCase() === 'deceased') && prop.approval_status === 'approved') {
    alerts.push({
      code: 'approved_deceased',
      message: 'Aprovada com tag Deceased',
      severity: 'critical',
    });
  }

  // No Sqft AND not land — house needs sqft (ex: 710 Columbia shows 0 beds/0 baths)
  if (!isLand && !prop.square_feet) {
    alerts.push({
      code: 'no_sqft_house',
      message: 'Casa sem Sqft — impossível calcular $/sqft',
      severity: 'critical',
    });
  }

  // Large price discrepancy: offer is >10x the price or <1% of price
  if (prop.estimated_value > 0 && prop.cash_offer_amount > 0) {
    const ratio = prop.cash_offer_amount / prop.estimated_value;
    if (ratio > 10) {
      alerts.push({
        code: 'offer_price_ratio_extreme',
        message: `Oferta é ${Math.round(ratio)}x o preço do sistema — dados inconsistentes`,
        severity: 'critical',
      });
    }
  }

  // ── MODERATE ALERTS ──

  // Land without lot_size
  if (isLand && !prop.lot_size) {
    alerts.push({
      code: 'land_no_lot_size',
      message: 'Terreno sem tamanho do lote (lot_size)',
      severity: 'moderate',
    });
  }

  // Missing data for houses
  if (!isLand) {
    if (!prop.bedrooms) alerts.push({ code: 'no_bedrooms', message: 'Quartos não informados', severity: 'moderate' });
    if (!prop.bathrooms) alerts.push({ code: 'no_bathrooms', message: 'Banheiros não informados', severity: 'moderate' });
  }

  if (!prop.year_built) alerts.push({ code: 'no_year', message: 'Ano construção não informado', severity: 'moderate' });
  if (!prop.owner_name) alerts.push({ code: 'no_owner', message: 'Nome do dono não informado', severity: 'moderate' });

  // No AI score
  if (prop.ai_score === null || prop.ai_score === undefined) {
    alerts.push({ code: 'no_ai_score', message: 'Score IA não calculado', severity: 'moderate' });
  }

  return alerts;
}

/**
 * Get only critical alerts (used for blocking approval)
 */
export function getCriticalAlerts(prop: PropertyAlertInput): PropertyAlert[] {
  return analyzePropertyAlerts(prop).filter(a => a.severity === 'critical');
}

/**
 * Codes that should BLOCK auto-approval (require forced approval)
 */
const BLOCKING_CODES = new Set([
  'offer_above_arv',
  'offer_above_price',
  'price_too_low',
  'offer_price_ratio_extreme',
  'no_sqft_house',
  'approved_dnc',
  'approved_deceased',
]);

/**
 * Check if a property has alerts that should block automatic approval
 */
export function hasBlockingAlerts(prop: PropertyAlertInput): { blocked: boolean; reasons: string[] } {
  const critical = getCriticalAlerts(prop);
  const blocking = critical.filter(a => BLOCKING_CODES.has(a.code));
  return {
    blocked: blocking.length > 0,
    reasons: blocking.map(a => a.message),
  };
}
