# 🧪 Marketing Test Mode - Guia Completo

## 📋 Como Funciona o Test Mode

O **Test Mode** é um recurso de segurança que permite testar todo o sistema de marketing **SEM enviar comunicações reais**.

### Estados do Sistema

| Estado | Ícone | Cor | Comportamento |
|--------|-------|-----|---------------|
| **Test Mode ATIVO** | 🧪 | Laranja | Simula envios, NÃO envia SMS/Email/Calls reais |
| **Production Mode** | 🚀 | Verde | Envia SMS/Email/Calls REALMENTE aos destinatários |

---

## 🎯 Como Habilitar/Desabilitar Test Mode

### Método 1: Pelo Dashboard (Recomendado)

1. Acesse `/marketing` no navegador
2. No topo do dashboard, você verá o card **"Test Mode Configuration"**
3. Use o **Switch** (botão deslizante) para alternar:
   - **ON (direita)** = Test Mode ATIVO 🧪
   - **OFF (esquerda)** = Production Mode 🚀

### Método 2: Pela Página de Settings

1. Acesse `/marketing/settings`
2. Encontre a seção **"Test Mode"**
3. Alterne o switch

### Método 3: Programaticamente (localStorage)

Abra o Console do navegador (F12) e execute:

```javascript
// Ver estado atual
const state = JSON.parse(localStorage.getItem('marketing-storage'));
console.log('Test Mode:', state.state.settings.defaults.test_mode);

// Ativar Test Mode
const newState = JSON.parse(localStorage.getItem('marketing-storage'));
newState.state.settings.defaults.test_mode = true;
localStorage.setItem('marketing-storage', JSON.stringify(newState));
window.location.reload();

// Desativar Test Mode (CUIDADO!)
const newState = JSON.parse(localStorage.getItem('marketing-storage'));
newState.state.settings.defaults.test_mode = false;
localStorage.setItem('marketing-storage', JSON.stringify(newState));
window.location.reload();
```

---

## 🖥️ Console - Validação em Tempo Real

### Como Acessar o Console

1. Pressione **F12** (ou **Ctrl+Shift+I** / **Cmd+Option+I** no Mac)
2. Clique na aba **"Console"**

### Logs Que Você Verá

#### Ao Carregar o Dashboard:
```
🎯 Marketing Dashboard - Estado Atual:
  📊 Total de comunicações: 0
  🧪 Test Mode: ATIVO ✅
  ⚙️ Settings: {company: {...}, llm: {...}, api: {...}, defaults: {...}}
  📝 Histórico completo: []
```

#### Ao Alternar Test Mode:
```
🔧 Test Mode Toggle: ATIVANDO
  Modo anterior: false
  Modo novo: true
✅ Test Mode atualizado com sucesso!
  Estado atual: 🧪 TEST MODE (Safe)
✅ SAFE MODE: Comunicações serão apenas simuladas
```

#### Quando Desativar (Production):
```
🔧 Test Mode Toggle: DESATIVANDO
  Modo anterior: true
  Modo novo: false
✅ Test Mode atualizado com sucesso!
  Estado atual: 🚀 PRODUCTION MODE (Live)
⚠️ ATENÇÃO: PRODUCTION MODE ATIVO - Comunicações serão enviadas REALMENTE!
```

---

## 📊 Console Visual no Dashboard

Na parte inferior do Marketing Dashboard, você verá um card **"Sistema Console"** que mostra:

```
> Sistema Console

Test Mode:              🧪 ATIVO (Safe)  ou  🚀 DESATIVADO (Live)
Total Communications:   5
Test/Production Split:  3 test / 2 prod
Success Rate:           100%
API Endpoint:          https://marketing.workfaraway.com
```

Este console é atualizado **em tempo real** sempre que você:
- Alterna o Test Mode
- Envia uma nova comunicação
- Adiciona itens ao histórico

---

## ✅ Verificação de Validação

### Checklist Antes de Enviar Comunicação Real:

1. **Abra o Console (F12)** para ver logs em tempo real
2. **Verifique o Dashboard:**
   - Card superior deve estar **VERDE** (Production) ou **LARANJA** (Test)
   - Leia a descrição: "Communications will be sent LIVE" ou "simulated"
