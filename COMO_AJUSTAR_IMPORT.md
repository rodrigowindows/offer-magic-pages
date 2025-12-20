# 🔧 Como Ajustar o /admin/import para Importar Todas as Colunas

Guia para configurar o sistema de import no Lovable para aceitar TODAS as colunas do `LOVABLE_UPLOAD_WITH_IMAGES.csv`

---

## 📋 Problema Atual

O sistema de import atual (`/admin/import`) está configurado para um conjunto limitado de colunas. Seu CSV tem **36 colunas** diferentes com dados de análise de propriedades.

**Colunas no seu CSV:**
- account_number
- property_address
- photo_url
- condition_score
- condition_category
- visual_summary
- appears_vacant
- lawn_condition
- exterior_condition
- roof_condition
- visible_issues
- owner_name
- mailing_address
- mailing_city
- mailing_state
- mailing_zip
- property_type
- beds
- baths
- year_built
- sqft
- lot_size
- just_value
- taxable_value
- exemptions
- total_tax_due
- years_delinquent
- lead_score
- priority_tier
- equity_estimate
- estimated_repair_cost_low
- estimated_repair_cost_high
- is_estate
- is_out_of_state
- is_vacant_land
- distress_indicators

---

## ✅ Solução: 2 Opções

### **Opção 1: Adicionar Campos Manualmente no Lovable** ⭐ RECOMENDADO

Cole este prompt no Lovable AI:

```
Preciso adicionar mais campos ao sistema de import de properties em /admin/import.

Atualize o arquivo src/components/ColumnMappingDialog.tsx:

Adicione estes campos ao DATABASE_FIELDS (mantendo os existentes):

CONDITION ANALYSIS GROUP:
{ key: 'condition_score', label: 'Condition Score (0-10)', required: false, group: 'condition' },
{ key: 'condition_category', label: 'Condition Category', required: false, group: 'condition' },
{ key: 'visual_summary', label: 'Visual Summary', required: false, group: 'condition' },
{ key: 'appears_vacant', label: 'Appears Vacant', required: false, group: 'condition' },
{ key: 'lawn_condition', label: 'Lawn Condition', required: false, group: 'condition' },
{ key: 'exterior_condition', label: 'Exterior Condition', required: false, group: 'condition' },
{ key: 'roof_condition', label: 'Roof Condition', required: false, group: 'condition' },
{ key: 'visible_issues', label: 'Visible Issues', required: false, group: 'condition' },

MAILING ADDRESS GROUP:
{ key: 'mailing_address', label: 'Mailing Address', required: false, group: 'mailing' },
{ key: 'mailing_city', label: 'Mailing City', required: false, group: 'mailing' },
{ key: 'mailing_state', label: 'Mailing State', required: false, group: 'mailing' },
{ key: 'mailing_zip', label: 'Mailing ZIP', required: false, group: 'mailing' },

FINANCIAL DETAILS GROUP (adicione aos existentes):
{ key: 'just_value', label: 'Just Value', required: false, group: 'financial' },
{ key: 'taxable_value', label: 'Taxable Value', required: false, group: 'financial' },
{ key: 'exemptions', label: 'Exemptions', required: false, group: 'financial' },
{ key: 'total_tax_due', label: 'Total Tax Due', required: false, group: 'financial' },
{ key: 'years_delinquent', label: 'Years Delinquent', required: false, group: 'financial' },
{ key: 'equity_estimate', label: 'Equity Estimate', required: false, group: 'financial' },

ESTIMATES GROUP:
{ key: 'estimated_repair_cost_low', label: 'Repair Cost Low', required: false, group: 'estimates' },
{ key: 'estimated_repair_cost_high', label: 'Repair Cost High', required: false, group: 'estimates' },

FLAGS GROUP:
{ key: 'is_estate', label: 'Is Estate', required: false, group: 'flags' },
{ key: 'is_out_of_state', label: 'Is Out of State', required: false, group: 'flags' },
{ key: 'is_vacant_land', label: 'Is Vacant Land', required: false, group: 'flags' },
{ key: 'distress_indicators', label: 'Distress Indicators', required: false, group: 'flags' },

PRIORITY GROUP:
{ key: 'priority_tier', label: 'Priority Tier', required: false, group: 'priority' },

PROPERTY DETAILS (adicione aos existentes):
{ key: 'beds', label: 'Beds', required: false, group: 'property' },
{ key: 'baths', label: 'Baths', required: false, group: 'property' },
{ key: 'sqft', label: 'Square Feet', required: false, group: 'property' },
{ key: 'lot_size', label: 'Lot Size', required: false, group: 'property' },


Atualize também a função autoDetectField() para reconhecer automaticamente estas colunas:

'conditionscore': 'condition_score',
'conditioncategory': 'condition_category',
'visualsummary': 'visual_summary',
'appearsvacant': 'appears_vacant',
'lawncondition': 'lawn_condition',
'exteriorcondition': 'exterior_condition',
'roofcondition': 'roof_condition',
'visibleissues': 'visible_issues',
'mailingaddress': 'mailing_address',
'mailingcity': 'mailing_city',
'mailingstate': 'mailing_state',
'mailingzip': 'mailing_zip',
'justvalue': 'just_value',
'taxablevalue': 'taxable_value',
'exemptions': 'exemptions',
'totaltaxdue': 'total_tax_due',
'yearsdelinquent': 'years_delinquent',
'equityestimate': 'equity_estimate',
'estimatedrepaircostlow': 'estimated_repair_cost_low',
'estimatedrepaircosthigh': 'estimated_repair_cost_high',
'isestate': 'is_estate',
'isoutofstate': 'is_out_of_state',
'isvacantland': 'is_vacant_land',
'distressindicators': 'distress_indicators',
'prioritytier': 'priority_tier',
'beds': 'beds',
'baths': 'baths',
'sqft': 'sqft',
'lotsize': 'lot_size',


E no arquivo src/pages/ImportProperties.tsx, na função handleImport (linha ~350), adicione parsing para os novos campos:

case 'condition_score':
case 'equity_estimate':
case 'just_value':
case 'taxable_value':
case 'exemptions':
case 'total_tax_due':
case 'estimated_repair_cost_low':
case 'estimated_repair_cost_high':
  propertyData[dbField] = parseFloat(value) || null;
  break;

case 'years_delinquent':
  propertyData[dbField] = parseInt(value) || null;
  break;

case 'appears_vacant':
case 'is_estate':
case 'is_out_of_state':
case 'is_vacant_land':
  propertyData[dbField] = value.toLowerCase() === 'true' || value === '1';
  break;

case 'condition_category':
case 'visual_summary':
case 'lawn_condition':
case 'exterior_condition':
case 'roof_condition':
case 'visible_issues':
case 'mailing_address':
case 'mailing_city':
case 'mailing_state':
case 'mailing_zip':
case 'priority_tier':
case 'distress_indicators':
  propertyData[dbField] = value;
  break;
```

