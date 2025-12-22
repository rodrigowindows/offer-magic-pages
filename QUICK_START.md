# 🚀 Guia de Instalação Rápida - Marketing System

## ⚡ Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
npm install
```

### 2. Copiar Componentes Restantes

Copie os códigos de `COMPLETE_COMPONENTS_PART2.md` e `COMPLETE_COMPONENTS_PART3.md` para criar:

**Ainda faltam criar (copiar dos guias):**
- `src/components/marketing/Step4Confirmation.tsx` → [COMPLETE_COMPONENTS_PART2.md](COMPLETE_COMPONENTS_PART2.md)
- `src/components/marketing/Dashboard.tsx` → [COMPLETE_COMPONENTS_PART2.md](COMPLETE_COMPONENTS_PART2.md)
- `src/components/marketing/History.tsx` → [COMPLETE_COMPONENTS_PART3.md](COMPLETE_COMPONENTS_PART3.md)
- `src/components/marketing/Settings.tsx` → [COMPLETE_COMPONENTS_PART3.md](COMPLETE_COMPONENTS_PART3.md)
- `src/components/marketing/MarketingApp.tsx` → [COMPLETE_COMPONENTS_PART3.md](COMPLETE_COMPONENTS_PART3.md) (Opção A)

### 3. Atualizar main.tsx

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MarketingApp } from '@/components/marketing/MarketingApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MarketingApp />
  </StrictMode>
);
```

### 4. Iniciar o Servidor

```bash
npm run dev
```

Acesse: `http://localhost:8080`

---

## ✅ Arquivos Já Criados (Prontos!)

- ✅ `src/types/marketing.types.ts` - Todos os tipos + test_mode
- ✅ `src/services/api.ts` - Axios configurado
- ✅ `src/services/marketingService.ts` - Serviços completos
- ✅ `src/store/marketingStore.ts` - Zustand store
- ✅ `src/utils/validators.ts` - Validações Zod
- ✅ `src/utils/formatters.ts` - Formatações
- ✅ `src/hooks/useMarketing.ts` - Hook principal
- ✅ `src/hooks/useTemplates.ts` - Templates
- ✅ `src/hooks/useBatchUpload.ts` - Upload CSV/JSON
- ✅ `src/components/marketing/TestModeToggle.tsx` - Toggle teste
- ✅ `src/components/marketing/Step1RecipientInfo.tsx` - Step 1 completo
- ✅ `src/components/marketing/Step2ChannelsConfig.tsx` - Step 2 completo
- ✅ `src/components/marketing/Step3MessageCustomization.tsx` - Step 3 completo
- ✅ `src/components/marketing/WizardLayout.tsx` - Layout wizard

---

## 📋 Checklist de Verificação

Após copiar todos os componentes, verifique:

- [ ] Todos os imports estão corretos
- [ ] Não há erros de TypeScript
- [ ] `npm run dev` inicia sem erros
- [ ] Dashboard carrega corretamente
- [ ] Test Mode toggle funciona
- [ ] Wizard completo funciona (4 steps)
- [ ] Histórico exibe dados
- [ ] Settings salva configurações

---

## 🧪 Teste Rápido do Sistema

### Teste 1: Envio Individual em Test Mode

1. Acesse Dashboard
2. Verifique que Test Mode está **ON** (laranja)
3. Clique em "Send Communication"
4. Preencha:
   - Name: `John Test`
   - Phone: `1234567890`
   - Email: `test@test.com`
   - Address: `123 Test St`
5. Clique "Next"
6. Selecione canais: **SMS, Email, Call**
7. Clique "Next"
8. Revise mensagens (preview)
9. Clique "Next"
10. Veja alerta **TEST MODE**
11. Clique "Send Test"
12. ✅ Toast deve mostrar: **"🧪 Test communication sent (simulated)!"**
13. Vá para History
14. ✅ Deve aparecer com badge **"Test"**

