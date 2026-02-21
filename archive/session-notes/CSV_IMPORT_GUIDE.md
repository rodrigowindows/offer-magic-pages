# CSV Property Importer - Guia Completo

## 🎯 Visão Geral

Sistema completo de importação de dados CSV com:
- ✅ Upload de arquivo CSV
- ✅ Mapeamento automático de colunas
- ✅ Criação dinâmica de colunas no banco de dados
- ✅ Opção de pular valores vazios
- ✅ Preview antes de importar
- ✅ Validação e relatório de erros
- ✅ Progresso em tempo real

## 📁 Arquivos Criados

### 1. Componente Principal
**`src/components/CSVImporter.tsx`**
- Interface completa de importação
- 4 passos: Upload → Mapeamento → Preview → Importação
- Validação de dados
- Relatório de sucesso/erros

### 2. Utilitário de Parse CSV
**`src/utils/csvParser.ts`**
- Parser CSV nativo (sem dependências externas)
- Suporta aspas e escapes
- Lê arquivos como texto

### 3. Funções do Banco de Dados
**`supabase/migrations/20260102000000_csv_import_functions.sql`**
- `add_column_if_not_exists()` - Adiciona coluna se não existir
- `column_exists()` - Verifica se coluna existe
- `get_table_columns()` - Lista todas as colunas

## 🚀 Como Usar

### Passo 1: Aplicar Migration

```bash
# Aplicar a migration com as funções SQL
supabase migration up
```

Ou executar manualmente no Supabase SQL Editor:
```sql
-- Conteúdo de: supabase/migrations/20260102000000_csv_import_functions.sql
```

### Passo 2: Adicionar ao Admin Dashboard

```tsx
// src/pages/AdminDashboard.tsx
import { CSVImporter } from "@/components/CSVImporter";

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <h1>Admin Dashboard</h1>

      {/* CSV Importer */}
      <CSVImporter />
    </div>
  );
};
```

Ou criar uma página dedicada:

```tsx
// src/pages/ImportPage.tsx
import { CSVImporter } from "@/components/CSVImporter";

export const ImportPage = () => {
  return (
    <div className="container mx-auto py-8">
      <CSVImporter />
    </div>
  );
};
```

### Passo 3: Preparar seu CSV

O CSV deve ter:
1. **Primeira linha**: Cabeçalhos (nomes das colunas)
2. **Linhas seguintes**: Dados

Exemplo:
```csv
Input Property Address,Input Property City,Input Property State,Input Property Zip,Input Last Name,Input First Name,Owner First Name,Owner Last Name
5528 LONG LAKE RD,Orlando,FL,32810,DELICH,LUCIA M,TAYLOR,ROSE
1025 S WASHINGTON AVE,Orlando,FL,32703,IVERSON,DELLA M,,
144 WASHINGTON AVE,EATONVILLE,Orlando,FL,32810,,WASHINGTON AVE TRUST,,
```

## 📊 Funcionalidades Detalhadas

### 1. Upload de Arquivo

- Arraste e solte ou clique para selecionar
- Aceita apenas arquivos `.csv`
- Botão para download de CSV de exemplo
- Validação automática após upload

### 2. Mapeamento de Colunas

**Mapeamento Automático:**
O sistema tenta mapear automaticamente baseado em nomes similares:

| CSV Column | Auto-mapped to DB Column |
|------------|-------------------------|
| Input Property Address | property_address |
| Input Property City | city |
| Input Property State | state |
| Owner First Name | owner_first_name |

**Opções por Coluna:**
- **Selecionar campo do banco** - Escolher qual coluna do banco de dados
- **Pular coluna** - Não importar essa coluna
- **Criar nova coluna** - Criar automaticamente no banco
- **Skip empty** - Checkbox para pular valores vazios nessa coluna

**Colunas Disponíveis:**
```typescript
- property_address (obrigatório)
- city (obrigatório)
- state
- zip_code
- owner_first_name
- owner_last_name
- owner_full_name
- mail_address
- mail_city
- mail_state
- mail_zip_code
- assessed_value
- beds
- baths
- sqft
- year_built
- lot_size
- property_type
```

### 3. Criação Dinâmica de Colunas

Se você mapear para uma coluna que não existe:

**Exemplo:**
```
CSV: "Custom Field" → DB: "custom_field" (não existe)
```

O sistema vai:
1. Detectar que `custom_field` não existe
2. Mostrar alerta: "1 new column will be created: custom_field"
3. Pedir confirmação com checkbox "Allow creation"
4. Se confirmado, criar a coluna antes de importar

**Validação de Nomes:**
- Apenas letras minúsculas, números e underscores
- Deve começar com letra
- Exemplos válidos: `custom_field`, `owner_email`, `tax_year_2024`
- Exemplos inválidos: `Custom Field`, `123field`, `field-name`

### 4. Skip Empty Values

**Opção Global:**
Checkbox "Skip empty values" no topo aplica para todas as colunas

