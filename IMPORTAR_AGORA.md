# 🚀 IMPORTAR AGORA - Passo a Passo Simples

Guia direto para importar as 84 properties com fotos AGORA.

---

## ✅ PASSO 1: Ajustar Lovable (5 minutos)

### 1.1 Copie este prompt:

```
Preciso ajustar o sistema de import em /admin/import para aceitar todas as colunas do meu CSV.

ATUALIZAR ColumnMappingDialog.tsx - Adicione estes campos ao DATABASE_FIELDS:

// CONDITION ANALYSIS
{ key: 'condition_score', label: 'Condition Score', required: false, group: 'condition' },
{ key: 'condition_category', label: 'Condition Category', required: false, group: 'condition' },
{ key: 'visual_summary', label: 'Visual Summary', required: false, group: 'condition' },
{ key: 'appears_vacant', label: 'Appears Vacant', required: false, group: 'condition' },
{ key: 'lawn_condition', label: 'Lawn Condition', required: false, group: 'condition' },
{ key: 'exterior_condition', label: 'Exterior Condition', required: false, group: 'condition' },
{ key: 'roof_condition', label: 'Roof Condition', required: false, group: 'condition' },
{ key: 'visible_issues', label: 'Visible Issues', required: false, group: 'condition' },

// MAILING
{ key: 'mailing_address', label: 'Mailing Address', required: false, group: 'mailing' },
{ key: 'mailing_city', label: 'Mailing City', required: false, group: 'mailing' },
{ key: 'mailing_state', label: 'Mailing State', required: false, group: 'mailing' },
{ key: 'mailing_zip', label: 'Mailing ZIP', required: false, group: 'mailing' },

// FINANCIAL
{ key: 'just_value', label: 'Just Value', required: false, group: 'financial' },
{ key: 'taxable_value', label: 'Taxable Value', required: false, group: 'financial' },
{ key: 'exemptions', label: 'Exemptions', required: false, group: 'financial' },
{ key: 'total_tax_due', label: 'Total Tax Due', required: false, group: 'financial' },
{ key: 'years_delinquent', label: 'Years Delinquent', required: false, group: 'financial' },
{ key: 'equity_estimate', label: 'Equity Estimate', required: false, group: 'financial' },
{ key: 'estimated_repair_cost_low', label: 'Repair Cost Low', required: false, group: 'estimates' },
{ key: 'estimated_repair_cost_high', label: 'Repair Cost High', required: false, group: 'estimates' },

// FLAGS
{ key: 'is_estate', label: 'Is Estate', required: false, group: 'flags' },
{ key: 'is_out_of_state', label: 'Is Out of State', required: false, group: 'flags' },
{ key: 'is_vacant_land', label: 'Is Vacant Land', required: false, group: 'flags' },
{ key: 'distress_indicators', label: 'Distress Indicators', required: false, group: 'flags' },
{ key: 'priority_tier', label: 'Priority Tier', required: false, group: 'priority' },

// PROPERTY
{ key: 'beds', label: 'Beds', required: false, group: 'property' },
{ key: 'baths', label: 'Baths', required: false, group: 'property' },
{ key: 'sqft', label: 'Square Feet', required: false, group: 'property' },

Atualize autoDetectField() para reconhecer automaticamente:
'conditionscore': 'condition_score',
'conditioncategory': 'condition_category',
'visualsummary': 'visual_summary',
'appearsvacant': 'appears_vacant',
'lawncondition': 'lawn_condition',
'mailingaddress': 'mailing_address',
'mailingcity': 'mailing_city',
'mailingstate': 'mailing_state',
'mailingzip': 'mailing_zip',
'justvalue': 'just_value',
'taxablevalue': 'taxable_value',
'totaltaxdue': 'total_tax_due',
'yearsdelinquent': 'years_delinquent',
'equityestimate': 'equity_estimate',
'prioritytier': 'priority_tier',
'beds': 'beds',
'baths': 'baths',
'sqft': 'sqft',

No ImportProperties.tsx, adicione parsing para novos campos na função handleImport:

case 'condition_score':
case 'just_value':
case 'taxable_value':
case 'total_tax_due':
case 'equity_estimate':
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
  propertyData[dbField] = value?.toLowerCase() === 'true';
  break;

CRIAR MIGRATION - Adicione colunas se não existirem:

ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_score NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition_category TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visual_summary TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appears_vacant BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lawn_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roof_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visible_issues TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_city TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_state TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mailing_zip TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS just_value NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS taxable_value NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exemptions NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_tax_due NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS years_delinquent INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS equity_estimate NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_low NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_repair_cost_high NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_estate BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_out_of_state BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_vacant_land BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distress_indicators TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS priority_tier TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beds INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS baths NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sqft INTEGER;

CREATE INDEX IF NOT EXISTS idx_condition_category ON properties(condition_category);
CREATE INDEX IF NOT EXISTS idx_priority_tier ON properties(priority_tier);
```

### 1.2 Cole no Lovable AI
- Abra seu projeto no Lovable
- Cole o prompt acima no chat
- Aperte Enter
- Aguarde 2-5 minutos enquanto o AI processa

### 1.3 Aguarde Deploy
- Lovable vai fazer deploy automaticamente
- Aguarde aparecer "Deploy complete" ✅

---

## 📤 PASSO 2: Upload das Imagens (10-15 minutos)

### 2.1 Acesse a página de import
- Vá para: `https://seu-app.lovable.app/admin/import`
- Ou no Lovable, navegue para `/admin/import`

### 2.2 Selecione as imagens
1. Na seção "1. Upload de Imagens"
2. Click no botão de escolher arquivos
3. Navegue até:
   ```
   G:\My Drive\Sell House - code\Orlando\Step 3 - Download Images\property_photos\
   ```
