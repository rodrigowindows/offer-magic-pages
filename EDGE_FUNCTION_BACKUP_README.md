# Função Edge de Backup do Supabase

Função Edge Function que faz backup automático do banco de dados Supabase e salva em Storage.

## 🚀 Como Usar

### 1. Deploy da Função
```bash
supabase functions deploy backup-database
```

### 2. Criar Bucket de Storage (se não existir)
```sql
-- No SQL Editor do Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', true);
```

### 3. Chamar a Função

#### Backup Completo (GET)
```bash
curl -X GET "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/backup-database" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Backup Personalizado (POST)
```bash
curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/backup-database" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tables": ["properties", "priority_leads"],
    "format": "json",
    "includeMetadata": true
  }'
```

## 📊 Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `tables` | `string[]` | Todas as tabelas | Lista de tabelas para backup |
| `format` | `"json" \| "csv"` | `"json"` | Formato do arquivo de backup |
| `includeMetadata` | `boolean` | `true` | Incluir metadados no backup |

## 📁 Estrutura do Backup JSON

```json
{
  "metadata": {
    "timestamp": "2026-01-12T00:45:34.391Z",
    "totalRecords": 326,
    "totalSize": 15432,
    "tables": {
      "properties": { "records": 223, "size": 12345 },
      "priority_leads": { "records": 86, "size": 2345 }
    },
    "format": "json"
  },
  "data": {
    "properties": [...],
    "priority_leads": [...]
  }
}
```

## 🔄 Resposta da API

```json
{
  "success": true,
  "timestamp": "2026-01-12T00:45:34.391Z",
  "tables": {
    "properties": { "records": 223, "size": 12345 }
  },
  "totalRecords": 326,
  "totalSize": 15432,
  "downloadUrl": "https://...",
  "error": null
}
```

## 🧪 Teste Local

Execute o script de teste:
```bash
node test_backup_function.js
```

## 📋 Funcionalidades

- ✅ Backup automático de todas as tabelas
- ✅ Backup seletivo de tabelas específicas
- ✅ Suporte a formatos JSON e CSV
- ✅ Upload automático para Storage
- ✅ Metadados detalhados
- ✅ Tratamento de erros robusto
- ✅ CORS habilitado

## 🔒 Segurança

- Usa autenticação Bearer token
- RLS (Row Level Security) respeitado
- Apenas usuários autenticados podem fazer backup

## 📊 Monitoramento

Os logs da função aparecem no Supabase Dashboard > Edge Functions > Logs.

## 🚨 Limitações

- Timeout de 30 segundos para funções Edge
- Limite de 5MB por arquivo no Storage gratuito
- Para bancos muito grandes, considere backup em lotes

## 💡 Uso Programático

```javascript
// Backup completo
const response = await fetch('/functions/v1/backup-database', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tables: ['properties'],
    format: 'json'
  })
});

const result = await response.json();
console.log('Backup URL:', result.downloadUrl);
```