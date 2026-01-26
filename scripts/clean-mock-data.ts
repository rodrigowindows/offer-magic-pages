// scripts/clean-mock-data.ts
// Script para limpar dados mock/demo do Supabase

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// ATENÇÃO: Estes valores são apenas para testes locais. NÃO use em produção!
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://SEU_SUPABASE_URL.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SEU_SERVICE_ROLE_KEY_AQUI';
const dryRun = !process.argv.includes('--execute');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos nas variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function countAndDelete(table: string, where: string, label: string) {
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .filter(where.split(' ')[0], where.split(' ')[1], where.split(' ')[2]);

  console.log(`🔎 ${label}: ${count} registros encontrados para exclusão.`);

  if (!dryRun && count && count > 0) {
    const { error } = await supabase.from(table).delete().filter(where.split(' ')[0], where.split(' ')[1], where.split(' ')[2]);
    if (error) {
      console.error(`❌ Erro ao deletar de ${table}:`, error.message);
    } else {
      console.log(`✅ ${count} registros deletados de ${table}.`);
    }
  }
}

async function main() {
  console.log('==== LIMPEZA DE DADOS MOCK/DEMO ====');
  console.log(`Modo: ${dryRun ? 'DRY-RUN (não deleta)' : 'EXECUTE (irá deletar!)'}`);

  await countAndDelete('comparables', "source eq 'demo'", 'comparables (demo)');
  await countAndDelete('comparables', 'source is null', 'comparables (source null)');
  await countAndDelete('comps_analysis_history', "data_source eq 'demo'", 'comps_analysis_history (demo)');
  await countAndDelete('comps_analysis_history', 'data_source is null', 'comps_analysis_history (source null)');
  await countAndDelete('comparables_cache', 'id is not null', 'comparables_cache (todos)');

  if (dryRun) {
    console.log('\nPara deletar de verdade, rode com --execute');
  }
}

main();
