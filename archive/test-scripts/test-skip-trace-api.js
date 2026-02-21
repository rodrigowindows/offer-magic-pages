#!/usr/bin/env node

/**
 * Script para testar a API de Skip Trace Data
 * Uso: node test-skip-trace-api.js
 */

const https = require('https');

// Configurações - substitua pelas suas
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/functions/v1/${path}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testSkipTraceAPI() {
  console.log('🧪 Testando API de Skip Trace Data\n');

  try {
    // Teste 1: Buscar propriedades com skip trace data
    console.log('1. Buscando propriedades com dados de skip trace...');
    const response1 = await makeRequest('get-skip-trace-data?hasSkipTraceData=true&limit=5');

    if (response1.status === 200 && response1.data.success) {
      console.log('✅ Sucesso!');
      console.log(`📊 Total de propriedades: ${response1.data.summary.total_properties}`);
      console.log(`📞 Com telefones: ${response1.data.summary.properties_with_phones}`);
      console.log(`📧 Com emails: ${response1.data.summary.properties_with_emails}`);
      console.log(`👤 Com info do proprietário: ${response1.data.summary.properties_with_owner_info}`);

      if (response1.data.data && response1.data.data.length > 0) {
        console.log('\n📋 Primeira propriedade encontrada:');
        const firstProp = response1.data.data[0];
        console.log(`🏠 ${firstProp.address}, ${firstProp.city}`);
        console.log(`👤 Proprietário: ${firstProp.owner_name || 'N/A'}`);
        console.log(`📞 Telefones: ${firstProp.skip_trace_summary.total_phones}`);
        console.log(`📧 Emails: ${firstProp.skip_trace_summary.total_emails}`);
        console.log(`🚫 DNC: ${firstProp.skip_trace_summary.dnc_status}`);
      }
    } else {
      console.log('❌ Erro:', response1.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 2: Buscar com filtro de busca
    console.log('2. Buscando propriedades em Orlando...');
    const response2 = await makeRequest('get-skip-trace-data?search=Orlando&limit=3');

    if (response2.status === 200 && response2.data.success) {
      console.log('✅ Sucesso!');
      console.log(`📊 Propriedades encontradas: ${response2.data.data?.length || 0}`);

      if (response2.data.data && response2.data.data.length > 0) {
        response2.data.data.forEach((prop, idx) => {
          console.log(`${idx + 1}. ${prop.address} - ${prop.skip_trace_summary.total_phones} phones, ${prop.skip_trace_summary.total_emails} emails`);
        });
      }
    } else {
      console.log('❌ Erro:', response2.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 3: Verificar paginação
    console.log('3. Testando paginação...');
    const response3 = await makeRequest('get-skip-trace-data?hasSkipTraceData=true&limit=2&offset=0');

    if (response3.status === 200 && response3.data.success) {
      console.log('✅ Sucesso!');
      console.log(`📄 Página 1: ${response3.data.data?.length || 0} propriedades`);
      console.log(`📊 Total disponível: ${response3.data.pagination.total}`);
      console.log(`➡️  Mais páginas: ${response3.data.pagination.has_more ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Erro:', response3.data);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Executar os testes
if (require.main === module) {
  testSkipTraceAPI();
}

module.exports = { testSkipTraceAPI, makeRequest };