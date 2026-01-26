/**
 * ATTOM V2 Integration Service
 * Integra as funções ATTOM V2 com o mapeamento de counties
 * 
 * Uso:
 * const service = new AttomV2Service(ATTOM_API_KEY);
 * const comps = await service.fetchComparables(address, city, state, zipCode);
 */

import { getCountyByCity, suggestCounty } from '@/utils/cityCountyMap';

export interface ComparableData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate: string;
  salePrice: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  propertyType?: string;
  source: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface FetchResult {
  success: boolean;
  comps: ComparableData[];
  source: 'attom' | 'demo' | 'error';
  count: number;
  message: string;
  county?: string;
  error?: string;
}

export class AttomV2Service {
  private apiKey: string;
  private baseUrl = 'https://api.gateway.attomdata.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch comparables using ATTOM V2 Sales Comparables API
   */
  async fetchComparables(
    address: string,
    city: string,
    state: string = 'FL',
    zipCode: string
  ): Promise<FetchResult> {
    try {
      // 1. Obter county automaticamente
      let county = getCountyByCity(city, state);
      
      if (!county) {
        console.warn(`⚠️ County not found for ${city}, ${state}. Suggesting...`);
        county = suggestCounty(city, state);
        console.log(`📍 Using suggested county: ${county}`);
      }

      // 2. Validar inputs
      if (!address || !city || !county || !state || !zipCode) {
        return {
          success: false,
          comps: [],
          source: 'error',
          count: 0,
          message: 'Missing required address components',
          county,
          error: `address=${!!address}, city=${!!city}, county=${!!county}, state=${!!state}, zip=${!!zipCode}`
        };
      }

      // 3. Montar URL
      const encodedAddress = encodeURIComponent(address);
      const encodedCity = encodeURIComponent(city);
      const encodedCounty = encodeURIComponent(county);

      const url = `${this.baseUrl}/property/v2/salescomparables/address/${encodedAddress}/${encodedCity}/${encodedCounty}/${state}/${zipCode}`;

      console.log(`🔍 Fetching ATTOM V2 comparables...`);
      console.log(`   Address: ${address}`);
      console.log(`   City: ${city}, County: ${county}, State: ${state}, ZIP: ${zipCode}`);

      // 4. Fazer request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'APIKey': this.apiKey,
          'User-Agent': 'MyLocalInvest-CMA/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ATTOM API error (HTTP ${response.status}):`, errorText.substring(0, 200));
        
        return {
          success: false,
          comps: [],
          source: 'error',
          count: 0,
          message: `ATTOM API error: ${response.status}`,
          county,
          error: errorText.substring(0, 200)
        };
      }

      const data = await response.json();

      // 5. Extrair comparables (V2 usa estrutura RESPONSE_GROUP)
      const comps = this.extractComparables(data, { city, state, zipCode });

      if (comps.length === 0) {
        console.log('⚠️ ATTOM returned no comparables');

        return {
          success: true,
          comps: [],
          source: 'attom',
          count: 0,
          message: 'No comparables found for this address',
          county
        };
      }

      return {
        success: true,
        comps,
        source: 'attom',
        count: comps.length,
        message: `Found ${comps.length} comparable sales`,
        county
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ATTOM V2 fetch failed:', errorMsg);
      
      return {
        success: false,
        comps: [],
        source: 'error',
        count: 0,
        message: `Error fetching comparables: ${errorMsg}`,
        error: errorMsg
      };
    }
  }

  /**
   * Parse uma propriedade retornada pela ATTOM V2
   */
  private parseAttomComparable(
    comp: any,
    defaultCity: string,
    defaultState: string,
    defaultZip: string
  ): ComparableData | null {
    try {
      const addr = comp.address || {};
      const loc = comp.location || {};
      const propDetails = comp.property || {};
      const sale = comp.sale || {};

      const salePrice = sale.saleAmt || sale.saleAmount || 0;
      if (salePrice <= 0) return null;

      return {
        address: `${addr.line1 || ''}`,
        city: addr.city || addr.locality || defaultCity,
        state: addr.state || addr.countrySubd || defaultState,
        zipCode: addr.zip || addr.postal1 || defaultZip,
        saleDate: sale.saleTransactionDate || sale.saleTransDate || new Date().toISOString().split('T')[0],
        salePrice: Number(salePrice),
        beds: Number(propDetails.bedrooms || propDetails.beds || 0),
        baths: Number(propDetails.bathrooms || propDetails.bathsTotal || 0),
        sqft: Number(propDetails.sqft || propDetails.livingSize || propDetails.universalSize || 0),
        yearBuilt: propDetails.yearBuilt ? Number(propDetails.yearBuilt) : undefined,
        propertyType: propDetails.propertyType || 'Single Family',
        source: 'attom',
        latitude: loc.latitude ? Number(loc.latitude) : undefined,
        longitude: loc.longitude ? Number(loc.longitude) : undefined,
        distance: loc.distance ? Number(loc.distance) : undefined
      };
    } catch (error) {
      console.warn('⚠️ Error parsing comparable:', error);
      return null;
    }
  }

