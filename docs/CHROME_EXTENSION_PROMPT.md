# Chrome Extension - Property Triage Assistant

## Prompt Completo para Desenvolvimento

Crie uma Chrome Extension chamada **"Offer Magic - Property Comp Grabber"** que se integra com o sistema web de triagem de propriedades em `https://offer.mylocalinvest.com/process`.

---

## 1. VISAO GERAL

A extensao ajuda investidores imobiliarios a fazer triagem de propriedades mais rapido. O sistema web (`offer.mylocalinvest.com`) mostra propriedades uma por uma para review. Quando o usuario precisa verificar a propriedade no Zillow, Redfin, Trulia ou Realtor.com, a extensao:

1. **DETECTA** que o usuario esta numa pagina de propriedade (Zillow, Redfin, etc.)
2. **EXTRAI** automaticamente os dados da pagina (preco, sqft, quartos, banheiros, foto, endereco)
3. **MOSTRA** um popup com os dados extraidos + botao "Adicionar como Comp"
4. **ENVIA** os dados diretamente para o Supabase como comp da propriedade que esta sendo avaliada no sistema web
5. **MOSTRA** o status da propriedade atual sendo avaliada no sistema (endereco, valor estimado, comps ja salvos)

---

## 2. ARQUITETURA DA EXTENSAO

```
chrome-extension/
├── manifest.json          # Manifest V3
├── popup/
│   ├── popup.html         # UI principal da extensao
│   ├── popup.css          # Estilos
│   └── popup.js           # Logica do popup
├── content-scripts/
│   ├── zillow.js          # Extrator para Zillow
│   ├── redfin.js          # Extrator para Redfin
│   ├── trulia.js          # Extrator para Trulia
│   ├── realtor.js         # Extrator para Realtor.com
│   └── offer-magic.js     # Content script para offer.mylocalinvest.com
├── background/
│   └── service-worker.js  # Background service worker
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── lib/
    └── supabase.js        # Cliente Supabase minimo
```

---

## 3. MANIFEST.JSON

```json
{
  "manifest_version": 3,
  "name": "Offer Magic - Property Comp Grabber",
  "version": "1.0.0",
  "description": "Extrai dados de propriedades do Zillow, Redfin, Trulia e Realtor.com e salva como comps no Offer Magic",
  "permissions": [
    "activeTab",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "https://www.zillow.com/*",
    "https://www.redfin.com/*",
    "https://www.trulia.com/*",
    "https://www.realtor.com/*",
    "https://offer.mylocalinvest.com/*",
    "https://atwdkhlyrffbaugkaker.supabase.co/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.zillow.com/homedetails/*"],
      "js": ["content-scripts/zillow.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.redfin.com/*/home/*", "https://www.redfin.com/*/*/*/*"],
      "js": ["content-scripts/redfin.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.trulia.com/p/*"],
      "js": ["content-scripts/trulia.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.realtor.com/realestateandhomes-detail/*"],
      "js": ["content-scripts/realtor.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://offer.mylocalinvest.com/*"],
      "js": ["content-scripts/offer-magic.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## 4. BACKEND - SUPABASE (ja existe)

### Credenciais
```
URL: https://atwdkhlyrffbaugkaker.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs
REST API: https://atwdkhlyrffbaugkaker.supabase.co/rest/v1/
```

### Headers para todas as requests
```
apikey: <ANON_KEY>
Authorization: Bearer <ACCESS_TOKEN_DO_USUARIO>
Content-Type: application/json
```

### Autenticacao
O usuario precisa fazer login na extensao. Usar Supabase Auth:
```
POST https://atwdkhlyrffbaugkaker.supabase.co/auth/v1/token?grant_type=password
Headers: { apikey: <ANON_KEY>, Content-Type: application/json }
Body: { email: "...", password: "..." }
Response: { access_token, refresh_token, user: { id, email, user_metadata: { full_name } } }
```

### Tabela: `properties` (LEITURA)
Buscar a propriedade atual sendo avaliada:
```
GET /rest/v1/properties?approval_status=is.null&order=created_at.asc&limit=1
-- OU se tiver batch selecionado:
GET /rest/v1/properties?approval_status=is.null&import_batch=eq.Orlando-2025-01-15&order=created_at.asc&limit=1

