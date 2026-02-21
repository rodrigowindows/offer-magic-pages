# 📊 Como Funciona o Tracking de Cliques

## 🔗 Quando Alguém Clica no Link

**URL Exemplo:**
```
https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms
```

---

## 🎯 O Que Acontece (Passo a Passo)

### 1. **Link é Clicado** 📱
- Usuário recebe SMS/Email com link da propriedade
- Link contém `?src=sms` (ou `?src=email`, `?src=call`)

### 2. **Página Carrega** 🌐
- Arquivo: `src/pages/Property.tsx`
- Componente detecta parâmetros da URL
- Chama função `trackAnalytics()`

### 3. **Dados São Salvos em 2 Lugares** 💾

#### ✅ **Local 1: Tabela `property_analytics`**

**Tabela SQL:**
```sql
CREATE TABLE property_analytics (
  id UUID PRIMARY KEY,
  property_id UUID,           -- ID da propriedade
  event_type TEXT,            -- 'page_view', 'inquiry_submitted', 'phone_click', etc
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,            -- Browser/Device info
  referrer TEXT,              -- De onde veio
  device_type TEXT,           -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMP        -- Quando clicou
);
```

**Código que insere (Property.tsx linha 62-67):**
```typescript
await supabase.from('property_analytics').insert({
  property_id: propertyId,
  event_type: 'page_view',
  referrer: document.referrer || 'direct',
  user_agent: navigator.userAgent,
});
```

#### ✅ **Local 2: Edge Function `track-analytics`**

**Código que chama (Property.tsx linha 47-59):**
```typescript
await supabase.functions.invoke('track-analytics', {
  body: {
    propertyId,
    eventType: 'page_view',
    source: 'sms',              // ← Pego do ?src=sms
    campaign: 'default',
    utmSource: searchParams.get('utm_source'),
    utmMedium: searchParams.get('utm_medium'),
    utmCampaign: searchParams.get('utm_campaign'),
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent,
  },
});
```

**O que essa função faz:**
- Processa e enriquece os dados
- Pode salvar em outras tabelas (analytics agregadas)
- Pode disparar webhooks/notificações

---

## 📋 Tipos de Eventos Rastreados

### 1. **page_view** (Visualização da Página)
- Quando alguém abre o link da propriedade
- Automaticamente salvo quando página carrega

### 2. **inquiry_submitted** (Formulário Enviado)
- Quando usuário submete formulário de interesse

### 3. **phone_click** (Clique no Telefone)
- Quando usuário clica no botão "Call"

### 4. **email_click** (Clique no Email)
- Quando usuário clica no botão "Email"

### 5. **whatsapp_click** (Clique no WhatsApp)
- Quando usuário clica no botão WhatsApp

---

## 🔍 Como Ver os Dados Salvos

### **Opção 1: Query Supabase Dashboard**

```sql
SELECT
  pa.id,
  pa.event_type,
  pa.created_at,
  pa.user_agent,
  pa.referrer,
  p.address,
  p.owner_name
FROM property_analytics pa
JOIN properties p ON p.id = pa.property_id
WHERE pa.event_type = 'page_view'
ORDER BY pa.created_at DESC
LIMIT 100;
```

### **Opção 2: Ver no Dashboard da Aplicação**

1. Acesse: `https://offer.mylocalinvest.com/marketing`
2. Procure por "Clicks Analytics" ou "Property Analytics"
3. Veja gráficos e relatórios

### **Opção 3: API/Code**

```typescript
const { data } = await supabase
  .from('property_analytics')
  .select('*, properties(address, owner_name)')
  .eq('event_type', 'page_view')
  .order('created_at', { ascending: false })
  .limit(100);

console.log('Últimos cliques:', data);
```

---

## 📊 Exemplo de Dados Salvos

