# 🏠 Orlando Real Estate Analysis Pipeline

Sistema completo de análise de propriedades, geração de ofertas e campanhas de marketing para investimento imobiliário em Orlando, FL.

## 🎯 Funcionalidades Principais

### ✅ Sistema de Importação CSV
- Upload em massa de propriedades via CSV
- Mapeamento automático e manual de colunas
- Criação dinâmica de campos no banco de dados
- Opção de skip para valores vazios
- Preview antes de importar
- Relatório detalhado de erros

### ✅ A/B Testing de Lead Capture
- Sistema completo de testes A/B para páginas de propriedades
- Múltiplas variantes (ultra-simple, email-first, progressive, etc.)
- Tracking automático de eventos e conversões
- Dashboard de analytics com métricas de funil
- Determinação automática de vencedor com significância estatística

### ✅ Marketing & Outreach
- Geração automática de ofertas de cash
- Análise de comparáveis de mercado
- Sistema de scoring de leads
- Campanhas de email/SMS
- Chatbot inteligente para proprietários

### ✅ Admin Dashboard
- Gestão de propriedades
- Visualização de leads
- Métricas e analytics
- Sistema de aprovação de ofertas

## 🚀 Quick Start

### Desenvolvimento Local

```bash
# Clonar repositório
git clone <YOUR_GIT_URL>
cd orlando-real-estate

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env com:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_key

# Rodar em desenvolvimento
npm run dev
```

### Deploy para Lovable

```bash
# Opção 1: Script automatizado
deploy.bat

# Opção 2: Manual
git add .
git commit -m "Your message"
git push origin master
```

Veja guia completo em [LOVABLE_DEPLOYMENT_GUIDE.md](LOVABLE_DEPLOYMENT_GUIDE.md)

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── CSVImporter.tsx              # Importador CSV com mapping
│   ├── ABTestWrapper.tsx            # Wrapper de A/B testing
│   ├── ABTestAnalytics.tsx          # Dashboard de analytics
│   ├── variants/                    # Variantes de teste A/B
│   ├── SimpleLeadCapture.tsx        # Captura simples de lead
│   ├── InterestCapture.tsx          # Captura de interesse
│   └── marketing/                   # Sistema de marketing
├── pages/
│   ├── Index.tsx                    # Página inicial
│   ├── Admin.tsx                    # Admin dashboard
│   ├── ImportProperties.tsx         # Página de importação
│   └── Property.tsx                 # Página de propriedade
├── utils/
│   ├── csvParser.ts                 # Parser CSV nativo
│   └── abTesting.ts                 # Lógica de A/B testing
└── integrations/
    └── supabase/                    # Cliente Supabase

supabase/
└── migrations/
    ├── 20260101000000_create_property_leads.sql
    ├── 20260101000001_simple_lead_flow.sql
    ├── 20260101000002_ab_testing.sql
    └── 20260102000000_csv_import_functions.sql
```

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais

- **properties** - Propriedades importadas
- **property_leads** - Leads capturados
- **ab_test_events** - Eventos de A/B testing
- **campaigns** - Campanhas de marketing
- **messages** - Mensagens enviadas

### Aplicar Migrations

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no Supabase Dashboard
# SQL Editor → New Query → Cole cada migration
```

## 📊 Guias e Documentação

- **[CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)** - Guia completo do importador CSV
- **[AB_TESTING_INTEGRATION_GUIDE.md](AB_TESTING_INTEGRATION_GUIDE.md)** - Guia de A/B testing
- **[LOVABLE_DEPLOYMENT_GUIDE.md](LOVABLE_DEPLOYMENT_GUIDE.md)** - Deploy para Lovable

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Query**: TanStack Query

## 🔑 Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🧪 A/B Testing

### Variantes Disponíveis

1. **ultra-simple** - Mostra oferta imediatamente (sem gate)
2. **email-first** - Pede email antes de revelar oferta
3. **progressive** - Revelação progressiva em etapas
4. **social-proof** - Foca em depoimentos e prova social
5. **urgency** - Usa gatilhos de urgência e escassez

### Configurar Teste

```typescript
// src/utils/abTesting.ts
export const AB_TEST_CONFIG = {
  enabled: true,
  variants: [
    { variant: 'ultra-simple', weight: 50, active: true },
    { variant: 'email-first', weight: 50, active: true },
  ],
};
```

## 📈 CSV Import

### Formato do CSV

```csv
Input Property Address,Input Property City,Input Property State,Input Property Zip,Owner First Name,Owner Last Name
5528 LONG LAKE RD,Orlando,FL,32810,TAYLOR,ROSE
1025 S WASHINGTON AVE,Orlando,FL,32703,DELLA,M
```

### Usar Importador

1. Ir para `/admin/import`
2. Upload do CSV
3. Mapear colunas (auto-detect ou manual)
4. Preview
5. Importar

Ver guia completo em [CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)

## 🚢 Deploy

### Lovable (Recomendado)

1. Push código para GitHub
2. Conectar repositório no Lovable
3. Configurar env vars
4. Deploy automático!

### Vercel/Netlify (Alternativa)

```bash
# Build
npm run build

# Output em dist/
```

## 🤝 Contribuindo

1. Fork o projeto
2. Criar branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abrir Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para dúvidas ou suporte:
- Abrir issue no GitHub
- Email: seu-email@example.com
- Documentação: Ver guias em `/docs`

---

**Desenvolvido com ❤️ para análise de propriedades em Orlando, FL**
