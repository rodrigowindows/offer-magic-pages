import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs";

async function restoreTable(tableName, data) {
  console.log(`🔄 Restaurando tabela: ${tableName} (${data.length} registros)`);

  // Para tabelas grandes, fazer em lotes
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    try {
      const url = `${SUPABASE_URL}/rest/v1/${tableName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(batch)
      });

      if (response.ok) {
        successCount += batch.length;
        console.log(`  ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
      } else {
        errorCount += batch.length;
        console.error(`  ❌ Lote ${Math.floor(i/batchSize) + 1}: ${response.status} ${response.statusText}`);
      }

    } catch (err) {
      errorCount += batch.length;
      console.error(`  ❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, err.message);
    }
  }

  return { successCount, errorCount };
}

async function restoreDatabase(backupPath) {
  console.log('🔄 Iniciando restauração do banco de dados...');
  console.log(`📁 Usando backup: ${backupPath}`);

  // Verificar se o diretório existe
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Diretório de backup não encontrado: ${backupPath}`);
  }

  // Ler informações do backup
  const infoPath = path.join(backupPath, 'backup_info.json');
  if (!fs.existsSync(infoPath)) {
    throw new Error('Arquivo backup_info.json não encontrado');
  }

  const backupInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  console.log(`📊 Backup original: ${backupInfo.totalRecords} registros em ${Object.keys(backupInfo.tables).length} tabelas`);

  const restoreResults = {
    timestamp: new Date().toISOString(),
    originalBackup: backupInfo.timestamp,
    tables: {},
    totalSuccess: 0,
    totalErrors: 0
  };

  // Restaurar cada tabela
  for (const [tableName, tableInfo] of Object.entries(backupInfo.tables)) {
    if (tableInfo.records === 0) {
      console.log(`⏭️  Pulando tabela vazia: ${tableName}`);
      continue;
    }

    try {
      const filePath = path.join(backupPath, tableInfo.file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        restoreResults.tables[tableName] = { error: 'Arquivo não encontrado', successCount: 0, errorCount: tableInfo.records };
        continue;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const { successCount, errorCount } = await restoreTable(tableName, data);

      restoreResults.tables[tableName] = {
        successCount,
        errorCount,
        totalRecords: tableInfo.records
      };

      restoreResults.totalSuccess += successCount;
      restoreResults.totalErrors += errorCount;

    } catch (err) {
      console.error(`❌ Erro ao restaurar ${tableName}:`, err.message);
      restoreResults.tables[tableName] = { error: err.message, successCount: 0, errorCount: tableInfo.records };
      restoreResults.totalErrors += tableInfo.records;
    }
  }

  // Salvar relatório de restauração
  const reportPath = path.join(backupPath, 'restore_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(restoreResults, null, 2));

  console.log('🎉 Restauração concluída!');
  console.log(`✅ Sucesso: ${restoreResults.totalSuccess} registros`);
  console.log(`❌ Erros: ${restoreResults.totalErrors} registros`);
  console.log(`📄 Relatório salvo em: ${reportPath}`);

  return restoreResults;
}

// Uso: node database_restore.js "caminho/do/backup"
const backupPath = process.argv[2];
if (!backupPath) {
  console.error('❌ Uso: node database_restore.js "caminho/do/backup"');
  console.error('📝 Exemplo: node database_restore.js "./database_backup/backup_2026-01-12T00-43-51-556Z"');
  process.exit(1);
}

restoreDatabase(backupPath).catch(console.error);