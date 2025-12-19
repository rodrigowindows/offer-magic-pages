# 🤖 Prompt para Lovable AI - Import Automático

Cole este prompt no chat do Lovable AI para criar tudo automaticamente.

---

## 📋 PROMPT COMPLETO (Cole isso no Lovable)

```
Preciso importar 84 properties com fotos para o sistema. Crie uma feature completa de import:

1. TABELA SUPABASE (crie a migration):

Tabela: properties

Colunas:
- id (uuid, primary key, auto)
- account_number (text, unique, not null)
- property_address (text)
- photo_url (text)

CONDITION ANALYSIS:
- condition_score (numeric)
- condition_category (text)
- visual_summary (text)
- appears_vacant (boolean)
- lawn_condition (text)
- exterior_condition (text)
- roof_condition (text)
- visible_issues (text)

OWNER INFO:
- owner_name (text)
- mailing_address (text)
- mailing_city (text)
- mailing_state (text)
- mailing_zip (text)

PROPERTY DETAILS:
- property_type (text)
- beds (numeric)
- baths (numeric)
- year_built (numeric)
- sqft (numeric)
- lot_size (numeric)

FINANCIAL:
- just_value (numeric)
- taxable_value (numeric)
- exemptions (numeric)
- total_tax_due (numeric)
- years_delinquent (integer)

SCORING:
- lead_score (numeric)
- priority_tier (text)

ESTIMATES:
- equity_estimate (numeric)
- estimated_repair_cost_low (numeric)
- estimated_repair_cost_high (numeric)

FLAGS:
- is_estate (boolean)
- is_out_of_state (boolean)
- is_vacant_land (boolean)
- distress_indicators (text)

STATUS (com defaults):
- lead_status (text, default: 'new')
- approval_status (text, default: 'pending')
- approved_by (uuid)
- approved_by_name (text)
- approved_at (timestamp)
- rejection_reason (text)
- rejection_notes (text)

TIMESTAMPS:
- created_at (timestamp, default: now())
- updated_at (timestamp, default: now())

Índices:
- account_number (unique)
- condition_category
- lead_score
- approval_status

RLS: Enable Row Level Security
- Todos podem ler
- Apenas autenticados podem inserir/atualizar


2. STORAGE BUCKET (crie se não existir):

Bucket: property-photos
- Público
- Aceita imagens (.jpg, .png)


3. PÁGINA DE IMPORT (crie em /admin/import ou adicione na página Admin existente):

Interface deve ter:

A) Seção "Upload de Imagens":
- Botão "Upload Images"
- Aceita múltiplos arquivos (.jpg)
- Upload para bucket property-photos
- Mostra progresso (X/Y uploaded)
- Lista de imagens carregadas com preview

B) Seção "Import Properties Data":
- Botão "Upload CSV"
- Aceita arquivo .csv
- Preview dos dados (primeiras 5 linhas)
- Mostra total de properties no CSV
- Validações:
  * Verifica se account_number é único
  * Verifica se colunas obrigatórias existem
  * Mostra erros se houver

C) Botão "Import to Database":
- Desabilitado até CSV ser carregado
- Ao clicar:
  * Mostra loading/spinner
  * Importa linha por linha
  * Mostra progresso: "Importing X/84..."
  * Trata duplicatas (update se existir, insert se novo)
  * Ao terminar mostra:
    - Total importadas
    - Total atualizadas
    - Erros (se houver)

D) Visual:
- Use shadcn/ui components
- Cards para cada seção
- Progress bars
- Toast notifications para sucesso/erro
- Ícones do lucide-react


4. FUNCIONALIDADES EXTRAS:

- Botão "View Imported Properties" que redireciona para página de properties
- Botão "Download Sample CSV" com template
- Validação de tipos de dados antes de importar
- Rollback se houver erro crítico


5. NAVIGATION:

- Adicione link "Import Properties" no menu Admin
- Ou adicione tab "Import" na página Admin existente


Estilos:
- Usar cores: verde para sucesso, vermelho para erro, azul para info
- Layout responsivo
- Loading states em todos os botões
```

