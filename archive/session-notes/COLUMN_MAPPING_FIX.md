# Fix para Auto-Detecção de Colunas CSV

## Problema
O erro mostra: **"CSV deve ter pelo menos 'account_number' ou 'property_address'"**

Mas seu CSV tem colunas como:
- `Input Property Address`
- `Input Property City`
- `Input Property State`
- etc.

## Solução

### 1. Adicionar Mapeamentos para "Input" Columns

No arquivo `src/components/ColumnMappingDialog.tsx`, na função `autoDetectField`, adicione estas linhas:

```typescript
const mappings: Record<string, DatabaseFieldKey> = {
  // Address - ADICIONAR ESTAS LINHAS
  'address': 'address',
  'propertyaddress': 'address',
  'situsaddress': 'address',
  'streetaddress': 'address',
  'inputpropertyaddress': 'address',      // NOVO
  'inputaddress': 'address',              // NOVO

  // City - ADICIONAR ESTAS LINHAS
  'city': 'city',
  'propertycity': 'city',
  'situscity': 'city',
  'inputpropertycity': 'city',           // NOVO
  'inputcity': 'city',                   // NOVO

  // State - ADICIONAR ESTAS LINHAS
  'state': 'state',
  'propertystate': 'state',
  'situsstate': 'state',
  'inputpropertystate': 'state',         // NOVO
  'inputstate': 'state',                 // NOVO

  // Zip - ADICIONAR ESTAS LINHAS
  'zip': 'zip_code',
  'zipcode': 'zip_code',
  'postalcode': 'zip_code',
  'situszip': 'zip_code',
  'inputpropertyzip': 'zip_code',        // NOVO
  'inputzip': 'zip_code',                // NOVO

  // Owner - ADICIONAR ESTAS LINHAS
  'ownername': 'owner_name',
  'owner': 'owner_name',
  'name': 'owner_name',
  'inputlastname': 'owner_name',         // NOVO
  'inputfirstname': 'owner_name',        // NOVO
  'ownerfirstname': 'owner_name',        // NOVO
  'ownerlastname': 'owner_name',         // NOVO

  // Mailing Address - ADICIONAR ESTAS LINHAS
  'owneraddress': 'owner_address',
  'mailingaddress': 'owner_address',
  'inputmailingaddress1': 'owner_address', // NOVO
  'inputmailingaddress': 'owner_address',  // NOVO

  // ... resto do código
};
```

### 2. Como Usar o Auto-Detectar

1. **Upload do CSV**
2. Na seção "Mapeamento de Colunas"
3. **Clicar no botão "Auto-Detectar"** (ícone de varinha mágica ✨)
4. O sistema vai mapear automaticamente:
   - `Input Property Address` → `address`
   - `Input Property City` → `city`
   - `Input Property State` → `state`
   - `Input Property Zip` → `zip_code`
   - etc.

### 3. Verificação Manual

Depois do auto-detect, você pode:
- ✅ **Ver quais foram mapeadas** (badge verde mostra o número)
- ⏭️ **Ignorar colunas** que não precisa
- 🔄 **Trocar manualmente** se o auto-detect errou

### 4. Campos Obrigatórios

O sistema mostra com asterisco vermelho (*):
- **Endereço** (`address`) - OBRIGATÓRIO
- **Valor Estimado** (`estimated_value`) - OBRIGATÓRIO

Se seu CSV não tem `estimated_value`, você tem 2 opções:
1. Adicionar uma coluna com valores (pode ser aproximado)
2. Modificar o código para tornar opcional

## Para Modificar Código Agora

Edite o arquivo:
```
src/components/ColumnMappingDialog.tsx
```

Procure pela linha 63:
```typescript
const mappings: Record<string, DatabaseFieldKey> = {
```

E adicione todos os mapeamentos "input" acima mostrados.

## Teste

1. Upload do seu CSV atual
2. Clique "Auto-Detectar"
3. Verifique se mapeou corretamente
4. Ajuste manualmente se necessário
5. Prossiga com importação

## Se Ainda Não Funcionar

Verifique no console do navegador (F12) qual o nome exato da coluna que está vindo do CSV. O sistema remove espaços, underscores e converte para minúsculas antes de comparar.

Exemplo:
- `Input Property Address` vira `inputpropertyaddress`
- `Property_Address` vira `propertyaddress`
- `property address` vira `propertyaddress`

Então adicione a versão normalizada no mapeamento!
