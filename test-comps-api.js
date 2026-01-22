/**
 * Test Comps API - Node.js Script
 * Run with: node test-comps-api.js
 */

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUzODcsImV4cCI6MjA0OTg2MTM4N30.yMSiS4bnkjKQe9_YXAuAOLaZcHs8xpBmS2-qhkBw-Aw';

async function testCompsAPI() {
  console.log('🏠 Testing Comps API...\n');

  const testCases = [
    {
      name: 'Apopka Property',
      payload: {
        address: '114 W CELESTE ST',
        city: 'APOPKA',
        state: 'FL',
        basePrice: 250000,
        radius: 3
      }
    },
    {
      name: 'Orlando Downtown',
      payload: {
        address: '100 S Eola Dr',
        city: 'Orlando',
        state: 'FL',
        basePrice: 350000,
        radius: 1
      }
    },
    {
      name: 'Large Radius Test',
      payload: {
        address: '123 Main St',
        city: 'Orlando',
        state: 'FL',
        basePrice: 200000,
        radius: 5
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Test: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      console.log('📤 Request:', JSON.stringify(testCase.payload, null, 2));

      const startTime = Date.now();

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-comps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testCase.payload)
      });

      const duration = Date.now() - startTime;

      console.log(`\n⏱️  Response time: ${duration}ms`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error response: ${errorText}`);
        continue;
      }

      const data = await response.json();

      if (data.success && data.comps) {
        console.log(`\n✅ SUCCESS!`);
        console.log(`📦 Found: ${data.comps.length} comparables`);
        console.log(`📡 Source: ${data.source}`);
        console.log(`🔑 API Keys: Attom=${data.apiKeysConfigured?.attom ? '✅' : '❌'}, RapidAPI=${data.apiKeysConfigured?.rapidapi ? '✅' : '❌'}`);

        console.log(`\n📋 Comparables Summary:`);
        console.log(`${'─'.repeat(60)}`);

        data.comps.forEach((comp, i) => {
          const pricePerSqft = Math.round(comp.salePrice / comp.sqft);
          console.log(`${i + 1}. ${comp.address}`);
          console.log(`   Price: $${comp.salePrice.toLocaleString()} | ${comp.beds}bd/${comp.baths}ba | ${comp.sqft.toLocaleString()} sqft | $${pricePerSqft}/sqft`);
          console.log(`   Sale Date: ${comp.saleDate} | Built: ${comp.yearBuilt}`);
        });

        console.log(`${'─'.repeat(60)}`);

        // Calculate average
        const avgPrice = data.comps.reduce((sum, c) => sum + c.salePrice, 0) / data.comps.length;
        const avgPricePerSqft = data.comps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / data.comps.length;

        console.log(`\n📊 Analysis:`);
        console.log(`   Average Price: $${Math.round(avgPrice).toLocaleString()}`);
        console.log(`   Average $/sqft: $${Math.round(avgPricePerSqft)}`);
        console.log(`   Value Range: $${Math.round(avgPrice * 0.9).toLocaleString()} - $${Math.round(avgPrice * 1.1).toLocaleString()}`);

      } else {
        console.log(`⚠️  No comparables found`);
        console.log(JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.error(`\n❌ ERROR:`, error.message);
      console.error(error.stack);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Testing Complete!`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run the tests
testCompsAPI().catch(console.error);