---

## 🎯 O Que o Lovable AI Vai Criar

Depois de processar, o AI vai gerar:

✅ **Migration do Supabase** (`supabase/migrations/xxxxx_create_properties_table.sql`)
✅ **Storage bucket** configuration
✅ **Componente de Upload** (`src/components/PropertyImport.tsx` ou similar)
✅ **Página de Import** (`src/pages/ImportProperties.tsx` ou tab no Admin)
✅ **Lógica de validação** e import
✅ **UI completa** com progress bars e feedback

---

## 📝 Passos Após o AI Criar

1. **Deploy** (Lovable faz automaticamente)

2. **Acessar página de Import:**
   - Vá para `/admin/import` ou aba "Import" no Admin

3. **Upload das Imagens:**
   - Click "Upload Images"
   - Selecione as 84 imagens da pasta:
     ```
     G:\My Drive\Sell House - code\Orlando\Step 3 - Download Images\property_photos\
     ```
   - Aguarde upload completar

4. **Upload do CSV:**
   - Click "Upload CSV"
   - Selecione:
     ```
     G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns\LOVABLE_UPLOAD_WITH_IMAGES.csv
     ```
   - Veja o preview

5. **Import para Database:**
   - Click "Import to Database"
   - Aguarde completar (vai mostrar progresso)
   - Veja mensagem de sucesso: "84 properties imported!"

6. **Verificar:**
   - Vá para página Properties
   - Veja as 84 properties com fotos

---

## 🔧 Se o AI Pedir Clarificações

O AI pode perguntar coisas como:

**"Onde quer a página de import?"**
→ Responda: "Crie uma nova página /admin/import"

**"Qual o formato do CSV?"**
→ Responda: "O CSV tem estas colunas: account_number, property_address, photo_url, condition_score, condition_category, owner_name, lead_score... (todas as listadas acima)"

**"Como validar duplicatas?"**
→ Responda: "Use account_number como chave única. Se existir, UPDATE. Se não, INSERT."

---

## 🎨 Exemplo de Como Vai Ficar

```
┌─────────────────────────────────────────┐
│  Import Properties                      │
├─────────────────────────────────────────┤
│                                         │
│  📸 Upload Images                       │
│  ┌─────────────────────────────────┐   │
│  │ [Upload Images Button]           │   │
│  │                                  │   │
│  │ Progress: 84/84 uploaded ✓       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📄 Import Properties Data              │
│  ┌─────────────────────────────────┐   │
│  │ [Upload CSV Button]              │   │
│  │                                  │   │
│  │ Preview (5 rows):                │   │
│  │ account_number | address | ...   │   │
│  │ 28-22-29...   | 3466 W ... | ...│   │
│  │                                  │   │
│  │ Total: 84 properties             │   │
│  │                                  │   │
│  │ [Import to Database] 🚀          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✓ Import complete! 84 properties      │
│    added to database                   │
│                                         │
│  [View Properties] [Import More]       │
└─────────────────────────────────────────┘
```

---

## ⚡ Prompt Curto (Se Quiser Mais Simples)

Se o prompt acima for muito longo, use esta versão curta:

```
Crie uma página de import para properties:

1. Migration com tabela properties (account_number, property_address, photo_url, condition_score, condition_category, owner_name, lead_score, e mais 30 colunas de dados de properties)

2. Storage bucket "property-photos" (público)

3. Página /admin/import com:
   - Upload de imagens (.jpg) para bucket
   - Upload de CSV com preview
   - Botão "Import" que salva tudo no database
   - Progress bar e validação de duplicatas

Use shadcn/ui e mostre progresso durante import.
```

---

**Cole um dos prompts acima no Lovable AI e ele vai criar tudo! 🚀**

Depois me avisa quando terminar que eu te ajudo com os próximos passos!
