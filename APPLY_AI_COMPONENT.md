# 🤖 Como Aplicar o Componente com IA

## Mudança Necessária

Edite o arquivo: **`src/pages/ImportProperties.tsx`**

### Linha 12 - Mudar Import

**ANTES:**
```typescript
import ColumnMappingDialog, { ColumnMapping, DatabaseFieldKey } from "@/components/ColumnMappingDialog";
```

**DEPOIS:**
```typescript
import ColumnMappingDialogWithAI from "@/components/ColumnMappingDialogWithAI";
import { ColumnMapping, DatabaseFieldKey } from "@/components/ColumnMappingDialog";
```

### Linha 804 - Mudar Componente

**ANTES:**
```typescript
<ColumnMappingDialog
  csvHeaders={csvHeaders}
  onMappingChange={handleMappingChange}
  initialMappings={columnMappings}
/>
```

**DEPOIS:**
```typescript
<ColumnMappingDialogWithAI
  csvHeaders={csvHeaders}
  onMappingChange={handleMappingChange}
  initialMappings={columnMappings}
/>
```

## Pronto!

Agora você terá:
- ✅ Botão "Auto-Detectar com IA" 🤖 (roxo/azul)
- ✅ Botão "Auto-Detectar (Simples)" 💡 (tradicional)
- ✅ Mapeamento inteligente com Gemini
- ✅ Fallback automático se IA falhar

## Como Testar

1. Salvar as mudanças
2. Recarregar a página (F5)
3. Fazer upload do seu CSV
4. Ver os 2 botões na seção "Mapeamento de Colunas"
5. Clicar "Auto-Detectar com IA" ✨
6. Ver a mágica acontecer!

## Precisa de API Key?

Sim, para usar a IA:
1. Ir em Settings → Gemini AI Settings
2. Adicionar API key do Gemini (grátis em https://makersuite.google.com/app/apikey)
3. Salvar

**SEM API key?** Usa "Auto-Detectar (Simples)" que funciona offline!
