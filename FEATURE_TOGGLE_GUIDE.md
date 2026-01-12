# 🎛️ Feature Toggle System - Guia Completo

## 📋 Visão Geral

Sistema completo de Feature Toggles que permite **ativar/desativar funcionalidades** sem fazer commits ou deploys. Agora você pode testar diferentes versões do código instantaneamente!

## 🚀 Como Acessar

1. Faça login no sistema
2. Vá para **Admin → Feature Toggles** (aba no topo)
3. Você verá o painel de controle completo

## 🎯 Funcionalidades Disponíveis

### 📦 Quick Presets (Configurações Rápidas)

Clique em qualquer preset para aplicar instantaneamente:

#### 1. **Full Features** (Atual) 🔵
- Todas as funcionalidades ativadas
- Versão atual do código
- **Tags** para armazenar contatos
- UI moderna com gradientes

#### 2. **Legacy (Jan 8)** ⭐ RECOMENDADA
- Versão do commit `435bb94`
- Usa **colunas do banco** (`preferred_phones`, `preferred_emails`)
- Batch processing robusto
- Sistema de garantias e validação
- Mais estável e testado

#### 3. **Modern UI (Jan 8)** 💜
- Versão do commit `45f168a`
- UI com gradientes e animações
- Design moderno e atraente
- Experiência visual premium

#### 4. **Minimal** ⚪
- Apenas funcionalidades essenciais
- Interface simples
- Ideal para performance máxima

---

## 🔧 Controle Detalhado

Na aba **Detailed Control**, você pode ativar/desativar cada feature individualmente:

### 📞 Contact Management
- **Use Tags for Contacts** (HIGH IMPACT)
  - `true` = Armazena em tags (atual)
  - `false` = Usa colunas do banco (legacy - Jan 8)
- **Show Preferred Contacts Filter**
  - Mostra checkbox "Only with Preferred Contacts"
- **Enable Skip Tracing Data**
  - Usa campo `skip_tracing_data` para contatos extras

### 🚀 Campaign Wizard
- **Campaign Preview** (MEDIUM)
  - Mostra step de preview antes de enviar
- **Batch Processing** (HIGH)
  - Processa envios em lotes de 5 (mais confiável)
- **Cost Estimates** (LOW)
  - Mostra estimativa de custos
- **Auto-Retry Failed Sends** (HIGH)
  - Tenta novamente envios que falharam
- **Campaign Templates**
  - Mostra seletor de templates

### 🎨 UI/UX Design
- **Modern Gradients**
  - Gradientes e design moderno
- **Animations**
  - Transições animadas
- **Dark Mode** (experimental)
- **Metric Cards**
  - Cards de métricas no wizard
- **Compact View**
  - Layout compacto para propriedades

### ✨ Advanced Features
- **QR Code Generation** (MEDIUM)
  - Gera QR codes para páginas
- **URL Tracking (UTM)** (MEDIUM)
  - Parâmetros UTM para tracking
- **A/B Testing** (HIGH)
  - Features de A/B testing
- **Analytics Dashboard** (MEDIUM)
  - Dashboard de analytics

### 👁️ Data Display
- **Property Images**
  - Mostra imagens nas listas
- **Owner Information**
  - Exibe info do proprietário

### ⚡ Campaign Operations
- **Quick Campaign** (MEDIUM)
  - Dialog de campanha rápida
- **Scheduled Sends** (MEDIUM)
  - Agendamento de campanhas
- **Test Mode** (HIGH)
  - Modo de teste para campanhas

---

## 🎯 Impacto das Features

### 🔴 HIGH IMPACT
Mudanças significativas no comportamento do sistema:
- `useTagsForContacts` - Muda onde contatos são armazenados
- `enableBatchProcessing` - Muda como envios são processados
- `enableRetryLogic` - Adiciona retry automático
- `enableABTesting` - Ativa/desativa A/B testing completo
- `enableTestMode` - Modo de teste

### 🟡 MEDIUM IMPACT
Funcionalidades importantes mas não críticas:
- `enableCampaignPreview` - Step extra no wizard
- `enableQRCodes` - QR codes nos templates
- `enableURLTracking` - UTM tracking
- `showAnalyticsDashboard` - Dashboard de analytics

### 🟢 LOW IMPACT
Mudanças visuais ou não-críticas:
- `useModernGradients` - Design moderno
- `showAnimations` - Animações
- `showCostEstimates` - Estimativas de custo
- `showMetricCards` - Cards de métricas
- `enableCompactView` - Layout compacto

---

## 💾 Persistência e Backup

### Auto-Save
- Todas as mudanças são **salvas automaticamente** no localStorage
- Suas configurações persistem entre sessões

### Export/Import
1. **Export**: Clica em "Export" para salvar suas configurações em arquivo JSON
2. **Import**: Clica em "Import" para carregar configurações de arquivo