**O Lovable AI vai:**
1. Atualizar `ColumnMappingDialog.tsx` com todos os novos campos
2. Atualizar a função de auto-detecção
3. Atualizar a lógica de parsing no `ImportProperties.tsx`
4. Fazer deploy automaticamente

---

### **Opção 2: Criar Migration SQL Completa**

Se a tabela `properties` ainda não tem todas as colunas, você também precisa criar/atualizar a migration.

Cole este prompt no Lovable:

```
Preciso garantir que a tabela properties tem todas as colunas necessárias.

Crie uma migration em supabase/migrations/ que adicione estas colunas SE não existirem:

-- Condition Analysis
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_score NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_category TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visual_summary TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appears_vacant BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lawn_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roof_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visible_issues TEXT;

-- Mailing Address
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_city TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_state TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_zip TEXT;

-- Financial
ALTER TABLE properties ADD COLUMN IF NOT EXISTS just_value NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS taxable_value NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exemptions NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_tax_due NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS years_delinquent INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS equity_estimate NUMERIC;

-- Estimates
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_low NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_high NUMERIC;

-- Flags
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_estate BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_out_of_state BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_vacant_land BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distress_indicators TEXT;

-- Priority
ALTER TABLE properties ADD COLUMN IF NOT EXISTS priority_tier TEXT;

-- Property Details (se não existirem)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beds INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS baths NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sqft INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size NUMERIC;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_condition_category ON properties(condition_category);
CREATE INDEX IF NOT EXISTS idx_properties_priority_tier ON properties(priority_tier);
CREATE INDEX IF NOT EXISTS idx_properties_years_delinquent ON properties(years_delinquent);

-- Comentários
COMMENT ON COLUMN properties.condition_score IS 'Visual condition score 0-10 (10 = worst)';
COMMENT ON COLUMN properties.appears_vacant IS 'Property appears vacant based on visual analysis';
COMMENT ON COLUMN properties.years_delinquent IS 'Number of years property taxes are delinquent';
COMMENT ON COLUMN properties.is_estate IS 'Property is part of an estate/inheritance';
COMMENT ON COLUMN properties.priority_tier IS 'Lead priority tier (P1-CRITICAL, P2-HIGH, etc)';
```

