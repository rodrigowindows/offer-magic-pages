# A/B Testing Strategy - Lead Capture Optimization

## 🎯 Objetivo

Testar diferentes abordagens para maximizar conversão E qualidade de leads.

---

## 📊 Variantes para Testar

### **Variant A: Ultra-Simples (Como o Exemplo)**
**Filosofia:** Transparência total, sem barreiras

```
Hero
  ↓
"Your Cash Offer: $450,000" (visível imediatamente)
  ↓
[Accept This Offer] [I Have Questions]
  ↓
NENHUM form até clicarem em botão
```

**Pros:**
- ✅ Máxima transparência
- ✅ Zero fricção inicial
- ✅ Melhor experiência do usuário

**Cons:**
- ❌ Não captura leads que só "olham"
- ❌ Perde oportunidade de follow-up

**Quando usar:** Se você tem MUITO tráfego

---

### **Variant B: Email-First (Micro-Commitment)**
**Filosofia:** Troca justa - email por oferta exata

```
Hero
  ↓
"Cash Offer Ready: $4XX,XXX" (parcialmente visível)
  ↓
"Enter email to see exact amount"
Email: [_____] [Reveal Offer]
  ↓
"$450,000" + [Accept] [Questions]
```

**Pros:**
- ✅ Captura 75-80% dos visitantes
- ✅ Pode nutrir via email
- ✅ Baixa fricção (só email)

**Cons:**
- ❌ Pequena barreira inicial
- ❌ Alguns podem desistir

**Quando usar:** Equilíbrio ideal

---

### **Variant C: Social Proof First**
**Filosofia:** Construir confiança primeiro

```
Hero
  ↓
"Join 1,247 Orlando Homeowners Who Got Cash Offers"
  ↓
[5 Video Testimonials Carousel]
  ↓
"Your Cash Offer: $450,000"
  ↓
[Accept] [Questions]
```

**Pros:**
- ✅ Constrói credibilidade
- ✅ Reduz ceticismo
- ✅ Leads mais qualificados

**Cons:**
- ❌ Página mais longa
- ❌ Pode perder atenção

**Quando usar:** Leads céticos/desconfiados

---

### **Variant D: Video Personal**
**Filosofia:** Conexão humana

```
Hero
  ↓
[▶ Video: "Hi John, I reviewed your property..."]
  ↓
"Based on my analysis: $450,000"
  ↓
[Book 15-Min Call] → Calendly
```

**Pros:**
- ✅ Máxima confiança
- ✅ Leads altíssima qualidade
- ✅ Diferenciação competitiva

**Cons:**
- ❌ Precisa gravar vídeos
- ❌ Menor volume de conversão

**Quando usar:** Leads de alto valor

---

### **Variant E: Urgency/Scarcity**
**Filosofia:** FOMO (Fear of Missing Out)

```
Hero
  ↓
"⚡ URGENT: Offer Expires in 7 Days"
[Timer: 6d 23h 45m]
  ↓
"Your Cash Offer: $450,000"
  ↓
"Lock in this price now"
Email: [_____] [Secure My Offer]
```

**Pros:**
- ✅ Aumenta urgência
- ✅ Ação mais rápida
- ✅ Reduz procrastinação

**Cons:**
- ❌ Só funciona se real
- ❌ Pode parecer pushy

**Quando usar:** Ofertas com prazo real

---

## 🧪 Plano de Teste A/B

### **Fase 1: Teste Básico (2 semanas)**

**Grupo A (50%):** Ultra-Simples (mostra $450,000 direto)
**Grupo B (50%):** Email-First (esconde, pede email)

**Métricas:**
- Taxa de conversão (clicaram Accept/Questions)
- Qualidade de leads (quantos realmente interessados)
- Custo por lead

---

### **Fase 2: Vencedor vs Variantes (2 semanas)**

**Grupo A (33%):** Vencedor da Fase 1
**Grupo B (33%):** Social Proof
**Grupo C (33%):** Video Personal

---

### **Fase 3: Otimização (contínua)**

Testar elementos específicos:
- Cor dos botões
- Texto dos CTAs
- Posição dos elementos
- Comprimento da página

---

## 📈 Métricas para Rastrear

### **Funil Completo:**

```
100 visitantes
  ↓
  ├─ Variant A: 60 clicam "Accept" (60%)
  │    └─ 30 preenchem form (50%)
  │         └─ 10 realmente interessados (33%)
  │              = 10% conversão total
  │
  └─ Variant B: 75 dão email (75%)
       └─ 45 clicam "Interested" (60%)
            └─ 30 preenchem form (67%)
                 └─ 15 realmente interessados (50%)
                      = 15% conversão total
```

### **KPIs Principais:**

1. **Conversion Rate** - % que tomam ação
2. **Lead Quality Score** - Quão qualificados são
3. **Cost Per Lead** - Quanto custa cada lead
4. **Time to Close** - Quanto tempo até fechar venda
5. **Close Rate** - % que realmente vendem

### **Métricas Secundárias:**

- Bounce rate (saem imediatamente)
- Time on page (quanto tempo ficam)
- Scroll depth (até onde rolam)
- Button clicks (quais botões clicam)
- Form abandonment (começam mas não terminam)

---

## 🛠️ Implementação Técnica

### **1. Sistema de A/B Testing Simples**