Campos retornados (select):
id, address, city, state, zip_code, estimated_value, cash_offer_amount, square_feet,
bedrooms, bathrooms, lot_size, property_type, year_built, approval_status, import_batch
```

### Tabela: `manual_comps_links` (LEITURA + ESCRITA)
Salvar comps extraidos:
```
POST /rest/v1/manual_comps_links
Body: {
  "property_id": "uuid-da-propriedade-sendo-avaliada",
  "property_address": "123 Main St, Orlando, FL 32801",
  "url": "https://www.zillow.com/homedetails/...",
  "source": "zillow",  // zillow | redfin | trulia | realtor | other
  "comp_data": {
    "sale_price": 250000,
    "square_feet": 1500,
    "lot_size": 5000,
    "bedrooms": 3,
    "bathrooms": 2,
    "sale_date": "2025-01-15",
    "address": "456 Oak Ave, Orlando, FL 32801"
  },
  "user_id": "uuid-do-usuario-logado"
}
```

Buscar comps ja salvos:
```
GET /rest/v1/manual_comps_links?property_id=eq.<UUID>&order=created_at.desc
Select: id, url, source, comp_data, created_at
```

### Tabela: `properties` (ESCRITA - Aprovar/Rejeitar)
```
PATCH /rest/v1/properties?id=eq.<UUID>

-- APROVAR:
{
  "approval_status": "approved",
  "approved_by": "uuid-do-usuario",
  "approved_by_name": "Nome do Usuario",
  "approved_at": "2025-02-20T15:30:00Z",
  "cash_offer_amount": 150000,
  "rejection_reason": null,
  "rejection_notes": null,
  "updated_by": "uuid-do-usuario",
  "updated_by_name": "Nome do Usuario"
}

-- REJEITAR:
{
  "approval_status": "rejected",
  "approved_by": "uuid-do-usuario",
  "approved_by_name": "Nome do Usuario",
  "approved_at": "2025-02-20T15:30:00Z",
  "rejection_reason": "too-good-condition",
  "rejection_notes": "Casa reformada recentemente",
  "updated_by": "uuid-do-usuario",
  "updated_by_name": "Nome do Usuario"
}
```

### Motivos de Rejeicao Validos
```
"new-construction"     → Casa Nova (menos de 20 anos)
"recent-sale"          → Recem Vendida (menos de 2 anos)
"too-good-condition"   → Casa em Bom Estado
"multi-family"         → Multi-Family
"hoa-restrictions"     → Propriedade com HOA
"land"                 → Terreno (Land)
"no-equity"            → Low-Equity
"agent-listed"         → Anunciada por Corretor
"commercial"           → Imovel Comercial
"duplicate"            → Duplicado
"wrong-location"       → Localizacao errada
"other"                → Outro motivo
```

---

## 5. CONTENT SCRIPTS - EXTRACAO DE DADOS

### 5A. Zillow (`content-scripts/zillow.js`)

Executar em: `https://www.zillow.com/homedetails/*`

**Dados para extrair do DOM:**

