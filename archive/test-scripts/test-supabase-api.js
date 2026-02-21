/**
 * Teste de API do Supabase - Validação de Comparables
 *
 * Este script testa:
 * 1. Conexão com Supabase
 * 2. Leitura de properties com coordenadas
 * 3. Leitura de comparables_cache
 * 4. Validação de distâncias
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.log('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Haversine distance calculation
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
console.log("🧪 TESTE DE SUPABASE - COMPARABLES SYSTEM");
console.log("═══════════════════════════════════════════════════════\n");

async function runTests() {
  try {
    // TEST 1: Verificar conexão
    console.log("TEST 1: Verificando conexão com Supabase...");
    const { data: healthCheck, error: healthError } = await supabase
      .from('properties')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ ERRO de conexão:', healthError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // TEST 2: Properties com coordenadas
    console.log("TEST 2: Buscando properties com coordenadas...");
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, address, city, state, zip_code, latitude, longitude, estimated_value')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (propError) {
      console.error('❌ ERRO ao buscar properties:', propError.message);
      return;
    }

    console.log(`✅ Encontradas ${properties?.length || 0} properties com coordenadas`);

    if (properties && properties.length > 0) {
      console.log('\n📊 Properties:');
      properties.forEach((prop, idx) => {
        console.log(`\n${idx + 1}. ${prop.address}, ${prop.city}, ${prop.state}`);
        console.log(`   Coordinates: ${prop.latitude}, ${prop.longitude}`);
        console.log(`   Value: $${prop.estimated_value?.toLocaleString() || 'N/A'}`);
      });
    } else {
      console.log('⚠️ Nenhuma property com coordenadas encontrada!');
      console.log('   Você precisa popular a tabela properties com dados de teste.');
      return;
    }

    // TEST 3: Properties SEM coordenadas (precisam ser preenchidas)
    console.log("\n\nTEST 3: Buscando properties SEM coordenadas...");
    const { data: propsWithoutCoords, error: noCoordError } = await supabase
      .from('properties')
      .select('id, address, city, state')
      .or('latitude.is.null,longitude.is.null')
      .limit(5);

    if (noCoordError) {
      console.error('❌ ERRO:', noCoordError.message);
    } else {
      console.log(`⚠️ ${propsWithoutCoords?.length || 0} properties SEM coordenadas`);
      if (propsWithoutCoords && propsWithoutCoords.length > 0) {
        console.log('\nProperties que precisam de geocoding:');
        propsWithoutCoords.forEach((prop, idx) => {
          console.log(`${idx + 1}. ${prop.address}, ${prop.city}, ${prop.state}`);
        });
      }
    }

    // TEST 4: Comparables cache
    console.log("\n\nTEST 4: Verificando comparables_cache...");
    const { data: compsCache, error: cacheError } = await supabase
      .from('comparables_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (cacheError) {
      console.error('❌ ERRO ao buscar cache:', cacheError.message);
    } else {
      console.log(`✅ Encontrados ${compsCache?.length || 0} comps no cache`);

      if (compsCache && compsCache.length > 0) {
        console.log('\n📊 Últimos comps salvos:');
        compsCache.forEach((comp, idx) => {
          console.log(`\n${idx + 1}. ${comp.address}, ${comp.city || 'N/A'}`);
          console.log(`   Sale Price: $${comp.sale_price?.toLocaleString() || 'N/A'}`);
          console.log(`   Coordinates: ${comp.latitude}, ${comp.longitude}`);
          console.log(`   Distance: ${comp.distance} miles`);
          console.log(`   Source: ${comp.data_source}`);
          console.log(`   Cached: ${new Date(comp.created_at).toLocaleString()}`);
        });
      } else {
        console.log('⚠️ Nenhum comp no cache ainda!');
        console.log('   Execute o sistema de comps para gerar e cachear dados.');
      }
    }

    // TEST 5: Validação de distâncias
    if (properties && properties.length > 0 && compsCache && compsCache.length > 0) {
      console.log("\n\nTEST 5: Validando distâncias dos comps...");

      // Agrupar comps por property
      const compsByProperty = new Map();

      for (const comp of compsCache) {
        if (!compsByProperty.has(comp.property_id)) {
          compsByProperty.set(comp.property_id, []);
        }
        compsByProperty.get(comp.property_id).push(comp);
      }

      console.log(`\n📊 Analisando ${compsByProperty.size} properties com comps...\n`);

      let totalValidations = 0;
      let totalValid = 0;
      let totalInvalid = 0;

      for (const [propertyId, comps] of compsByProperty.entries()) {
        const property = properties.find(p => p.id === propertyId);

        if (!property || !property.latitude || !property.longitude) {
          console.log(`⚠️ Property ${propertyId} sem coordenadas, pulando...`);
          continue;
        }

        console.log(`\n📍 Property: ${property.address}, ${property.city}`);
        console.log(`   Coordinates: ${property.latitude}, ${property.longitude}`);
        console.log(`   Total comps: ${comps.length}\n`);

        let minDist = Infinity;
        let maxDist = 0;
        let totalDist = 0;

        comps.forEach((comp, idx) => {
          if (!comp.latitude || !comp.longitude) {
            console.log(`   ⚠️ Comp ${idx + 1}: ${comp.address} - SEM coordenadas!`);
            totalInvalid++;
            return;
          }

          const calculatedDistance = haversineMiles(
            property.latitude,
            property.longitude,
            comp.latitude,
            comp.longitude
          );

          const storedDistance = comp.distance || 0;
          const distanceDiff = Math.abs(calculatedDistance - storedDistance);

          totalValidations++;
          minDist = Math.min(minDist, calculatedDistance);
          maxDist = Math.max(maxDist, calculatedDistance);
          totalDist += calculatedDistance;

          const withinRadius = calculatedDistance <= 3;
          const accurateStorage = distanceDiff < 0.1; // Tolerância de 0.1 mile

          if (withinRadius && accurateStorage) {
            totalValid++;
            console.log(`   ✅ Comp ${idx + 1}: ${comp.address}`);
          } else if (!withinRadius) {
            totalInvalid++;
            console.log(`   ❌ Comp ${idx + 1}: ${comp.address} - LONGE DEMAIS!`);
          } else {
            totalInvalid++;
            console.log(`   ⚠️ Comp ${idx + 1}: ${comp.address} - Distância incorreta`);
          }

          console.log(`      Calculada: ${calculatedDistance.toFixed(3)} mi | Armazenada: ${storedDistance.toFixed(3)} mi`);
        });

        if (comps.length > 0) {
          const avgDist = totalDist / comps.length;
          console.log(`\n   📊 Estatísticas:`);
          console.log(`      Min: ${minDist.toFixed(3)} mi | Max: ${maxDist.toFixed(3)} mi | Avg: ${avgDist.toFixed(3)} mi`);
        }
      }

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📊 RESUMO DAS VALIDAÇÕES:');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Total de validações: ${totalValidations}`);
      console.log(`✅ Válidos: ${totalValid} (${((totalValid / totalValidations) * 100).toFixed(1)}%)`);
      console.log(`❌ Inválidos: ${totalInvalid} (${((totalInvalid / totalValidations) * 100).toFixed(1)}%)`);
    }

    // TEST 6: Estatísticas por data source
    console.log("\n\nTEST 6: Estatísticas por data source...");
    const { data: sourceStats, error: statsError } = await supabase
      .from('comparables_cache')
      .select('data_source, distance, latitude, longitude');

    if (statsError) {
      console.error('❌ ERRO:', statsError.message);
    } else if (sourceStats && sourceStats.length > 0) {
      const statsBySource = {};

      sourceStats.forEach(comp => {
        const source = comp.data_source || 'unknown';
        if (!statsBySource[source]) {
          statsBySource[source] = {
            count: 0,
            withCoords: 0,
            distances: []
          };
        }
        statsBySource[source].count++;
        if (comp.latitude && comp.longitude) {
          statsBySource[source].withCoords++;
        }
        if (comp.distance) {
          statsBySource[source].distances.push(comp.distance);
        }
      });

      console.log('\n📊 Por fonte de dados:');
      Object.entries(statsBySource).forEach(([source, stats]) => {
        const avgDist = stats.distances.length > 0
          ? stats.distances.reduce((a, b) => a + b, 0) / stats.distances.length
          : 0;

        console.log(`\n${source.toUpperCase()}:`);
        console.log(`  Total: ${stats.count}`);
        console.log(`  Com coords: ${stats.withCoords} (${((stats.withCoords / stats.count) * 100).toFixed(1)}%)`);
        console.log(`  Distância média: ${avgDist.toFixed(3)} miles`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TESTES CONCLUÍDOS!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
  }
}

// Run tests
runTests().catch(console.error);
