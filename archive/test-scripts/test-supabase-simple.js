/**
 * Teste Simples do Supabase - Validação de Comparables
 *
 * Execute: node test-supabase-simple.js
 *
 * Requer: Configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env
 */

console.log("═══════════════════════════════════════════════════════");
console.log("🧪 TESTE SUPABASE - COMPARABLES VALIDATION");
console.log("═══════════════════════════════════════════════════════\n");

// INSTRUÇÕES
console.log("📋 COMO TESTAR:");
console.log("─────────────────────────────────────────────────────\n");

console.log("OPÇÃO 1: Teste via SQL (Supabase Dashboard)");
console.log("1. Acesse: https://supabase.com/dashboard");
console.log("2. Selecione seu projeto");
console.log("3. Vá em 'SQL Editor'");
console.log("4. Cole e execute as queries do arquivo: test-supabase-comps.sql\n");

console.log("OPÇÃO 2: Teste via Browser Console");
console.log("1. Abra o app no browser");
console.log("2. Abra DevTools (F12)");
console.log("3. Vá para Console");
console.log("4. Cole e execute:\n");

console.log(`
// TEST 1: Verificar properties com coordenadas
const { data: properties } = await supabase
  .from('properties')
  .select('id, address, city, state, latitude, longitude, estimated_value')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .limit(10);

console.table(properties);

// TEST 2: Verificar comps cache
const { data: comps } = await supabase
  .from('comparables_cache')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

console.table(comps);

// TEST 3: Validar distâncias
properties.forEach(async (property) => {
  const { data: propertyComps } = await supabase
    .from('comparables_cache')
    .select('*')
    .eq('property_id', property.id);

  console.log('\\n📍 Property:', property.address);
  console.log('Total comps:', propertyComps?.length);

  propertyComps?.forEach((comp, idx) => {
    const latDiff = Math.abs(comp.latitude - property.latitude);
    const lngDiff = Math.abs(comp.longitude - property.longitude);
    const approxDist = Math.sqrt(latDiff * latDiff * 69 * 69 + lngDiff * lngDiff * 54 * 54);

    console.log(\`  \${idx + 1}. \${comp.address} - \${approxDist.toFixed(2)} miles\`);
  });
});
`);

console.log("\nOPÇÃO 3: Verificar Logs do App");
console.log("1. Abra o app e vá para Comps Analysis");
console.log("2. Selecione uma property");
console.log("3. Clique em 'Generate Comparables'");
console.log("4. Verifique os logs no console:\n");

console.log("   Logs esperados:");
console.log("   ✅ Found 6 comps (source: demo)");
console.log("   📍 First comp coordinates: 28.xxx, -81.xxx");
console.log("   ✅ Auto-saved to database cache");
console.log("   ✅ Using cached coordinates for [address]: lat, lng\n");

console.log("═══════════════════════════════════════════════════════");
console.log("🔍 QUERIES ÚTEIS PARA EXECUTAR:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("1. VERIFICAR PROPERTIES COM COORDENADAS:");
console.log(`
SELECT
  address,
  city,
  state,
  latitude,
  longitude,
  estimated_value
FROM properties
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
`);

console.log("\n2. VERIFICAR COMPS NO CACHE:");
console.log(`
SELECT
  c.address AS comp_address,
  c.city,
  c.sale_price,
  c.latitude,
  c.longitude,
  c.distance,
  c.data_source,
  p.address AS property_address,
  p.city AS property_city
FROM comparables_cache c
INNER JOIN properties p ON c.property_id = p.id
ORDER BY c.created_at DESC
LIMIT 20;
`);

console.log("\n3. VALIDAR DISTÂNCIAS (aprox):");
console.log(`
SELECT
  p.address AS property,
  p.latitude AS prop_lat,
  p.longitude AS prop_lng,
  c.address AS comp,
  c.latitude AS comp_lat,
  c.longitude AS comp_lng,
  c.distance AS stored_dist,
  ABS(c.latitude - p.latitude) * 69 AS lat_miles,
  ABS(c.longitude - p.longitude) * 54 AS lng_miles,
  CASE
    WHEN ABS(c.latitude - p.latitude) < 0.05
     AND ABS(c.longitude - p.longitude) < 0.05
    THEN '✅ PRÓXIMO'
    ELSE '⚠️ LONGE'
  END AS status
FROM properties p
INNER JOIN comparables_cache c ON p.id = c.property_id
WHERE p.latitude IS NOT NULL
ORDER BY p.created_at DESC, c.distance ASC
LIMIT 30;
`);

console.log("\n4. ESTATÍSTICAS POR DATA SOURCE:");
console.log(`
SELECT
  data_source,
  COUNT(*) AS total,
  AVG(distance) AS avg_distance,
  MIN(distance) AS min_distance,
  MAX(distance) AS max_distance,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) AS with_coords
FROM comparables_cache
GROUP BY data_source
ORDER BY total DESC;
`);

console.log("\n5. PROPERTIES SEM COORDENADAS (precisam geocoding):");
console.log(`
SELECT
  id,
  address,
  city,
  state,
  zip_code
FROM properties
WHERE latitude IS NULL
   OR longitude IS NULL
LIMIT 20;
`);

console.log("\n═══════════════════════════════════════════════════════");
console.log("✅ CHECKLIST DE VALIDAÇÃO:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("[ ] 1. Tabela 'properties' existe e tem colunas latitude/longitude");
console.log("[ ] 2. Tabela 'comparables_cache' existe");
console.log("[ ] 3. Existem properties com coordenadas preenchidas");
console.log("[ ] 4. Existem comps no cache");
console.log("[ ] 5. Comps têm coordenadas (latitude/longitude não null)");
console.log("[ ] 6. Distâncias armazenadas estão < 3 miles");
console.log("[ ] 7. Coordenadas dos comps estão próximas da property");
console.log("[ ] 8. Data source está preenchido (demo/attom/zillow/etc)");
console.log("[ ] 9. Índices criados nas colunas de coordenadas");
console.log("[ ] 10. RLS policies configuradas corretamente\n");

console.log("═══════════════════════════════════════════════════════");
console.log("📊 RESULTADOS ESPERADOS:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("✅ Properties: 10+ registros com latitude/longitude");
console.log("✅ Comps Cache: Múltiplos registros para cada property");
console.log("✅ Coordenadas: Comps dentro de 0.5-1.5 miles da property");
console.log("✅ Data Source: 'demo' para testes sem API keys");
console.log("✅ Distance: Valores entre 0.1 e 3.0 miles");
console.log("✅ Quality Score: 0.7 - 1.0 (se configurado)");

console.log("\n═══════════════════════════════════════════════════════");
console.log("🎯 PRÓXIMOS PASSOS:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("1. Execute as queries SQL no Supabase Dashboard");
console.log("2. Verifique se há dados nas tabelas");
console.log("3. Se NÃO houver dados:");
console.log("   - Abra o app");
console.log("   - Vá para uma property");
console.log("   - Clique em 'Generate Comparables'");
console.log("   - Verifique se salvou no cache");
console.log("4. Se houver dados, valide:");
console.log("   - Coordenadas estão corretas");
console.log("   - Distâncias fazem sentido");
console.log("   - Comps estão próximos da property\n");

console.log("═══════════════════════════════════════════════════════\n");
