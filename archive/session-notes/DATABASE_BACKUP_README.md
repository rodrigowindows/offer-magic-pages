# Database Backup & Restore

Scripts para fazer backup e restaurar o banco de dados Supabase do projeto Orlando.

## 📦 Arquivos

- `database_backup.js` - Script para fazer backup de todas as tabelas
- `database_restore.js` - Script para restaurar dados de um backup
- `database_backup/` - Diretório contendo os backups criados

## 🚀 Como Fazer Backup

Execute o script de backup:

```bash
node database_backup.js
```

O backup será salvo em `database_backup/backup_[timestamp]/` com:
- Arquivos JSON individuais para cada tabela
- `backup_info.json` - Metadados do backup
- `README.md` - Resumo do backup

## 🔄 Como Restaurar

Para restaurar um backup específico:

```bash
node database_restore.js "caminho/do/backup"
```

Exemplo:
```bash
node database_restore.js "./database_backup/backup_2026-01-12T00-43-51-556Z"
```

## 📊 Último Backup

**Data:** Janeiro 12, 2026
**Localização:** `database_backup/backup_2026-01-12T00-43-51-556Z/`
**Total de Registros:** 326
**Tabelas com Dados:**
- `properties`: 223 registros
- `priority_leads`: 86 registros
- `ab_tests`: 12 registros
- `campaign_logs`: 5 registros

## ⚠️ Avisos Importantes

1. **Backup Incremental:** O script atual faz backup completo de todas as tabelas
2. **Restauração:** Usa `resolution=merge-duplicates` para evitar conflitos
3. **Limitações:** Algumas tabelas podem ter restrições de RLS que impedem inserção
4. **Performance:** Para bancos grandes, considere fazer backup em lotes menores

## 🔧 Personalização

Para modificar quais tabelas fazer backup, edite a constante `TABLES` no script `database_backup.js`.

Para alterar as configurações do Supabase, modifique as constantes `SUPABASE_URL` e `SUPABASE_KEY`.