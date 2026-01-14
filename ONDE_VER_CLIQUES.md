# 📊 Onde Ver os Cliques e Analytics

## 🔗 Links Diretos no Seu Site

### **1. Analytics Geral (Todos os Cliques)**
```
https://offer.mylocalinvest.com/marketing/analytics
```

**O que você vê:**
- ✅ Gráficos de cliques por fonte (SMS, Email, Call)
- ✅ Cliques por campanha (Top 10)
- ✅ Timeline de cliques recentes (últimos 20)
- ✅ Total de cliques
- ✅ Top canal (SMS/Email/Call)
- ✅ Canais ativos

**Componente:** `ClicksAnalytics.tsx`

---

### **2. Dashboard de Marketing**
```
https://offer.mylocalinvest.com/marketing
```

**O que você vê:**
- Estatísticas gerais
- Campanhas ativas
- Histórico de comunicações
- Performance geral

---

### **3. Analytics por Propriedade**

**No Admin, clique em "Notes" de qualquer propriedade:**

```
https://offer.mylocalinvest.com/admin
```

1. Click no botão **"Notes"** (📝) de qualquer propriedade
2. Abre modal com **"Property Analytics & Notes"**
3. Mostra:
   - ✅ Número de visualizações da página
   - ✅ Cliques no telefone
   - ✅ Cliques no email
   - ✅ Histórico de comunicações
   - ✅ Follow-ups agendados

**Componente:** `PropertyAnalytics.tsx`

---

## 📊 O Que Cada Dashboard Mostra

### **ClicksAnalytics** (`/marketing/analytics`)

```typescript
// Métricas exibidas:
- Total Clicks
- Top Source (SMS/Email/Call)
- Top Campaign
- Active Channels

// Gráficos:
- Clicks by Source (Bar Chart)
- Clicks by Campaign (Top 10)
- Recent Clicks (últimos 20)

// Filtros:
- Date Range: 7/30/90 days ou All time
- Refresh button
```

---

### **PropertyAnalytics** (Modal no Admin)

```typescript
// Para cada propriedade:
- Page Views: quantas vezes a página foi vista
- Phone Clicks: quantas vezes clicaram no telefone
- Email Clicks: quantas vezes clicaram no email
- Communication History: histórico completo
- Scheduled Follow-ups: follow-ups agendados
```

---

## 🎯 Como Acessar Cada Um

### **Método 1: Menu de Navegação**

No site `https://offer.mylocalinvest.com`:

1. Click em **"Marketing"** no menu
2. Você verá as opções:
   - **Dashboard**
   - **Campaigns**
   - **Templates**
   - **History**
   - **Settings**
   - **Analytics** ← AQUI!

---

### **Método 2: URL Direta**

Copie e cole no navegador:

```
https://offer.mylocalinvest.com/marketing/analytics
```

---

### **Método 3: Admin → Notes Button**

1. Acesse: `https://offer.mylocalinvest.com/admin`
2. Encontre uma propriedade
3. Click no botão **"Notes"** (📝)
4. Modal abre com analytics daquela propriedade

---

## 📱 Screenshots (O Que Você Verá)

### **Analytics Dashboard:**

```
┌─────────────────────────────────────────────┐
│  📊 Clicks Analytics Dashboard              │
├─────────────────────────────────────────────┤
│                                             │
│  📈 Total Clicks: 247                       │
│  📱 Top Source: SMS (156 clicks)            │
│  🏆 Top Campaign: Orlando Hot Leads         │
│  📡 Active Channels: 3                      │
│                                             │
├─────────────────────────────────────────────┤
│  Clicks by Source                           │
│  ████████████████░░░░░ SMS: 156            │
│  ██████████░░░░░░░░░░░ Email: 78           │
│  ████░░░░░░░░░░░░░░░░░ Call: 13            │
│                                             │
├─────────────────────────────────────────────┤
│  Recent Clicks                              │
│  🏠 123 Main St - 2 min ago (SMS)          │
│  🏠 456 Oak Ave - 5 min ago (Email)        │
│  🏠 789 Pine Rd - 8 min ago (SMS)          │
│  ...                                        │
└─────────────────────────────────────────────┘
```