```javascript
// Preco de venda
// Seletor: [data-testid="price"] ou span que contem "$" dentro de .summary-container
// Exemplos de texto: "$250,000", "Sold: $250,000", "Zestimate: $260,000"
// Prioridade: Preco de venda real > Zestimate

// Endereco
// Seletor: h1[class*="Text-c11n"] ou [data-testid="bdp-header-address"]
// Exemplo: "123 Main St, Orlando, FL 32801"

// Quartos / Banheiros / Sqft
// Seletor: [data-testid="bed-bath-beyond"] spans ou .summary-container spans
// Formato tipico: "3 bd | 2 ba | 1,500 sqft"
// Tambem tentar: span[data-testid="property-beds"], span[data-testid="property-baths"], span[data-testid="property-sqft"]

// Lot Size
// Buscar no bloco de "Facts and features" ou "What's special"
// Texto tipico: "Lot size: 5,000 sqft" ou "0.12 Acres"

// Ano Construido
// Buscar "Year built: 1985" no bloco de facts

// Data de Venda (se vendida)
// Buscar "Sold on Jan 15, 2025" ou no historico de precos

// Foto principal
// Seletor: img dentro de [data-testid="hero-image"] ou .media-stream img:first-child

// IMPORTANTE: O Zillow carrega dados de forma assincrona (React).
// Usar MutationObserver ou retry com setTimeout para esperar o DOM carregar completamente.
// Tentar tambem extrair do __NEXT_DATA__ script tag (JSON com todos os dados):
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
  const data = JSON.parse(nextData.textContent);
  // Navegar em data.props.pageProps.componentProps.gdpClientCache
  // ou data.props.pageProps.initialReduxState
}
```

### 5B. Redfin (`content-scripts/redfin.js`)

Executar em: `https://www.redfin.com/*/home/*`

```javascript
// Preco
// Seletor: [data-rf-test-id="abp-price"] .statsValue ou .HomeMainStats .stat-block .value
// Texto: "$250,000"

// Endereco
// Seletor: .street-address ou [data-rf-test-id="abp-streetLine"]
// Mais: .dp-subtext (cidade, estado, cep)

// Quartos / Banheiros / Sqft
// Seletor: .HomeMainStats .stat-block
// Cada bloco tem .value e .label (ex: "3" + "Beds", "2" + "Baths", "1,500" + "Sq Ft")

// Lot Size
// Buscar na tabela de "Property Details" ou "Home Facts"
// Texto: "Lot Size: 5,000 Sq. Ft."

// Ano Construido
// Buscar "Year Built: 1985" na secao de detalhes

// Data de Venda
// Se vendida, aparece como "SOLD" + data

// IMPORTANTE: Redfin tambem usa React e carrega dados async.
// Tentar extrair de window.__reactServerState ou de script tags com JSON-LD:
const ldJson = document.querySelector('script[type="application/ld+json"]');
if (ldJson) {
  const data = JSON.parse(ldJson.textContent);
  // Schema.org RealEstateListing ou Product
}
```

### 5C. Trulia (`content-scripts/trulia.js`)

Executar em: `https://www.trulia.com/p/*`

```javascript
// Trulia pertence ao Zillow Group, estrutura similar
// Preco: [data-testid="home-details-summary-headline"] ou h3 com "$"
// Endereco: [data-testid="home-details-summary-address"]
// Bed/Bath/Sqft: [data-testid="home-details-summary-bedrooms"] etc.

// Tentar JSON-LD:
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach(s => {
  const data = JSON.parse(s.textContent);
  if (data['@type'] === 'SingleFamilyResidence' || data['@type'] === 'Product') {
    // Extrair dados
  }
});
```

### 5D. Realtor.com (`content-scripts/realtor.js`)

Executar em: `https://www.realtor.com/realestateandhomes-detail/*`

```javascript
// Preco: [data-testid="list-price"] ou .price-section
// Endereco: [data-testid="address-line1"], [data-testid="address-line2"]
// Bed/Bath/Sqft: [data-testid="property-meta-beds"], [data-testid="property-meta-baths"], [data-testid="property-meta-sqft"]

// Tentar __NEXT_DATA__:
const nextData = document.getElementById('__NEXT_DATA__');
if (nextData) {
  const data = JSON.parse(nextData.textContent);
  // data.props.pageProps.property
}
```

### 5E. Offer Magic Site (`content-scripts/offer-magic.js`)

Executar em: `https://offer.mylocalinvest.com/*`

Este content script **escuta** a pagina web e envia para a extensao:
- ID da propriedade sendo avaliada
- Endereco da propriedade
- Batch selecionado
- Dados da propriedade (estimated_value, sqft, etc.)

