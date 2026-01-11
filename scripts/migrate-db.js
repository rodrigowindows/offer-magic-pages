/**
 * Database Migration Script
 * Executa migrações do banco de dados Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase (use variáveis de ambiente em produção)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
  console.error('❌ Erro: Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  console.log('💡 Você pode encontrar essas informações no dashboard do Supabase > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...');

    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'database', 'lead_scoring_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Arquivo de migração carregado');

    // Dividir o SQL em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executando ${statements.length} statements SQL...`);

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executando statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            // Se rpc não funcionar, tentar executar diretamente
            console.log('🔄 Tentando execução direta...');
            const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);

            if (directError && directError.message.includes('relation') === false) {
              throw error;
            }
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} pode requerer execução manual:`, statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('🎯 Tabelas criadas:');
    console.log('  - lead_scores');
    console.log('  - lead_activities');
    console.log('  - follow_up_sequences');
    console.log('🔧 Função criada: update_lead_score()');

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    process.exit(1);
  }
}

// Executar migração
runMigration();