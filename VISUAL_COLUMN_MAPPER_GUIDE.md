# 🎨 Visual Column Mapper - Guia Completo

## ✨ O Que É?

Um componente **interativo e visual** para mapear colunas do CSV para campos do banco de dados. Você vê:

- ✅ Nome da coluna do CSV
- ✅ **Preview dos dados reais** (primeiras 3 linhas)
- ✅ **Sugestão da IA** com % de confiança
- ✅ Dropdown para escolher o campo manualmente
- ✅ Status visual (mapeado/não mapeado/obrigatório)

## 🎯 Como Usar

### 1. Upload do CSV
```tsx
import VisualColumnMapper from "@/components/VisualColumnMapper";

function ImportPage() {
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCSVHeaders] = useState([]);

  const handleFileUpload = (file) => {
    // Parse CSV
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCSVHeaders(Object.keys(results.data[0]));
        setCsvData(results.data); // Full data
      }
    });
  };

  return (
    <VisualColumnMapper
      csvHeaders={csvHeaders}
      csvData={csvData.slice(0, 10)} // First 10 rows for preview
      onMappingComplete={(mappings) => {
        console.log("Mappings:", mappings);
        // Proceed to import
      }}
    />
  );
}
```

### 2. Interface Visual

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎨 Visual Column Mapper                                          │
│ Map CSV columns to database fields with visual preview           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 📊 Mapped: 15/20 columns                                         │
│ ⚠️  Missing required: Valor Estimado                             │
│                                                                   │
│ [🪄 Auto-Detect All] [🗑️ Clear All] [👁️ Show/Hide Preview]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ CSV Column          │ Preview Data      │ AI Suggest   │ Map To │
│────────────────────────────────────────────────────────────────  │
│ account_number      │ 28-22-29-5600-... │ origem       │ [✓]    │
│ Column 1            │ 14-23-30-4400-... │ ✨ 99% conf  │ origem │
│                     │ 22-23-28-3300-... │              │        │
│────────────────────────────────────────────────────────────────  │
│ property_address    │ 3466 W WASHING... │ address      │ [✓]    │
│ Column 2            │ 1025 S MAIN ST... │ ✨ 99% conf  │ address│
│                     │ 5528 LONG LAKE... │              │        │
│────────────────────────────────────────────────────────────────  │
│ market_value_2025   │ 206318            │ estimated_va │ [✓]    │
│ Column 3            │ 150000            │ ✨ 95% conf  │ est... │
│                     │ 325000            │              │        │
└──────────────────────────────────────────────────────────────────┘
```

## 🔥 Funcionalidades Principais

### ✨ Auto-Detect All
Clique uma vez e a IA mapeia TODAS as colunas automaticamente:

```typescript
// Detecta automaticamente:
'account_number' → 'origem' (99% confiança)
'property_address' → 'address' (99% confiança)
'market_value_2025' → 'estimated_value' (95% confiança)
'owner_name' → 'owner_name' (99% confiança)
```

### 👁️ Preview de Dados
Veja os **dados reais** do CSV antes de mapear:

```
property_address:
  - 3466 W WASHINGTON ST
  - 1025 S MAIN AVE
  - 5528 LONG LAKE RD

market_value_2025:
  - 206318
  - 150000
  - 325000
```

**Por que é útil?**
- ✅ Confirma que a coluna tem os dados certos
- ✅ Identifica colunas vazias
- ✅ Vê o formato dos dados (número, texto, etc.)

### 🎯 Seleção Manual
Dropdown organizado por categorias:

```
Basic Info
  ├─ Endereço *
  ├─ Cidade
  ├─ Estado
  └─ CEP

Owner Info
  ├─ Nome do Proprietário
  ├─ Telefone
  └─ Endereço do Proprietário

Property Details
  ├─ Quartos
  ├─ Banheiros
  ├─ Área (sqft)
  └─ Ano de Construção

Financial
  ├─ Valor Estimado *
  ├─ Oferta Cash
  └─ Lead Score

System
  ├─ ID Único (Account Number)
  ├─ URL da Imagem
  └─ Tags
```

### ⚠️ Validação de Campos Obrigatórios

Campos obrigatórios marcados com **vermelho** se não mapeados:

```
❌ Não mapeado → Linha vermelha
✅ Mapeado → Linha verde
⏭️ Skip → Linha cinza
```

**Campos obrigatórios:**
- `address` - Endereço *
- `estimated_value` - Valor Estimado *

### 📊 Summary Stats

No topo, vê estatísticas em tempo real:

```
📊 Mapped: 18 / 23 columns