4. **IMPORTANTE:** Selecione APENAS as 84 imagens que correspondem ao seu CSV

   **Como saber quais são as 84?**
   - Abra `LOVABLE_UPLOAD_WITH_IMAGES.csv`
   - Veja a coluna `account_number`
   - Os nomes das imagens devem ser: `account_number` com `_` no lugar de `-`
   - Exemplo:
     - CSV: `28-22-29-5600-81200`
     - Imagem: `28_22_29_5600_81200.jpg`

5. **OU** selecione TODAS as 984 imagens (demora mais mas funciona)

### 2.3 Faça o upload
1. Click "Upload X Imagens"
2. Aguarde a barra de progresso completar
3. Veja mensagem: "84/84 uploaded ✓"

---

## 📊 PASSO 3: Upload do CSV (2 minutos)

### 3.1 Selecione o CSV
1. Na seção "2. Upload CSV"
2. Click no botão de escolher arquivo
3. Selecione:
   ```
   G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns\LOVABLE_UPLOAD_WITH_IMAGES.csv
   ```
4. Aguarde carregar

### 3.2 Revise o Preview
- Veja que mostra "84 propriedades encontradas"
- Veja preview das primeiras 5 linhas
- Deve abrir automaticamente o **Mapeamento de Colunas**

### 3.3 Configure o Mapeamento
- O sistema deve detectar automaticamente a maioria das colunas
- Verifique que:
  - `account_number` → `origem` ✅
  - `property_address` → `address` ✅
  - `photo_url` → `property_image_url` ✅
  - `condition_score` → `condition_score` ✅
  - `condition_category` → `condition_category` ✅
  - E assim por diante...

- Se alguma coluna não foi mapeada, selecione manualmente
- Click "Confirmar Mapeamento"

---

## 💾 PASSO 4: Importar para Database (5-10 minutos)

### 4.1 Configurações finais
- **Nome do Lote:** Deixe como `Import-2024-12-19` (ou personalize)
- **Atualizar existentes:** ✅ Marque (caso rode duas vezes)

### 4.2 Click "Importar 84 Propriedades"
- Aguarde a barra de progresso
- Veja: "Importando 1/84..."
- Veja: "Importando 84/84..."

### 4.3 Aguarde completar
- Deve aparecer:
  ```
  ✅ Importação Completa!
  84 propriedades novas importadas
  0 propriedades atualizadas
  0 erros
  ```

---

## ✅ PASSO 5: Verificar (2 minutos)

### 5.1 Ir para Admin
- Click "Ver Propriedades"
- Ou navegue para `/admin`

### 5.2 Verificar dados
- Deve ver **84 properties** na lista
- Clique em uma property
- Veja que TEM foto
- Veja que TEM todos os dados:
  - Condition Score
  - Condition Category
  - Visual Summary
  - Owner Name
  - Total Tax Due
  - Years Delinquent
  - etc.

### 5.3 Testar filtros
- Filtre por `condition_category = SEVERE`
  - Deve mostrar **1 property** (a melhor!)
- Filtre por `condition_category = POOR`
  - Deve mostrar **38 properties**
- Filtre por `condition_category = FAIR`
  - Deve mostrar **41 properties**

---

## 🎯 PRÓXIMOS PASSOS

Depois de importar:

### 1. **Revisar a property SEVERE**
   - É a MELHOR lead
   - Condição mais crítica + impostos atrasados
   - LIGAR HOJE! 📞

### 2. **Revisar as 38 POOR**
   - Alta prioridade
   - Ligar esta semana

### 3. **Configurar workflow**
   - Aprovar/Rejeitar cada uma
   - Sistema rastreia quem aprovou
   - Exportar aprovadas para CSV

### 4. **Começar outreach!**
   - Cold calling
   - Direct mail
   - Door knocking

---

## 🔧 Troubleshooting

### ❌ "Coluna não encontrada"
**Solução:** Volte ao Passo 1, verifique que o Lovable aplicou todas as mudanças

### ❌ "Erro ao importar"
**Solução:**
- Verifique que migration foi aplicada
- Vá para Supabase Dashboard → SQL Editor
- Rode: `SELECT * FROM properties LIMIT 1;`
- Veja se todas as colunas existem

### ❌ Imagens não aparecem
**Solução:**
- Verifique que bucket `property-images` é público
- Teste URL direto no navegador
- Formato deve ser: `https://xxx.supabase.co/storage/v1/object/public/property-images/imports/[batch]/[filename].jpg`

### ❌ Dados faltando
**Solução:**
- Verifique mapeamento de colunas
- Rode import novamente (com "Atualizar existentes" marcado)

---

## 📋 Checklist Final

Antes de começar:
- [ ] Lovable AI processou e fez deploy das mudanças
- [ ] Tenho acesso ao arquivo CSV
- [ ] Tenho acesso à pasta de imagens
- [ ] Estou logado no Lovable app

Durante import:
- [ ] 84 imagens carregadas com sucesso
- [ ] CSV carregado e preview mostra dados corretos
- [ ] Mapeamento de colunas configurado
- [ ] Import completado sem erros

Verificação:
- [ ] 84 properties aparecem no Admin
- [ ] Fotos aparecem corretamente
- [ ] Filtro por SEVERE mostra 1 property
- [ ] Filtro por POOR mostra 38 properties
- [ ] Todos os dados estão completos

---

## 🎉 Pronto!

Depois de seguir estes passos, você terá:
- ✅ 84 properties com fotos no sistema
- ✅ Todos os dados de análise preservados
- ✅ Sistema pronto para começar outreach
- ✅ Filtros funcionando
- ✅ 1 lead SEVERE para ligar HOJE!

**Boa sorte com as ligações! 📞🏠💰**