```javascript
// Escutar mudancas na pagina para detectar qual propriedade esta ativa
// Opcao 1: Interceptar o DOM e ler os dados do card
// Opcao 2: A pagina web envia um CustomEvent para a extensao:

// No codigo da web app (adicionar em ReviewQueue.tsx):
window.postMessage({
  type: 'OFFER_MAGIC_CURRENT_PROPERTY',
  payload: {
    id: currentProperty.id,
    address: currentProperty.address,
    city: currentProperty.city,
    state: currentProperty.state,
    zip_code: currentProperty.zip_code,
    estimated_value: currentProperty.estimated_value,
    square_feet: currentProperty.square_feet,
    bedrooms: currentProperty.bedrooms,
    bathrooms: currentProperty.bathrooms,
  }
}, '*');

// O content script escuta:
window.addEventListener('message', (event) => {
  if (event.data?.type === 'OFFER_MAGIC_CURRENT_PROPERTY') {
    chrome.runtime.sendMessage({
      action: 'SET_CURRENT_PROPERTY',
      property: event.data.payload
    });
  }
});
```

---

## 6. POPUP UI

### 6A. Tela de Login (se nao autenticado)

```
┌─────────────────────────────────┐
│  🏠 Offer Magic                │
│                                 │
│  Email:                         │
│  ┌─────────────────────────┐   │
│  │ rafael@email.com        │   │
│  └─────────────────────────┘   │
│                                 │
│  Senha:                         │
│  ┌─────────────────────────┐   │
│  │ ••••••••                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       ENTRAR            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 6B. Tela Principal (em pagina de propriedade - Zillow/Redfin/etc)

```
┌─────────────────────────────────┐
│  🏠 Offer Magic     [⚙️] [👤]  │
├─────────────────────────────────┤
│  PROPRIEDADE ATUAL (do sistema) │
│  📍 789 Pine St, Orlando, FL   │
│  Est: $180,000 | 1,200 sqft    │
│  Comps salvos: 2               │
├─────────────────────────────────┤
│  DADOS EXTRAIDOS DESTA PAGINA  │
│  ┌───────────────────────────┐ │
│  │ 🏷️ $250,000              │ │
│  │ 📐 1,500 sqft             │ │
│  │ 🛏️ 3 quartos | 🚿 2 ban │ │
│  │ 📍 456 Oak Ave, Orlando   │ │
│  │ 🏗️ Ano: 1985              │ │
│  │ 📅 Vendido: 15/01/2025   │ │
│  │ 📏 Lote: 5,000 sqft      │ │
│  └───────────────────────────┘ │
│                                 │
│  $/Sqft: $167                   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✅ ADICIONAR COMO COMP │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ❌ REJEITAR PROPRIEDADE│   │
│  └─────────────────────────┘   │
│                                 │
│  Motivo: [▼ Casa em Bom Estado]│
└─────────────────────────────────┘
```

### 6C. Tela Principal (em pagina qualquer - sem dados para extrair)

```
┌─────────────────────────────────┐
│  🏠 Offer Magic     [⚙️] [👤]  │
├─────────────────────────────────┤
│  PROPRIEDADE ATUAL              │
│  📍 789 Pine St, Orlando, FL   │
│  Est: $180,000 | 1,200 sqft    │
│  Comps: 2 salvos               │
│  ─────────────────────         │
│  ARV: $220,000 (avg $147/sqft) │
├─────────────────────────────────┤
│  ACOES RAPIDAS                  │
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │ ✅ APROV │ │ ❌ REJEI │     │
│  └──────────┘ └──────────┘     │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ▶️ PROXIMA PROPRIEDADE │   │
│  └─────────────────────────┘   │
│                                 │
│  [Abrir Zillow] [Abrir Maps]   │
│  [Abrir Redfin] [Abrir Trulia] │
└─────────────────────────────────┘
```

---

## 7. BACKGROUND SERVICE WORKER

```javascript
// background/service-worker.js

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs';

// Estado global da extensao
let currentProperty = null;  // Propriedade sendo avaliada no sistema
let currentUser = null;       // Usuario logado
let accessToken = null;       // Token de acesso Supabase

