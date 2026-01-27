-- scripts/clear-demo-cache.sql
-- Limpar cache demo do banco
DELETE FROM comps_analysis_history WHERE data_source = 'demo';
DELETE FROM comparables_cache WHERE source = 'demo';

-- Verificar resultado
SELECT data_source, COUNT(*) as count FROM comps_analysis_history GROUP BY data_source;
SELECT source, COUNT(*) as count FROM comparables_cache GROUP BY source;
