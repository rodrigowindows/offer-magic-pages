# 🚀 Quick Start - Feature Toggles

## Como Usar em 3 Passos

### 1️⃣ Acesse o Painel
```
Admin → Feature Toggles
```

### 2️⃣ Escolha um Preset
Clique em qualquer card:

- **🎨 Full Features** - Versão atual completa
- **⭐ Legacy (Jan 8)** - Database columns (RECOMENDADO para produção)
- **💎 Modern UI** - Visual moderno com gradientes
- **⚡ Minimal** - Apenas essencial

### 3️⃣ Veja as Mudanças
- Badges aparecem no Campaign Wizard
- Features ativam/desativam instantaneamente
- Configuração salva automaticamente

---

## 🎯 Principais Diferenças

### 📦 Tags Mode (Atual)
```typescript
// Armazena assim:
tags: ['pref_phone:+1234567890', 'pref_email:john@example.com']

// ✅ Flexível
// ❌ Mais lento
```

### 🗄️ Database Mode (Legacy - Recomendado)
```typescript
// Armazena assim:
preferred_phones: ['+1234567890']
preferred_emails: ['john@example.com']

// ✅ Muito mais rápido
// ✅ Queries SQL diretas
// ✅ Type-safe
```

**Para mudar:** Admin → Feature Toggles → "Legacy" preset

---

## 🔥 Recursos Principais

### Ative/Desative:
- ⚡ **Batch Processing** - Envios em lotes de 5
- 🔄 **Auto-Retry** - Retry automático
- 💰 **Cost Estimates** - Estimativa de custos
- 📱 **QR Codes** - Geração de QR codes
- 🔗 **UTM Tracking** - Parâmetros UTM
- 🎨 **Modern UI** - Gradientes e animações

### Indicadores Visuais:
No Campaign Wizard, você vê:
```
🎨 Full | 📦 Tags
⚡ Batch | 🔄 Retry | 💰 Costs | 📱 QR | 🔗 UTM
```

---

## 💾 Backup & Restore

### Export:
```
Feature Toggles → Export → Salva JSON
```

### Import:
```
Feature Toggles → Import → Carrega JSON
```

### Reset:
```
Feature Toggles → Reset → Volta ao padrão
```

---

## 🧪 Teste Recomendado

1. Vá para **Feature Toggles**
2. Clique em **"Legacy (Jan 8)"**
3. Vá para **Campaign Wizard**
4. Note: Badge mostra **"⭐ Legacy | 🗄️ DB"**
5. Compare performance vs versão atual

---

## 📊 Monitoramento

O painel mostra:
- ✅ **23 features** disponíveis
- 📈 Contador de features ativas
- 🎯 Preset atual (Full/Legacy/Modern/Minimal/Custom)
- 🔴🟡🟢 Impact levels

---

## ⚡ Atalhos

| Ação | Como |
|------|------|
| Versão Produção | Preset "Legacy" |
| Versão Bonita | Preset "Modern" |
| Versão Rápida | Preset "Minimal" |
| Todas Features | Preset "Full" |
| Customizar | Tab "Detailed Control" |

---

## 🆘 Troubleshooting

**Features não aplicam?**
→ Recarregue a página (F5)

**Perdeu configurações?**
→ Clique no preset desejado

**Quer código anterior?**
→ Use preset "Legacy" ou "Modern"

---

## 📞 Dicas

✅ **DO:**
- Use "Legacy" para produção
- Export suas configurações
- Teste cada preset

❌ **DON'T:**
- Não misture muitas flags custom
- Não esqueça de exportar antes de testar
- Não use "Minimal" em produção

---

**Pronto para usar! 🎉**

Próximo passo: Admin → Feature Toggles → Clique em "Legacy"
