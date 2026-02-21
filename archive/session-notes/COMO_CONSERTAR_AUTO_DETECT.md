# 🔧 Como Consertar o Auto-Detect do CSV Import

## Problema Atual

Você fez upload de um CSV com colunas como:
- `Input Property Address`
- `Input Property City`
- `Input Last Name`
- etc.

Mas o sistema mostrou erro: **"CSV deve ter pelo menos 'account_number' ou 'property_address'"**

## ✅ Solução Rápida (3 Passos)

### Passo 1: Atualizar ColumnMappingDialog.tsx

Abra o arquivo:
```
src/components/ColumnMappingDialog.tsx
```

Substitua a função `autoDetectField` (linha ~60) por esta versão:

```typescript
import { autoDetectDatabaseField } from '@/utils/csvColumnMappings';

// Na função autoDetectField (linha ~60):
const autoDetectField = (csvHeader: string): DatabaseFieldKey | '' => {
  const detected = autoDetectDatabaseField(csvHeader);
  return detected as DatabaseFieldKey | '';
};
```

OU, se preferir manter a função inline, adicione mais mapeamentos:

```typescript
const autoDetectField = (csvHeader: string): DatabaseFieldKey | '' => {
  const header = csvHeader.toLowerCase().replace(/[_\s-]/g, '');

  const mappings: Record<string, DatabaseFieldKey> = {
    // Address - ADICIONAR ESTES
    'address': 'address',
    'propertyaddress': 'address',
    'inputpropertyaddress': 'address',    // ← NOVO!
    'inputaddress': 'address',            // ← NOVO!

    // City - ADICIONAR ESTES
    'city': 'city',
    'propertycity': 'city',
    'inputpropertycity': 'city',          // ← NOVO!
    'inputcity': 'city',                  // ← NOVO!

    // State - ADICIONAR ESTES
    'state': 'state',
    'propertystate': 'state',
    'inputpropertystate': 'state',        // ← NOVO!
    'inputstate': 'state',                // ← NOVO!

    // Zip - ADICIONAR ESTES
    'zip': 'zip_code',
    'zipcode': 'zip_code',
    'inputpropertyzip': 'zip_code',       // ← NOVO!
    'inputzip': 'zip_code',               // ← NOVO!

    // Owner Name - ADICIONAR ESTES
    'ownername': 'owner_name',
    'inputlastname': 'owner_name',        // ← NOVO!
    'inputfirstname': 'owner_name',       // ← NOVO!
    'lastname': 'owner_name',             // ← NOVO!
    'firstname': 'owner_name',            // ← NOVO!

    // Mailing Address - ADICIONAR ESTES
    'owneraddress': 'owner_address',
    'mailingaddress': 'owner_address',
    'inputmailingaddress1': 'owner_address',  // ← NOVO!
    'inputmailingaddress': 'owner_address',   // ← NOVO!

    // ... resto do código existente ...
  };

  return mappings[header] || '';
};
```

### Passo 2: Testar no Navegador

Depois de fazer a mudança:

1. **Salvar** o arquivo
2. **Recarregar** a página (Ctrl+R ou F5)
3. **Fazer upload** do CSV novamente
4. **Clicar** no botão **"Auto-Detectar"** (ícone de varinha mágica ✨)

Agora deve mapear automaticamente:
- ✅ `Input Property Address` → `address`
- ✅ `Input Property City` → `city`
- ✅ `Input Property State` → `state`
- ✅ `Input Last Name` → `owner_name`

### Passo 3: Verificar Campos Obrigatórios

O sistema precisa de:
- **`address`** (obrigatório) ← Deve ser mapeado do "Input Property Address"
- **`estimated_value`** (obrigatório) ← Se não tem no CSV, precisa adicionar

**Se não tem `estimated_value` no seu CSV:**

Opção A: Adicionar coluna no Excel/Google Sheets com valores aproximados

Opção B: Tornar opcional editando `DATABASE_FIELDS` (linha 12):

```typescript
{ key: 'estimated_value', label: 'Valor Estimado', required: false, group: 'financial' },
//                                                            ^^^^^ mudar para false
```

## 🧪 Como Testar os Mapeamentos

Abra o Console do Navegador (F12) e cole:

```javascript
// Testar uma coluna específica
const testColumn = "Input Property Address";
const normalized = testColumn.toLowerCase().replace(/[_\s-]/g, '');
console.log("Original:", testColumn);
console.log("Normalizado:", normalized);
// Deve mostrar: "inputpropertyaddress"

// Ver todos os mapeamentos
console.table({
  'Input Property Address': 'inputpropertyaddress',
  'Input Property City': 'inputpropertycity',
  'Input Property State': 'inputpropertystate',
  'Input Property Zip': 'inputpropertyzip',
  'Input Last Name': 'inputlastname',
  'Input First Name': 'inputfirstname',
});
```

## 📋 Lista Completa de Mapeamentos "Input"

Adicione estes ao objeto `mappings` na função `autoDetectField`:

```typescript
// Todos os campos "Input" do seu CSV
'inputpropertyaddress': 'address',
'inputpropertycity': 'city',
'inputpropertystate': 'state',
'inputpropertyzip': 'zip_code',

'inputlastname': 'owner_name',
'inputfirstname': 'owner_name',

'inputmailingaddress1': 'owner_address',
'inputmailingaddress': 'owner_address',
'inputmailingcity': 'owner_city',
'inputmailingstate': 'owner_state',
'inputmailingzip': 'owner_zip',

// Se tiver estes campos também:
'ownerfirstname': 'owner_first_name',
'ownerlastname': 'owner_last_name',
'ownerfixname': 'owner_name',
'ownerfixcity': 'owner_city',
'ownerfixstate': 'owner_state',
'ownerfixzip': 'owner_zip',
```

## 🎯 Depois de Corrigir

1. ✅ Upload do CSV
2. ✅ Clicar "Auto-Detectar"
3. ✅ Verificar mapeamentos (badge verde mostra quantas foram mapeadas)
4. ✅ Ajustar manualmente se necessário
5. ✅ Prosseguir com importação

## 🆘 Se Ainda Não Funcionar

Me avise qual o nome EXATO das colunas do seu CSV (tire print da tela de mapeamento ou cole aqui) e eu adiciono os mapeamentos corretos!

Você também pode:
1. Abrir F12 (DevTools)
2. Ir na aba Console
3. Procurar por erros vermelhos
4. Me enviar o erro exato
