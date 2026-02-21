// Test generateDemoComps to verify coordinates are generated

function generateDemoComps(basePrice, city, count = 6, centerLat = 28.5383, centerLng = -81.3792) {
  const streets = [
    'Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln', 'Palm Way',
    'Sunset Blvd', 'Lake View Dr', 'Park Ave', 'Main St', 'Colonial Dr'
  ];

  const comps = [];
  const maxRadius = 0.02; // ~2.2 km radius

  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 0.3;
    const price = Math.round(basePrice * (1 + variance));
    const sqft = Math.round(1200 + Math.random() * 1500);
    const beds = Math.floor(2 + Math.random() * 3);
    const baths = Math.floor(1 + Math.random() * 2.5);
    const yearBuilt = Math.floor(1970 + Math.random() * 50);

    const daysAgo = Math.floor(Math.random() * 180);
    const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Generate coordinates within small radius of center
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * maxRadius;
    const lat = centerLat + (radius * Math.cos(angle));
    const lng = centerLng + (radius * Math.sin(angle));
    const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)) * 111;

    comps.push({
      address: `${Math.floor(100 + Math.random() * 9900)} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: city || 'Orlando',
      state: 'FL',
      zipCode: `328${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      saleDate: saleDate.toISOString().split('T')[0],
      salePrice: price,
      beds,
      baths,
      sqft,
      yearBuilt,
      propertyType: 'Single Family',
      source: 'demo',
      latitude: lat,
      longitude: lng,
      distance: Math.round(distance * 10) / 10
    });
  }

  return comps.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
}

// Test
const comps = generateDemoComps(250000, 'Orlando', 6, 28.5383, -81.3792);
console.log(JSON.stringify(comps, null, 2));
console.log('\n✅ All comps have coordinates:', comps.every(c => c.latitude && c.longitude));
console.log('📍 Coordinates range:');
console.log('  Lat:', Math.min(...comps.map(c => c.latitude)), '-', Math.max(...comps.map(c => c.latitude)));
console.log('  Lng:', Math.min(...comps.map(c => c.longitude)), '-', Math.max(...comps.map(c => c.longitude)));
