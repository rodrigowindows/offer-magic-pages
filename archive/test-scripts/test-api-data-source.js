/**
 * Test API to verify data source
 * Tests if comparables are real or demo data
 */

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs';

// Fontes de dados REAIS (não demo)
const REAL_SOURCES = ['attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv'];

async function testProperty(address, city, state, basePrice = 100000, radius = 3) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${address}, ${city}, ${state}`);
  console.log('='.repeat(60));

  try {
    const url = `${SUPABASE_URL}/functions/v1/fetch-comps`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        address,
        city,
        state,
        basePrice,
        radius
      })
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log(`\n📊 Response Summary:`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Source: ${data.source}`);
    console.log(`   Count: ${data.count} comps`);
    console.log(`   isDemo: ${data.isDemo}`);
    console.log(`   API Keys: Attom=${data.apiKeysConfigured?.attom}, RapidAPI=${data.apiKeysConfigured?.rapidapi}`);
    
    // Verificar se é dados reais
    const isRealData = REAL_SOURCES.includes(data.source);
    
    if (isRealData) {
      console.log(`\n✅ DADOS REAIS - Source: ${data.source}`);
    } else if (data.source === 'demo') {
      console.log(`\n❌ DADOS DEMO - Source: ${data.source}`);
      console.log(`   ⚠️ Configure API keys in Supabase for real data`);
    } else {
      console.log(`\n⚠️ Source desconhecida: ${data.source}`);
    }
    
    // Analisar comps
    if (data.comps && data.comps.length > 0) {
      console.log(`\n📋 First 3 Comparables:`);
      data.comps.slice(0, 3).forEach((comp, idx) => {
        console.log(`   ${idx + 1}. ${comp.address}`);
        console.log(`      Price: $${comp.salePrice.toLocaleString()}`);
        console.log(`      $/Sqft: $${Math.round(comp.pricePerSqft || 0)}`);
        console.log(`      Source: ${comp.source || data.source}`);
        console.log(`      Date: ${comp.saleDate}`);
      });
      
      // Validar valores
      const prices = data.comps.map(c => c.salePrice);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgSqftPrice = data.comps.reduce((sum, c) => sum + (c.pricePerSqft || 0), 0) / data.comps.length;
      
      console.log(`\n💰 Price Analysis:`);
      console.log(`   Average: $${Math.round(avgPrice / 1000)}K`);
      console.log(`   Range: $${Math.round(minPrice / 1000)}K - $${Math.round(maxPrice / 1000)}K`);
      console.log(`   Avg $/Sqft: $${Math.round(avgSqftPrice)}`);
      
      // Verificar se valores fazem sentido
      const priceDiff = Math.abs(avgPrice - basePrice) / basePrice;
      if (priceDiff > 0.5) {
        console.log(`   ⚠️ Average price differs ${(priceDiff * 100).toFixed(0)}% from base price`);
      }
      
      if (avgSqftPrice < 30 || avgSqftPrice > 150) {
        console.log(`   ⚠️ $/Sqft outside normal Orlando range ($30-$150)`);
      } else {
        console.log(`   ✅ $/Sqft within normal range`);
      }
    } else {
      console.log(`\n⚠️ No comparables returned`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

// Testar algumas propriedades do PDF
async function runTests() {
  console.log('🔍 Testing API Data Sources\n');
  
  const testProperties = [
    { address: '25217 Mathew ST', city: 'Orlando', state: 'FL', basePrice: 100000 },
    { address: '5528 Long Lake DR', city: 'Orlando', state: 'FL', basePrice: 100000 },
    { address: '1025 S Washington AVE', city: 'Orlando', state: 'FL', basePrice: 100000 },
  ];
  
  for (const prop of testProperties) {
    await testProperty(prop.address, prop.city, prop.state, prop.basePrice);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Testing Complete');
  console.log('='.repeat(60));
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { testProperty, runTests };
}