// ── AUTENTICACAO ────────────────────────────────

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.access_token) {
    accessToken = data.access_token;
    currentUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email,
    };
    // Salvar no chrome.storage
    await chrome.storage.local.set({
      access_token: accessToken,
      refresh_token: data.refresh_token,
      user: currentUser,
    });
    return { success: true, user: currentUser };
  }
  return { success: false, error: data.error_description || 'Login falhou' };
}

async function refreshToken() {
  const stored = await chrome.storage.local.get(['refresh_token']);
  if (!stored.refresh_token) return false;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: stored.refresh_token }),
  });
  const data = await res.json();
  if (data.access_token) {
    accessToken = data.access_token;
    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    return true;
  }
  return false;
}

// ── API HELPERS ─────────────────────────────────

function apiHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

// ── BUSCAR PROPRIEDADE ATUAL ────────────────────

async function fetchCurrentProperty(batch = null) {
  let url = `${SUPABASE_URL}/rest/v1/properties?or=(approval_status.is.null,approval_status.eq.pending)&order=created_at.asc&limit=1&select=id,address,city,state,zip_code,estimated_value,cash_offer_amount,square_feet,bedrooms,bathrooms,lot_size,property_type,year_built,import_batch,zillow_url,evaluation,lead_score`;

  if (batch && batch !== 'all') {
    url += `&import_batch=eq.${encodeURIComponent(batch)}`;
  }

  const res = await fetch(url, { headers: apiHeaders() });
  const data = await res.json();
  if (data.length > 0) {
    currentProperty = data[0];
    await chrome.storage.local.set({ current_property: currentProperty });
    return currentProperty;
  }
  return null;
}

// ── BUSCAR COMPS SALVOS ─────────────────────────

async function fetchComps(propertyId) {
  const url = `${SUPABASE_URL}/rest/v1/manual_comps_links?property_id=eq.${propertyId}&order=created_at.desc&select=id,url,source,comp_data,created_at`;
  const res = await fetch(url, { headers: apiHeaders() });
  return await res.json();
}

// ── SALVAR COMP ─────────────────────────────────

async function saveComp(compUrl, compData) {
  if (!currentProperty || !currentUser) return { success: false, error: 'Sem propriedade ativa ou usuario' };

  const addressStr = `${currentProperty.address}, ${currentProperty.city || ''}, ${currentProperty.state || ''} ${currentProperty.zip_code || ''}`;

  // Detectar source
  let source = 'other';
  if (compUrl.includes('zillow.com')) source = 'zillow';
  else if (compUrl.includes('redfin.com')) source = 'redfin';
  else if (compUrl.includes('trulia.com')) source = 'trulia';
  else if (compUrl.includes('realtor.com')) source = 'realtor';

  const res = await fetch(`${SUPABASE_URL}/rest/v1/manual_comps_links`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      property_id: currentProperty.id,
      property_address: addressStr,
      url: compUrl,
      source: source,
      comp_data: {
        sale_price: compData.price || null,
        square_feet: compData.sqft || null,
        lot_size: compData.lotSize || null,
        bedrooms: compData.bedrooms || null,
        bathrooms: compData.bathrooms || null,
        sale_date: compData.saleDate || null,
        address: compData.address || null,
      },
      user_id: currentUser.id,
    }),
  });

  if (res.ok) {
    return { success: true };
  }
  const err = await res.json();
  return { success: false, error: err.message };
}

// ── APROVAR PROPRIEDADE ─────────────────────────

async function approveProperty(cashOfferAmount = null) {
  if (!currentProperty || !currentUser) return { success: false };

  const body = {
    approval_status: 'approved',
    approved_by: currentUser.id,
    approved_by_name: currentUser.name,
    approved_at: new Date().toISOString(),
    rejection_reason: null,
    rejection_notes: null,
    updated_by: currentUser.id,
    updated_by_name: currentUser.name,
  };
  if (cashOfferAmount && cashOfferAmount > 0) {
    body.cash_offer_amount = cashOfferAmount;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${currentProperty.id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });

  if (res.ok) {
    // Buscar proxima propriedade automaticamente
    await fetchCurrentProperty(currentProperty.import_batch);
    return { success: true, nextProperty: currentProperty };
  }
  return { success: false };
}

