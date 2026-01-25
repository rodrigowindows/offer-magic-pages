/**
 * Analyze why all properties have estimated_value = $100,000
 * This is suspicious - suggests a placeholder or default value
 */

console.log('🔍 ANALYZING ESTIMATED_VALUE ISSUE\n');
console.log('=' .repeat(60));

// All 28 properties from PDF
const properties = [
  { id: 1, address: '25217 MATHEW ST', estimated: 100000, avgSale: 101000, suggested: '90K-111K' },
  { id: 2, address: '5528 LONG LAKE DR', estimated: 100000, avgSale: 99000, suggested: '90K-109K' },
  { id: 3, address: '1025 S WASHINGTON AVE', estimated: 100000, avgSale: 106000, suggested: '95K-116K' },
  { id: 4, address: '144 WASHINGTON AVE', estimated: 100000, avgSale: 96000, suggested: '86K-106K' },
  { id: 5, address: '114 W CELESTE ST', estimated: 100000, avgSale: 102000, suggested: '92K-112K' },
  { id: 6, address: '1317 EDGEWOOD RANCH RD', estimated: 100000, avgSale: 96000, suggested: '87K-106K' },
  { id: 7, address: '3100 FLOWERTREE RD', estimated: 100000, avgSale: 101000, suggested: '96K-106K' },
  { id: 8, address: '7605 AREZZO AVE', estimated: 100000, avgSale: 92000, suggested: '83K-102K' },
  { id: 9, address: '6008 LAKEVILLE RD', estimated: 100000, avgSale: 100000, suggested: '95K-105K' },
  { id: 10, address: 'E 13TH ST', estimated: 100000, avgSale: 103000, suggested: '93K-114K' },
  { id: 11, address: '4711 ROUND LAKE RD', estimated: 100000, avgSale: 98000, suggested: '93K-103K' },
  { id: 12, address: '217 E 17TH ST', estimated: 100000, avgSale: 104000, suggested: '98K-109K' },
  { id: 13, address: 'ARBOR GLEN CT', estimated: 100000, avgSale: 95000, suggested: '90K-100K' },
  { id: 14, address: '1775 4TH ST', estimated: 100000, avgSale: 103000, suggested: '98K-108K' },
  { id: 15, address: '907 PLYMOUTH AVE', estimated: 100000, avgSale: 105000, suggested: '100K-110K' },
  { id: 16, address: '6764 DUDLEY AVE', estimated: 100000, avgSale: 108000, suggested: '103K-113K' },
  { id: 17, address: '0 CLARCONA OCOEE RD', estimated: 100000, avgSale: 104000, suggested: '99K-109K' },
  { id: 18, address: '1851 OGLESBY AVE', estimated: 100000, avgSale: 101000, suggested: '96K-106K' },
  { id: 19, address: '611 ADIRONDACK AVE', estimated: 100000, avgSale: 102000, suggested: '97K-108K' },
  { id: 20, address: '8202 TURKEY LAKE RD', estimated: 100000, avgSale: 102000, suggested: '97K-107K' },
  { id: 21, address: '9TH AVE', estimated: 100000, avgSale: 98000, suggested: '94K-103K' },
  { id: 22, address: '928 W FAIRBANKS AVE', estimated: 100000, avgSale: 103000, suggested: '98K-108K' },
  { id: 23, address: '1145 S HIGHLAND AVE', estimated: 100000, avgSale: 105000, suggested: '100K-110K' },
  { id: 24, address: '2411 RIO LN', estimated: 100000, avgSale: 104000, suggested: '99K-110K' },
  { id: 25, address: '931 N THOMPSON RD', estimated: 100000, avgSale: 96000, suggested: '92K-101K' },
  { id: 26, address: '2124 MESSINA AVE', estimated: 100000, avgSale: 99000, suggested: '94K-104K' },
  { id: 27, address: '3340 BABBITT AVE', estimated: 100000, avgSale: 99000, suggested: '94K-104K' },
  { id: 28, address: '2310 JUNO AVE', estimated: 100000, avgSale: 93000, suggested: '88K-98K' }
];

console.log('\n🚩 PROBLEM IDENTIFIED:\n');
console.log('ALL 28 properties have IDENTICAL estimated_value = $100,000');
console.log('But avgSalePrice varies from $92K to $108K\n');

