# Como Ver os Leads do Formulário de Contato

## ✅ O Que Foi Feito

O formulário "Get Your Fair Cash Offer Today" agora **salva automaticamente** todos os dados submetidos na tabela `property_leads` do Supabase.

### Dados Salvos:
- ✅ Nome completo (`full_name`)
- ✅ Email (`email`)
- ✅ Telefone (`phone`)
- ✅ Endereço da propriedade (vinculado via `property_id` se disponível)
- ✅ Data/hora de criação (`created_at`)
- ✅ User agent (navegador usado)
- ✅ Status do lead (`status` = 'new' por padrão)

---

## 📊 Como Acessar os Leads

### Opção 1: Supabase Dashboard (Mais Fácil)

1. **Acesse o Supabase Dashboard:**
   ```
   https://app.supabase.com/project/atwdkhlyrffbaugkaker/editor
   ```

2. **Navegue até a tabela:**
   - No menu lateral esquerdo, clique em **"Table Editor"**
   - Selecione a tabela **`property_leads`**

3. **Visualize todos os leads:**
   - Você verá todos os formulários submetidos
   - Clique em qualquer linha para ver detalhes completos

4. **Filtrar leads:**
   - Use os filtros no topo da tabela
   - Exemplos:
     - `status` = `new` → Ver apenas leads novos
     - `created_at` > `2026-01-13` → Leads de hoje
     - `selling_timeline` = `asap` → Leads urgentes

### Opção 2: SQL Query (Avançado)

No Supabase Dashboard, vá em **SQL Editor** e execute:

```sql
-- Ver todos os leads mais recentes primeiro
SELECT
  id,
  full_name,
  email,
  phone,
  property_id,
  status,
  selling_timeline,
  created_at
FROM property_leads
ORDER BY created_at DESC
LIMIT 100;
```

**Ver leads com informações da propriedade:**
```sql
SELECT
  pl.full_name,
  pl.email,
  pl.phone,
  pl.created_at,
  pl.status,
  p.address,
  p.city,
  p.state,
  p.cash_offer_amount
FROM property_leads pl
LEFT JOIN properties p ON pl.property_id = p.id
ORDER BY pl.created_at DESC;
```

**Ver analytics dos leads:**
```sql
SELECT * FROM property_leads_analytics;
```

### Opção 3: Criar Interface Admin (Recomendado)

Vou criar uma página simples no admin para visualizar os leads. Execute:

```bash
cd "Step 5 - Outreach & Campaigns"
```

Depois acesse:
```
http://localhost:5173/admin/leads
```

---

## 📈 Analytics Disponíveis

A view `property_leads_analytics` já está criada e mostra:

- Total de leads por propriedade
- Leads novos vs contactados
- Leads qualificados
- Leads urgentes (timeline = 'asap')
- Leads mornos (timeline = '1-3months' ou '3-6months')
- Data do último lead recebido

**Query:**
```sql
SELECT
  address,
  city,
  state,
  total_leads,
  new_leads,
  urgent_leads,
  latest_lead_at
FROM property_leads_analytics
ORDER BY total_leads DESC;
```

---

## 🔔 Notificações (Futuro)

Para receber notificações quando um lead é submetido, você pode:

1. **Email automático via Supabase Edge Function**
2. **Webhook para Slack/Discord**
3. **SMS via Twilio**
4. **Notificação push no admin**

---

## 🛡️ Segurança

- ✅ RLS (Row Level Security) está habilitado
- ✅ Qualquer pessoa pode **inserir** leads (formulário público)
- ✅ Apenas usuários **autenticados** podem **visualizar** leads
- ✅ Apenas usuários **autenticados** podem **atualizar** status dos leads
- ✅ Proteção contra duplicatas (mesmo email + property_id)

---

## 📝 Campos da Tabela `property_leads`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do lead |
| `property_id` | UUID | Referência à propriedade (pode ser null) |
| `full_name` | TEXT | Nome completo do interessado |
| `email` | TEXT | Email (único por propriedade) |
| `phone` | TEXT | Telefone de contato |
| `is_owner` | BOOLEAN | Se é o proprietário (padrão: true) |
| `selling_timeline` | TEXT | Prazo de venda: 'asap', '1-3months', '3-6months', '6-12months', 'exploring' |
| `created_at` | TIMESTAMP | Data/hora de criação |
| `updated_at` | TIMESTAMP | Data/hora da última atualização |
| `ip_address` | TEXT | IP do visitante (opcional) |
| `user_agent` | TEXT | Navegador usado |
| `contacted` | BOOLEAN | Se já foi contactado |
| `contacted_at` | TIMESTAMP | Quando foi contactado |
| `contacted_by` | UUID | Quem contactou (usuário) |
| `status` | TEXT | Status: 'new', 'contacted', 'qualified', 'not-interested', 'closed' |
| `notes` | TEXT | Notas sobre o lead |

---

## 🚀 Próximos Passos

1. **Exportar para CSV:**
   ```sql
   COPY (
     SELECT * FROM property_leads
     WHERE created_at > '2026-01-01'
   ) TO '/tmp/leads.csv' WITH CSV HEADER;
   ```

2. **Integrar com CRM** (ex: HubSpot, Salesforce)

3. **Dashboard de Analytics** para visualizar conversão

4. **Automação de follow-up** via email/SMS

---

## 📞 Contato de Teste

Para testar, submeta o formulário em:
```
https://offer.mylocalinvest.com/property/[property-slug]
```

Depois verifique no Supabase se o lead apareceu!

---

## ✅ Status Atual

- ✅ Formulário salvando no banco
- ✅ Tabela `property_leads` criada
- ✅ RLS configurado
- ✅ Analytics view criada
- ✅ Proteção contra duplicatas
- ✅ Tratamento de erros

**Última atualização:** 2026-01-13
