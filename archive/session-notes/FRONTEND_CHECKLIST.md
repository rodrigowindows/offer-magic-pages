# 📋 Checklist de Revisão Frontend - Pré-Deploy

## 🔴 ERROS MAIS COMUNS NO LOVABLE

### 1. TypeError - Propriedades undefined/null
```typescript
// ❌ ERRO: Cannot read property 'X' of undefined
const filteredTags = prop.tags.filter(tag => tag.active)
const phoneNumber = contact.phone.number

// ✅ CORREÇÃO: Verificações null-safe
const filteredTags = (prop.tags || []).filter(tag => tag.active)
const filteredTags = Array.isArray(prop.tags) ? prop.tags.filter(tag => tag.active) : []
const phoneNumber = contact?.phone?.number || ''
```

### 2. Renderização de listas sem key
```typescript
// ❌ ERRO: Each child should have unique "key" prop
{items.map(item => (
  <div>{item.name}</div>
))}

// ✅ CORREÇÃO: Adicionar prop key única
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

{items.map((item, index) => (
  <div key={`${item.id}-${index}`}>{item.name}</div>
))}
```

### 3. Hooks condicionais (React Rules of Hooks)
```typescript
// ❌ ERRO: Hooks cannot be called conditionally
if (condition) {
  const [state, setState] = useState()
}

// ✅ CORREÇÃO: Hooks sempre no top level
const [state, setState] = useState()
if (condition) {
  // use state aqui
}
```

### 4. Imports incorretos/faltando
```typescript
// ❌ ERRO: Module not found
import { Component } from './wrong-path'
import Component from '@/components/component' // case errado

// ✅ VERIFICAR:
// - Paths corretos (@/ = src/)
// - Extensões (.tsx, .ts)
// - Case-sensitive (Component vs component)
// - Named imports vs default imports
```

### 5. Estados assíncronos e memory leaks
```typescript
// ❌ ERRO: Cannot update unmounted component
useEffect(() => {
  fetchData().then(data => setData(data))
}, [])

// ✅ CORREÇÃO: Cleanup function
useEffect(() => {
  let mounted = true

  fetchData().then(data => {
    if (mounted) setData(data)
  })

  return () => {
    mounted = false
  }
}, [])
```

### 6. Optional chaining e nullish coalescing
```typescript
// ❌ ERRO: Cannot read property
const total = data.summary.total_phones

// ✅ CORREÇÃO:
const total = data?.summary?.total_phones ?? 0
```

### 7. Array methods em valores não-array
```typescript
// ❌ ERRO: X.map is not a function
const items = data.items.map(...)

// ✅ CORREÇÃO:
const items = Array.isArray(data.items) ? data.items.map(...) : []
```

### 8. Event handlers sem bind ou arrow functions
```typescript
// ❌ PROBLEMA: 'this' undefined em class components
<button onClick={this.handleClick}>

// ✅ CORREÇÃO:
<button onClick={() => this.handleClick()}>
<button onClick={this.handleClick.bind(this)}>
// ou no constructor: this.handleClick = this.handleClick.bind(this)
```

---

## ✅ CHECKLIST DE TESTES PRÉ-DEPLOY

### 1. 🔍 CONSOLE ERRORS
- [ ] Abrir DevTools (F12) → Console
- [ ] Navegar por **TODAS** as páginas do app
- [ ] Clicar em **TODOS** os botões e ações
- [ ] Preencher e submeter formulários
- [ ] Verificar **0 erros vermelhos** no console
- [ ] Verificar **0 warnings críticos** (amarelos)

### 2. 🌐 NETWORK ERRORS
- [ ] DevTools → Network tab
- [ ] Verificar requests com status **4xx** (bad request, unauthorized)
- [ ] Verificar requests com status **5xx** (server errors)
- [ ] Testar com internet lenta (DevTools → throttling "Slow 3G")
- [ ] Verificar se há requests duplicados desnecessários
- [ ] Confirmar que APIs retornam dados corretos

### 3. 📦 ESTADOS VAZIOS E EDGE CASES
- [ ] Testar páginas **sem dados** (arrays vazios)
- [ ] Verificar **loading states** aparecem corretamente
- [ ] Verificar **mensagens de erro** são exibidas
- [ ] Testar com 1 item, 10 items, 100+ items
- [ ] Testar strings muito longas (overflow)
- [ ] Testar valores null/undefined

### 4. 📱 RESPONSIVIDADE
- [ ] Mobile pequeno (**320px** - iPhone SE)
- [ ] Mobile médio (**375px** - iPhone 12)
- [ ] Mobile grande (**414px** - iPhone Pro Max)
- [ ] Tablet (**768px** - iPad)
- [ ] Desktop (**1920px**)
- [ ] Verificar scroll horizontal (não deve ter)
- [ ] Verificar botões clicáveis em mobile