### Reset
- Botão "Reset" restaura para configurações padrão

---

## 🔄 Comparação: Tags vs Database Columns

### 📦 Tags Approach (Atual - `useTagsForContacts: true`)

**Como funciona:**
```typescript
// Armazena em tags:
tags: ['pref_phone:+1234567890', 'pref_email:john@example.com']

// Acessa assim:
const phones = tags
  .filter(t => t.startsWith('pref_phone:'))
  .map(t => t.replace('pref_phone:', ''));
```

**Prós:**
- Flexível - pode adicionar qualquer tipo de dado
- Não precisa migração de banco
- Fácil de adicionar novos tipos

**Contras:**
- Mais lento para filtrar
- Difícil de query no SQL
- Parsing em tempo real

---

### 🗄️ Database Columns (Legacy - `useTagsForContacts: false`)

**Como funciona:**
```typescript
// Armazena em colunas:
preferred_phones: ['+1234567890', '+0987654321']
preferred_emails: ['john@example.com']

// Acessa assim:
const phones = property.preferred_phones || [];
```

**Prós:**
- ⚡ Muito mais rápido
- ✅ Queries SQL diretas
- 🎯 Type-safe (TypeScript)
- 📊 Fácil de agregar/contar

**Contras:**
- Precisa colunas no banco
- Menos flexível

**Recomendação:** Se você tem as colunas `preferred_phones` e `preferred_emails` no banco, use Database Columns!

---

## 🎬 Indicadores Visuais

### No Campaign Wizard
No topo do Campaign Creator, você verá badges mostrando:

- **📦 Tags Mode** ou **🗄️ DB Mode** - Qual abordagem está ativa
- **⚡ Batch Processing** - Se batch está ativo
- **🔄 Auto-Retry** - Se retry automático está ativo
- **💰 Cost Estimates** - Se mostra custos
- **📱 QR Codes** - Se gera QR codes

### No Painel
- **Badge com contagem** - Mostra quantas features estão ativas
- **Cores de impacto:**
  - 🟢 Verde = Low impact
  - 🟡 Amarelo = Medium impact
  - 🔴 Vermelho = High impact

---

## 🧪 Testes Recomendados

### Teste 1: Comparar Performance de Contatos
1. Vá para Feature Toggles
2. Ative "Legacy (Jan 8)" preset
3. Vá para Campaign Wizard
4. Note a velocidade de carregamento
5. Volte e ative "Full Features"
6. Compare a performance

### Teste 2: Versões do UI
1. Ative "Minimal" preset
2. Veja interface simplificada
3. Ative "Modern UI" preset
4. Veja gradientes e animações
5. Escolha sua preferida!

### Teste 3: Features Específicas
1. Vá para "Detailed Control"
2. Desative "Campaign Preview"
3. Wizard terá 1 step a menos
4. Ative novamente
5. Preview volta

---

## 🆘 Troubleshooting

### Features não aplicam?
1. Recarregue a página (F5)
2. Limpe cache do browser
3. Verifique console para erros

### Perdeu configurações?
1. Use "Import" com arquivo de backup
2. Ou clique em preset desejado

### Quer versão específica do Git?
Cada preset corresponde a um commit:
- **Legacy (Jan 8)** = commit `435bb94`
- **Modern UI (Jan 8)** = commit `45f168a`
- **Full Features** = HEAD atual

Para restaurar código completo:
```bash
git checkout 435bb94 -- src/components/marketing/CampaignWizard.tsx
```

---

## 📊 Monitoramento

O painel mostra em tempo real:
- **Total de features**: 23 features disponíveis
- **Features ativas**: Contador dinâmico
- **Preset atual**: Badge visual

---

## 🎓 Casos de Uso

### CEO/Manager
- Use **Quick Presets** para alternar entre versões
- Teste "Modern UI" para apresentações
- Use "Minimal" para velocidade

### Developer
- Use **Detailed Control** para testar features específicas
- Export configurações de teste
- Debug com features isoladas

### QA/Testing
- Teste cada preset
- Documente bugs por configuração
- Use Export/Import para cenários

---

## 🔮 Futuro

Próximas features planejadas:
- [ ] Feature toggle por usuário (roles)
- [ ] Analytics de uso de features
- [ ] Rollout gradual (% usuários)
- [ ] Feature flags do Supabase

---

## ✅ Checklist de Uso

- [ ] Acessei Feature Toggles no Admin
- [ ] Testei cada preset rápido
- [ ] Comparei Tags vs DB mode
- [ ] Exportei minhas configurações
- [ ] Escolhi minha configuração ideal
- [ ] Compartilhei feedback

---

## 📞 Suporte

Dúvidas sobre Feature Toggles?
- Verifique os badges de impacto
- Teste em ambiente local primeiro
- Use Export antes de mudanças grandes
- Mantenha backup das configurações

**Divirta-se testando! 🎉**