console.log('Sample properties:');
properties.slice(0, 5).forEach(p => {
  console.log(`  Property #${p.id}: ${p.address}`);
  console.log(`    Estimated: $${(p.estimated/1000).toFixed(0)}K`);
  console.log(`    Avg Sale:  $${(p.avgSale/1000).toFixed(0)}K (${p.avgSale > p.estimated ? '+' : ''}${((p.avgSale - p.estimated)/1000).toFixed(0)}K difference)`);
  console.log(`    Suggested: ${p.suggested}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log('\n📊 STATISTICAL ANALYSIS:\n');

const estimatedValues = properties.map(p => p.estimated);
const avgSaleValues = properties.map(p => p.avgSale);

const uniqueEstimated = [...new Set(estimatedValues)];
console.log(`Unique estimated_value values: ${uniqueEstimated.length}`);
console.log(`  Values: $${uniqueEstimated.map(v => v/1000 + 'K').join(', ')}`);
console.log(`  🚩 ${uniqueEstimated.length === 1 ? 'SUSPICIOUS! All identical = hardcoded placeholder' : 'Normal variation'}`);

const avgOfAvgSales = avgSaleValues.reduce((a,b) => a+b, 0) / avgSaleValues.length;
const minAvgSale = Math.min(...avgSaleValues);
const maxAvgSale = Math.max(...avgSaleValues);

console.log(`\nAverage of "Avg Sale Price": $${(avgOfAvgSales/1000).toFixed(1)}K`);
console.log(`Range: $${(minAvgSale/1000).toFixed(0)}K - $${(maxAvgSale/1000).toFixed(0)}K`);
console.log(`✅ Avg Sale Prices show NORMAL variation (${((maxAvgSale-minAvgSale)/1000).toFixed(0)}K range)`);

console.log('\n=' .repeat(60));
console.log('\n🔎 ROOT CAUSE THEORIES:\n');

console.log('Theory 1: Hardcoded default value');
console.log('  - estimated_value field in database has default = 100000');
console.log('  - Properties imported without calculating real value');
console.log('  - Likelihood: 🔥🔥🔥 HIGH');

console.log('\nTheory 2: Batch import with placeholder');
console.log('  - Properties imported from CSV/list with placeholder value');
console.log('  - Real AVM (Automated Valuation Model) not run');
console.log('  - Likelihood: 🔥🔥 MEDIUM');

console.log('\nTheory 3: AVM API not configured');
console.log('  - System tries to call valuation API but fails');
console.log('  - Falls back to $100K placeholder');
console.log('  - Likelihood: 🔥 LOW (would show error logs)');

console.log('\n=' .repeat(60));
console.log('\n🔍 WHERE TO INVESTIGATE:\n');

console.log('1. Database schema:');
console.log('   SELECT column_name, column_default');
console.log('   FROM information_schema.columns');
console.log('   WHERE table_name = \'properties\'');
console.log('   AND column_name = \'estimated_value\';');

console.log('\n2. Check if values are being calculated:');
console.log('   SELECT address, estimated_value, created_at');
console.log('   FROM properties');
console.log('   WHERE estimated_value = 100000');
console.log('   ORDER BY created_at DESC LIMIT 10;');

console.log('\n3. Look for AVM/valuation logic in code:');
console.log('   - Search for "estimated_value" assignment');
console.log('   - Check property import/creation logic');
console.log('   - Verify if valuation API is called');

console.log('\n=' .repeat(60));
console.log('\n💡 EXPECTED BEHAVIOR:\n');

console.log('Each property should have UNIQUE estimated_value based on:');
console.log('  1. Property size (sqft)');
console.log('  2. Location (city, ZIP)');
console.log('  3. Comparable sales nearby');
console.log('  4. Market trends');

console.log('\nExpected variation:');
properties.slice(0, 8).forEach(p => {
  console.log(`  ${p.address}: ~$${(p.avgSale/1000).toFixed(0)}K (not $100K)`);
});

console.log('\n=' .repeat(60));
console.log('\n✅ NEXT STEPS:\n');

console.log('1. ✅ Query database to check estimated_value distribution');
console.log('2. ✅ Find property creation/import code');
console.log('3. ✅ Implement real AVM calculation or update values');
console.log('4. ✅ Re-run comps analysis with correct estimated values');

console.log('\n🎯 Impact: This affects offer calculations and CMA accuracy!');
