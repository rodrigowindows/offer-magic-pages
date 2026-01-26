/**
 * Mapeamento de Cidades → Nomes de Counties
 * Essencial para ATTOM V2 Sales Comparables API
 * 
 * ATTOM V2 requer: street, city, COUNTY (não zip), state, zip
 */

export const CITY_TO_COUNTY_MAP: Record<string, Record<string, string>> = {
  FL: {
    // Orange County (Orlando area)
    'Orlando': 'Orange',
    'Winter Park': 'Orange',
    'Ocoee': 'Orange',
    'Belle Isle': 'Orange',
    'Eatonville': 'Orange',
    'Apopka': 'Orange',
    'Edgewood': 'Orange',
    'Maitland': 'Orange',
    'Altamonte Springs': 'Seminole',
    'Kissimmee': 'Osceola',
    'Poinciana': 'Osceola',
    'St Cloud': 'Osceola',
    'Davenport': 'Polk',
    'Tampa': 'Hillsborough',
    'Tampa Bay': 'Hillsborough',
    'Plant City': 'Hillsborough',
    'Jacksonville': 'Duval',
    'Jacksonville Beach': 'Duval',
    'Miami': 'Miami-Dade',
    'Miami Beach': 'Miami-Dade',
    'Coral Gables': 'Miami-Dade',
    'Fort Lauderdale': 'Broward',
    'Hollywood': 'Broward',
    'Deerfield Beach': 'Broward',
    'West Palm Beach': 'Palm Beach',
    'Palm Beach': 'Palm Beach',
    'Boca Raton': 'Palm Beach',
    'Delray Beach': 'Palm Beach',
    'Clearwater': 'Pinellas',
    'St Petersburg': 'Pinellas',
    'Sarasota': 'Sarasota',
    'Bradenton': 'Manatee',
    'Naples': 'Collier',
    'Fort Myers': 'Lee',
    'Cape Coral': 'Lee',
    'Daytona Beach': 'Volusia',
    'Ocala': 'Marion',
    'Tallahassee': 'Leon',
    'Pensacola': 'Escambia',
    'Fort Walton Beach': 'Okaloosa',
    'Destin': 'Okaloosa',
    'Gainesville': 'Alachua',
    'Lakeland': 'Polk',
    'Melbourne': 'Brevard',
    'Fort Pierce': 'St. Lucie',
    'Stuart': 'Martin',
    'Vero Beach': 'Indian River',
    'Sebring': 'Highlands',
    'Leesburg': 'Lake',
    'Eustis': 'Lake',
    'Montverde': 'Lake',
    'The Villages': 'Sumter',
    'Dunnellon': 'Marion',
  }
};

/**
 * Obter county a partir de city e state
 */
export function getCountyByCity(city: string, state: string = 'FL'): string | null {
  const stateMap = CITY_TO_COUNTY_MAP[state];
  if (!stateMap) return null;

  // Busca exata
  if (stateMap[city]) {
    return stateMap[city];
  }

  // Busca parcial (case insensitive)
  const lowerCity = city.toLowerCase();
  for (const [mapCity, county] of Object.entries(stateMap)) {
    if (mapCity.toLowerCase() === lowerCity) {
      return county;
    }
  }

  return null;
}

/**
 * Validar se temos o county para uma cidade
 */
export function isCityCountyMapped(city: string, state: string = 'FL'): boolean {
  return getCountyByCity(city, state) !== null;
}

/**
 * Fornecer sugestão de county alternativo se não encontrado
 */
export function suggestCounty(city: string, state: string = 'FL'): string {
  // Para Orlando, se não achar, assume Orange County
  if (state === 'FL' && (city.toLowerCase().includes('orlando') || city === '')) {
    return 'Orange';
  }
  
  // Retornar primeira opção do state como fallback
  const stateMap = CITY_TO_COUNTY_MAP[state];
  if (stateMap) {
    return Object.values(stateMap)[0];
  }

  return 'Orange'; // Fallback final para Orange County
}
