# 🤖 Guia: Auto-Detect com IA (Gemini)

## ✨ O Que Foi Criado

Sistema de mapeamento inteligente de colunas CSV usando **Gemini AI**!

### Arquivos Criados

1. **`src/utils/aiColumnMapper.ts`** - Lógica de IA
2. **`src/components/ColumnMappingDialogWithAI.tsx`** - UI com botão de IA

## 🎯 Como Funciona

### Antes (String Matching)
```
"Input Property Address" → normaliza → "inputpropertyaddress" → procura dicionário → address ✓
"Dirección de la Propiedad" → normaliza → "direcciondelapropiedad" → não acha → '' ✗
```

### Agora (Com IA) 🤖
```
"Input Property Address" → Gemini AI analisa → address ✓
"Dirección de la Propiedad" → Gemini AI analisa → address ✓
"Owner's Full Legal Name" → Gemini AI analisa → owner_name ✓
"Qualquer Nome Maluco" → Gemini AI tenta adivinhar → melhor match possível ✓
```

## 🚀 Como Usar

### Passo 1: Configurar API Key do Gemini

1. Ir para https://makersuite.google.com/app/apikey
2. Criar API key (grátis!)
3. No admin, clicar em **Settings** → **Gemini AI Settings**
4. Colar a API key
5. Salvar

### Passo 2: Fazer Upload do CSV

1. Ir para `/admin/import`
2. Fazer upload do CSV
3. Ver a seção "Mapeamento de Colunas"

### Passo 3: Usar o Auto-Detect com IA

Você tem **3 opções**:

#### Opção 1: 🤖 Auto-Detectar com IA (Recomendado!)
- Botão roxo/azul com ícone ✨
- Usa Gemini AI para mapear
- Entende contexto e sinônimos
- Funciona com qualquer idioma
- Mais preciso!

#### Opção 2: 💡 Auto-Detectar (Simples)
- Botão com ícone de varinha mágica 🪄
- Usa string matching tradicional
- Mais rápido
- Sem necessidade de API key
- Funciona offline

#### Opção 3: ✋ Manual
- Mapear coluna por coluna manualmente
- Você escolhe cada campo
- Total controle

## 📊 Exemplo de Uso

### Seu CSV:
```csv
Input Property Address,Input Property City,Owner First Name,Owner Last Name
123 Main St,Orlando,John,Doe
```

### Clica "Auto-Detectar com IA" 🤖

**Status mostrado:**
1. "Conectando com Gemini AI..."
2. "Analisando colunas do CSV..."
3. "Processando sugestões da IA..."
4. "Mapeamento concluído!"

**Resultado:**
- ✅ `Input Property Address` → `address` (confidence: high)
- ✅ `Input Property City` → `city` (confidence: high)
- ✅ `Owner First Name` → `owner_name` (confidence: high)
- ✅ `Owner Last Name` → `owner_name` (confidence: high)

Toast aparece: **"✨ IA concluída! 4 colunas mapeadas com inteligência artificial"**

## 🎨 Interface

### Botão Principal (Roxo/Azul Gradiente)
```
[✨ Auto-Detectar com IA]
```

Quando clica:
- Botão fica disabled
- Mostra loading spinner
- Alert azul aparece com status
- Quando termina: Toast de sucesso!

### Botão Fallback
```
[🪄 Auto-Detectar (Simples)]
```

Usa string matching tradicional se:
- Não tem API key
- IA falhou
- Preferir mais rápido

## 🔧 Integração na Página de Import

Para usar o novo componente, edite:

**`src/pages/ImportProperties.tsx`**

```typescript
// ANTES
import ColumnMappingDialog from "@/components/ColumnMappingDialog";

// DEPOIS
import ColumnMappingDialogWithAI from "@/components/ColumnMappingDialogWithAI";

// No JSX, trocar:
<ColumnMappingDialog ... />
// Por:
<ColumnMappingDialogWithAI ... />
```