// ── REJEITAR PROPRIEDADE ────────────────────────

async function rejectProperty(reason, notes = null) {
  if (!currentProperty || !currentUser) return { success: false };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${currentProperty.id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({
      approval_status: 'rejected',
      approved_by: currentUser.id,
      approved_by_name: currentUser.name,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
      rejection_notes: notes || null,
      updated_by: currentUser.id,
      updated_by_name: currentUser.name,
    }),
  });

  if (res.ok) {
    await fetchCurrentProperty(currentProperty.import_batch);
    return { success: true, nextProperty: currentProperty };
  }
  return { success: false };
}

// ── CALCULAR ARV ────────────────────────────────

function calculateARV(comps, subjectSqft) {
  const valid = comps.filter(c =>
    c.comp_data?.sale_price > 0 && c.comp_data?.square_feet > 0
  );
  if (valid.length === 0 || !subjectSqft) return null;

  const pricesPerSqft = valid.map(c => c.comp_data.sale_price / c.comp_data.square_feet);

  // Remover outliers se >= 4 comps (metodo IQR)
  let finalPrices = pricesPerSqft;
  if (pricesPerSqft.length >= 4) {
    const sorted = [...pricesPerSqft].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    finalPrices = pricesPerSqft.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
  }

  const avgPricePerSqft = finalPrices.reduce((s, v) => s + v, 0) / finalPrices.length;
  return {
    arv: Math.round(avgPricePerSqft * subjectSqft),
    avgPricePerSqft: Math.round(avgPricePerSqft),
    validComps: valid.length,
  };
}

// ── MESSAGE HANDLER ─────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handle = async () => {
    switch (msg.action) {
      case 'LOGIN':
        return await login(msg.email, msg.password);

      case 'GET_STATE':
        const stored = await chrome.storage.local.get(['user', 'access_token', 'current_property']);
        if (stored.access_token) accessToken = stored.access_token;
        if (stored.user) currentUser = stored.user;
        if (stored.current_property) currentProperty = stored.current_property;
        return { user: currentUser, property: currentProperty };

      case 'SET_CURRENT_PROPERTY':
        currentProperty = msg.property;
        await chrome.storage.local.set({ current_property: currentProperty });
        return { success: true };

      case 'FETCH_CURRENT_PROPERTY':
        return await fetchCurrentProperty(msg.batch);

      case 'FETCH_COMPS':
        return await fetchComps(msg.propertyId);

      case 'SAVE_COMP':
        return await saveComp(msg.url, msg.compData);

      case 'APPROVE':
        return await approveProperty(msg.cashOfferAmount);

      case 'REJECT':
        return await rejectProperty(msg.reason, msg.notes);

      case 'EXTRACTED_DATA':
        // Dados extraidos pelo content script - armazenar temporariamente
        await chrome.storage.local.set({ extracted_data: msg.data });
        // Atualizar badge da extensao
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
        return { success: true };

      case 'LOGOUT':
        accessToken = null;
        currentUser = null;
        await chrome.storage.local.clear();
        return { success: true };

      default:
        return { error: 'Acao desconhecida' };
    }
  };

  handle().then(sendResponse);
  return true; // Manter canal aberto para resposta async
});

// ── INICIALIZACAO ───────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(['access_token', 'refresh_token']);
  if (stored.access_token) {
    accessToken = stored.access_token;
    // Tentar refresh
    await refreshToken();
  }
});
```

---

## 8. FLUXO COMPLETO DO USUARIO

### Fluxo Normal de Triagem com a Extensao:

```
1. Usuario abre https://offer.mylocalinvest.com/process
   → Web app mostra propriedade #1: "789 Pine St, Orlando, FL"
   → Content script (offer-magic.js) envia dados para a extensao
   → Extensao armazena: currentProperty = { id, address, sqft, etc }