**Opção por Coluna:**
Cada coluna tem seu próprio checkbox "Skip empty"

**Comportamento:**
```typescript
// Se "Skip empty" = true
Row: { address: "123 Main St", city: "" }
Resultado: Só importa address, city não é incluído

// Se "Skip empty" = false
Row: { address: "123 Main St", city: "" }
Resultado: Importa address="123 Main St" e city=""
```

**Por que usar?**
- Evita sobrescrever dados existentes com vazios
- Mantém valores padrão do banco
- Reduz ruído nos dados

### 5. Preview

Mostra as primeiras 5 linhas formatadas antes de importar:

```
| property_address      | city    | state | owner_name |
|----------------------|---------|-------|------------|
| 5528 LONG LAKE RD    | Orlando | FL    | TAYLOR     |
| 1025 S WASHINGTON    | Orlando | FL    | DELLA M    |
```

- Verifica campos obrigatórios
- Mostra valores vazios como *(empty)*
- Permite voltar para ajustar mapeamento

### 6. Importação

**Processo:**
1. Cria colunas novas (se permitido)
2. Importa linha por linha
3. Valida campos obrigatórios (address + city)
4. Pula linhas com erros, continua com próximas
5. Mostra progresso em tempo real

**Barra de Progresso:**
```
Importing data...
[████████████░░░░░░░░] 60%
45 of 75 rows processed
```

### 7. Relatório Final

**Se sucesso total:**
```
✓ Import Complete!

[100]      [0]
Successful | Errors
```

**Se houve erros:**
```
⚠ Import Completed with Errors

[75]       [25]
Successful | Errors

Error Details:
- Row 12: Missing required fields (address or city)
- Row 34: duplicate key value violates unique constraint
- Row 56: invalid input syntax for type numeric
```

Mostra até 50 primeiros erros.

## 🔧 Validações

### Validações de Upload
- ✅ Arquivo deve ser .csv
- ✅ Deve ter pelo menos 1 linha de cabeçalho
- ✅ Deve ter pelo menos 1 linha de dados

### Validações de Mapeamento
- ✅ Campos obrigatórios devem estar mapeados
- ✅ Campos obrigatórios: `property_address` e `city`
- ✅ Nomes de novas colunas devem ser válidos

### Validações de Importação
- ✅ Cada linha deve ter address E city
- ✅ Valores numéricos em campos numéricos
- ✅ Unicidade (se houver constraints no banco)

## 💡 Casos de Uso

### Caso 1: Importação Simples

**CSV:**
```csv
Property Address,City,State
123 Main St,Orlando,FL
456 Oak Ave,Tampa,FL
```

**Passos:**
1. Upload do arquivo
2. Sistema auto-mapeia: Property Address → property_address, etc.
3. Preview mostra 2 linhas
4. Importa → Sucesso: 2, Erros: 0

### Caso 2: Campos Customizados

**CSV:**
```csv
Address,City,Tax Year,Tax Amount
123 Main St,Orlando,2024,$5000
```

**Passos:**
1. Upload
2. Mapear:
   - Address → property_address
   - City → city
   - Tax Year → new_tax_year (criar nova)
   - Tax Amount → new_tax_amount (criar nova)
3. Marcar "Allow creation"
4. Sistema cria `tax_year` e `tax_amount` no banco
5. Importa dados

### Caso 3: Atualização Parcial

**Cenário:** Você tem propriedades no banco e quer adicionar apenas o campo "assessed_value"

**CSV:**
```csv
Address,City,Assessed Value
123 Main St,Orlando,250000
```

**Configuração:**
- Marcar "Skip empty values" = true
- Mapear apenas Address, City, Assessed Value
- Outras colunas: "Skip this column"

**Resultado:**
- Encontra propriedade existente por address+city
- Adiciona apenas assessed_value
- Outros campos permanecem intocados

### Caso 4: CSV com Muitas Colunas

Se seu CSV tem 30 colunas mas você só quer 5:

1. No mapeamento, configure as 5 importantes
2. Para as outras 25, selecione "Skip this column"
3. Importação só processa as 5 selecionadas

## 🚨 Tratamento de Erros

### Erros Comuns

**1. "Missing required fields (address or city)"**
- Linha não tem endereço OU cidade
- Essa linha é pulada
- Próximas linhas continuam

**2. "duplicate key value violates unique constraint"**
- Propriedade com mesmo endereço já existe
- Precisa ter constraint única no banco
- Ou remover duplicatas do CSV

**3. "invalid input syntax for type numeric"**
- Tentou importar texto em campo numérico
- Ex: "N/A" em campo `beds`
- Ajustar CSV ou mapear para text

**4. "Failed to create column"**
- Nome de coluna inválido
- Ou permissões insuficientes
- Verificar nome (apenas a-z, 0-9, _)

### Estratégias de Recuperação

**Importação Parcial:**
Se 50 de 100 linhas deram erro:
- 50 foram importadas com sucesso
- 50 falharam (listadas no relatório)
- Exportar erros, corrigir CSV
- Re-importar apenas linhas corrigidas