---

## 📝 Passo a Passo Completo

### 1. **Atualizar Database Fields** (Opção 1 prompt)
   - Cole o primeiro prompt no Lovable
   - Aguarde AI processar
   - Verifica que novos campos aparecem no mapeamento

### 2. **Criar/Atualizar Migration** (Opção 2 prompt)
   - Cole o segundo prompt no Lovable
   - Migration é criada
   - Deploy automático aplica as colunas

### 3. **Fazer Upload**
   - Vá para `/admin/import`
   - Upload das 84 imagens
   - Upload do CSV `LOVABLE_UPLOAD_WITH_IMAGES.csv`
   - Veja que TODAS as colunas estão mapeadas automaticamente!
   - Click "Importar"

### 4. **Verificar**
   - Vá para `/admin`
   - Veja as 84 properties
   - Clique em uma
   - Veja que TODOS os campos foram importados

---

## 🎨 Como Vai Ficar o Mapeamento

Depois de aplicar as mudanças, quando você fizer upload do CSV, vai ver:

```
┌────────────────────────────────────────────┐
│  Mapeamento de Colunas                     │
├────────────────────────────────────────────┤
│                                            │
│  CSV Column              →  Database Field │
│  ─────────────────────────────────────────│
│  account_number          →  origem         │
│  property_address        →  address        │
│  photo_url               →  property_image │
│  condition_score         →  condition_score│
│  condition_category      →  condition_cat..│
│  visual_summary          →  visual_summary │
│  appears_vacant          →  appears_vacant │
│  lawn_condition          →  lawn_condition │
│  ... (todas as 36 colunas mapeadas)       │
│                                            │
│  ✓ 36/36 colunas mapeadas                 │
│  ✓ 0 erros                                 │
│                                            │
│  [Confirmar Mapeamento] ✓                  │
└────────────────────────────────────────────┘
```

---

## 🔍 Verificação Pós-Import

Depois de importar, você pode verificar no Supabase que todos os dados foram salvos:

```sql
SELECT
  account_number,
  property_address,
  condition_score,
  condition_category,
  appears_vacant,
  years_delinquent,
  priority_tier,
  is_estate,
  photo_url
FROM properties
WHERE condition_category = 'SEVERE'
LIMIT 1;
```

Deve retornar a property SEVERE com TODOS os campos preenchidos!

---

## ⚡ Atalho Rápido

Se quiser fazer tudo de uma vez, cole AMBOS os prompts no Lovable em uma única mensagem:

```
Preciso ajustar o sistema de import em /admin/import para aceitar mais colunas.

PARTE 1: Atualizar ColumnMappingDialog.tsx
[cole todo o conteúdo do Opção 1]

PARTE 2: Criar Migration
[cole todo o conteúdo do Opção 2]

Faça as duas alterações e depois faça deploy.
```

O Lovable AI vai processar tudo de uma vez!

---

## 📊 Resultado Final

**Antes:** Sistema aceita ~15 colunas básicas
**Depois:** Sistema aceita TODAS as 36 colunas do seu CSV

**Benefícios:**
✅ Import completo sem perder dados
✅ Todas as análises visuais preservadas
✅ Scores de condição salvos
✅ Flags de distress mantidos
✅ Filtrar por condition_category (SEVERE, POOR, FAIR)
✅ Ver histórico de impostos atrasados
✅ Identificar estates e out-of-state owners

---

**Cole os prompts no Lovable e em 5 minutos está pronto! 🚀**
