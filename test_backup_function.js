// Test script for the backup-database Edge Function
import fetch from 'node-fetch';

const SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs";

async function testBackupFunction() {
  console.log('🧪 Testando função Edge de backup...');

  try {
    // Test 1: Backup completo (padrão)
    console.log('\n📊 Teste 1: Backup completo');
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/backup-database`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        includeMetadata: true,
        format: 'json'
      })
    });

    const result1 = await response1.json();
    console.log('✅ Status:', response1.status);
    console.log('📈 Total de registros:', result1.totalRecords);
    console.log('📁 URL do download:', result1.downloadUrl);

    // Test 2: Backup apenas de algumas tabelas
    console.log('\n📊 Teste 2: Backup seletivo (apenas properties e priority_leads)');
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/backup-database`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tables: ['properties', 'priority_leads'],
        format: 'json',
        includeMetadata: false
      })
    });

    const result2 = await response2.json();
    console.log('✅ Status:', response2.status);
    console.log('📈 Total de registros:', result2.totalRecords);

    // Test 3: Backup em CSV
    console.log('\n📊 Teste 3: Backup em formato CSV');
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/backup-database`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tables: ['properties'],
        format: 'csv'
      })
    });

    const result3 = await response3.json();
    console.log('✅ Status:', response3.status);
    console.log('📁 URL do download:', result3.downloadUrl);

    console.log('\n🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testBackupFunction();