/**
 * Validação de Distância dos Comparables
 * Analisa se os comps estão realmente próximos da subject property
 */

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

console.log("═══════════════════════════════════════════════════════");
console.log("🔍 VALIDAÇÃO DE PROXIMIDADE DOS COMPARABLES");
console.log("═══════════════════════════════════════════════════════\n");

// DADOS DO LOG - Property: E 13TH ST, Orlando
const subjectProperty = {
  address: "E 13TH ST",
  city: "Orlando",
  state: "FL",
  // Coordenadas inferidas (Orlando downtown se não especificado)
  latitude: 28.5383,
  longitude: -81.3792
};

// DADOS DO LOG - Comps gerados
const comps = [
  {
    address: "8455 Main St",
    latitude: 28.543577855410913,
    longitude: -81.36965177522742
  },
  {
    address: "782 Palm Way",
    latitude: 28.54817039475177,
    longitude: -81.38366612718379
  },
  {
    address: "8589 Pine Ave",
    latitude: 28.538140349775862,
    longitude: -81.37924269795157
  },
  {
    address: "1106 Cedar Ln",
    latitude: 28.543548603367633,
    longitude: -81.3812275007528
  },
  {
    address: "3783 Lake View Dr",
    latitude: 28.541761398494174,
    longitude: -81.37488731862463
  },
  {
    address: "9112 Cedar Ln",
    latitude: 28.543053889337557,
    longitude: -81.38021708042878
  }
];

console.log("📍 SUBJECT PROPERTY:");
console.log(`   Address: ${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state}`);
console.log(`   Coordinates: ${subjectProperty.latitude}, ${subjectProperty.longitude}`);
console.log(`   (Orlando downtown center)\n`);

console.log("📊 ANÁLISE DE DISTÂNCIA DOS COMPARABLES:");
console.log("─────────────────────────────────────────────────────\n");

let totalDistance = 0;
let maxDistance = 0;
let minDistance = Infinity;

comps.forEach((comp, index) => {
  const distance = haversineMiles(
    subjectProperty.latitude,
    subjectProperty.longitude,
    comp.latitude,
    comp.longitude
  );

  totalDistance += distance;
  maxDistance = Math.max(maxDistance, distance);
  minDistance = Math.min(minDistance, distance);

  const withinRadius = distance <= 3;
  const emoji = withinRadius ? '✅' : '❌';

  console.log(`${emoji} Comp ${index + 1}: ${comp.address}`);
  console.log(`   Coordinates: ${comp.latitude.toFixed(6)}, ${comp.longitude.toFixed(6)}`);
  console.log(`   Distance: ${distance.toFixed(3)} miles ${withinRadius ? '(DENTRO do raio de 3mi)' : '(FORA do raio)'}`);

  // Calcular diferença em graus
  const latDiff = Math.abs(comp.latitude - subjectProperty.latitude);
  const lngDiff = Math.abs(comp.longitude - subjectProperty.longitude);
  console.log(`   Δ Latitude: ${latDiff.toFixed(6)}° (~${(latDiff * 69).toFixed(2)} miles)`);
  console.log(`   Δ Longitude: ${lngDiff.toFixed(6)}° (~${(lngDiff * 54).toFixed(2)} miles)`);
  console.log();
});

const avgDistance = totalDistance / comps.length;

console.log("═══════════════════════════════════════════════════════");
console.log("📊 ESTATÍSTICAS:");
console.log("═══════════════════════════════════════════════════════");
console.log(`Total de Comps: ${comps.length}`);
console.log(`Distância Mínima: ${minDistance.toFixed(3)} miles`);
console.log(`Distância Máxima: ${maxDistance.toFixed(3)} miles`);
console.log(`Distância Média: ${avgDistance.toFixed(3)} miles`);
console.log(`Raio Esperado: 3.0 miles`);
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("✅ VALIDAÇÃO:");
console.log("═══════════════════════════════════════════════════════");

const allWithinRadius = comps.every(comp => {
  const distance = haversineMiles(
    subjectProperty.latitude,
    subjectProperty.longitude,
    comp.latitude,
    comp.longitude
  );
  return distance <= 3;
});

if (allWithinRadius) {
  console.log("✅ SUCESSO: Todos os comps estão dentro do raio de 3 milhas");
} else {
  console.log("❌ FALHA: Alguns comps estão fora do raio de 3 milhas");
}

if (maxDistance <= 1.0) {
  console.log("✅ EXCELENTE: Todos os comps estão dentro de 1 milha (muito próximos)");
} else if (maxDistance <= 2.0) {
  console.log("✅ BOM: Todos os comps estão dentro de 2 milhas");
} else if (maxDistance <= 3.0) {
  console.log("⚠️ ACEITÁVEL: Alguns comps chegam perto do limite de 3 milhas");
} else {
  console.log("❌ PROBLEMA: Alguns comps ultrapassam o limite de 3 milhas");
}

console.log();
console.log("═══════════════════════════════════════════════════════");
console.log("🗺️ VISUALIZAÇÃO NO MAPA:");
console.log("═══════════════════════════════════════════════════════");

// Calcular bounding box
const allLats = [subjectProperty.latitude, ...comps.map(c => c.latitude)];
const allLngs = [subjectProperty.longitude, ...comps.map(c => c.longitude)];

const minLat = Math.min(...allLats);
const maxLat = Math.max(...allLats);
const minLng = Math.min(...allLngs);
const maxLng = Math.max(...allLngs);

const latSpan = maxLat - minLat;
const lngSpan = maxLng - minLng;

console.log(`Bounding Box:`);
console.log(`  Latitude: ${minLat.toFixed(6)} → ${maxLat.toFixed(6)} (span: ${latSpan.toFixed(6)}°)`);
console.log(`  Longitude: ${minLng.toFixed(6)} → ${maxLng.toFixed(6)} (span: ${lngSpan.toFixed(6)}°)`);
console.log();

const latSpanMiles = latSpan * 69; // 1° latitude ≈ 69 miles
const lngSpanMiles = lngSpan * 54; // 1° longitude ≈ 54 miles at this latitude

console.log(`Área coberta:`);
console.log(`  Norte-Sul: ~${latSpanMiles.toFixed(2)} miles`);
console.log(`  Leste-Oeste: ~${lngSpanMiles.toFixed(2)} miles`);
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("🎯 CONCLUSÃO:");
console.log("═══════════════════════════════════════════════════════");

if (maxDistance <= 1.5 && avgDistance <= 0.8) {
  console.log("✅ PERFEITO: Comps muito bem agrupados, excelente qualidade");
} else if (maxDistance <= 3.0 && avgDistance <= 1.5) {
  console.log("✅ BOM: Comps bem distribuídos dentro do raio esperado");
} else if (maxDistance <= 3.0) {
  console.log("⚠️ OK: Alguns comps no limite, mas aceitável");
} else {
  console.log("❌ PROBLEMA: Comps muito distantes, revisar lógica de geração");
}

console.log();
console.log("📍 Google Maps link para visualizar:");
const centerLat = (minLat + maxLat) / 2;
const centerLng = (minLng + maxLng) / 2;
console.log(`https://www.google.com/maps/@${centerLat},${centerLng},14z`);
console.log();
