// Test script to directly test ATTOM V2 API
// Run with: deno run --allow-net test-attom-direct.ts

const ATTOM_API_KEY = 'ab8b3f3032756d9c17529dc80e07049b';

interface TestCase {
  name: string;
  address: string;
  normalized: string;
  city: string;
  county: string;
  state: string;
  zipCode: string;
}

const testCases: TestCase[] = [
  {
    name: 'Original failing address',
    address: '1025 S WASHINGTON AVE',
    normalized: '1025 SOUTH WASHINGTON AVENUE',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  },
  {
    name: 'With abbreviated directional',
    address: '1025 S WASHINGTON AVE',
    normalized: '1025 S WASHINGTON AVE',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  },
  {
    name: 'Without directional',
    address: '1025 WASHINGTON AVE',
    normalized: '1025 WASHINGTON AVENUE',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  },
  {
    name: 'Another failing address',
    address: '5528 LONG LAKE DR ORLANDO',
    normalized: '5528 LONG LAKE DRIVE',
    city: 'Orlando',
    county: 'Orange',
    state: 'FL',
    zipCode: '32801'
  }
];

async function testAttomAPI(testCase: TestCase): Promise<void> {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📍 Address: ${testCase.address}`);
  console.log(`📍 Normalized: ${testCase.normalized}`);
  console.log(`📍 Location: ${testCase.city}, ${testCase.county}, ${testCase.state} ${testCase.zipCode}`);
  
  const encodedAddress = encodeURIComponent(testCase.normalized);
  const encodedCity = encodeURIComponent(testCase.city);
  const encodedCounty = encodeURIComponent(testCase.county);
  
  const url = `https://api.gateway.attomdata.com/property/v2/salescomparables/address/${encodedAddress}/${encodedCity}/${encodedCounty}/${testCase.state}/${testCase.zipCode}`;
  
  console.log(`🔗 URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY,
      }
    });
    
    const executionTime = Date.now() - startTime;
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Time: ${executionTime}ms`);
    console.log(`📋 Headers:`, JSON.stringify(responseHeaders, null, 2));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response:`);
      console.log(errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`📄 Parsed Error:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log(`⚠️ Could not parse error as JSON`);
      }
    } else {
      const data = await response.json();
      console.log(`✅ Success Response:`);
      console.log(`📦 Structure keys:`, Object.keys(data || {}));
      console.log(`📦 Full response (first 2000 chars):`, JSON.stringify(data, null, 2).substring(0, 2000));
      
      // Try to find comparables
      const responseGroup = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;
      if (responseGroup && Array.isArray(responseGroup)) {
        console.log(`✅ Found ${responseGroup.length} properties in response`);
      } else {
        console.log(`⚠️ No properties found in expected structure`);
        console.log(`🔍 Full structure:`, JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.error(`❌ Exception:`, error);
    if (error instanceof Error) {
      console.error(`❌ Message:`, error.message);
      console.error(`❌ Stack:`, error.stack);
    }
  }
}

async function main() {
  console.log('🚀 Starting ATTOM V2 API Direct Tests');
  console.log(`🔑 API Key: ${ATTOM_API_KEY.substring(0, 10)}...`);
  
  for (const testCase of testCases) {
    await testAttomAPI(testCase);
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All tests completed');
}

main().catch(console.error);
