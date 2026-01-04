# 👁️ Guia do Visual Column Matcher

## 🎉 O Que Foi Criado

Um componente **visual e interativo** que mostra lado a lado:
- **Esquerda:** Dados originais do CSV com exemplos reais
- **Centro:** Seletor de campo do banco de dados
- **Direita:** Preview de como os dados ficarão no banco

## ✨ Funcionalidades

### 1. **Preview de Dados Reais** 📊
- Mostra 2-5 exemplos reais de cada coluna do CSV
- Botão "expandir" para ver mais exemplos
- Dados em caixinhas com borda para fácil leitura

### 2. **Seleção Visual** 🎯
- Dropdown organizado por categoria:
  - 📍 Localização
  - 👤 Proprietário
  - 🏠 Detalhes do Imóvel
  - 💰 Financeiro
  - ⚙️ Sistema
- Campos obrigatórios marcados com *
- Opção de ignorar coluna

### 3. **Preview do Banco** ✅
- Mostra como os dados do CSV aparecerão no banco
- Formato: **Campo DB:** valor
- Background verde para fácil identificação
- Atualiza em tempo real

### 4. **Indicadores Visuais** 🎨
- Cards **verdes** = mapeado
- Cards **cinza** = não mapeado
- Badges de confiança (alta/média/baixa)
- Ícones de check/x

### 5. **Resumo no Rodapé** 📈
- Total de colunas mapeadas
- Total ignoradas
- Total sem mapear

---

## 🔧 Como Integrar

### Passo 1: Importar o Componente

Em `src/components/ColumnMappingDialog.tsx`:

```tsx
import VisualColumnMatcher from "./VisualColumnMatcher";
```

### Passo 2: Adicionar csvData como Prop

```tsx
interface ColumnMappingDialogProps {
  csvHeaders: string[];
  csvData?: Array<{ [key: string]: string }>; // ADICIONAR
  onMappingChange: (mappings: ColumnMapping[]) => void;
  initialMappings?: ColumnMapping[];
}
```

### Passo 3: Usar o Componente

Substitua ou adicione junto com a lista de mapeamentos (por volta da linha 460):

```tsx
{/* Visual Column Matcher */}
{csvData && csvData.length > 0 && (
  <VisualColumnMatcher
    csvHeaders={csvHeaders}
    csvData={csvData}
    currentMappings={mappings}
    onMappingChange={(newMappings) => {
      setMappings(newMappings);
      onMappingChange(newMappings);
    }}
  />
)}
```

### Passo 4: Passar csvData do ImportProperties

Em `src/pages/ImportProperties.tsx`:

```tsx
<ColumnMappingDialog
  csvHeaders={csvHeaders}
  csvData={csvPreview}  // ADICIONAR
  onMappingChange={handleMappingChange}
  initialMappings={columnMappings}
/>
```

---

## 🎨 Interface Visual

### Cada Linha de Mapeamento Mostra:

```
┌─────────────────────────────────────────────────────────────┐
│  CSV                          →           BANCO             │
│  ────                                     ─────             │
│  Owner Full Name                                            │
│  ┌─────────────────┐         →    [Selecionar campo...]    │
│  │ JOHN SMITH      │              ┌──────────────────┐     │
│  │ MARY JOHNSON    │              │ Nome do Prop...  │     │
│  └─────────────────┘              └──────────────────┘     │
│  + 3 mais exemplos                                          │
│                                   ┌──────────────────┐     │
│                                   │ owner_name:      │     │
│                                   │ JOHN SMITH       │     │
│                                   │                  │     │
│                                   │ owner_name:      │     │
│                                   │ MARY JOHNSON     │     │
│                                   └──────────────────┘     │
│                                                         ✓   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Exemplos de Uso

### Exemplo 1: CSV com "Owner Full Name"

**CSV mostra:**
```
Owner Full Name
├─ JOHN SMITH
├─ MARY JOHNSON
└─ BOB WILLIAMS
```

**Você seleciona:** `owner_name (Nome do Proprietário)`

**Preview do Banco mostra:**
```
✅ Nome do Proprietário: JOHN SMITH
✅ Nome do Proprietário: MARY JOHNSON
✅ Nome do Proprietário: BOB WILLIAMS
```

### Exemplo 2: CSV com "Property Full Address"

**CSV mostra:**
```
Property Full Address
├─ 123 MAIN ST ORLANDO FL
├─ 456 ELM AVE ORLANDO FL
└─ 789 OAK DR ORLANDO FL
```

**Você seleciona:** `address (Endereço)`

**Preview do Banco mostra:**
```
✅ Endereço: 123 MAIN ST ORLANDO FL
✅ Endereço: 456 ELM AVE ORLANDO FL
✅ Endereço: 789 OAK DR ORLANDO FL
```

---

## 🎯 Benefícios

### Para o Usuário:
- ✅ **Vê exemplos reais** antes de mapear
- ✅ **Confirma visualmente** que está correto
- ✅ **Evita erros** de mapeamento
- ✅ **Interface intuitiva** - não precisa adivinhar

### Para o Sistema:
- ✅ **Validação em tempo real**
- ✅ **Feedback visual imediato**
- ✅ **Menos erros de importação**
- ✅ **Maior confiança do usuário**

---

## 🔄 Fluxo de Trabalho

1. **Carregar CSV**
2. **Sistema tenta auto-mapear** (com matching inteligente)
3. **Visual Column Matcher aparece**
4. **Usuário vê:**
   - Dados originais do CSV (esquerda)
   - Sugestão de mapeamento (centro)
   - Preview no banco (direita)
5. **Usuário ajusta** se necessário
6. **Confirma e importa**

---

## 🎨 Customizações Possíveis

### Mudar Número de Exemplos:
```tsx
{examples.slice(0, isExpanded ? 10 : 3).map((example, i) => (
  // Mostra 3 exemplos por padrão, 10 quando expandido
))}
```

### Adicionar Transformações:
```tsx
{preview.original.toUpperCase()} // Uppercase
{preview.original.trim()} // Remove espaços
{formatPhone(preview.original)} // Formatar telefone
```

### Adicionar Validações:
```tsx
{isValidEmail(example) ? (
  <Badge variant="success">✓ Email válido</Badge>
) : (
  <Badge variant="destructive">✗ Email inválido</Badge>
)}
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Lista Simples):
```
CSV Column           →    DB Field
─────────────────────────────────────
Owner Full Name      →    [selector]
```