## ⚙️ Configurações da IA

### Modelo Usado
- **Gemini Pro** (rápido e gratuito)
- Pode mudar para `gemini-pro-vision` se quiser

### Prompt Customizado
A IA recebe:
1. Lista de colunas do CSV
2. Lista de campos do banco de dados
3. Instruções de mapeamento
4. Exemplos

Ela retorna JSON:
```json
{
  "mappings": [
    {
      "csvColumn": "Input Property Address",
      "suggestedField": "address",
      "confidence": "high",
      "reason": "Campo de endereço principal da propriedade"
    }
  ]
}
```

## 🛡️ Tratamento de Erros

### Erro: "Gemini API key not configured"
**Solução:** Adicionar API key em Settings → Gemini AI Settings

### Erro: "Failed to parse AI response"
**Solução:** IA retornou formato inválido
- Sistema usa fallback automático (string matching)
- Tenta novamente ou usa "Auto-Detectar (Simples)"

### Erro: API Rate Limit
**Solução:**
- Gemini tem limite gratuito
- Esperar alguns segundos
- Ou usar "Auto-Detectar (Simples)"

## 🧪 Testar Localmente

Abra Console do Navegador (F12):

```javascript
// Importar função
import { testAIMapping } from '@/utils/aiColumnMapper';

// Testar com suas colunas
const colunas = [
  "Input Property Address",
  "Input Property City",
  "Owner First Name",
  "Owner Last Name"
];

testAIMapping(colunas);

// Vai mostrar:
// ✅ Success!
// Tabela com mapeamentos sugeridos
```

## 📈 Vantagens da IA

### 1. Entende Contexto
```
"Endereço Completo do Imóvel" → address ✓
"Full Property Street Address" → address ✓
"Адрес недвижимости" (russo) → address ✓
```

### 2. Lida com Múltiplos Idiomas
- Português
- Inglês
- Espanhol
- Qualquer idioma!

### 3. Sinônimos e Variações
```
"Owner" → owner_name
"Proprietário" → owner_name
"Dono" → owner_name
"Property Owner" → owner_name
```

### 4. Campos Compostos
```
CSV tem: "Owner First Name" + "Owner Last Name"
IA mapeia ambos para: owner_name
Razão: "Sistema concatena automaticamente"
```

## 💰 Custo

**Gemini API:**
- ✅ **Grátis** até 60 requests/minuto
- ✅ Sem cartão de crédito necessário
- ✅ Quota generosa

Para importações normais (< 100 colunas), totalmente grátis!

## 🎯 Próximos Passos

1. ✅ Configurar API key
2. ✅ Testar com seu CSV
3. ✅ Comparar IA vs String Matching
4. ✅ Escolher o melhor para seu caso
5. ✅ Importar dados!

## 🤝 Fallback Inteligente

Se IA falhar:
1. Sistema detecta erro
2. Automaticamente usa string matching
3. Mostra toast: "Usando detecção simples como fallback"
4. Importação continua normalmente

**Você nunca fica bloqueado!**

## 📞 Troubleshooting

### IA não funciona
1. Verificar API key em Settings
2. Verificar conexão internet
3. Testar com "Auto-Detectar (Simples)"
4. Ver Console (F12) para erros

### IA mapeou errado
1. Corrigir manualmente (dropdown)
2. Reportar qual coluna errou (para melhorar prompt)
3. Ou usar string matching

### Muito lento
1. Gemini demora ~2-5 segundos para 50 colunas
2. Se urgente, use "Auto-Detectar (Simples)" (instantâneo)
3. IA vale a pena para CSVs complexos!

## 🎉 Pronto!

Agora você tem:
- ✅ Auto-detect inteligente com IA
- ✅ Fallback tradicional
- ✅ Opção manual
- ✅ Melhor experiência de importação!

**Faça o teste com seu CSV agora!** 🚀
