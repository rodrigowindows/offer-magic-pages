# Sistema de Comunicação de Marketing - Documentação Completa

## 📋 Visão Geral

Sistema frontend completo para envio de comunicados de marketing multicanal (SMS, Email e Ligações Telefônicas) para proprietários de imóveis.

**Base URL da API:** `https://marketing.workfaraway.com`

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas Criada

```
src/
├── types/
│   └── marketing.types.ts          ✅ CRIADO - Todos os tipos TypeScript
├── services/
│   ├── api.ts                      ✅ CRIADO - Configuração do Axios
│   └── marketingService.ts         ✅ CRIADO - Serviços da API de marketing
├── store/
│   └── marketingStore.ts           ✅ CRIADO - Zustand store (estado global)
├── hooks/
│   ├── useMarketing.ts             ✅ CRIADO - Hook principal de marketing
│   ├── useTemplates.ts             ✅ CRIADO - Gerenciamento de templates
│   └── useBatchUpload.ts           ✅ CRIADO - Upload em lote (CSV/JSON)
├── utils/
│   ├── validators.ts               ✅ CRIADO - Validações com Zod
│   └── formatters.ts               ✅ CRIADO - Formatação de dados
├── components/
│   ├── marketing/
│   │   ├── Step1RecipientInfo.tsx  ✅ CRIADO - Informações do destinatário
│   │   ├── Step2ChannelsConfig.tsx ⚠️ CRIAR - Seleção de canais e config
│   │   ├── Step3MessageCustom.tsx  ⚠️ CRIAR - Personalização de mensagens
│   │   ├── Step4Confirmation.tsx   ⚠️ CRIAR - Confirmação e envio
│   │   ├── Dashboard.tsx           ⚠️ CRIAR - Dashboard principal
│   │   ├── History.tsx             ⚠️ CRIAR - Histórico de envios
│   │   ├── Settings.tsx            ⚠️ CRIAR - Configurações
│   │   └── WizardLayout.tsx        ⚠️ CRIAR - Layout do wizard
│   └── ui/                         ✅ JÁ EXISTE - Componentes shadcn/ui
└── App.tsx / MarketingApp.tsx      ⚠️ CRIAR - App principal com rotas
```

---

## 📦 Dependências Adicionadas

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "papaparse": "^5.4.1",
    "react-dropzone": "^14.2.3",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.11"
  }
}
```

**Comando para instalar:**
```bash
npm install
```

---

## 🎯 Fluxo do Usuário

### 1. Dashboard (Tela Inicial)
- Estatísticas de envios (24h/7d/30d)
- Health check da API (verde/vermelho)
- Botões de ação rápida
- Gráficos de performance por canal

### 2. Wizard de Envio (4 Passos)

#### PASSO 1: Informações do Destinatário ✅
**Arquivo:** `Step1RecipientInfo.tsx` (CRIADO)

**Funcionalidades:**
- Modo Individual: Formulário com validação
- Modo Batch: Upload de CSV/JSON com drag & drop
- Validação em tempo real
- Preview de telefone formatado
- Download de template CSV

**Campos:**
- name (obrigatório)
- phone_number (10 dígitos, obrigatório)
- email (formato válido, obrigatório)
- address (obrigatório)
- seller_name (opcional)

#### PASSO 2: Seleção de Canais e Configurações
**Arquivo:** `Step2ChannelsConfig.tsx` (CRIAR)

**Estrutura:**
```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function Step2ChannelsConfig() {
  const store = useMarketingStore();

  // Seção 1: Seleção de Canais
  // - Checkboxes para SMS, Email, Call
  // - Validação: pelo menos 1 selecionado

  // Seção 2: Configurações de Empresa
  // - Inputs com valores padrão de store.settings.company
  // - Editáveis: company_name, contact_phone, contact_phone_alt, etc.

  // Seção 3: Configurações de IA (LLM)
  // - Toggle: use_llm
  // - Select: llm_model (mistral, llama, gpt-4)
  // - Select: llm_prompt_style (persuasive, friendly, professional, casual)
  // - Number: llm_max_words_voicemail (10-100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Selection & Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Implementar UI */}
      </CardContent>
    </Card>
  );
}
```

**Funções do Store a usar:**
- `store.toggleChannel(channel)`
- `store.setCompanyConfig(config)`
- `store.setLLMConfig(config)`

#### PASSO 3: Personalização de Mensagens
**Arquivo:** `Step3MessageCustomization.tsx` (CRIAR)

**Estrutura por Canal:**

**SMS:**
- Toggle: Template Padrão / Personalizado
- Preview em tempo real com substituição de variáveis
- Variáveis suportadas: {name}, {address}, {contact_phone}, {company_name}, {city}

**Email:**
- Toggle: Template Padrão / Personalizado
- Subject input
- Rich text editor (ou Textarea com HTML)
- Upload de imagem (PNG, JPG, JPEG, GIF)
- Preview formatado

**Call (Voicemail):**
- Radio buttons: Template 1 / Template 2 / Random
- Textarea para voicemail personalizado
- Preview com substituição de variáveis

**Implementação:**
```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMessagePreview } from '@/services/marketingService';
import { DEFAULT_SMS_TEMPLATE, DEFAULT_EMAIL_BODY, DEFAULT_VOICEMAIL_TEMPLATE_1 } from '@/types/marketing.types';