**Problema:** Usuário não sabe se está correto!

### Depois (Visual Matcher):
```
CSV                        →           BANCO
────────────────────────────────────────────────
Owner Full Name                   Nome do Proprietário
┌─────────────┐           →    ┌────────────────────┐
│ JOHN SMITH  │                │ owner_name:        │
│ MARY J...   │                │ JOHN SMITH         │
└─────────────┘                └────────────────────┘
              ✓
```

**Solução:** Usuário **VÊ** que está correto! ✅

---

## 🧪 Testes Recomendados

### Teste 1: Mapeamento Correto
- [ ] Carregar CSV
- [ ] Ver exemplos aparecerem
- [ ] Selecionar campo
- [ ] Ver preview atualizar
- [ ] Confirmar dados corretos

### Teste 2: Múltiplos Exemplos
- [ ] Clicar em "expandir"
- [ ] Ver mais exemplos
- [ ] Clicar em "recolher"
- [ ] Ver menos exemplos

### Teste 3: Diferentes Tipos
- [ ] Testar com endereços
- [ ] Testar com nomes
- [ ] Testar com valores
- [ ] Testar com datas

### Teste 4: Ignorar Colunas
- [ ] Selecionar "Ignorar"
- [ ] Ver preview desaparecer
- [ ] Card ficar cinza

---

## 🐛 Troubleshooting

### Preview não aparece?
- Verifique se `csvData` está sendo passado
- Verifique se tem dados no CSV (pelo menos 1 linha)

### Exemplos vazios?
- CSV pode ter linhas vazias no topo
- Verificar se está lendo dados corretos

### Seletor não atualiza?
- Verificar se `onMappingChange` está sendo chamado
- Verificar se `setMappings` está atualizando estado

---

## 📝 Próximas Melhorias Sugeridas

1. **Validação de Formato**
   - Validar email, telefone, CEP
   - Mostrar warning se formato errado

2. **Transformações Automáticas**
   - Uppercase para nomes
   - Format para telefones
   - Trim espaços

3. **Sugestões Inteligentes**
   - Baseado em formato dos dados
   - Baseado em nome da coluna
   - Baseado em padrões históricos

4. **Estatísticas por Campo**
   - Quantos valores únicos
   - Quantos vazios
   - Tipo de dados detectado

5. **Bulk Actions**
   - Mapear todos os similares
   - Ignorar todos os vazios
   - Aceitar todas as sugestões

---

## ✅ Checklist de Integração

- [ ] Arquivo `VisualColumnMatcher.tsx` criado
- [ ] Importar no `ColumnMappingDialog.tsx`
- [ ] Adicionar prop `csvData`
- [ ] Adicionar componente na UI
- [ ] Passar `csvData` do `ImportProperties.tsx`
- [ ] Testar com CSV real
- [ ] Verificar exemplos aparecem
- [ ] Testar seleção de campos
- [ ] Verificar preview atualiza
- [ ] Confirmar importação funciona

---

## 🎉 Resultado Final

Com o **Visual Column Matcher**, o usuário:
- ✅ **VÊ** os dados originais
- ✅ **SELECIONA** o campo correto
- ✅ **CONFIRMA** o preview
- ✅ **IMPORTA** com confiança!

**Processo 10x mais visual e confiável!** 🚀
