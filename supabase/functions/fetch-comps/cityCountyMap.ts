// cityCountyMap.ts - Compartilhado para Deno/Node
// Mapeamento completo para FL
export const CITY_TO_COUNTY_MAP: Record<string, Record<string, string>> = {
  FL: {
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
    // ...adicionar demais cidades conforme necessário
  }
};

export function getCountyByCity(city: string, state: string = 'FL'): string | null {
  const stateMap = CITY_TO_COUNTY_MAP[state];
  if (!stateMap) return null;
  const lowerCity = city.toLowerCase();
  for (const [mapCity, county] of Object.entries(stateMap)) {
    if (mapCity.toLowerCase() === lowerCity) {
      return county;
    }
  }
  // Fallback para Orlando
  if (state === 'FL' && lowerCity.includes('orlando')) {
    return 'Orange';
  }
  return null;
}

export function suggestCounty(city: string, state: string = 'FL'): string {
  // Sugere county mais comum ou próximo
  if (state === 'FL') return 'Orange';
  return 'Unknown';
}