2. Usuario ve a propriedade no sistema web
   → Analisa: Year Built, Sqft, Bedrooms, Estimated Value, Tags (HOT/WARM/COLD)
   → Sistema sugere pre-negacao se aplicavel (Casa Nova, Terreno, Multi-Family)

3. DECISAO: Precisa de mais info?
   → SIM: Clica em "Zillow" ou "Redfin" no card (abre nova aba)
   → NAO: Decide direto (vai para passo 6)

4. Navega para Zillow/Redfin (nova aba)
   → Content script DETECTA pagina de propriedade
   → EXTRAI automaticamente: preco, sqft, quartos, banheiros, lote, ano, foto
   → Icone da extensao fica VERDE com "!" indicando dados disponiveis

5. Usuario abre o popup da extensao
   → Ve: "PROPRIEDADE ATUAL: 789 Pine St" (do sistema)
   → Ve: "DADOS EXTRAIDOS: $250,000 | 1,500 sqft | $167/sqft"
   → Clica: "ADICIONAR COMO COMP"
   → Extensao salva no Supabase via API
   → Pode repetir para 2-5 comps de propriedades similares vendidas

6. DECISAO FINAL:

   6A. APROVAR:
   → Se tem comps: extensao calcula ARV automaticamente
   → Mostra botoes rapidos: 60%, 65%, 70%, 75%, 80% do ARV
   → Usuario escolhe valor da oferta
   → Clica "APROVAR" → salva no Supabase
   → Extensao carrega PROXIMA propriedade automaticamente

   6B. REJEITAR:
   → Clica "REJEITAR" no popup
   → Seleciona motivo (dropdown com 12 opcoes)
   → Opcionalmente adiciona notas
   → Clica "CONFIRMAR REJEICAO"
   → Extensao carrega PROXIMA propriedade automaticamente

7. Repete do passo 2 para proxima propriedade
```

### Fluxo Rapido (sem sair do sistema web):

```
1. No sistema web, ve que a casa e claramente "boa demais" (foto bonita)
2. Abre popup da extensao
3. Clica "REJEITAR" → motivo: "Casa em Bom Estado"
4. Proxima propriedade carrega
5. Tempo total: ~5 segundos por propriedade rejeitada
```

### Fluxo com Comps:

```
1. No sistema web, ve casa com potencial (mau estado, boa area)
2. Clica "Zillow" no card → abre Zillow com endereco
3. No Zillow, busca "Recently Sold" na area
4. Abre 3-4 propriedades vendidas similares
5. Em cada uma, extensao extrai dados automaticamente
6. Abre popup → "ADICIONAR COMO COMP" em cada
7. Apos 3+ comps, popup mostra:
   - ARV calculado: $280,000
   - Oferta sugerida (70%): $196,000
8. Clica "APROVAR com $196,000"
9. Tempo total: ~3-5 minutos por propriedade aprovada
```

---

## 9. FLOATING BADGE (opcional - melhoria avancada)

Alem do popup, a extensao pode injetar um badge flutuante no canto da tela quando o usuario esta no Zillow/Redfin. Isso evita ter que abrir o popup:

```javascript
// Injetar no content script do Zillow/Redfin:
const badge = document.createElement('div');
badge.id = 'offer-magic-badge';
badge.innerHTML = `
  <div style="
    position: fixed; bottom: 20px; right: 20px; z-index: 99999;
    background: #1a1a2e; color: white; border-radius: 12px;
    padding: 12px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    font-family: system-ui; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  ">
    <span style="font-size: 18px;">🏠</span>
    <div>
      <div style="font-weight: bold; font-size: 11px; opacity: 0.7;">AVALIANDO</div>
      <div style="font-weight: bold;" id="om-badge-address">789 Pine St</div>
    </div>
    <button id="om-add-comp-btn" style="
      background: #22c55e; color: white; border: none; border-radius: 8px;
      padding: 8px 12px; font-weight: bold; cursor: pointer; margin-left: 8px;
    ">+ COMP</button>
  </div>
`;
document.body.appendChild(badge);

