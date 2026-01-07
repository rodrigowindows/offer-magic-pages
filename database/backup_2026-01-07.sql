-- ============================================
-- DATABASE BACKUP - 2026-01-07
-- Project: Step 5 Property Management
-- ============================================

-- RESUMO:
-- properties: 223 registros
-- priority_leads: 86 registros  
-- notifications: 52 registros
-- ab_tests: 12 registros
-- Outras tabelas: 0 registros

-- ============================================
-- INSTRUÇÕES DE RESTAURAÇÃO:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. As tabelas devem existir antes da restauração
-- 3. Use TRUNCATE se quiser limpar dados existentes
-- ============================================

-- Para backup completo dos dados, use as queries abaixo
-- no SQL Editor para exportar cada tabela:

-- EXPORTAR PROPERTIES (223 registros):
-- COPY (SELECT * FROM properties) TO STDOUT WITH CSV HEADER;

-- EXPORTAR PRIORITY_LEADS (86 registros):
-- COPY (SELECT * FROM priority_leads) TO STDOUT WITH CSV HEADER;

-- EXPORTAR NOTIFICATIONS (52 registros):
-- COPY (SELECT * FROM notifications) TO STDOUT WITH CSV HEADER;

-- EXPORTAR AB_TESTS (12 registros):
-- COPY (SELECT * FROM ab_tests) TO STDOUT WITH CSV HEADER;

-- ============================================
-- ESTRUTURA DAS TABELAS (DDL)
-- ============================================

-- Para obter o DDL completo de cada tabela, use:
-- 
-- SELECT 
--   'CREATE TABLE ' || table_name || ' (' ||
--   string_agg(column_name || ' ' || data_type || 
--     CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
--     CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END, 
--     ', ' ORDER BY ordinal_position) || ');'
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'properties'
-- GROUP BY table_name;

-- ============================================
-- BACKUP AUTOMÁTICO VIA LOVABLE
-- ============================================
-- 
-- Para fazer backup completo, você pode:
-- 1. Usar o botão "View Backend" abaixo para acessar os dados
-- 2. Exportar via API usando scripts Python
-- 3. Solicitar export CSV de tabelas específicas

-- ============================================
-- CONTAGEM ATUAL DE REGISTROS
-- ============================================

-- properties: 223
-- priority_leads: 86
-- notifications: 52
-- ab_tests: 12
-- profiles: 0
-- property_leads: 0
-- property_notes: 0
-- campaign_logs: 0
-- campaign_templates: 0
-- ab_test_events: 0
-- email_campaigns: 0
-- follow_up_reminders: 0

-- ============================================
-- FIM DO BACKUP
-- ============================================
