#!/usr/bin/env node

/**
 * 🧪 Script de Teste para ATTOM V2 Integration
 * 
 * Uso:
 *   npx tsx test-attom-v2.ts
 *   ou
 *   node test-attom-v2.ts (se TypeScript compilado)
 * 
 * Testa:
 * 1. Se ATTOM API Key funciona
 * 2. Se endpoint V2 responde
 * 3. Se county mapping está correto
 * 4. Se formato de resposta está correto
 */

const ATTOM_API_KEY = process.env.ATTOM_API_KEY || '';
const BASE_URL = 'https://api.gateway.attomdata.com';

interface TestProperty {
  address: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
}

// Propriedades de teste
const TEST_PROPERTIES: TestProperty[] = [
  {
    address: '25217 Mathew St',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32709'
  },
  {
    address: '144 Washington Ave',
    city: 'Eatonville',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  },
  {
    address: '5528 Long Lake Dr',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  }
];

async function testAttomV2() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 ATTOM V2 Sales Comparables API Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test 1: Check API Key
  console.log('1️⃣  Testing ATTOM API Key...');
  if (!ATTOM_API_KEY) {
    console.log('❌ ATTOM_API_KEY not set!\n');
    return;
  }
  console.log(`✅ API Key configured: ${ATTOM_API_KEY.substring(0, 10)}...\n`);

  // Test 2: Test each property
  for (const prop of TEST_PROPERTIES) {
    await testProperty(prop);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Test Complete');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

async function testProperty(prop: TestProperty) {
  console.log(`2️⃣  Testing: ${prop.address}, ${prop.city}, ${prop.state}`);

  try {
    // Build URL
    const encodedAddress = encodeURIComponent(prop.address);
    const encodedCity = encodeURIComponent(prop.city);
    const encodedCounty = encodeURIComponent(prop.county);

    const url = `${BASE_URL}/property/v2/salescomparables/address/${encodedAddress}/${encodedCity}/${encodedCounty}/${prop.state}/${prop.zipCode}`;

    console.log(`   📍 URL: ${url.substring(0, 80)}...`);

    // Make request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY,
        'User-Agent': 'MyLocalInvest-Test/1.0'
      }
    });

    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      console.log();
      return;
    }

    const data = await response.json();

    const comps = extractComps(data).slice(0, 3);

    if (comps.length === 0) {
      console.log('   ⚠️  No comparables found\n');
      return;
    }

    // Success!
    console.log(`   ✅ Got ${comps.length} comparables (showing first 3)\n`);
    console.log('   First comparables:');
    comps.forEach((comp: any, i: number) => {
      console.log(`   ${i + 1}. ${comp.address}`);
      console.log(`      Price: $${comp.price} | Date: ${comp.date} | Beds: ${comp.beds} | Sqft: ${comp.sqft}`);
    });
    console.log();

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ Error: ${errorMsg}\n`);
  }
}

function extractComps(data: any) {
  const results: any[] = [];

  // V2 format (RESPONSE_GROUP)
  const v2Props = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;
  if (Array.isArray(v2Props)) {
    v2Props.forEach((entry: any) => {
      const c = entry?.COMPARABLE_PROPERTY_ext;
      if (!c) return;

      const sale = c.SALES_HISTORY || {};
      const structure = c.STRUCTURE || {};

      results.push({
        address: c['@_StreetAddress'] || 'N/A',
        price: sale['@PropertySalesAmount'] || 'N/A',
        date: sale['@TransferDate_ext'] || 'N/A',
        beds: structure['@TotalBedroomCount'] || 'N/A',
        sqft: structure['@GrossLivingAreaSquareFeetCount'] || 'N/A'
      });
    });
  }

  // Legacy format fallback
  if (Array.isArray(data?.property)) {
    data.property.forEach((prop: any) => {
      const addr = prop.address || {};
      const sale = prop.sale || {};
      const propDetails = prop.property || {};

      results.push({
        address: addr.line1 || 'N/A',
        price: sale.saleAmt || 'N/A',
        date: sale.saleTransactionDate || 'N/A',
        beds: propDetails.bedrooms || 'N/A',
        sqft: propDetails.sqft || 'N/A'
      });
    });
  }

  return results.filter(c => c.price && c.price !== 'N/A');
}

// Run tests
testAttomV2().catch(console.error);
