# 📊 GUIA DE IMPORT COMPLETO - 66 COLUNAS

## ✅ Arquivo Pronto
📄 **`01_DADOS_COMPLETO_TODAS_COLUNAS.csv`**
- **206 properties** (1 SEVERE, 38 POOR, 122 FAIR, 45 VACANT LAND)
- **66 colunas** com TODOS os dados dos Steps 1, 2 e 4
- **100% com fotos** (todas as 206 têm imagens)
- **0 duplicatas**

---

## 📋 TODAS AS 66 COLUNAS

### 🔑 Identificadores (4 colunas)
1. `account_number` - Número da conta (formato: 26_22_28_6068_00170)
2. `property_address` - Endereço do imóvel
3. `owner_name` - Nome do proprietário
4. `owner_address` - Endereço do proprietário

### 📸 Foto (1 coluna)
5. `photo_url` - URL da foto (Google Street View)

### 💰 Dados Financeiros (4 colunas)
6. `balance_amount` - Valor em dívida
7. `assessed_value` - Valor avaliado
8. `equity` - Equity calculado
9. `equity_ratio` - Ratio de equity

### 🏠 Detalhes do Imóvel (17 colunas)
10. `year_built` - Ano de construção
11. `years_old` - Idade do imóvel
12. `living_area_sqft` - Área habitável (pés²)
13. `gross_area_sqft` - Área total (pés²)
14. `bedrooms` - Quartos
15. `bathrooms` - Banheiros
16. `floors` - Andares
17. `building_type` - Tipo de construção
18. `exterior_wall` - Parede externa
19. `interior_wall` - Parede interna
20. `land_use_code` - Código de uso da terra
21. `land_use_description` - Descrição do uso
22. `zoning` - Zoneamento
23. `land_qty` - Quantidade de terra
24. `land_qty_code` - Código da quantidade
25. `land_acres` - Acres de terra
26. `land_sqft` - Terra em pés²
27. `value_per_acre` - Valor por acre

### 📄 Tax & Legal (13 colunas)
28. `roll_year` - Ano do roll
29. `tax_year` - Ano fiscal
30. `alternate_key` - Chave alternativa
31. `account_status` - Status da conta
32. `billing_address` - Endereço de cobrança
33. `legal_description` - Descrição legal
34. `millage_code` - Código de millage
35. `cert_number` - Número do certificado
36. `bidder_number` - Número do licitante
37. `cert_buyer` - Comprador do certificado
38. `cert_status` - Status do certificado
39. `deed_status` - Status da escritura
40. `pid` - Property ID

### 🎯 Scoring & Flags (7 colunas)
41. `priority_score` - Score de prioridade (do Step 2)
42. `times_delinquent` - Vezes inadimplente
43. `is_estate_trust` - É estate/trust?
44. `is_out_of_state` - Dono fora do estado?
45. `is_deed_certified` - Deed certificado?
46. `is_cert_issued` - Certificado emitido?
47. `is_llc` - É LLC?

### 🔍 Análise Visual do Step 4 (20 colunas)
48. `condition_score` - Score de condição (0-10)
49. `condition_category` - Categoria (SEVERE/POOR/FAIR/VACANT LAND)
50. `lawn_condition` - Condição do gramado
51. `exterior_condition` - Condição externa
52. `roof_condition` - Condição do telhado
53. `driveway_condition` - Condição da entrada
54. `pool_condition` - Condição da piscina
55. `visible_issues` - Problemas visíveis
56. `appears_vacant` - Parece vago?
57. `vehicles_present` - Veículos presentes?
58. `distress_indicators` - Indicadores de distress
59. `neighbor_comparison` - Comparação com vizinhos
60. `visual_summary` - Resumo visual (análise AI)
61. `estimated_repair_cost` - Custo estimado de reparo
62. `estimated_repair_cost_low` - Custo mínimo
63. `estimated_repair_cost_high` - Custo máximo
64. `image_appears_current` - Imagem parece atual?
65. `image_path` - Caminho da imagem original
66. `analysis_date` - Data da análise

---

## 🚀 COMO IMPORTAR NO LOVABLE

### Opção 1: Import Básico (Rápido)
Se você quiser importar rapidamente sem ajustar todas as colunas:

1. Vá em `/admin/import` no Lovable
2. Faça upload de `01_DADOS_COMPLETO_TODAS_COLUNAS.csv`
3. O Lovable vai mapear automaticamente as colunas que já existem
4. **Importante**: Algumas colunas podem não ser mapeadas (o Lovable vai ignorar)

### Opção 2: Import Completo (Recomendado)
Para importar TODAS as 66 colunas, você precisa adicionar as colunas faltantes no banco Supabase:

#### Passo 1: Adicionar Colunas no Supabase