// Ao clicar no botao, extrai dados e salva direto
document.getElementById('om-add-comp-btn').addEventListener('click', async () => {
  const extractedData = extractPageData(); // Funcao do content script
  chrome.runtime.sendMessage({
    action: 'SAVE_COMP',
    url: window.location.href,
    compData: extractedData,
  }, (response) => {
    if (response.success) {
      // Feedback visual: botao fica verde com checkmark
      const btn = document.getElementById('om-add-comp-btn');
      btn.textContent = '✅ SALVO';
      btn.style.background = '#15803d';
      setTimeout(() => {
        btn.textContent = '+ COMP';
        btn.style.background = '#22c55e';
      }, 2000);
    }
  });
});
```

---

## 10. SINCRONIZACAO COM O SISTEMA WEB

Para manter a extensao sincronizada com o sistema web:

### Opcao A: PostMessage (recomendada)
Adicionar no codigo React (`ReviewQueue.tsx`):

```typescript
// Emitir evento quando a propriedade muda
useEffect(() => {
  if (currentProperty) {
    window.postMessage({
      type: 'OFFER_MAGIC_PROPERTY_CHANGED',
      payload: {
        id: currentProperty.id,
        address: currentProperty.address,
        city: currentProperty.city,
        state: currentProperty.state,
        zip_code: currentProperty.zip_code,
        estimated_value: currentProperty.estimated_value,
        cash_offer_amount: currentProperty.cash_offer_amount,
        square_feet: currentProperty.square_feet,
        bedrooms: currentProperty.bedrooms,
        bathrooms: currentProperty.bathrooms,
        lot_size: currentProperty.lot_size,
        year_built: currentProperty.year_built,
        property_type: currentProperty.property_type,
        zillow_url: currentProperty.zillow_url,
        evaluation: currentProperty.evaluation,
        import_batch: selectedBatch,
      }
    }, '*');
  }
}, [currentProperty]);
```

### Opcao B: Polling (sem alterar web app)
A extensao busca a propriedade atual via API a cada 5 segundos:
```javascript
setInterval(async () => {
  await fetchCurrentProperty(selectedBatch);
}, 5000);
```

---

## 11. ATALHOS DE TECLADO DA EXTENSAO

Registrar atalhos globais no `manifest.json`:

```json
{
  "commands": {
    "add-comp": {
      "suggested_key": {
        "default": "Alt+C"
      },
      "description": "Adicionar pagina atual como comp"
    },
    "reject-quick": {
      "suggested_key": {
        "default": "Alt+R"
      },
      "description": "Rejeitar propriedade atual"
    },
    "approve-quick": {
      "suggested_key": {
        "default": "Alt+A"
      },
      "description": "Aprovar propriedade atual"
    },
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+O"
      },
      "description": "Abrir popup da extensao"
    }
  }
}
```

---

## 12. RESUMO DAS TECNOLOGIAS

- **Manifest V3** (padrao atual do Chrome)
- **Vanilla JavaScript** (sem framework, extensoes devem ser leves)
- **Chrome Storage API** para persistencia local
- **Supabase REST API** para backend (nao precisa de SDK)
- **Content Scripts** para extrecao de dados do DOM
- **Service Worker** como background script (Manifest V3)
- **Popup HTML/CSS/JS** para interface do usuario

---

## 13. PRIORIDADE DE IMPLEMENTACAO

### Fase 1 - MVP (1-2 dias)
1. Login com Supabase
2. Popup mostrando propriedade atual
3. Content script para Zillow (extracao basica)
4. Botao "Adicionar como Comp" no popup
5. Botao "Rejeitar" com motivos

### Fase 2 - Completo (3-5 dias)
6. Content scripts para Redfin, Trulia, Realtor.com
7. Floating badge nas paginas de imoveis
8. Calculo de ARV automatico
9. Botao "Aprovar" com valor da oferta
10. Sincronizacao com o sistema web (postMessage)

### Fase 3 - Avancado (opcional)
11. Atalhos de teclado globais
12. Notificacoes quando outro usuario esta avaliando a mesma propriedade
13. Cache offline dos dados extraidos
14. Export de comps para CSV
