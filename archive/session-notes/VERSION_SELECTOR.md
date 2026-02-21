# 🕐 Versões Disponíveis do CampaignWizard.tsx

## Escolha qual versão deseja restaurar:

### **Opção 1** - Versão Atual (2026-01-11)
- **Commit**: `fedd9ef`
- **Data**: 2026-01-11
- **Descrição**: "Changes"
- **Características**:
  - Usa tags para preferred contacts (legacy approach)
  - Funções helper: getPreferredPhones, getPreferredEmails
  - Preview com currentPreviewIndex
  - Grid de propriedades com preview lateral

---

### **Opção 2** - Versão de 08/Jan (Recomendada)
- **Commit**: `435bb94`
- **Data**: 2026-01-08
- **Descrição**: "feat: Implement advanced campaign sending flow with guarantees"
- **Características**:
  - Fluxo avançado de envio de campanha
  - Sistema de garantias
  - Usa preferred_phones e preferred_emails direto da tabela
  - Sem funções helper de tags

---

### **Opção 3** - Versão 08/Jan (Enhanced UI)
- **Commit**: `45f168a`
- **Data**: 2026-01-08
- **Descrição**: "feat: Enhanced Campaign Creator UI with modern design and CampaignManager improvements"
- **Características**:
  - UI moderna aprimorada
  - Design melhorado
  - Melhorias no CampaignManager

---

### **Opção 4** - Versão 08/Jan (Template Links)
- **Commit**: `98875d1`
- **Data**: 2026-01-08
- **Descrição**: "feat: Enhance TemplateManager with offer links, QR codes, and tracking"
- **Características**:
  - Links de oferta nos templates
  - QR codes
  - Sistema de tracking

---

## 🎯 Comando para Restaurar

Depois de escolher, use um destes comandos:

### Restaurar Opção 2 (Recomendada):
```bash
git checkout 435bb94 -- src/components/marketing/CampaignWizard.tsx
```

### Restaurar Opção 3:
```bash
git checkout 45f168a -- src/components/marketing/CampaignWizard.tsx
```

### Restaurar Opção 4:
```bash
git checkout 98875d1 -- src/components/marketing/CampaignWizard.tsx
```

---

## 🔍 Ver Diferenças Antes de Restaurar

### Ver o que mudou entre Opção 2 e versão atual:
```bash
git diff 435bb94 HEAD -- src/components/marketing/CampaignWizard.tsx
```

### Ver o arquivo completo da Opção 2:
```bash
git show 435bb94:src/components/marketing/CampaignWizard.tsx
```

---

## ⚠️ Principais Diferenças da Versão Atual

A versão atual (fedd9ef) adicionou:
- ✅ Funções helper para extrair contacts de tags: `getPreferredPhones()`, `getPreferredEmails()`
- ✅ Suporte a `email1` field
- ✅ Preview lateral de propriedades (`currentPreviewIndex`)
- ✅ Layout de 2 colunas (grid + preview)

A versão 435bb94 (08/Jan) tinha:
- ✅ Acesso direto a `preferred_phones` e `preferred_emails` da tabela
- ✅ Código mais limpo sem funções helper
- ✅ Sistema de garantias de envio
- ✅ Skip tracing data integration

---

## 📋 Qual Escolher?

**Escolha Opção 2 (`435bb94`)** se você quer:
- Código mais simples e direto
- Sistema de garantias de envio
- Menos complexidade no código

**Mantenha Versão Atual** se você precisa:
- Compatibilidade com sistema de tags
- Preview lateral de propriedades
- Suporte ao campo email1

---

**Me diga qual opção você prefere e eu restauro para você!**
