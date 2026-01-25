/**
 * Comprehensive analysis of comps data quality from PDF
 * Checking: distances, prices, data patterns, database consistency
 */

console.log('🔍 COMPS DATABASE QUALITY ANALYSIS\n');
console.log('=' .repeat(70));

// Extract all properties from PDF
const properties = [
  {
    id: 1, address: '25217 MATHEW ST', city: 'UNINCORPORATED', zip: '32709',
    estimated: 100000, offer: 70000, avgSale: 101000, avgSqft: 52,
    comps: [
      { addr: '3820 Colonial Dr', date: '01/08/26', price: 112000, sqft: 2083, psf: 54, beds: 4, baths: 2, dist: 0.0 },
      { addr: '4609 Pine Ave', date: '12/12/25', price: 87000, sqft: 1806, psf: 48, beds: 3, baths: 1, dist: 0.0 },
      { addr: '7506 Palm Way', date: '11/28/25', price: 115000, sqft: 1542, psf: 74, beds: 4, baths: 2, dist: 0.0 },
      { addr: '4811 Main St', date: '11/26/25', price: 86000, sqft: 2162, psf: 40, beds: 3, baths: 2, dist: 0.0 },
      { addr: '3684 Cedar Ln', date: '11/05/25', price: 102000, sqft: 1785, psf: 57, beds: 4, baths: 1, dist: 0.0 },
      { addr: '5891 Cedar Ln', date: '07/30/25', price: 101000, sqft: 2441, psf: 41, beds: 2, baths: 3, dist: 0.0 }
    ]
  },
  {
    id: 7, address: '3100 FLOWERTREE RD', city: 'BELLE ISLE', zip: '32801',
    estimated: 100000, offer: 70000, avgSale: 103000, avgSqft: 59,
    comps: [
      { addr: '8699 Colonial Dr', date: '01/14/26', price: 112000, sqft: 1945, psf: 58, beds: 3, baths: 2, dist: 0.0 },
      { addr: '2421 Sunset Blvd', date: '12/31/25', price: 92000, sqft: 1354, psf: 68, beds: 3, baths: 1, dist: 0.9 },
      { addr: '4753 Oak St', date: '12/08/25', price: 115000, sqft: 2541, psf: 45, beds: 2, baths: 2, dist: 0.7 },
      { addr: '7705 Park Ave', date: '11/25/25', price: 89000, sqft: 2114, psf: 42, beds: 2, baths: 2, dist: 0.6 },
      { addr: '4684 Park Ave', date: '10/16/25', price: 97000, sqft: 1240, psf: 78, beds: 3, baths: 2, dist: 0.2 },
      { addr: '3659 Oak St', date: '08/16/25', price: 111000, sqft: 1730, psf: 64, beds: 2, baths: 2, dist: 0.4 }
    ]
  },
  {
    id: 9, address: '6008 LAKEVILLE RD', city: 'ORLANDO', zip: '32801',
    estimated: 100000, offer: 70000, avgSale: 97000, avgSqft: 43,
    comps: [
      { addr: '9134 Colonial Dr', date: '01/04/26', price: 96000, sqft: 2484, psf: 38, beds: 3, baths: 2, dist: 0.8 },
      { addr: '7948 Park Ave', date: '10/23/25', price: 108000, sqft: 1832, psf: 59, beds: 3, baths: 2, dist: 0.3 },
      { addr: '1143 Pine Ave', date: '09/23/25', price: 86000, sqft: 1836, psf: 47, beds: 4, baths: 2, dist: 1.1 },
      { addr: '7102 Oak St', date: '09/01/25', price: 88000, sqft: 2587, psf: 34, beds: 2, baths: 2, dist: 1.0 },
      { addr: '9738 Oak St', date: '08/31/25', price: 102000, sqft: 2453, psf: 42, beds: 3, baths: 2, dist: 0.4 },
      { addr: '4285 Sunset Blvd', date: '08/09/25', price: 100000, sqft: 2657, psf: 38, beds: 3, baths: 3, dist: 0.7 }
    ]
  },
  {
    id: 11, address: '4711 ROUND LAKE RD', city: 'ORLANDO', zip: '32801',
    estimated: 100000, offer: 70000, avgSale: 96000, avgSqft: 63,
    comps: [
      { addr: '9082 Lake View Dr', date: '01/19/26', price: 89000, sqft: 2265, psf: 39, beds: 4, baths: 2, dist: 0.6 },
      { addr: '4076 Pine Ave', date: '01/16/26', price: 112000, sqft: 1245, psf: 90, beds: 4, baths: 2, dist: 1.1 },
      { addr: '2888 Colonial Dr', date: '01/12/26', price: 111000, sqft: 1453, psf: 76, beds: 4, baths: 2, dist: 0.6 },
      { addr: '8753 Lake View Dr', date: '01/04/26', price: 86000, sqft: 1342, psf: 64, beds: 2, baths: 3, dist: 0.5 },
      { addr: '5826 Park Ave', date: '12/16/25', price: 93000, sqft: 1577, psf: 59, beds: 4, baths: 3, dist: 1.3 },
      { addr: '7568 Sunset Blvd', date: '10/05/25', price: 86000, sqft: 1808, psf: 48, beds: 2, baths: 2, dist: 0.2 }
    ]
  }
];

