import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase (diretamente do .env)
const SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs";

// Lista de todas as tabelas do banco
const TABLES = [
  'priority_leads',
  'property_notes',
  'call_settings',
  'properties',
  'ab_tests',
  'campaign_templates',
  'profiles',
  'ab_test_events',
  'campaign_sequences',
  'email_campaigns',
  'email_settings',
  'property_leads',
  'sms_settings',
  'follow_up_reminders',
  'property_analytics',
  'sequence_steps',
  'property_sequences',
  'notifications',
  'campaign_logs'
];

async function fetchTableData(tableName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const count = response.headers.get('content-range')?.split('/')[1] || data.length;

  return { data, count: parseInt(count) || data.length };
}

async function backupDatabase() {
  console.log('🚀 Iniciando backup do banco de dados...');

  // Criar diretório de backup
  const backupDir = path.join(__dirname, 'database_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup_${timestamp}`);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  console.log(`📁 Salvando backup em: ${backupPath}`);

  const backupInfo = {
    timestamp: new Date().toISOString(),
    tables: {},
    totalRecords: 0
  };

  // Backup de cada tabela
  for (const tableName of TABLES) {
    try {
      console.log(`📊 Fazendo backup da tabela: ${tableName}`);

      // Buscar todos os dados da tabela
      const { data, count } = await fetchTableData(tableName);

      // Salvar dados em arquivo JSON
      const filePath = path.join(backupPath, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      backupInfo.tables[tableName] = {
        records: count,
        file: `${tableName}.json`
      };

      backupInfo.totalRecords += count;

      console.log(`✅ ${tableName}: ${count} registros salvos`);

    } catch (err) {
      console.error(`❌ Erro na tabela ${tableName}:`, err.message);
      backupInfo.tables[tableName] = { error: err.message, records: 0 };
    }
  }

  // Salvar informações do backup
  const infoPath = path.join(backupPath, 'backup_info.json');
  fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));

  // Criar arquivo README
  const readmePath = path.join(backupPath, 'README.md');
  const readme = `# Database Backup - ${new Date().toLocaleString()}

## Resumo do Backup
- **Data/Hora:** ${backupInfo.timestamp}
- **Total de Registros:** ${backupInfo.totalRecords}
- **Total de Tabelas:** ${Object.keys(backupInfo.tables).length}

## Tabelas Incluídas
${Object.entries(backupInfo.tables)
  .map(([table, info]) => `- **${table}**: ${info.records || 0} registros ${info.error ? `(Erro: ${info.error})` : ''}`)
  .join('\n')}

## Como Restaurar
Para restaurar os dados, use os arquivos JSON individuais com a API do Supabase ou scripts de importação.

## Arquivos
- \`backup_info.json\` - Metadados do backup
- \`[nome_tabela].json\` - Dados de cada tabela
`;

  fs.writeFileSync(readmePath, readme);

  console.log('🎉 Backup concluído!');
  console.log(`📊 Total de registros: ${backupInfo.totalRecords}`);
  console.log(`📁 Localização: ${backupPath}`);

  return backupInfo;
}

// Executar backup
backupDatabase().catch(console.error);