export function Step3MessageCustomization() {
  const store = useMarketingStore();
  const { wizard } = store;

  // Para cada canal selecionado, mostrar seção de customização
  // Usar generateMessagePreview() para preview em tempo real

  return (
    <Tabs defaultValue="sms">
      {wizard.selectedChannels.includes('sms') && (
        <TabsContent value="sms">
          {/* UI de customização de SMS */}
        </TabsContent>
      )}
      {/* Repetir para email e call */}
    </Tabs>
  );
}
```

**Funções do Store:**
- `store.setCustomMessage(channel, message)`

#### PASSO 4: Confirmação e Envio
**Arquivo:** `Step4Confirmation.tsx` (CRIAR)

**Funcionalidades:**
- Resumo de todas as informações
- Preview de todas as mensagens que serão enviadas
- Estimativa de tempo (batch)
- Botão de envio com loading state
- Progress bar para batch

**Implementação:**
```tsx
import { useMarketing } from '@/hooks/useMarketing';
import { estimateBatchTime } from '@/utils/formatters';

export function Step4Confirmation() {
  const { sendFromWizard, isSending, batchProgress } = useMarketing();
  const store = useMarketingStore();

  const handleSend = async () => {
    try {
      await sendFromWizard();
      // Redirecionar para histórico
      // Resetar wizard
    } catch (error) {
      // Exibir erro
    }
  };

  return (
    <Card>
      {/* Resumo */}
      {/* Preview */}
      {/* Botão de envio */}
      {isSending && <Progress value={(batchProgress.current / batchProgress.total) * 100} />}
    </Card>
  );
}
```

---

## 🎨 Componentes Principais

### Dashboard
**Arquivo:** `Dashboard.tsx` (CRIAR)

```tsx
import { useEffect } from 'react';
import { useMarketing } from '@/hooks/useMarketing';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export function Dashboard() {
  const { performHealthCheck, apiHealthy } = useMarketing();
  const store = useMarketingStore();

  useEffect(() => {
    performHealthCheck();
    // Carregar stats
  }, []);

  return (
    <div className="space-y-6">
      {/* Health Check Badge */}
      <div className="flex items-center gap-2">
        {apiHealthy ? (
          <CheckCircle2 className="text-green-500" />
        ) : (
          <XCircle className="text-red-500" />
        )}
        <span>API Status: {apiHealthy ? 'Healthy' : 'Unhealthy'}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>SMS Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{store.stats?.sms.total || 0}</p>
          </CardContent>
        </Card>
        {/* Repetir para Email e Call */}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => navigate('/send')}>
          Send Communication
        </Button>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          Settings
        </Button>
      </div>
    </div>
  );
}
```

### History (Histórico)
**Arquivo:** `History.tsx` (CRIAR)

**Funcionalidades:**
- Tabela com todos os envios
- Filtros: canal, status, busca
- Detalhes expandíveis
- Exportar CSV/JSON
- Reenviar comunicado

```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatChannel } from '@/utils/formatters';