console.log('\n📊 OVERALL STATISTICS:\n');

let totalComps = 0;
let compsWithZeroDist = 0;
let compsWithValidDist = 0;
let allDistances = [];
let allPrices = [];
let allPSF = [];

properties.forEach(prop => {
  prop.comps.forEach(comp => {
    totalComps++;
    if (comp.dist === 0.0) {
      compsWithZeroDist++;
    } else {
      compsWithValidDist++;
      allDistances.push(comp.dist);
    }
    allPrices.push(comp.price);
    allPSF.push(comp.psf);
  });
});

console.log(`Total properties analyzed: ${properties.length} (sample from 28)`);
console.log(`Total comps: ${totalComps}`);
console.log(`Comps with distance = 0.0: ${compsWithZeroDist} (${Math.round(compsWithZeroDist/totalComps*100)}%)`);
console.log(`Comps with distance > 0: ${compsWithValidDist} (${Math.round(compsWithValidDist/totalComps*100)}%)`);

console.log('\n' + '='.repeat(70));
console.log('\n🎯 DISTANCE ANALYSIS:\n');

if (allDistances.length > 0) {
  const avgDist = allDistances.reduce((a,b) => a+b, 0) / allDistances.length;
  const minDist = Math.min(...allDistances);
  const maxDist = Math.max(...allDistances);

  console.log(`Valid distances (n=${allDistances.length}):`);
  console.log(`  Min: ${minDist.toFixed(2)} mi`);
  console.log(`  Max: ${maxDist.toFixed(2)} mi`);
  console.log(`  Avg: ${avgDist.toFixed(2)} mi`);
  console.log(`  ✅ ${maxDist <= 3.0 ? 'ALL within 3-mile radius!' : '⚠️ Some beyond 3 miles'}`);
} else {
  console.log('❌ No valid distances found!');
}