  private parseAttomV2ComparableFromResponse(comp: any, defaults: { city: string; state: string; zipCode: string }): ComparableData | null {
    try {
      const c = comp?.COMPARABLE_PROPERTY_ext;
      if (!c) return null;

      const sale = c.SALES_HISTORY || {};
      const structure = c.STRUCTURE || {};

      const salePrice = Number(sale['@PropertySalesAmount'] || 0);
      if (!salePrice || Number.isNaN(salePrice)) return null;

      return {
        address: String(c['@_StreetAddress'] || '').trim(),
        city: String(c['@_City'] || defaults.city),
        state: String(c['@_State'] || defaults.state),
        zipCode: String(c['@_PostalCode'] || defaults.zipCode),
        saleDate: String(sale['@TransferDate_ext'] || sale['@PropertySalesDate'] || new Date().toISOString().split('T')[0]),
        salePrice,
        beds: Number(structure['@TotalBedroomCount'] || 0),
        baths: Number(structure['@TotalBathroomCount'] || 0),
        sqft: Number(structure['@GrossLivingAreaSquareFeetCount'] || 0),
        yearBuilt: structure.STRUCTURE_ANALYSIS?.['@PropertyStructureBuiltYear'] ? Number(structure.STRUCTURE_ANALYSIS['@PropertyStructureBuiltYear']) : undefined,
        propertyType: String(c['@StandardUseDescription_ext'] || 'Single Family'),
        source: 'attom',
        latitude: c['@LatitudeNumber'] ? Number(c['@LatitudeNumber']) : undefined,
        longitude: c['@LongitudeNumber'] ? Number(c['@LongitudeNumber']) : undefined,
        distance: c['@DistanceFromSubjectPropertyMilesCount'] ? Number(c['@DistanceFromSubjectPropertyMilesCount']) : undefined
      };
    } catch (error) {
      console.warn('⚠️ Error parsing V2 comparable:', error);
      return null;
    }
  }

  private extractComparables(data: any, defaults: { city: string; state: string; zipCode: string }): ComparableData[] {
    const results: ComparableData[] = [];

    // Forma antiga (caso a ATTOM mude o formato de volta)
    if (Array.isArray(data?.property)) {
      const parsed = data.property
        .map((prop: any) => this.parseAttomComparable(prop, defaults.city, defaults.state, defaults.zipCode))
        .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];

      results.push(...parsed);
    }

    // Forma observada na API V2 (RESPONSE_GROUP)
    const v2Props = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;
    if (Array.isArray(v2Props)) {
      const parsedV2 = v2Props
        .map((entry: any) => this.parseAttomV2ComparableFromResponse(entry, defaults))
        .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];

      results.push(...parsedV2);
    }

    return results;
  }

  /**
   * Fetch ATTOM AVM value for a property
   */
  async fetchAVMValue(
    address: string,
    city: string,
    state: string = 'FL',
    zipCode: string
  ): Promise<{
    value?: number;
    confidence?: number;
    min?: number;
    max?: number;
  }> {
    try {
      const url = `${this.baseUrl}/propertyapi/v1.0.0/attomavm/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state + ' ' + zipCode)}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'APIKey': this.apiKey
        }
      });

      if (!response.ok) {
        console.log('⚠️ AVM API error:', response.status);
        return {};
      }

      const data = await response.json();
      const prop = data.property?.[0];
      if (!prop) return {};

      const avm = prop.avm || {};
      const value = avm.avmValue ? Number(avm.avmValue) : undefined;
      const confidence = avm.avmConfidence ? Number(avm.avmConfidence) : undefined;

      return {
        value,
        confidence,
        min: value ? Math.round(value * 0.90) : undefined,
        max: value ? Math.round(value * 1.10) : undefined
      };
    } catch (error) {
      console.error('❌ AVM fetch failed:', error);
      return {};
    }
  }

  /**
   * Fetch property details from ATTOM
   */
  async fetchPropertyDetails(address: string, city: string, state: string = 'FL') {
    try {
      const url = `${this.baseUrl}/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state)}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'APIKey': this.apiKey
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.property?.[0] || null;
    } catch (error) {
      console.error('❌ Property detail fetch failed:', error);
      return null;
    }
  }

  /**
   * Check if ATTOM API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.fetchPropertyDetails('1 Main St', 'Orlando', 'FL');
      return result !== null;
    } catch {
      return false;
    }
  }
}

export default AttomV2Service;