---

### **Property Analytics Modal:**

```
┌─────────────────────────────────────────────┐
│  Property Analytics & Notes                 │
│  123 Main Street, Orlando, FL               │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Page Views: 12                          │
│  📞 Phone Clicks: 3                         │
│  📧 Email Clicks: 1                         │
│                                             │
├─────────────────────────────────────────────┤
│  Recent Activity                            │
│  • Page viewed (SMS) - 2 hours ago         │
│  • Phone clicked - 1 day ago               │
│  • Page viewed (Email) - 3 days ago        │
│                                             │
├─────────────────────────────────────────────┤
│  Communication History                      │
│  ✅ SMS sent - Jan 10, 2026                │
│  ✅ Email sent - Jan 08, 2026              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔍 Query SQL para Ver Direto no Banco

Se você quiser ver os dados diretamente no Supabase Dashboard:

```sql
-- Ver todos os cliques
SELECT
  pa.id,
  pa.event_type,
  pa.created_at,
  pa.user_agent,
  pa.referrer,
  p.address,
  p.city,
  p.owner_name
FROM property_analytics pa
JOIN properties p ON p.id = pa.property_id
ORDER BY pa.created_at DESC
LIMIT 100;

-- Ver cliques de uma propriedade específica
SELECT *
FROM property_analytics
WHERE property_id = 'ID_DA_PROPRIEDADE'
ORDER BY created_at DESC;

-- Contar cliques por tipo
SELECT
  event_type,
  COUNT(*) as total
FROM property_analytics
GROUP BY event_type
ORDER BY total DESC;

-- Cliques por dia
SELECT
  DATE(created_at) as date,
  COUNT(*) as clicks
FROM property_analytics
WHERE event_type = 'page_view'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🚀 Quick Links

| Descrição | URL |
|-----------|-----|
| **Analytics Dashboard** | `https://offer.mylocalinvest.com/marketing/analytics` |
| **Marketing Dashboard** | `https://offer.mylocalinvest.com/marketing` |
| **Admin (Property Analytics)** | `https://offer.mylocalinvest.com/admin` |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker` |
| **Supabase Analytics Table** | `https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor?table=property_analytics` |

---

## 📊 Tipos de Eventos Rastreados

| Evento | Quando Acontece |
|--------|----------------|
| `page_view` | Quando alguém abre o link da propriedade |
| `phone_click` | Quando clica no botão "Call" |
| `email_click` | Quando clica no botão "Email" |
| `whatsapp_click` | Quando clica no botão WhatsApp |
| `inquiry_submitted` | Quando envia formulário de interesse |

---

## 🎯 Exemplo Prático

**Cenário:** Você enviou SMS para 50 pessoas com links de propriedades.

**Como ver quem clicou:**

1. **Opção 1: Analytics Dashboard**
   ```
   https://offer.mylocalinvest.com/marketing/analytics
   ```
   - Filtre por "Last 7 days"
   - Veja gráfico "Clicks by Source" → SMS
   - Veja lista "Recent Clicks"

2. **Opção 2: Admin → Notes**
   - Acesse Admin
   - Para cada propriedade que enviou SMS
   - Click em "Notes"
   - Veja quantas visualizações teve

3. **Opção 3: Query SQL**
   ```sql
   SELECT
     p.address,
     p.owner_name,
     COUNT(*) as views
   FROM property_analytics pa
   JOIN properties p ON p.id = pa.property_id
   WHERE pa.event_type = 'page_view'
     AND pa.created_at >= NOW() - INTERVAL '7 days'
   GROUP BY p.address, p.owner_name
   ORDER BY views DESC;
   ```

---

## ✅ Resumo

**Para ver TODOS os cliques:**
```
https://offer.mylocalinvest.com/marketing/analytics
```

**Para ver cliques de UMA propriedade:**
```
https://offer.mylocalinvest.com/admin
→ Click "Notes" na propriedade
```

**Para ver dados brutos:**
```
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor?table=property_analytics
```

🎉 **Tudo está funcionando!** Os cliques são salvos automaticamente quando alguém acessa o link.