console.log('\nProperties with distance issues:');
properties.forEach(prop => {
  const zeroCount = prop.comps.filter(c => c.dist === 0.0).length;
  if (zeroCount > 0) {
    console.log(`  Property #${prop.id} (${prop.address}): ${zeroCount}/6 comps with 0.0 mi`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n💰 PRICE & VALUE ANALYSIS:\n');

const avgPrice = allPrices.reduce((a,b) => a+b, 0) / allPrices.length;
const minPrice = Math.min(...allPrices);
const maxPrice = Math.max(...allPrices);

console.log(`Comp sale prices (n=${allPrices.length}):`);
console.log(`  Min: $${(minPrice/1000).toFixed(0)}K`);
console.log(`  Max: $${(maxPrice/1000).toFixed(0)}K`);
console.log(`  Avg: $${(avgPrice/1000).toFixed(0)}K`);
console.log(`  Range: $${((maxPrice-minPrice)/1000).toFixed(0)}K`);

const avgPSF_calc = allPSF.reduce((a,b) => a+b, 0) / allPSF.length;
const minPSF = Math.min(...allPSF);
const maxPSF = Math.max(...allPSF);

console.log(`\nPrice per sqft ($/sqft):`);
console.log(`  Min: $${minPSF}/sqft`);
console.log(`  Max: $${maxPSF}/sqft`);
console.log(`  Avg: $${Math.round(avgPSF_calc)}/sqft`);
console.log(`  ${avgPSF_calc >= 35 && avgPSF_calc <= 75 ? '✅ Normal for Orlando market' : '⚠️ Check if reasonable'}`);

console.log('\n' + '='.repeat(70));
console.log('\n🏠 PROPERTY VALUE CONSISTENCY:\n');

properties.forEach(prop => {
  const diff = prop.avgSale - prop.estimated;
  const pct = Math.round((diff / prop.estimated) * 100);
  console.log(`Property #${prop.id}: ${prop.address}`);
  console.log(`  Estimated Value: $${(prop.estimated/1000).toFixed(0)}K`);
  console.log(`  Avg Comp Sale:   $${(prop.avgSale/1000).toFixed(0)}K (${pct >= 0 ? '+' : ''}${pct}%)`);
  console.log(`  Current Offer:   $${(prop.offer/1000).toFixed(0)}K (${Math.round((prop.offer/prop.avgSale)*100)}% of comps avg)`);
  console.log('');
});

console.log('='.repeat(70));
console.log('\n🚩 DATA QUALITY ISSUES DETECTED:\n');

const issues = [];

// Issue 1: Properties with all zero distances
const allZeroProps = properties.filter(p => p.comps.every(c => c.dist === 0.0));
if (allZeroProps.length > 0) {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'Properties with ALL comps at distance 0.0',
    count: allZeroProps.length,
    details: allZeroProps.map(p => `#${p.id} (${p.address})`).join(', '),
    cause: 'Generated before distance calculation fix',
    action: 'DELETE and regenerate these properties'
  });
}

// Issue 2: Properties with mixed distances
const mixedProps = properties.filter(p => {
  const zeros = p.comps.filter(c => c.dist === 0.0).length;
  return zeros > 0 && zeros < 6;
});
if (mixedProps.length > 0) {
  issues.push({
    severity: '⚠️ MEDIUM',
    issue: 'Properties with SOME comps at 0.0 distance',
    count: mixedProps.length,
    details: mixedProps.map(p => `#${p.id} (${p.address})`).join(', '),
    cause: 'Mix of old cached data and new comps',
    action: 'Clear cache and regenerate'
  });
}

// Issue 3: Identical estimated values
const uniqueEstimates = [...new Set(properties.map(p => p.estimated))];
if (uniqueEstimates.length === 1) {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'ALL properties have identical estimated_value',
    count: properties.length,
    details: `All = $${uniqueEstimates[0]/1000}K`,
    cause: 'Hardcoded placeholder, not calculated from comps',
    action: 'Implement AVM calculation or update values'
  });
}

// Issue 4: Unrealistic price/sqft outliers
const outlierPSF = allPSF.filter(psf => psf < 30 || psf > 100);
if (outlierPSF.length > 0) {
  issues.push({
    severity: '⚠️ MEDIUM',
    issue: 'Price/sqft outliers detected',
    count: outlierPSF.length,
    details: `${outlierPSF.length} comps with $/sqft outside $30-$100 range`,
    cause: 'Demo data or unusual properties',
    action: 'Verify these are legitimate comps'
  });
}

// Issue 5: Generic street names (demo data indicators)
const demoAddresses = [];
properties.forEach(prop => {
  prop.comps.forEach(comp => {
    if (/^(Park Ave|Main St|Oak St|Pine Ave|Colonial Dr|Maple Dr|Cedar Ln|Palm Way|Sunset Blvd|Lake View Dr)$/i.test(comp.addr.split(' ').slice(-2).join(' '))) {
      demoAddresses.push(comp.addr);
    }
  });
});
if (demoAddresses.length > 0) {
  issues.push({
    severity: '🟡 LOW',
    issue: 'Generic street names (possible demo data)',
    count: demoAddresses.length,
    details: `${demoAddresses.length}/${totalComps} comps (${Math.round(demoAddresses.length/totalComps*100)}%)`,
    cause: 'Using demo/fallback data instead of real API comps',
    action: 'Check if API keys configured, verify API is working'
  });
}