### Teste 2: Production Mode

1. Vá para Settings
2. Desative Test Mode (toggle OFF)
3. ✅ Alerta vermelho deve aparecer
4. Volte para Send
5. Preencha dados e complete wizard
6. ✅ Modal de confirmação deve aparecer
7. Cancele para não enviar de verdade

### Teste 3: Batch Upload

1. Crie arquivo `test.csv`:
```csv
name,phone_number,email,address
John Smith,1234567890,john@test.com,123 Main St
Jane Doe,0987654321,jane@test.com,456 Oak Ave
```

2. No Step 1, clique "Switch to Batch Mode"
3. Faça upload do CSV
4. ✅ Deve mostrar 2 recipients
5. Continue o wizard
6. ✅ Progress bar deve aparecer durante envio

---

## 🎯 Funcionalidades Principais

### Test Mode (Modo de Teste)
- **Default:** ON (seguro para desenvolvimento)
- **Toggle global:** Alterna entre test/production
- **Alertas visuais:** Laranja (test) / Vermelho (prod)
- **Toast diferenciado:** 🧪 para teste
- **Modal de confirmação:** Apenas em production
- **Badges no histórico:** Test / Prod

### Wizard de 4 Passos
1. **Recipient Info** - Individual ou Batch (CSV/JSON)
2. **Channels & Config** - SMS/Email/Call + Empresa + IA
3. **Messages** - Customização com preview em tempo real
4. **Confirmation** - Revisão completa + envio

### Dashboard
- Health check da API (verde/vermelho)
- Estatísticas por canal
- Test vs Production stats
- Atividade recente

### Histórico
- Filtros: canal, status, modo (test/prod)
- Busca por nome/email/telefone
- Export CSV
- Detalhes completos de cada envio

### Settings
- Configurações de empresa
- API endpoints
- Preferências de IA
- Templates salvos

---

## 🔧 Troubleshooting

### Erro: "Module not found"
```bash
npm install
```

### Erro: "Cannot find module '@/components/ui/...'"
Verifique que todos os componentes shadcn/ui estão instalados. O projeto já tem os necessários.

### API retorna erro
1. Verifique a URL: `https://marketing.workfaraway.com`
2. Teste health check: `GET /health`
3. Ative Test Mode para simular

### Histórico vazio
Normal em primeira execução. Envie algum comunicado primeiro.

### Test Mode não salva
Verifique localStorage do browser. Limpe se necessário:
```js
localStorage.removeItem('marketing-storage');
```

---

## 📚 Documentação Completa

- **[MARKETING_SYSTEM_README.md](MARKETING_SYSTEM_README.md)** - Documentação técnica
- **[ISSUES_AND_FIXES.md](ISSUES_AND_FIXES.md)** - Análise de fluxos e correções
- **[COMPLETE_COMPONENTS_GUIDE.md](COMPLETE_COMPONENTS_GUIDE.md)** - Componentes Part 1
- **[COMPLETE_COMPONENTS_PART2.md](COMPLETE_COMPONENTS_PART2.md)** - Componentes Part 2
- **[COMPLETE_COMPONENTS_PART3.md](COMPLETE_COMPONENTS_PART3.md)** - Componentes Part 3

---

## 🎊 Próximos Passos

Após validar que tudo funciona:

1. **Conectar à API real** - Trocar URL se necessário
2. **Adicionar autenticação** - Se API requer
3. **Customizar templates** - Ajustar mensagens padrão
4. **Deploy** - `npm run build`
5. **Monitorar** - Acompanhar estatísticas

---

## 💡 Dicas Úteis

- **Sempre teste em Test Mode primeiro**
- **Use batch upload para grandes volumes**
- **Salve templates personalizados**
- **Monitore histórico regularmente**
- **Export CSV para análise externa**
- **Ajuste configurações de IA conforme necessidade**

---

**Sistema pronto para uso! 🚀**