3. **Veja o Console Visual:**
   - "Test Mode: 🚀 DESATIVADO (Live)" = Vai enviar de verdade
   - "Test Mode: 🧪 ATIVO (Safe)" = Apenas simulação
4. **Envie teste primeiro:**
   - Deixe Test Mode ATIVO
   - Envie para você mesmo
   - Verifique histórico
5. **Somente depois desative Test Mode**

---

## 🔍 Exemplos Práticos

### Cenário 1: Teste Seguro (Recomendado)

```
1. Test Mode: ATIVO 🧪
2. Enviar comunicação para "João Silva"
3. Console mostra: "✅ Simulação enviada com sucesso"
4. Histórico mostra: "João Silva 🧪 Test"
5. Nenhum SMS/Email real foi enviado
```

### Cenário 2: Envio Real (Produção)

```
1. Test Mode: DESATIVADO 🚀
2. Console mostra: "⚠️ PRODUCTION MODE ATIVO"
3. Enviar comunicação para "João Silva"
4. API REALMENTE envia SMS/Email/Call
5. Histórico mostra: "João Silva" (sem 🧪)
6. Créditos são consumidos
```

---

## 🛡️ Segurança

### Padrão do Sistema:
- **Test Mode SEMPRE começa ATIVO** ao instalar
- Linha 130 de `marketingStore.ts`:
  ```typescript
  test_mode: true, // PADRÃO: Modo de teste ativado
  ```

### Proteções:
1. ✅ Alertas visuais claros (cores laranja/verde)
2. ✅ Console warnings ao desativar
3. ✅ Cards destacados no dashboard
4. ✅ Badge "🧪 Test" em comunicações simuladas
5. ✅ Estado persistido no localStorage (não perde ao recarregar)

---

## 🐛 Troubleshooting

### Test Mode não está mudando?

**Solução 1: Verificar localStorage**
```javascript
// Console
localStorage.getItem('marketing-storage')
// Se retornar null, o estado não foi persistido
```

**Solução 2: Limpar cache**
```javascript
localStorage.removeItem('marketing-storage');
window.location.reload();
```

**Solução 3: Hard refresh**
- Ctrl+Shift+R (Windows/Linux)
- Cmd+Shift+R (Mac)

### Console não mostra logs?

1. Certifique-se de estar na aba **Console** (não Elements/Network)
2. Verifique se "Preserve log" está marcado
3. Limpe o console (ícone 🚫) e recarregue a página

### Histórico não mostra se é Test ou Production?

Cada item do histórico tem a propriedade `test_mode`:
```javascript
// Console
const history = JSON.parse(localStorage.getItem('marketing-storage')).state.history;
console.table(history.map(h => ({
  name: h.recipient.name,
  test_mode: h.test_mode,
  status: h.status,
  channels: h.channels.join(', ')
})));
```

---

## 📖 Referências

- **Código fonte:** `src/components/marketing/TestModeToggle.tsx`
- **Store:** `src/store/marketingStore.ts` (linha 130)
- **Dashboard:** `src/components/marketing/Dashboard.tsx`
- **Types:** `src/types/marketing.types.ts`

---

## 🎓 Resumo Rápido

| Ação | Como Fazer |
|------|-----------|
| **Ver estado atual** | Dashboard → Card "Test Mode Configuration" |
| **Ativar Test Mode** | Switch para ON (🧪 laranja) |
| **Desativar Test Mode** | Switch para OFF (🚀 verde) + confirmar warning |
| **Ver logs detalhados** | F12 → Console |
| **Ver console visual** | Scroll até "Sistema Console" no Dashboard |
| **Resetar tudo** | `localStorage.removeItem('marketing-storage')` |

---

## ✨ Melhorias Implementadas

✅ **Console visual** no Dashboard (não precisa abrir F12)
✅ **Logs detalhados** em tempo real no DevTools Console
✅ **Switch destacado** com cores claras (laranja/verde)
✅ **Alertas** ao alternar modos
✅ **Estado persistido** no localStorage (não perde ao recarregar)
✅ **Badge 🧪** em comunicações de teste no histórico
✅ **Card de configuração** no topo do dashboard

**Tudo pronto para uso! 🚀**