✅ All required fields mapped! Ready to import.

ou

⚠️  Missing required: Valor Estimado, Endereço
```

## 🚀 Workflow Completo

```
1. Upload CSV
   ↓
2. Auto-Detect All (opcional)
   ↓
3. Review sugestões da IA
   ↓
4. Ajustar manualmente se necessário
   ↓
5. Ver preview dos dados
   ↓
6. Verificar campos obrigatórios
   ↓
7. Click "Continue to Import"
   ↓
8. Importação com mapeamentos corretos!
```

## 💡 Dicas Pro

### 1. Use Auto-Detect Primeiro
Sempre clique "Auto-Detect All" primeiro:
- 90% das colunas são detectadas corretamente
- Economia de tempo enorme
- Só ajusta as que erraram

### 2. Verifique o Preview
Antes de confirmar, veja o preview:
- Confirma que os dados estão na coluna certa
- Identifica problemas de formato
- Vê se há campos vazios

### 3. Skip Colunas Desnecessárias
Colunas que você não precisa:
- Selecione "Skip (Ignore)"
- Não serão importadas
- Economiza espaço no banco

### 4. Campos Obrigatórios em Vermelho
Se uma linha estiver vermelha:
- É campo obrigatório não mapeado
- Não poderá importar até mapear
- Procure uma coluna do CSV que tenha esses dados

## 📋 Exemplo Real - Orlando CSV

Seu CSV do Orlando tem essas colunas:
```csv
account_number,owner_name,property_address,market_value_2025,
year_built,beds,baths,mailing_address,sqft,total_tax_due
```

**Mapeamento automático:**
```
account_number     → origem              (99% ✨)
owner_name         → owner_name          (99% ✨)
property_address   → address             (99% ✨)
market_value_2025  → estimated_value     (95% ✨)
year_built         → year_built          (99% ✨)
beds               → bedrooms            (99% ✨)
baths              → bathrooms           (99% ✨)
mailing_address    → owner_address       (99% ✨)
sqft               → square_feet         (99% ✨)
total_tax_due      → Skip                (manual)
```

## 🔧 Customização

### Adicionar Novos Mapeamentos

Se uma coluna não for detectada, adicione em `csvColumnMappings.ts`:

```typescript
estimated_value: [
  // ... existentes
  'sua_coluna_customizada',  // ADICIONAR
  'outro_nome_possivel',      // ADICIONAR
],
```

### Mudar Número de Linhas no Preview

```tsx
<VisualColumnMapper
  csvData={csvData.slice(0, 5)}  // Mostra 5 linhas
  // ou
  csvData={csvData.slice(0, 10)} // Mostra 10 linhas
/>
```

## ⚡ Performance

- ✅ Rápido mesmo com CSVs grandes
- ✅ Preview usa apenas primeiras 10 linhas
- ✅ Não carrega todo CSV na memória
- ✅ Validação em tempo real

## 🐛 Troubleshooting

### "Missing required: Valor Estimado"
**Problema:** CSV não tem coluna de valor
**Solução:**
1. Procure coluna com preço/valor
2. Mapeie manualmente para "Valor Estimado"
3. Ou adicione valores padrão no CSV

### "Auto-Detect não encontrou X"
**Problema:** Nome da coluna muito diferente
**Solução:**
1. Mapeie manualmente usando dropdown
2. Ou adicione variação em `csvColumnMappings.ts`

### Preview mostra dados errados
**Problema:** Coluna mapeada para campo errado
**Solução:**
1. Mude o dropdown para campo correto
2. Veja preview atualizar em tempo real

## 📝 Changelog

**v1.0** (2026-01-04)
- ✨ Interface visual interativa
- ✅ Preview de dados do CSV
- 🤖 Auto-detect com IA
- 📊 Stats em tempo real
- ⚠️ Validação de campos obrigatórios
- 🏷️ Categorização de campos
- 🎨 Design moderno com Shadcn UI

## 🎯 Próximos Updates

- [ ] Salvar templates de mapeamento
- [ ] Histórico de imports anteriores
- [ ] Validação de formato (telefone, CEP, etc.)
- [ ] Sugestões de correção de dados
- [ ] Export de mapeamentos
- [ ] Import de mapeamentos salvos

---

**🎨 Visual Column Mapper - Made with ❤️ for Orlando Real Estate**
