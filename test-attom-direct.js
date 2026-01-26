/**
 * Test ATTOM API directly to verify if the API key works
 */

const ATTOM_API_KEY = 'ab8b3f3032756d9c17529dc80e07049b';

async function testAttomV2() {
  console.log('🧪 Testing ATTOM V2 API Directly\n');
  
  // Test case: 25217 Mathew St, Orlando, Orange County, FL 32833
  const address = '25217 Mathew St';
  const city = 'Orlando';
  const county = 'Orange';
  const state = 'FL';
  const zipCode = '32833';

  const encodedAddress = encodeURIComponent(address);
  const encodedCity = encodeURIComponent(city);
  const encodedCounty = encodeURIComponent(county);

  const url = `https://api.gateway.attomdata.com/property/v2/salescomparables/address/${encodedAddress}/${encodedCity}/${encodedCounty}/${state}/${zipCode}`;

  console.log(`📍 Testing: ${address}, ${city}, ${county}, ${state} ${zipCode}`);
  console.log(`🔗 URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY,
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\n❌ Error Response:`);
      console.log(errorText.substring(0, 500));
      return;
    }

    const data = await response.json();
    
    console.log(`\n✅ Success! Response structure:`);
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    
    // Check for comparables
    if (data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext) {
      console.log(`\n✅ Found RESPONSE_GROUP structure`);
    } else {
      console.log(`\n⚠️ Unexpected response structure`);
    }

  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    console.error(error.stack);
  }
}

testAttomV2();