Cole este SQL no Supabase SQL Editor:

```sql
-- Adicionar colunas do Step 1 (Property Details)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS years_old INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS living_area_sqft NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gross_area_sqft NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_wall TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS interior_wall TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_use_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_use_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_qty NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_qty_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_acres NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_sqft NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS value_per_acre NUMERIC;

-- Adicionar colunas do Step 2 (Scoring & Flags)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS priority_score NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS times_delinquent INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_estate_trust BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_out_of_state BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_deed_certified BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_cert_issued BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_llc BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS equity NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS equity_ratio NUMERIC;

-- Adicionar colunas do Step 4 (Visual Analysis)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_score NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_category TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lawn_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roof_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS driveway_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visible_issues TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appears_vacant BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vehicles_present TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distress_indicators TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighbor_comparison TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visual_summary TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_low NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_high NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_appears_current BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS analysis_date TIMESTAMP;

-- Adicionar colunas Tax & Legal
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roll_year INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_year INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS alternate_key TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS account_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legal_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS millage_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cert_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bidder_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cert_buyer TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cert_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deed_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pid TEXT;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_condition_category ON properties(condition_category);
CREATE INDEX IF NOT EXISTS idx_properties_condition_score ON properties(condition_score);
CREATE INDEX IF NOT EXISTS idx_properties_priority_score ON properties(priority_score);
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built);
```

#### Passo 2: Atualizar o Lovable AI para Mapear as Colunas

Cole este prompt no Lovable AI:

```
Preciso atualizar o sistema de import em /admin/import para mapear TODAS as 66 colunas do meu CSV.

Atualize o arquivo src/components/admin/import/ColumnMappingDialog.tsx:

1. Adicione ao array DATABASE_FIELDS:

// Property Details
{ key: 'year_built', label: 'Year Built', required: false, group: 'property' },
{ key: 'years_old', label: 'Years Old', required: false, group: 'property' },
{ key: 'living_area_sqft', label: 'Living Area (sqft)', required: false, group: 'property' },
{ key: 'gross_area_sqft', label: 'Gross Area (sqft)', required: false, group: 'property' },
{ key: 'bedrooms', label: 'Bedrooms', required: false, group: 'property' },
{ key: 'bathrooms', label: 'Bathrooms', required: false, group: 'property' },
{ key: 'floors', label: 'Floors', required: false, group: 'property' },
{ key: 'building_type', label: 'Building Type', required: false, group: 'property' },
{ key: 'exterior_wall', label: 'Exterior Wall', required: false, group: 'property' },
{ key: 'interior_wall', label: 'Interior Wall', required: false, group: 'property' },
{ key: 'land_use_code', label: 'Land Use Code', required: false, group: 'property' },
{ key: 'land_use_description', label: 'Land Use Description', required: false, group: 'property' },
{ key: 'zoning', label: 'Zoning', required: false, group: 'property' },
{ key: 'land_qty', label: 'Land Quantity', required: false, group: 'property' },
{ key: 'land_qty_code', label: 'Land Qty Code', required: false, group: 'property' },
{ key: 'land_acres', label: 'Land (acres)', required: false, group: 'property' },
{ key: 'land_sqft', label: 'Land (sqft)', required: false, group: 'property' },
{ key: 'value_per_acre', label: 'Value per Acre', required: false, group: 'property' },

// Scoring & Flags
{ key: 'priority_score', label: 'Priority Score', required: false, group: 'scoring' },
{ key: 'times_delinquent', label: 'Times Delinquent', required: false, group: 'scoring' },
{ key: 'is_estate_trust', label: 'Is Estate/Trust', required: false, group: 'flags' },
{ key: 'is_out_of_state', label: 'Is Out of State', required: false, group: 'flags' },
{ key: 'is_deed_certified', label: 'Is Deed Certified', required: false, group: 'flags' },
{ key: 'is_cert_issued', label: 'Is Cert Issued', required: false, group: 'flags' },
{ key: 'is_llc', label: 'Is LLC', required: false, group: 'flags' },
{ key: 'equity', label: 'Equity', required: false, group: 'financial' },
{ key: 'equity_ratio', label: 'Equity Ratio', required: false, group: 'financial' },

// Visual Analysis (Step 4)
{ key: 'condition_score', label: 'Condition Score', required: false, group: 'condition' },
{ key: 'condition_category', label: 'Condition Category', required: false, group: 'condition' },
{ key: 'lawn_condition', label: 'Lawn Condition', required: false, group: 'condition' },
{ key: 'exterior_condition', label: 'Exterior Condition', required: false, group: 'condition' },
{ key: 'roof_condition', label: 'Roof Condition', required: false, group: 'condition' },
{ key: 'driveway_condition', label: 'Driveway Condition', required: false, group: 'condition' },
{ key: 'pool_condition', label: 'Pool Condition', required: false, group: 'condition' },
{ key: 'visible_issues', label: 'Visible Issues', required: false, group: 'condition' },
{ key: 'appears_vacant', label: 'Appears Vacant', required: false, group: 'condition' },
{ key: 'vehicles_present', label: 'Vehicles Present', required: false, group: 'condition' },
{ key: 'distress_indicators', label: 'Distress Indicators', required: false, group: 'condition' },
{ key: 'neighbor_comparison', label: 'Neighbor Comparison', required: false, group: 'condition' },
{ key: 'visual_summary', label: 'Visual Summary', required: false, group: 'condition' },
{ key: 'estimated_repair_cost', label: 'Repair Cost (est)', required: false, group: 'estimates' },
{ key: 'estimated_repair_cost_low', label: 'Repair Cost Low', required: false, group: 'estimates' },
{ key: 'estimated_repair_cost_high', label: 'Repair Cost High', required: false, group: 'estimates' },
{ key: 'image_appears_current', label: 'Image Appears Current', required: false, group: 'condition' },
{ key: 'image_path', label: 'Image Path', required: false, group: 'metadata' },
{ key: 'analysis_date', label: 'Analysis Date', required: false, group: 'metadata' },

// Tax & Legal
{ key: 'roll_year', label: 'Roll Year', required: false, group: 'tax' },
{ key: 'tax_year', label: 'Tax Year', required: false, group: 'tax' },
{ key: 'alternate_key', label: 'Alternate Key', required: false, group: 'tax' },
{ key: 'account_status', label: 'Account Status', required: false, group: 'tax' },
{ key: 'billing_address', label: 'Billing Address', required: false, group: 'tax' },
{ key: 'legal_description', label: 'Legal Description', required: false, group: 'tax' },
{ key: 'millage_code', label: 'Millage Code', required: false, group: 'tax' },
{ key: 'cert_number', label: 'Cert Number', required: false, group: 'tax' },
{ key: 'bidder_number', label: 'Bidder Number', required: false, group: 'tax' },
{ key: 'cert_buyer', label: 'Cert Buyer', required: false, group: 'tax' },
{ key: 'cert_status', label: 'Cert Status', required: false, group: 'tax' },
{ key: 'deed_status', label: 'Deed Status', required: false, group: 'tax' },
{ key: 'pid', label: 'Property ID', required: false, group: 'identifiers' },

2. Atualize a função autoDetectField() para reconhecer estas colunas automaticamente.

3. Atualize a lógica de import para aceitar e processar estas colunas.
```