### 5. 📝 FORMULÁRIOS
- [ ] Submeter formulário **vazio** (verificar validação)
- [ ] Submeter com **dados inválidos** (email errado, phone errado)
- [ ] Verificar **feedback visual** de sucesso
- [ ] Verificar **feedback visual** de erro
- [ ] Testar campos obrigatórios
- [ ] Testar máscaras de input (phone, CPF, etc)
- [ ] Verificar loading/disabled durante submit

### 6. 🔐 AUTENTICAÇÃO E ROTAS PROTEGIDAS
- [ ] Login com **credenciais corretas**
- [ ] Login com **credenciais erradas**
- [ ] Logout e verificar **redirecionamento**
- [ ] Acessar **rota protegida sem login** (deve redirecionar)
- [ ] Verificar se token persiste após refresh
- [ ] Verificar timeout de sessão

### 7. ⚡ EDGE FUNCTIONS (SUPABASE)
- [ ] Verificar logs: `supabase functions logs <function-name>`
- [ ] Testar endpoints diretamente (Postman/curl)
- [ ] Verificar **CORS errors** no console
- [ ] Verificar **autorização** (Bearer token)
- [ ] Testar com dados inválidos
- [ ] Verificar timeout (funções lentas)

### 8. 🎨 UI/UX
- [ ] Verificar **contrast ratio** (acessibilidade)
- [ ] Testar navegação por **teclado** (Tab)
- [ ] Verificar **focus states** visíveis
- [ ] Testar com **screen reader** (básico)
- [ ] Verificar **tooltips** e mensagens de ajuda
- [ ] Verificar **animações** não estão quebradas

### 9. 🔄 PERFORMANCE
- [ ] Verificar **re-renders desnecessários** (React DevTools Profiler)
- [ ] Verificar **bundle size** (npm run build)
- [ ] Verificar **lazy loading** de imagens
- [ ] Verificar **code splitting** de rotas
- [ ] Testar **scroll performance** em listas longas

### 10. 📊 DADOS E INTEGRAÇÕES
- [ ] Skip Trace: carregar dados corretamente
- [ ] Filtros funcionando
- [ ] Paginação funcionando
- [ ] Ordenação funcionando
- [ ] Export de dados funcionando
- [ ] Import de dados funcionando

---

## 🛠️ PROMPT PARA PEDIR CORREÇÃO AO LOVABLE

```
Revise TODO o código do projeto e corrija os seguintes problemas:

1. **TypeError/undefined**: Adicione verificações null-safe usando optional chaining (?.) e nullish coalescing (??)
   - Procure por: .map(), .filter(), .find(), acessos a propriedades aninhadas

2. **Keys faltando**: Adicione prop "key" única em todos os .map() que renderizam JSX

3. **Memory leaks**: Adicione cleanup functions em useEffect com chamadas assíncronas

4. **Imports quebrados**: Verifique todos os imports (paths, case-sensitivity)

5. **Estados loading/error**: Garanta que toda chamada async tem estados de loading e error tratados

6. **Console.log esquecidos**: Remova todos os console.log de debug

7. **Type safety**: Adicione verificações de tipo (Array.isArray, typeof, etc)

**TESTE**: Navegue por cada página e garanta **0 erros no console**.

Arquivos críticos para revisar:
- src/pages/ImportProperties.tsx
- src/components/skip-trace/SkipTraceDataViewer.tsx
- src/hooks/useSkipTraceData.ts
- src/services/marketingService.ts
```

---

## 🚀 COMANDOS ÚTEIS

### Build e verificação local
```bash
# Build para produção
npm run build

# Preview da build
npm run preview

# Verificar bundle size
npm run build -- --report
```

### Supabase
```bash
# Ver logs de edge functions
supabase functions logs get-skip-trace-data --follow

# Testar edge function localmente
supabase functions serve

# Deploy de edge function
supabase functions deploy get-skip-trace-data
```

### Git
```bash
# Ver status
git status

# Commitar mudanças
git add .
git commit -m "fix: resolve frontend errors"

# Push
git push origin main
```

---

## 📝 TEMPLATE DE BUG REPORT

Quando encontrar um erro, documente assim:

```markdown
### 🐛 BUG: [Título curto do erro]

**Localização**: `src/path/to/file.tsx:linha`

**Erro**:
```
[Cole a mensagem de erro do console]
```

**Reprodução**:
1. Ir para página X
2. Clicar em botão Y
3. Ver erro Z

**Fix esperado**:
[Descreva a correção necessária]

**Prioridade**: 🔴 Alta / 🟡 Média / 🟢 Baixa
```

---

## ✨ PRÓXIMOS PASSOS

Após completar este checklist:

1. ✅ Fazer commit de todas as correções
2. ✅ Testar em ambiente de staging (se tiver)
3. ✅ Fazer deploy para produção
4. ✅ Testar em produção
5. ✅ Monitorar erros (Sentry, LogRocket, etc)

---

**Criado em**: 2026-01-10
**Versão**: 1.0
**Projeto**: Orlando - Step 5 - Outreach & Campaigns