```typescript
// src/utils/abTesting.ts

export type Variant = 'ultra-simple' | 'email-first' | 'social-proof' | 'video' | 'urgency';

export function getVariant(propertyId: string): Variant {
  // Get from localStorage or assign new
  const storageKey = `ab-variant-${propertyId}`;
  let variant = localStorage.getItem(storageKey) as Variant;

  if (!variant) {
    // Randomly assign variant (50/50 split for Phase 1)
    const random = Math.random();
    variant = random < 0.5 ? 'ultra-simple' : 'email-first';

    localStorage.setItem(storageKey, variant);

    // Track assignment
    trackEvent('ab_test_assigned', {
      property_id: propertyId,
      variant: variant,
      timestamp: new Date().toISOString(),
    });
  }

  return variant;
}

export function trackConversion(
  propertyId: string,
  variant: Variant,
  action: string,
  metadata?: any
) {
  // Track to database
  supabase.from('ab_test_events').insert({
    property_id: propertyId,
    variant: variant,
    action: action,
    metadata: metadata,
    timestamp: new Date().toISOString(),
  });
}
```

### **2. Componentes Condicionais**

```typescript
// src/pages/PropertyPage.tsx

export function PropertyPage({ property }) {
  const variant = getVariant(property.id);

  return (
    <div>
      <PropertyHero {...property} />

      {variant === 'ultra-simple' && (
        <UltraSimpleOffer property={property} />
      )}

      {variant === 'email-first' && (
        <EmailFirstOffer property={property} />
      )}

      {variant === 'social-proof' && (
        <SocialProofOffer property={property} />
      )}

      {/* ... outras variants ... */}
    </div>
  );
}
```

### **3. Tabela de Tracking**

```sql
CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  variant TEXT NOT NULL,
  action TEXT NOT NULL,
  -- 'page_view', 'email_submitted', 'offer_revealed',
  -- 'clicked_accept', 'clicked_questions', 'form_submitted'
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ab_test_variant ON ab_test_events(variant);
CREATE INDEX idx_ab_test_action ON ab_test_events(action);
CREATE INDEX idx_ab_test_timestamp ON ab_test_events(timestamp DESC);
```

### **4. Dashboard de Análise**

```sql
-- Conversão por variante
SELECT
  variant,
  COUNT(CASE WHEN action = 'page_view' THEN 1 END) as views,
  COUNT(CASE WHEN action = 'email_submitted' THEN 1 END) as emails,
  COUNT(CASE WHEN action = 'clicked_accept' THEN 1 END) as accepts,
  COUNT(CASE WHEN action = 'form_submitted' THEN 1 END) as submits,

  -- Taxas de conversão
  ROUND(
    COUNT(CASE WHEN action = 'email_submitted' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN action = 'page_view' THEN 1 END), 0) * 100,
    2
  ) as email_conversion_rate,

  ROUND(
    COUNT(CASE WHEN action = 'form_submitted' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN action = 'page_view' THEN 1 END), 0) * 100,
    2
  ) as final_conversion_rate

FROM ab_test_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY variant
ORDER BY final_conversion_rate DESC;
```

---

## 🎯 Recomendação Imediata

### **Comece com teste simples:**

**50% tráfego:** Ultra-Simples (mostra $450k direto)
**50% tráfego:** Email-First (pede email, depois mostra)

**Por quê?**
- ✅ Fácil de implementar
- ✅ Diferença clara para medir
- ✅ Aprende rápido (2 semanas)

### **O que esperar:**

| Variante | Conversão | Leads | Qualidade |
|----------|-----------|-------|-----------|
| **Ultra-Simples** | 40-50% | Menor volume | Altíssima |
| **Email-First** | 60-75% | Maior volume | Alta |

**Vencedor provável:** Email-First
- Mais leads no total
- Ainda alta qualidade
- Pode nutrir quem não converteu

---

## 💡 Elementos para Testar Depois

### **CTAs (Call-to-Actions):**
- ❌ "Submit Form" vs ✅ "Get My Offer"
- ❌ "Continue" vs ✅ "Yes, I'm Interested!"
- ❌ "Send" vs ✅ "Reveal My Cash Offer"

### **Cores dos Botões:**
- 🔵 Azul (confiável)
- 🟢 Verde (ação, positivo)
- 🟠 Laranja (urgência)
- 🔴 Vermelho (FOMO)

### **Prova Social:**
- Com vs sem depoimentos
- Números ("1,247 venderam") vs sem
- Fotos de clientes vs sem

### **Urgência:**
- Com timer vs sem
- "Oferta expira em X dias" vs sem prazo
- "3 pessoas vendo agora" vs nada

---

## 📊 Como Decidir o Vencedor

### **Significância Estatística:**

Precisa de pelo menos:
- 100 visitantes por variante
- Diferença > 10% entre variantes
- p-value < 0.05 (95% confiança)

**Calculadora:** https://www.optimizely.com/sample-size-calculator/

### **Não só conversão!**

Considere também:
- **Qualidade:** Quantos realmente fecham?
- **Velocidade:** Quão rápido fecham?
- **Valor:** Qual gera mais receita?

**Exemplo:**
- Variant A: 50 leads, 10% fecham = 5 vendas
- Variant B: 75 leads, 5% fecham = 3.75 vendas
- **Vencedor:** Variant A (mais vendas reais!)

---

## 🚀 Ação Imediata

Quer que eu crie:

**A)** Sistema completo de A/B testing?
- Código de atribuição de variantes
- Tracking de eventos
- Dashboard de análise
- **Tempo: 2-3 horas**

**B)** Só os 2 componentes principais para testar?
- UltraSimpleOffer.tsx
- EmailFirstOffer.tsx
- **Tempo: 30 minutos**

**C)** Documento com recomendações específicas baseadas no exemplo?
- **Tempo: 10 minutos**

Qual você quer? 🎯
