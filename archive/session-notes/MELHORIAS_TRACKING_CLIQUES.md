# 🎯 Melhorias no Sistema de Tracking de Cliques

## ✅ O Que Foi Implementado

### 1. **Novos Campos na Tabela `property_analytics`**

Agora a tabela salva muito mais informações sobre quem clicou:

```sql
-- Campos novos:
- source TEXT              -- 'sms', 'email', 'call', 'direct'
- campaign_name TEXT       -- Nome da campanha
- contact_phone TEXT       -- Telefone de quem clicou
- contact_email TEXT       -- Email de quem clicou
- contact_name TEXT        -- Nome de quem clicou
- property_address TEXT    -- Endereço da propriedade
- utm_source TEXT          -- UTM source
- utm_medium TEXT          -- UTM medium
- utm_campaign TEXT        -- UTM campaign
```

### 2. **Tracking Automático de IP e Localização**

Quando alguém clica no link, o sistema automaticamente:
- ✅ Detecta o IP do visitante
- ✅ Identifica cidade e país (via ipapi.co)
- ✅ Detecta tipo de device (mobile/tablet/desktop)

### 3. **Dashboard Melhorado**

O Analytics Dashboard agora mostra:
- 👤 **Quem clicou** (nome, telefone, email)
- 📍 **De onde clicou** (cidade, país, IP)
- 📱 **Como clicou** (device type)
- 🏠 **Qual propriedade** (endereço completo)
- 📋 **Qual campanha** (nome da campanha)
- 🎯 **Source** (sms, email, call)

---

## 📋 Como Usar as Novas Features

### **Formato do Link Melhorado**

**Antes (básico):**
```
https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms
```

**Agora (completo com tracking):**
```
https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms&campaign=orlando-hot-leads&phone=+14075551234&name=John%20Smith
```

### **Parâmetros Disponíveis**

| Parâmetro | Abreviação | Descrição | Exemplo |
|-----------|------------|-----------|---------|
| `src` | - | Fonte do clique | `sms`, `email`, `call` |
| `campaign` | `c` | Nome da campanha | `orlando-hot-leads` |
| `phone` | `p` | Telefone do contato | `+14075551234` |
| `email` | `e` | Email do contato | `john@example.com` |
| `name` | `n` | Nome do contato | `John Smith` |
| `utm_source` | - | UTM Source | `newsletter` |
| `utm_medium` | - | UTM Medium | `email` |
| `utm_campaign` | - | UTM Campaign | `january-2026` |

---

## 🚀 Como Usar no Código

### **Opção 1: Usar a função melhorada**

```typescript
import { generatePropertyOfferLink } from '@/lib/trackingLinks';

const propertyUrl = generatePropertyOfferLink('5528-long-lake-dr-orlando', {
  src: 'sms',
  campaign: 'Orlando Hot Leads',
  phone: '+14075551234',
  name: 'John Smith',
  email: 'john@example.com'
});

// Resultado:
// https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms&campaign=Orlando+Hot+Leads&phone=%2B14075551234&name=John+Smith&email=john%40example.com
```

### **Opção 2: Construir manualmente**

```typescript
const propertySlug = '5528-long-lake-dr-orlando';
const contactPhone = '+14075551234';
const contactName = 'John Smith';
const campaignName = 'Orlando Hot Leads';

const url = `https://offer.mylocalinvest.com/property/${propertySlug}?src=sms&campaign=${encodeURIComponent(campaignName)}&phone=${encodeURIComponent(contactPhone)}&name=${encodeURIComponent(contactName)}`;
```

---

## 📊 O Que Você Vê no Dashboard

### **Antes:**
```
Recent Clicks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 page_view • desktop
   Unknown location • 1/13/2026, 6:15:22 PM
   from: Https://Offer.Mylocalinvest.Com/Admin
```

### **Agora (com novos dados):**
```
Recent Clicks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 John Smith
   📞 +14075551234  📧 john@example.com
   🏠 5528 Long Lake Dr, Orlando, FL

   [sms] [📋 Orlando Hot Leads] [page_view] [📱 mobile]

   📍 Miami, United States  🌐 192.168.1.1  🕐 1/13/2026, 6:15:22 PM

   UTM: Source: twilio • Medium: sms • Campaign: january-2026
