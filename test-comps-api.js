/**
 * Test Comps API - Node.js Script
 * Run with: node test-comps-api.js
 * 
 * Valida se os dados retornados são de PRODUÇÃO (não demo)
 */

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUzODcsImV4cCI6MjA0OTg2MTM4N30.yMSiS4bnkjKQe9_YXAuAOLaZcHs8xpBmS2-qhkBw-Aw';

// Fontes de dados REAIS (não demo)
const REAL_SOURCES = ['attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv'];

/**
 * Validar se os dados são de produção
 */
function validateProductionData(data) {
  const issues = [];
  const warnings = [];

  // Verificar flag isDemo
  if (data.isDemo === true) {
    issues.push('❌ isDemo: true - Usando dados DEMO (não produção)');
  } else if (data.isDemo === false) {
    console.log('✅ isDemo: false - Dados de produção');
  }

  // Verificar source
  if (data.source === 'demo') {
    issues.push('❌ source: "demo" - Dados simulados');
  } else if (REAL_SOURCES.includes(data.source)) {
    console.log(`✅ source: "${data.source}" - Fonte de dados real`);
  } else {
    warnings.push(`⚠️ source: "${data.source}" - Fonte desconhecida`);
  }

  // Verificar API keys configuradas
  if (!data.apiKeysConfigured?.attom) {
    issues.push('❌ ATTOM_API_KEY não configurada no Supabase');
  } else {
    console.log('✅ ATTOM_API_KEY configurada');
  }

  // Verificar comps
  if (data.comps && data.comps.length > 0) {
    // Verificar se comps têm coordenadas
    const compsWithoutCoords = data.comps.filter(c => !c.latitude || !c.longitude);
    if (compsWithoutCoords.length > 0) {
      warnings.push(`⚠️ ${compsWithoutCoords.length} comps sem coordenadas`);
    }

    // Verificar se comps têm source real
    const demoComps = data.comps.filter(c => c.source === 'demo');
    if (demoComps.length > 0) {
      issues.push(`❌ ${demoComps.length} comps são DEMO (source: "demo")`);
    }

    // Verificar se addresses parecem reais (não gerados)
    const suspiciousAddresses = data.comps.filter(c => {
      const addr = c.address?.toLowerCase() || '';
      // Addresses gerados geralmente têm padrões como números muito altos
      return addr.match(/\d{5,}/) || addr.includes('demo') || addr.includes('test');
    });
    if (suspiciousAddresses.length > 0) {
      warnings.push(`⚠️ ${suspiciousAddresses.length} addresses suspeitos (podem ser gerados)`);
    }
  }

  return {
    isProduction: issues.length === 0 && data.isDemo === false,
    issues,
    warnings
  };
}

async function testCompsAPI() {
  console.log('🏠 Testing Comps API - Verificação de Dados de Produção\n');
  console.log('⚠️  IMPORTANTE: Este teste verifica se os dados são REAIS (não demo)\n');

  const testCases = [
    {
      name: 'Endereço Real Testado (25217 Mathew St)',
      payload: {
        address: '25217 Mathew St',
        city: 'Orlando',
        state: 'FL',
        basePrice: 250000,
        radius: 3,
        zipCode: '32833'
      }
    },
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
        console.log(`🎭 isDemo: ${data.isDemo ? '⚠️ TRUE (DADOS DEMO)' : '✅ FALSE (DADOS REAIS)'}`);

        // VALIDAÇÃO DE PRODUÇÃO
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔍 VALIDAÇÃO DE DADOS DE PRODUÇÃO`);
        console.log(`${'='.repeat(60)}`);
        
        const validation = validateProductionData(data);
        
        if (validation.issues.length > 0) {
          console.log(`\n❌ PROBLEMAS ENCONTRADOS:`);
          validation.issues.forEach(issue => console.log(`   ${issue}`));
        }
        
        if (validation.warnings.length > 0) {
          console.log(`\n⚠️  AVISOS:`);
          validation.warnings.forEach(warning => console.log(`   ${warning}`));
        }

        if (validation.isProduction) {
          console.log(`\n✅ DADOS DE PRODUÇÃO CONFIRMADOS!`);
          console.log(`   ✅ isDemo: false`);
          console.log(`   ✅ source: "${data.source}" (fonte real)`);
          console.log(`   ✅ API Keys configuradas`);
        } else {
          console.log(`\n⚠️  ATENÇÃO: Dados NÃO são de produção!`);
          console.log(`   Configure ATTOM_API_KEY no Supabase para obter dados reais.`);
          console.log(`   Comando: npx supabase secrets set ATTOM_API_KEY=SUA_KEY --project-ref atwdkhlyrffbaugkaker`);
        }

        console.log(`\n📋 Comparables Summary:`);
        console.log(`${'─'.repeat(60)}`);

        data.comps.forEach((comp, i) => {
          const pricePerSqft = Math.round(comp.salePrice / comp.sqft);
          const sourceIcon = comp.source === 'demo' ? '🎭' : '✅';
          console.log(`${i + 1}. ${comp.address} ${sourceIcon} (${comp.source})`);
          console.log(`   Price: $${comp.salePrice.toLocaleString()} | ${comp.beds}bd/${comp.baths}ba | ${comp.sqft.toLocaleString()} sqft | $${pricePerSqft}/sqft`);
          console.log(`   Sale Date: ${comp.saleDate} | Built: ${comp.yearBuilt}`);
          if (comp.latitude && comp.longitude) {
            console.log(`   Coordinates: ${comp.latitude}, ${comp.longitude} | Distance: ${comp.distance || 'N/A'} mi`);
          }
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
