/**
 * propertyAlerts - Shared service for property data quality alerts
 * Used by QualityMonitor and approval blocking logic
 * 
 * Based on real-world audit of Orlando batch (Mar 2026):
 * - 1800 Palm Ln: DNC + sem margem wholesale
 * - 909 Ferndell Rd: oferta 115% ARV, $/sqft $103 vs Zillow $169
 * - 201 Clark St: oferta 99% ARV, ARV $203k vs Zillow $326k
 * - Duskin Ave: sem número, sem sqft, sem Q/B, sem ano
 * - 18046 10th Ave: Deceased+DNC aprovada, preço $132
 * - 5309 E Kaley: DNC aprovada, oferta 132% ARV
 * - 4131 Ortisi Dr: sem sqft, sem margem wholesale
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
  // Extended fields for deeper analysis
  wholesale_value?: number | null;
  wholesale_pct?: number | null;
  renovation_value?: number | null;
  renovation_pct?: number | null;
  dnc_flag?: boolean | null;
  deceased?: boolean | null;
  city?: string | null;
  zip_code?: string | null;
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
  const tags = Array.isArray(prop.tags) ? prop.tags.map(t => t.toLowerCase()) : [];
  const isLand = isLandProperty(prop);

  // ══════════════════════════════════════════════
  // ── CRITICAL ALERTS ──
  // ══════════════════════════════════════════════

  // 1. Offer > ARV (ex: 909 Ferndell 115% ARV, 5309 E Kaley 132% ARV)
  if (prop.arv && prop.arv > 0 && prop.cash_offer_amount > prop.arv) {
    const pct = Math.round((prop.cash_offer_amount / prop.arv) * 100);
    alerts.push({
      code: 'offer_above_arv',
      message: `Oferta ($${prop.cash_offer_amount.toLocaleString()}) = ${pct}% do ARV ($${prop.arv.toLocaleString()}) — deve ser <70%`,
      severity: 'critical',
    });
  }

  // 2. Offer >= 85% of ARV (not profitable — ex: 201 Clark St 99% ARV)
  if (prop.arv && prop.arv > 0 && prop.cash_offer_amount > 0) {
    const arvPct = (prop.cash_offer_amount / prop.arv) * 100;
    if (arvPct >= 85 && arvPct <= 100) {
      alerts.push({
        code: 'offer_too_close_arv',
        message: `Oferta = ${Math.round(arvPct)}% do ARV — margem insuficiente (deve ser ≤70%)`,
        severity: 'critical',
      });
    }
  }

  // 3. Offer > Estimated Value (offer should always be below)
  if (prop.cash_offer_amount > prop.estimated_value && prop.estimated_value > 0) {
    alerts.push({
      code: 'offer_above_price',
      message: `Oferta ($${prop.cash_offer_amount.toLocaleString()}) ACIMA do preço ($${prop.estimated_value.toLocaleString()})`,
      severity: 'critical',
    });
  }

  // 4. Suspicious price: too low (ex: 18046 10th Ave $132, 1687 W Miller $3k)
  if (prop.estimated_value > 0 && prop.estimated_value < 5000) {
    alerts.push({
      code: 'price_too_low',
      message: `Preço suspeitamente baixo: $${prop.estimated_value.toLocaleString()} — verificar dados`,
      severity: 'critical',
    });
  }

  // 5. Suspicious price: too high
  if (prop.estimated_value > 2000000) {
    alerts.push({
      code: 'price_too_high',
      message: `Preço muito alto: $${prop.estimated_value.toLocaleString()}`,
      severity: 'critical',
    });
  }

  // 6. MAO > ARV
  if (prop.mao && prop.arv && prop.mao > prop.arv) {
    alerts.push({
      code: 'mao_above_arv',
      message: `MAO ($${prop.mao.toLocaleString()}) maior que ARV ($${prop.arv.toLocaleString()})`,
      severity: 'critical',
    });
  }

  // 7. DNC tag or flag — should NOT be approved (ex: 1800 Palm, 5309 E Kaley, 18046 10th Ave)
  const hasDnc = tags.includes('dnc') || tags.includes('call_soon') || prop.dnc_flag === true;
  if (hasDnc && prop.approval_status === 'approved') {
    alerts.push({
      code: 'approved_dnc',
      message: 'Aprovada com DNC — não pode ligar para este número',
      severity: 'critical',
    });
  }

  // 8. Deceased tag or flag (ex: 18046 10th Ave)
  const hasDeceased = tags.includes('deceased') || prop.deceased === true;
  if (hasDeceased && prop.approval_status === 'approved') {
    alerts.push({
      code: 'approved_deceased',
      message: 'Aprovada com Deceased — verificar herdeiros antes de aprovar',
      severity: 'critical',
    });
  }

  // 9. No Sqft AND not land (ex: 909 Ferndell, 4131 Ortisi, Duskin Ave)
  if (!isLand && !prop.square_feet) {
    alerts.push({
      code: 'no_sqft_house',
      message: 'Casa sem Sqft — impossível calcular $/sqft corretamente',
      severity: 'critical',
    });
  }

  // 10. Extreme price/offer ratio (ex: 18046 10th Ave: preço $132, oferta $48k)
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

  // 11. No wholesale margin (ex: 1800 Palm, 4131 Ortisi — "Sem Margem Wholesale")
  if (prop.arv && prop.arv > 0 && prop.cash_offer_amount > 0 && !isLand) {
    const wholesaleMargin = prop.arv - prop.cash_offer_amount;
    const marginPct = (wholesaleMargin / prop.arv) * 100;
    if (marginPct < 15) {
      alerts.push({
        code: 'no_wholesale_margin',
        message: `Margem wholesale apenas ${Math.round(marginPct)}% ($${wholesaleMargin.toLocaleString()}) — mínimo 15-30%`,
        severity: 'critical',
      });
    }
  }

  // 12. Address has no street number (ex: Duskin Ave — "Endereço sem Número")
  const addressClean = (prop.address || '').trim();
  const startsWithNumber = /^\d/.test(addressClean);
  if (!startsWithNumber && addressClean.length > 0) {
    alerts.push({
      code: 'address_no_number',
      message: `Endereço sem número: "${addressClean}" — impossível localizar`,
      severity: 'critical',
    });
  }

  // 13. Missing ALL key data (no sqft + no beds + no baths + no year = ghost property)
  // ex: Duskin Ave, 18046 10th Ave
  if (!prop.square_feet && !prop.bedrooms && !prop.bathrooms && !prop.year_built && !isLand) {
    alerts.push({
      code: 'ghost_property',
      message: 'Propriedade fantasma — sem Sqft, quartos, banheiros e ano',
      severity: 'critical',
    });
  }

  // 14. NO_VISUAL tag — property was approved without visual confirmation
  if (tags.includes('no visual') || tags.includes('no_visual')) {
    alerts.push({
      code: 'no_visual',
      message: 'Sem verificação visual — imagem indisponível',
      severity: 'critical',
    });
  }

  // 15. $/sqft do sistema muito abaixo do esperado para o zipcode
  // Ex: 517 Owl Cir 32825 — sistema $128/sqft vs mercado real $257/sqft
  // Ex: 1559 40th St 32839 — sistema $179/sqft vs comparáveis reais $207/sqft
  // Benchmark: Orlando residential avg ~$150-250/sqft. If system < $80, flag it
  if (prop.avg_price_per_sqft && prop.avg_price_per_sqft > 0 && prop.avg_price_per_sqft < 80 && !isLand) {
    alerts.push({
      code: 'psf_very_low',
      message: `$/Sqft do sistema ($${prop.avg_price_per_sqft}) muito baixo — mercado Orlando é $150-250/sqft`,
      severity: 'critical',
    });
  }

  // 16. "Sem Margem Wholesale" alert tag already present in system
  if (tags.includes('sem margem wholesale')) {
    alerts.push({
      code: 'tag_no_margin',
      message: 'Sistema já alertou "Sem Margem Wholesale" — não deveria ter sido aprovada',
      severity: 'critical',
    });
  }

  // 17. CALL_NOW + DNC contradiction (ex: 1800 Palm, 3433 N Tanner)
  if (tags.includes('call_now') && (tags.includes('dnc') || prop.dnc_flag === true)) {
    alerts.push({
      code: 'call_now_dnc_conflict',
      message: 'Tags contraditórias: CALL_NOW + DNC — não pode ligar',
      severity: 'critical',
    });
  }

  // ══════════════════════════════════════════════
  // ── MODERATE ALERTS ──
  // ══════════════════════════════════════════════

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

  // Very low AI score but approved (ex: 18046 10th Ave AI:5, Duskin Ave AI:40)
  if (prop.ai_score !== null && prop.ai_score !== undefined && prop.ai_score < 30 && prop.approval_status === 'approved') {
    alerts.push({
      code: 'low_ai_approved',
      message: `AI Score muito baixo (${prop.ai_score}) mas aprovada — revisar decisão`,
      severity: 'moderate',
    });
  }

  // DNC tag present (even if not approved yet — flag for awareness)
  if (hasDnc && prop.approval_status !== 'approved') {
    alerts.push({
      code: 'has_dnc',
      message: 'DNC — Do Not Call ativo',
      severity: 'moderate',
    });
  }

  // Deceased present (even if not approved yet)
  if (hasDeceased && prop.approval_status !== 'approved') {
    alerts.push({
      code: 'has_deceased',
      message: 'Deceased — proprietário falecido',
      severity: 'moderate',
    });
  }

  // $/sqft seems too low vs market (if avg_price_per_sqft exists and is suspiciously low)
  if (prop.avg_price_per_sqft && prop.avg_price_per_sqft > 0 && prop.avg_price_per_sqft < 50 && !isLand) {
    alerts.push({
      code: 'low_psf',
      message: `$/Sqft muito baixo ($${prop.avg_price_per_sqft}) — verificar dados de comps`,
      severity: 'moderate',
    });
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
  'offer_too_close_arv',
  'price_too_low',
  'offer_price_ratio_extreme',
  'no_sqft_house',
  'approved_dnc',
  'approved_deceased',
  'no_wholesale_margin',
  'address_no_number',
  'ghost_property',
  'no_visual',
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