```

---

## 🔧 Aplicar a Migration

Para ativar os novos campos no banco de dados:

### **Opção 1: Via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker
2. SQL Editor
3. Cole o conteúdo de `supabase/migrations/20260114_enhance_property_analytics.sql`
4. Run

### **Opção 2: Via Supabase CLI**

```bash
cd "Step 5 - Outreach & Campaigns"
supabase db push
```

### **Opção 3: Via Git (Lovable faz deploy automático)**

```bash
git add .
git commit -m "feat: Enhanced click tracking with contact info and geolocation"
git push origin main
```

Aguarde 2-3 minutos e o Lovable aplica automaticamente!

---

## 📝 Exemplo de Dados Salvos

```json
{
  "id": "abc-123",
  "property_id": "prop-456",
  "event_type": "page_view",
  "source": "sms",
  "campaign_name": "Orlando Hot Leads",
  "contact_phone": "+14075551234",
  "contact_email": "john@example.com",
  "contact_name": "John Smith",
  "property_address": "5528 Long Lake Dr, Orlando, FL",
  "utm_source": "twilio",
  "utm_medium": "sms",
  "utm_campaign": "january-2026",
  "ip_address": "192.168.1.1",
  "city": "Miami",
  "country": "United States",
  "device_type": "mobile",
  "user_agent": "Mozilla/5.0 (iPhone...)",
  "referrer": "direct",
  "created_at": "2026-01-13T18:15:22.000Z"
}
```

---

## 🎯 Como Atualizar Suas Campanhas

### **No CampaignManager.tsx:**

Quando gerar o link da propriedade para enviar por SMS/Email:

```typescript
// Antes
const propertyUrl = `https://offer.mylocalinvest.com/property/${property.slug}?src=sms`;

// Agora
import { generatePropertyOfferLink } from '@/lib/trackingLinks';

const propertyUrl = generatePropertyOfferLink(property.slug, {
  src: 'sms',
  campaign: campaignName,
  phone: property.owner_phone || property.phone1,
  email: property.owner_email || property.email1,
  name: property.owner_name
});
```

---

## ✅ Checklist de Implementação

- [x] Migration criada (`20260114_enhance_property_analytics.sql`)
- [x] Property.tsx atualizado para capturar novos parâmetros
- [x] Property.tsx integrado com ipapi.co para geolocalização
- [x] ClicksAnalytics.tsx melhorado para mostrar todas as informações
- [x] trackingLinks.ts atualizado com função melhorada
- [ ] Aplicar migration no banco de dados
- [ ] Atualizar CampaignManager para usar novos parâmetros
- [ ] Testar com link completo
- [ ] Verificar dados no dashboard

---

## 🧪 Como Testar

### **1. Aplicar a migration**
```bash
# No Supabase Dashboard → SQL Editor
# Cole e execute: supabase/migrations/20260114_enhance_property_analytics.sql
```

### **2. Criar um link de teste**
```
https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms&campaign=test-campaign&phone=+14075551234&name=John%20Smith&email=john@test.com
```

### **3. Clicar no link**
- Abra o link em uma aba anônima

### **4. Verificar o Analytics Dashboard**
```
https://offer.mylocalinvest.com/marketing/analytics
```

Você deve ver:
- ✅ Nome: John Smith
- ✅ Telefone: +14075551234
- ✅ Email: john@test.com
- ✅ Source: sms
- ✅ Campaign: test-campaign
- ✅ IP e localização detectados automaticamente

---

## 📈 Benefícios

### **Antes:**
- Não sabia quem clicou
- Não sabia de onde veio
- Não sabia qual campanha gerou o clique
- Apenas via "direct" ou URL completa

### **Agora:**
- ✅ Sabe exatamente quem clicou (nome, telefone, email)
- ✅ Sabe de onde clicou (cidade, país, IP)
- ✅ Sabe qual campanha gerou o clique
- ✅ Sabe o device usado (mobile/tablet/desktop)
- ✅ Pode correlacionar com Retell AI (pelo telefone)
- ✅ Pode fazer retargeting (tem email e telefone)

---

## 🔗 Integração com Retell AI

Quando o webhook do Retell AI receber uma chamada, você pode cruzar com os cliques:

```typescript
// No retell-webhook-handler
const fromNumber = call.from_number;

// Buscar cliques recentes desse número
const { data: recentClicks } = await supabase
  .from('property_analytics')
  .select('*, properties(address)')
  .eq('contact_phone', fromNumber)
  .order('created_at', { ascending: false })
  .limit(10);

// Agora você sabe:
// - Quais propriedades a pessoa viu
// - Quando viu (timestamp)
// - De onde viu (localização)
// - Qual campanha levou à visualização
```

---

## 🎉 Pronto!

Agora você tem um sistema completo de tracking que mostra:
- 👤 Quem clicou
- 📍 De onde clicou
- 📱 Como clicou
- 🏠 O que viu
- 📋 Qual campanha
- 🎯 Source (SMS/Email/Call)

Tudo salvo automaticamente e visível no dashboard! 🚀