export function History() {
  const history = useMarketingStore((state) => state.history);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDateTime(item.timestamp)}</TableCell>
                <TableCell>{item.recipient.name}</TableCell>
                <TableCell>
                  {item.channels.map((ch) => (
                    <Badge key={ch} variant="secondary" className="mr-1">
                      {formatChannel(ch)}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'sent' ? 'default' : 'destructive'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {/* Botões de ação */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Settings (Configurações)
**Arquivo:** `Settings.tsx` (CRIAR)

**Seções:**
1. Company Settings (editar defaults)
2. API Configuration (URLs)
3. Template Management (CRUD)
4. LLM Preferences

```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Settings() {
  const store = useMarketingStore();
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplates();

  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="llm">AI Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        {/* Form para editar store.settings.company */}
      </TabsContent>

      {/* Outros tabs */}
    </Tabs>
  );
}
```

---

## 🔄 Rotas e Navegação

### MarketingApp.tsx (CRIAR)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/components/marketing/Dashboard';
import { WizardLayout } from '@/components/marketing/WizardLayout';
import { History } from '@/components/marketing/History';
import { Settings } from '@/components/marketing/Settings';
import { Toaster } from 'sonner';

export function MarketingApp() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          {/* Navbar com links */}
        </nav>

        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<WizardLayout />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}
```

### WizardLayout.tsx (CRIAR)

```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Step1RecipientInfo } from './Step1RecipientInfo';
import { Step2ChannelsConfig } from './Step2ChannelsConfig';
import { Step3MessageCustomization } from './Step3MessageCustomization';
import { Step4Confirmation } from './Step4Confirmation';
import { Progress } from '@/components/ui/progress';

export function WizardLayout() {
  const currentStep = useMarketingStore((state) => state.wizard.currentStep);

  const steps = [
    { number: 1, title: 'Recipient Info', component: Step1RecipientInfo },
    { number: 2, title: 'Channels & Config', component: Step2ChannelsConfig },
    { number: 3, title: 'Messages', component: Step3MessageCustomization },
    { number: 4, title: 'Confirm & Send', component: Step4Confirmation },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.number} className={`flex-1 ${step.number < steps.length ? 'border-r' : ''}`}>
            <div className={`text-center ${step.number === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className="font-bold">{step.number}</div>
              <div className="text-sm">{step.title}</div>
            </div>
          </div>
        ))}
      </div>

      <Progress value={(currentStep / steps.length) * 100} />

      {/* Current Step */}
      <CurrentStepComponent />
    </div>
  );
}
```

---

## 🎨 Integrando ao App Existente

### Opção 1: Rota separada

Adicionar ao `App.tsx` existente:

```tsx
import { MarketingApp } from '@/components/marketing/MarketingApp';

// No Routes:
<Route path="/marketing/*" element={<MarketingApp />} />
```

### Opção 2: Integração completa

Modificar a navegação principal para incluir o marketing system.

---

## 🧪 Testando o Sistema

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar dev server
```bash
npm run dev
```

### 3. Fluxo de teste
1. Acessar `/marketing` ou `/`
2. Ver Dashboard com health check
3. Clicar em "Send Communication"
4. Preencher formulário ou fazer upload CSV
5. Selecionar canais
6. Customizar mensagens
7. Confirmar e enviar
8. Ver resultado no histórico

---

## 📊 Endpoints da API

### Health Check
```
GET /health
Response: { "status": "healthy", "service": "marketing-communication" }
```

### Enviar Comunicado Completo
```
POST /start
Body: CommunicationPayload (ver marketing.types.ts)
Response: CommunicationResponse
```

### Enviar SMS Individual
```
POST /send_sms
Body: { phone_number, body }
```

### Enviar Email Individual
```
POST /send_email
Body: { receiver_email, subject, message_body, image? }
Content-Type: multipart/form-data (se houver imagem)
```

### Iniciar Chamada
```
POST /initiate_call
Body: { name, address, from_number, to_number, voicemail_drop, seller_name }
```

---

## 🔐 Variáveis de Template

Todas as mensagens suportam as seguintes variáveis:

- `{name}` - Nome do destinatário
- `{address}` - Endereço da propriedade
- `{seller_name}` - Nome do vendedor/agente
- `{company_name}` - Nome da empresa
- `{contact_phone}` - Telefone de contato principal
- `{contact_phone_alt}` - Telefone alternativo
- `{city}` - Cidade
- `{region}` - Região

**Substituição automática** via `generateMessagePreview()` do marketingService.

---

## 📝 Próximos Passos para Completar o Projeto

1. ✅ **Concluído:**
   - Tipos TypeScript
   - Serviços de API
   - Store Zustand
   - Hooks customizados
   - Utils (validadores e formatadores)
   - Step 1 do Wizard
   - Package.json atualizado

2. ⚠️ **Criar:**
   - Step2ChannelsConfig.tsx
   - Step3MessageCustomization.tsx
   - Step4Confirmation.tsx
   - Dashboard.tsx
   - History.tsx
   - Settings.tsx
   - WizardLayout.tsx
   - MarketingApp.tsx
   - Integração com App.tsx principal

3. 🎨 **Melhorias Opcionais:**
   - Tema escuro/claro
   - Animações de transição
   - Gráficos avançados (Recharts)
   - A/B Testing
   - Agendamento de envios
   - Webhooks para notificações

---

## 📚 Recursos e Referências

- **React Hook Form:** https://react-hook-form.com/
- **Zod:** https://zod.dev/
- **Zustand:** https://zustand-demo.pmnd.rs/
- **Shadcn/ui:** https://ui.shadcn.com/
- **Axios:** https://axios-http.com/
- **Papa Parse:** https://www.papaparse.com/
- **React Dropzone:** https://react-dropzone.js.org/

---

## 🐛 Troubleshooting

### Erro: "Module not found"
```bash
npm install
```

### CORS Error
Verificar se a API permite requisições do frontend.

### Validação não funciona
Verificar se os schemas Zod estão corretos em `validators.ts`.

### Store não persiste
Verificar localStorage no browser. Limpar storage se necessário:
```js
localStorage.removeItem('marketing-storage');
```

---

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente
Criar `.env`:
```
VITE_MARKETING_API_URL=https://marketing.workfaraway.com
VITE_LLM_API_URL=https://llm-api-url.com
```

---

## 📄 Licença

Projeto proprietário - Todos os direitos reservados.

---

**Desenvolvido com ❤️ para automação de marketing imobiliário**