```json
{
  "id": "abc-123-def",
  "property_id": "prop-456",
  "event_type": "page_view",
  "ip_address": "192.168.1.1",
  "country": "United States",
  "city": "Orlando",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
  "referrer": "direct",
  "device_type": "mobile",
  "created_at": "2026-01-13T23:15:00.000Z"
}
```

---

## 🎯 Parâmetros da URL Reconhecidos

| Parâmetro | Exemplo | Descrição |
|-----------|---------|-----------|
| `src` | `?src=sms` | Fonte do clique (sms, email, call) |
| `source` | `?source=facebook` | Fonte alternativa |
| `campaign` | `?campaign=january-promo` | Nome da campanha |
| `utm_source` | `?utm_source=newsletter` | UTM Source (Google Analytics) |
| `utm_medium` | `?utm_medium=email` | UTM Medium |
| `utm_campaign` | `?utm_campaign=black-friday` | UTM Campaign |

**URL Completa:**
```
https://offer.mylocalinvest.com/property/5528-long-lake-dr-orlando?src=sms&campaign=orlando-hot-leads&utm_source=twilio&utm_medium=sms&utm_campaign=january-2026
```

---

## 🔗 Integração com Retell AI

Quando o webhook do Retell AI é chamado, você pode cruzar os dados:

```typescript
// No retell-webhook-handler
const fromNumber = call.from_number;

// Buscar cliques recentes desse número
const { data: recentClicks } = await supabase
  .from('property_analytics')
  .select('*, properties(address)')
  .eq('user_agent', fromNumber) // ou outro campo de identificação
  .order('created_at', { ascending: false })
  .limit(10);

// Retornar no webhook
return {
  property_info: {...},
  recent_clicks: recentClicks,
  engagement_score: recentClicks.length // Quantas vezes viu
};
```

---

## 🚀 Como Melhorar o Tracking

### **1. Adicionar Source ao Link da Campanha**

No código de geração de links (ex: CampaignManager), adicione parâmetros:

```typescript
const propertyUrl = `https://offer.mylocalinvest.com/property/${property.slug}?src=sms&campaign=${campaignName}&contact=${phoneNumber}`;
```

### **2. Salvar Informação do Contato**

Adicione campo `contact_identifier` na tabela:

```sql
ALTER TABLE property_analytics
ADD COLUMN contact_identifier TEXT;
```

E no código:

```typescript
await supabase.from('property_analytics').insert({
  property_id: propertyId,
  event_type: 'page_view',
  contact_identifier: searchParams.get('contact'), // Número de telefone
  referrer: document.referrer || 'direct',
});
```

### **3. Disparar Notificações em Tempo Real**

Adicione ao `trackAnalytics`:

```typescript
// Enviar notificação para dashboard
await supabase.from('notifications').insert({
  type: 'property_view',
  message: `${property.owner_name} acabou de ver a oferta!`,
  property_id: propertyId,
});
```

---

## 📈 Dashboards Disponíveis

### **1. ClicksAnalytics.tsx**
- Gráficos de cliques por fonte (SMS/Email/Call)
- Top propriedades mais vistas
- Timeline de cliques

### **2. CampaignPerformanceDashboard.tsx**
- Performance por campanha
- Taxa de abertura
- Taxa de clique

### **3. PropertyAnalytics.tsx**
- Analytics por propriedade específica
- Histórico de visualizações
- Engajamento

---

## ✅ Resumo

**Quando clicam no link:**
1. ✅ Dados salvos em `property_analytics` (banco de dados)
2. ✅ Enviados para Edge Function `track-analytics`
3. ✅ Parâmetros da URL (`?src=sms`) são capturados
4. ✅ Informações do device/browser são salvas
5. ✅ Timestamp exato é registrado

**Para ver os dados:**
- Dashboard: `https://offer.mylocalinvest.com/marketing`
- Supabase: `https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker`
- SQL Query: `SELECT * FROM property_analytics ORDER BY created_at DESC`

🎉 **Tudo já está funcionando!** Os cliques estão sendo salvos automaticamente.