// Print issues
if (issues.length > 0) {
  issues.forEach((issue, i) => {
    console.log(`${i+1}. ${issue.severity}: ${issue.issue}`);
    console.log(`   Count: ${issue.count}`);
    console.log(`   Details: ${issue.details}`);
    console.log(`   Root Cause: ${issue.cause}`);
    console.log(`   Action: ${issue.action}`);
    console.log('');
  });
} else {
  console.log('✅ No major data quality issues detected!');
}

console.log('='.repeat(70));
console.log('\n📋 DATABASE VALIDATION QUERIES:\n');

console.log('1. Check estimated_value distribution:');
console.log('   SELECT estimated_value, COUNT(*) as count');
console.log('   FROM properties');
console.log('   WHERE estimated_value IS NOT NULL');
console.log('   GROUP BY estimated_value');
console.log('   ORDER BY count DESC;');

console.log('\n2. Find properties needing regeneration (Property #1):');
console.log('   SELECT id, address, city, zip_code');
console.log('   FROM properties');
console.log('   WHERE address LIKE \'%25217 MATHEW ST%\';');

console.log('\n3. Check comparables_cache table:');
console.log('   SELECT property_id, COUNT(*) as comp_count,');
console.log('          AVG(distance) as avg_distance');
console.log('   FROM comparables_cache');
console.log('   GROUP BY property_id');
console.log('   HAVING AVG(distance) = 0');
console.log('   ORDER BY comp_count DESC;');

console.log('\n4. Verify distance calculations:');
console.log('   SELECT address, distance, latitude, longitude');
console.log('   FROM comparables_cache');
console.log('   WHERE distance = 0 AND latitude IS NOT NULL');
console.log('   LIMIT 20;');

console.log('\n5. Check for demo data pattern:');
console.log('   SELECT source, COUNT(*) as count');
console.log('   FROM comparables_cache');
console.log('   GROUP BY source;');

console.log('\n' + '='.repeat(70));
console.log('\n✅ RECOMMENDATIONS:\n');

console.log('Immediate Actions:');
console.log('1. 🔴 Deploy edge function fix:');
console.log('   supabase functions deploy fetch-comps');
console.log('   supabase functions deploy retell-webhook-handler');

console.log('\n2. 🔴 Delete and regenerate problematic properties:');
if (allZeroProps.length > 0) {
  allZeroProps.forEach(p => {
    console.log(`   - Property #${p.id}: ${p.address}`);
  });
}

console.log('\n3. ⚠️  Clear comparables cache for mixed properties:');
console.log('   - Run cache clearing function for properties with mixed 0.0/valid distances');

console.log('\n4. 🔴 Implement estimated_value calculation:');
console.log('   - Option A: Use avg sale price from comps');
console.log('   - Option B: Integrate AVM API (Zillow, Redfin, HouseCanary)');
console.log('   - Option C: Custom model based on comps + property features');

console.log('\n5. 🟡 Verify API configuration:');
console.log('   - Check ATTOM_API_KEY is set');
console.log('   - Check RAPIDAPI_KEY is set');
console.log('   - Test API calls manually');

console.log('\n' + '='.repeat(70));
console.log('\n📊 FINAL SUMMARY:\n');

console.log(`Total Issues Found: ${issues.length}`);
console.log(`Critical (🔴): ${issues.filter(i => i.severity.includes('CRITICAL')).length}`);
console.log(`Medium (⚠️): ${issues.filter(i => i.severity.includes('MEDIUM')).length}`);
console.log(`Low (🟡): ${issues.filter(i => i.severity.includes('LOW')).length}`);

const healthScore = Math.round(((totalComps - compsWithZeroDist) / totalComps) * 100);
console.log(`\nData Health Score: ${healthScore}%`);
console.log(healthScore >= 80 ? '✅ Good' : healthScore >= 60 ? '⚠️  Fair' : '🔴 Poor');

console.log('\n🎯 Next Step: Run database queries above to validate findings');