**Duplicatas:**
```sql
-- Verificar duplicatas antes de importar
SELECT property_address, city, COUNT(*)
FROM properties
GROUP BY property_address, city
HAVING COUNT(*) > 1;
```

## 📋 Exemplos de CSV

### Exemplo 1: Básico
```csv
property_address,city,state,zip_code
123 Main St,Orlando,FL,32801
456 Oak Ave,Orlando,FL,32802
```

### Exemplo 2: Com Owner Info
```csv
property_address,city,state,owner_first_name,owner_last_name
123 Main St,Orlando,FL,John,Doe
456 Oak Ave,Orlando,FL,Jane,Smith
```

### Exemplo 3: Completo
```csv
property_address,city,state,zip_code,beds,baths,sqft,year_built,assessed_value
123 Main St,Orlando,FL,32801,3,2,1500,1980,250000
456 Oak Ave,Orlando,FL,32802,4,3,2200,2005,350000
```

### Exemplo 4: Com Campos Customizados
```csv
property_address,city,tax_year,tax_amount,hoa_fee,notes
123 Main St,Orlando,2024,5000,250,Pool needs repair
456 Oak Ave,Orlando,2024,6500,0,Great condition
```

## 🔐 Segurança

### Validação de Input
- ✅ Nomes de colunas validados (regex)
- ✅ Nomes de tabelas validados
- ✅ Tipos de dados permitidos (whitelist)
- ✅ SQL injection prevention (parameterized queries)

### Permissões
- ✅ Funções executam com SECURITY DEFINER
- ✅ Apenas authenticated users podem executar
- ✅ RLS (Row Level Security) se configurado

### Tipos Permitidos para Novas Colunas
```sql
'text', 'integer', 'numeric', 'boolean', 'timestamp', 'date', 'jsonb'
```

Outros tipos não são permitidos por segurança.

## 🎨 Customização

### Adicionar Nova Coluna Padrão

Editar `src/components/CSVImporter.tsx`:

```typescript
const AVAILABLE_DB_COLUMNS: DatabaseColumn[] = [
  // ... colunas existentes

  // Adicionar nova coluna
  { name: 'tax_status', type: 'text', isRequired: false },
  { name: 'last_inspection', type: 'date', isRequired: false },
  { name: 'is_rental', type: 'boolean', isRequired: false },
];
```

### Mudar Campos Obrigatórios

```typescript
// Tornar zip_code obrigatório
{ name: 'zip_code', type: 'text', isRequired: true },

// Validação de importação (adicionar ao código)
const hasRequiredFields =
  mappedRow.property_address &&
  mappedRow.city &&
  mappedRow.zip_code; // Adicionar aqui
```

### Customizar Mensagens de Erro

```typescript
// Em CSVImporter.tsx, procurar por:
importErrors.push(`Row ${i + 1}: Missing required fields (address or city)`);

// Mudar para:
importErrors.push(`Linha ${i + 1}: Campos obrigatórios ausentes (endereço ou cidade)`);
```

## 📊 Performance

### Otimização para Grandes Arquivos

**Batch Inserts:**
Para importações de 10,000+ linhas, modificar para inserir em lotes:

```typescript
// Ao invés de insert individual
const { error } = await supabase.from('properties').insert(mappedRow);

// Usar batch insert
const batch = [];
for (let i = 0; i < csvData.data.length; i++) {
  batch.push(mappedRow);

  if (batch.length >= 100 || i === csvData.data.length - 1) {
    const { error } = await supabase.from('properties').insert(batch);
    batch = [];
  }
}
```

**Limites Recomendados:**
- < 1,000 linhas: Import normal (atual)
- 1,000 - 10,000 linhas: Batch de 100
- 10,000+ linhas: Batch de 500 + progress throttling

## 🐛 Troubleshooting

### Problema: "Cannot read file"
**Solução:** Verificar que arquivo é .csv válido, não .xlsx ou .txt

### Problema: "No data imported"
**Solução:**
1. Verificar se CSV tem linhas de dados (não só cabeçalho)
2. Verificar se campos obrigatórios estão mapeados
3. Verificar se "Skip empty" não está pulando tudo

### Problema: "Column creation failed"
**Solução:**
1. Verificar nome da coluna (apenas a-z, 0-9, _)
2. Verificar permissões do usuário Supabase
3. Verificar se migration foi aplicada

### Problema: "Import muito lento"
**Solução:**
1. Usar batch inserts (ver seção Performance)
2. Desabilitar índices temporariamente
3. Importar fora de horário de pico

## 🎉 Pronto para Usar!

O sistema está completo. Para começar:

1. ✅ Aplicar migration SQL
2. ✅ Adicionar `<CSVImporter />` ao seu admin
3. ✅ Fazer upload de um CSV
4. ✅ Mapear colunas
5. ✅ Importar dados!

**Dúvidas?** Consulte este guia ou verifique os comentários no código.
