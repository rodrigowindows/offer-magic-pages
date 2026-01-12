# 🗄️ Sistema Completo de Backup do Banco de Dados

Este projeto oferece **4 formas diferentes** de fazer backup do banco de dados Supabase, desde scripts locais até funções Edge automáticas.

## 📋 Opções Disponíveis

### 1. 🚀 Script Local Node.js (Mais Rápido)
**Arquivo:** `database_backup.js`
**Ideal para:** Backup manual rápido
```bash
node database_backup.js
```

### 2. ☁️ Função Edge do Supabase (Backup na Nuvem)
**Arquivo:** `supabase/functions/backup-database/index.ts`
**Ideal para:** Backup automático e integração com APIs
```bash
# Deploy
supabase functions deploy backup-database

# Usar
curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/backup-database" \
  -H "Authorization: Bearer YOUR_KEY"
```

### 3. 🐍 Script Python (Backup Agendado)
**Arquivo:** `backup_scheduler.py`
**Ideal para:** Automação e agendamento
```bash
python backup_scheduler.py
# ou agendar com cron/task scheduler
```

### 4. ⚡ Script C++ (Alta Performance)
**Arquivo:** `backup_scheduler.cpp`
**Ideal para:** Aplicações de alta performance

## 📊 Comparação das Opções

| Característica | Node.js Local | Edge Function | Python Script | C++ Script |
|----------------|---------------|---------------|---------------|------------|
| **Velocidade** | ⚡ Muito rápida | 🚀 Rápida | 🐌 Média | ⚡ Muito rápida |
| **Setup** | 🔧 Simples | 🔧 Médio | 🔧 Simples | 🔧 Complexo |
| **Automação** | ❌ Manual | ✅ API | ✅ Agendável | ✅ Agendável |
| **Armazenamento** | 💾 Local | ☁️ Supabase Storage | 💾 Local | 💾 Local |
| **Monitoramento** | ❌ Nenhum | 📊 Logs do Supabase | 📝 Arquivo de log | ❌ Nenhum |
| **Custo** | 💰 Gratuito | 💰 Gratuito* | 💰 Gratuito | 💰 Gratuito |

*Edge Functions têm limites gratuitos generosos

## 🚀 Guia Rápido

### Backup Imediato (Recomendado)
```bash
# Opção mais simples e rápida
node database_backup.js
```

### Backup Automático na Nuvem
```bash
# 1. Deploy da função
./deploy_backup_function.ps1

# 2. Criar bucket no Supabase (SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', true);

# 3. Testar
node test_backup_function.js
```

### Backup Agendado
```bash
# No Windows Task Scheduler ou cron
python backup_scheduler.py
```

## 📁 Estrutura dos Arquivos

```
database_backup.js              # Script Node.js local
database_restore.js             # Script de restauração
test_backup_function.js         # Teste da Edge Function
backup_scheduler.py             # Script Python agendado
backup_scheduler.cpp            # Script C++ (compilar com curl)
deploy_backup_function.ps1      # Deploy da Edge Function
supabase/functions/backup-database/index.ts  # Código da Edge Function
database_backup/                # Diretório com backups locais
├── backup_2026-01-12T00-43-51-556Z/
├── backup_2026-01-12T00-45-01-907Z/
└── backup_2026-01-12T00-45-34-391Z/
```

## 🎯 Quando Usar Cada Opção

### Use Node.js Local (`database_backup.js`)
- ✅ Backup rápido e simples
- ✅ Desenvolvimento e testes
- ✅ Quando precisa de controle total
- ✅ Backup local imediato

### Use Edge Function
- ✅ Backup automático via API
- ✅ Integração com outras aplicações
- ✅ Backup na nuvem (Supabase Storage)
- ✅ Monitoramento via dashboard

### Use Python Script
- ✅ Backup agendado (cron/jobs)
- ✅ Integração com sistemas externos
- ✅ Logs detalhados
- ✅ Limpeza automática de backups antigos

### Use C++ Script
- ✅ Aplicações de alta performance
- ✅ Sistemas embarcados
- ✅ Quando velocidade é crítica

## 🔧 Configuração Inicial

### 1. Para Edge Function
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy
./deploy_backup_function.ps1
```

### 2. Para Scripts Python
```bash
pip install requests
python backup_scheduler.py
```

### 3. Para Scripts C++
```bash
# Instalar vcpkg e bibliotecas
# Compilar com: g++ backup_scheduler.cpp -lcurl -ljsoncpp
```

## 📊 Dados do Último Backup

- **Total de Registros:** 326
- **Tabelas Principais:**
  - `properties`: 223 imóveis
  - `priority_leads`: 86 leads
  - `ab_tests`: 12 testes A/B
  - `campaign_logs`: 5 campanhas

## 🔒 Segurança

- ✅ Todas as opções usam autenticação Bearer
- ✅ RLS (Row Level Security) é respeitado
- ✅ Dados criptografados em trânsito
- ✅ Chaves de API protegidas

## 🚨 Monitoramento e Alertas

### Edge Function
- Logs disponíveis no Supabase Dashboard
- Alertas automáticos para falhas

### Scripts Locais
- Logs em arquivo (`backup_scheduler.log`)
- Códigos de saída para automação

## 💡 Dicas e Boas Práticas

1. **Teste sempre** com dados pequenos primeiro
2. **Monitore logs** regularmente
3. **Faça backup** antes de mudanças grandes
4. **Teste restauração** periodicamente
5. **Mantenha múltiplas cópias** (local + nuvem)

## 🆘 Troubleshooting

### Erro: "Function not found"
```bash
# Redeploy da Edge Function
supabase functions deploy backup-database --no-verify-jwt
```

### Erro: "Storage bucket not found"
```sql
-- Criar bucket no SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', true);
```

### Erro: "Timeout"
- Aumente timeout nas configurações
- Considere backup em lotes menores

---

**🎯 Recomendação:** Comece com o script Node.js local para testes, depois migre para Edge Function para produção.