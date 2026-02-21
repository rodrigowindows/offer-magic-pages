/**
 * Test Supabase Database - Validate Comps Data
 * Run this in browser console on your app page
 */

console.log('🔍 SUPABASE DATABASE VALIDATION TEST\n');

// You need to be logged into your app for this to work
// This uses the Supabase client already initialized in your app

async function validateDatabase() {
  const { createClient } = window.supabase || supabase;

  if (!createClient && typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found. Make sure you are on the app page.');
    console.log('Alternative: Run queries in Supabase SQL Editor dashboard');
    return;
  }

  const client = supabase;

  console.log('=' .repeat(70));
  console.log('TEST 1: Estimated Value Distribution');
  console.log('=' .repeat(70));

  try {
    // Get all properties and check estimated_value
    const { data: properties, error } = await client
      .from('properties')
      .select('id, address, estimated_value')
      .not('estimated_value', 'is', null)
      .limit(20);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log(`\n📊 Found ${properties.length} properties:\n`);

      // Count estimated values
      const valueCounts = {};
      properties.forEach(p => {
        const val = p.estimated_value;
        valueCounts[val] = (valueCounts[val] || 0) + 1;
      });

      console.log('Estimated Value Distribution:');
      Object.entries(valueCounts).forEach(([value, count]) => {
        console.log(`  $${(value/1000).toFixed(0)}K: ${count} properties (${Math.round(count/properties.length*100)}%)`);
      });

      if (Object.keys(valueCounts).length === 1) {
        console.log('\n🚩 WARNING: ALL properties have the same estimated_value!');
        console.log('   This indicates a hardcoded placeholder, not real calculations.');
      } else {
        console.log('\n✅ Good: Estimated values vary across properties');
      }
    }
  } catch (err) {
    console.error('❌ Error fetching properties:', err);
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Comparables Distance Analysis');
  console.log('=' .repeat(70));

  try {
    const { data: comps, error } = await client
      .from('comparables_cache')
      .select('property_id, address, distance, source, latitude, longitude')
      .limit(100);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log(`\n📍 Found ${comps.length} comps:\n`);

      const zeroDistance = comps.filter(c => c.distance === 0 || c.distance === null);
      const validDistance = comps.filter(c => c.distance > 0);

      console.log(`Comps with distance = 0: ${zeroDistance.length} (${Math.round(zeroDistance.length/comps.length*100)}%) ❌`);
      console.log(`Comps with distance > 0: ${validDistance.length} (${Math.round(validDistance.length/comps.length*100)}%) ✅`);

      if (validDistance.length > 0) {
        const distances = validDistance.map(c => c.distance);
        const avg = distances.reduce((a,b) => a+b, 0) / distances.length;
        const min = Math.min(...distances);
        const max = Math.max(...distances);

        console.log('\nValid Distance Stats:');
        console.log(`  Min: ${min.toFixed(2)} mi`);
        console.log(`  Max: ${max.toFixed(2)} mi`);
        console.log(`  Avg: ${avg.toFixed(2)} mi`);
        console.log(`  ${max <= 3.0 ? '✅ All within 3-mile radius' : '⚠️  Some beyond 3 miles'}`);
      }

      if (zeroDistance.length > 0) {
        console.log('\n🚩 Sample comps with distance = 0:');
        zeroDistance.slice(0, 5).forEach(c => {
          console.log(`  - ${c.address} (${c.source}) [lat: ${c.latitude?.toFixed(4)}, lng: ${c.longitude?.toFixed(4)}]`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error fetching comps:', err);
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Data Source Distribution');
  console.log('=' .repeat(70));

  try {
    const { data: comps, error } = await client
      .from('comparables_cache')
      .select('source')
      .limit(200);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      const sourceCounts = {};
      comps.forEach(c => {
        sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
      });

      console.log('\n🔍 Data Sources:\n');
      Object.entries(sourceCounts).sort((a,b) => b[1] - a[1]).forEach(([source, count]) => {
        const pct = Math.round(count/comps.length*100);
        const icon = source === 'demo' ? '⚠️' : '✅';
        console.log(`  ${icon} ${source}: ${count} comps (${pct}%)`);
      });

      const demoCount = sourceCounts['demo'] || 0;
      const demoPct = Math.round(demoCount/comps.length*100);

      console.log('');
      if (demoPct > 50) {
        console.log('🚩 WARNING: Majority of comps are demo data!');
        console.log('   This means API calls are failing or API keys not configured.');
        console.log('   Check ATTOM_API_KEY and RAPIDAPI_KEY in Supabase Edge Function secrets.');
      } else if (demoPct > 20) {
        console.log('⚠️  Moderate demo data usage (>20%)');
        console.log('   Some API calls may be failing.');
      } else {
        console.log('✅ Good: Mostly real API data, minimal demo fallback');
      }
    }
  } catch (err) {
    console.error('❌ Error fetching source data:', err);
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Find Problem Property #1');
  console.log('=' .repeat(70));

  try {
    const { data: props, error } = await client
      .from('properties')
      .select('id, address, city, zip_code, estimated_value')
      .ilike('address', '%25217 MATHEW%');

    if (error) {
      console.error('❌ Error:', error);
    } else if (props.length === 0) {
      console.log('\n✅ Property #1 (25217 MATHEW ST) NOT found in database');
      console.log('   Either already deleted or never existed.');
    } else {
      console.log(`\n🚩 Found ${props.length} matching properties:\n`);
      props.forEach(p => {
        console.log(`  ID: ${p.id}`);
        console.log(`  Address: ${p.address}`);
        console.log(`  City: ${p.city}, ZIP: ${p.zip_code}`);
        console.log(`  Estimated Value: $${(p.estimated_value/1000).toFixed(0)}K`);
        console.log('');
      });
      console.log('⚠️  ACTION: This property should be deleted and regenerated');
    }
  } catch (err) {
    console.error('❌ Error searching property:', err);
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Recent Comps Quality');
  console.log('=' .repeat(70));

  try {
    const { data: recentComps, error } = await client
      .from('comparables_cache')
      .select('address, distance, source, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('\n📅 10 Most Recent Comps:\n');
      recentComps.forEach((c, i) => {
        const date = new Date(c.created_at).toLocaleDateString();
        const distIcon = c.distance === 0 ? '❌' : '✅';
        console.log(`${i+1}. ${c.address} (${c.source})`);
        console.log(`   ${distIcon} Distance: ${c.distance || 0} mi | Added: ${date}`);
      });

      const recentZero = recentComps.filter(c => c.distance === 0).length;
      console.log('');
      if (recentZero > 0) {
        console.log(`🚩 ${recentZero}/10 recent comps have distance = 0`);
        console.log('   Edge function fix may not be deployed yet.');
      } else {
        console.log('✅ All recent comps have valid distances');
        console.log('   Edge function fix is working!');
      }
    }
  } catch (err) {
    console.error('❌ Error fetching recent comps:', err);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(70));
  console.log('\nRun this script in browser console on your app page.');
  console.log('Then check results above for data quality issues.');
  console.log('\nKey Metrics to Check:');
  console.log('1. Estimated Value: Should have variety, not all $100K');
  console.log('2. Distance = 0: Should be < 10% of comps');
  console.log('3. Demo Data: Should be < 20% of sources');
  console.log('4. Recent Comps: Should all have distance > 0 if fix deployed');
}

// Run validation
validateDatabase();