#### Passo 3: Fazer Upload

1. Vá em `/admin/import`
2. Faça upload de `01_DADOS_COMPLETO_TODAS_COLUNAS.csv`
3. Revise o mapeamento (deve estar automático)
4. Clique em "Import"

---

## 📊 RESUMO DOS DADOS

**Total**: 206 properties

**Por Categoria**:
- SEVERE: 1 (0.5%)
- POOR: 38 (18.4%)
- FAIR: 122 (59.2%)
- VACANT LAND: 45 (21.8%)

**Cobertura de Dados**:
- ✅ 100% têm `account_number`
- ✅ 100% têm `property_address`
- ✅ 100% têm `owner_name`
- ✅ 100% têm `photo_url` (todas com fotos!)
- ✅ 100% têm dados financeiros (balance, equity, etc.)
- ✅ 100% têm análise visual do Step 4
- ✅ 100% têm dados de scoring do Step 2
- ⚠️ Alguns campos podem ter valores null/NaN (ex: pool_condition se não tiver piscina)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **CSV criado** - `01_DADOS_COMPLETO_TODAS_COLUNAS.csv`
2. ⏳ **Adicionar colunas no Supabase** (SQL acima)
3. ⏳ **Atualizar Lovable AI** (prompt acima)
4. ⏳ **Upload do CSV** em `/admin/import`
5. ⏳ **Upload das imagens** (206 fotos em `02_IMAGENS_206_FOTOS/`)

---

## 🔧 TROUBLESHOOTING

**Problema**: Lovable não reconhece algumas colunas
- **Solução**: Execute o SQL no Supabase primeiro

**Problema**: Import parcial (algumas colunas ignoradas)
- **Solução**: Use o prompt do Lovable AI para atualizar ColumnMappingDialog.tsx

**Problema**: Erro "account_number must be unique"
- **Solução**: Este CSV já está deduplicated, use UPSERT mode

**Problema**: Imagens não aparecem após import
- **Solução**: As images precisam ser uploadadas separadamente para Supabase Storage

---

**Criado**: 2024-12-19
**Script**: `Step 5 - Outreach & Campaigns/tools/create_complete_import_csv.py`
