# Comps Analysis - Análise Comparativa de Mercado (CMA)

## 📋 Visão Geral

Sistema completo de Análise Comparativa de Mercado (Comparative Market Analysis - CMA) para avaliação de propriedades com exportação profissional para PDF incluindo imagens e todos os dados.

## 🚀 Instalação

### Dependências Necessárias

Execute o seguinte comando para instalar as bibliotecas de geração de PDF:

```bash
cd "Step 5 - Outreach & Campaigns"
npm install jspdf jspdf-autotable
```

**Nota:** Se houver erros durante a instalação devido a permissões de arquivo, tente:
1. Fechar o servidor de desenvolvimento (`npm run dev`)
2. Fechar o VSCode ou qualquer editor que esteja acessando os arquivos
3. Executar o comando de instalação novamente
4. Se persistir, deletar `node_modules` e executar `npm install`

## 📁 Arquivos Criados

### Componentes
- **`src/components/marketing/CompsAnalysis.tsx`** - Componente principal da tela de análise
- **`src/components/ViewCompsButton.tsx`** - Botão reutilizável para acessar comps de qualquer lugar

### Utilitários
- **`src/utils/pdfExport.ts`** - Funções de exportação de PDF com duas opções:
  - `exportCompsToPDF()` - PDF completo com imagens e formatação profissional
  - `exportCompsToSimplePDF()` - PDF rápido sem imagens

### Integrações
- **`src/components/marketing/MarketingApp.tsx`** - Rota `/marketing/comps` adicionada
- **`src/components/marketing/LeadsManagerEnhanced.tsx`** - Botão de comps no gerenciador de leads

## 🎯 Funcionalidades

### 1. Seleção de Propriedade
- Dropdown com todas as propriedades ativas
- Exibição de detalhes: endereço, cidade, valor estimado, oferta atual

### 2. Comparáveis Automáticos
Gera 5 propriedades comparáveis com:
- Endereço
- Data de venda (últimos 3-6 meses)
- Preço de venda
- Metragem quadrada
- Preço por pé quadrado
- Quartos/Banheiros
- Ano de construção
- Distância da propriedade principal
- Dias no mercado
- Campo de ajuste manual
- Preço ajustado

### 3. Análise de Mercado
Exibe automaticamente:
- **Preço médio de venda** dos comparáveis
- **Preço médio por pé quadrado**
- **Faixa de valor sugerida** (mínimo - máximo)
- **Tendência de mercado** com porcentagem (subindo/descendo/estável)

### 4. Exportação de PDF

#### Opção 1: PDF Completo com Imagens
Clique em **"Export PDF com Imagens"** para gerar um relatório profissional incluindo:

**Cabeçalho:**
- Logo/Nome da empresa (MyLocalInvest)
- Título do relatório
- Data de geração

**Seção de Propriedade:**
- Todos os detalhes da propriedade
- Imagem da propriedade (se disponível)
- Endereço completo

**Análise de Mercado:**
- Cards visuais com métricas principais
- Gráficos de tendência
- Cores codificadas (verde para alta, vermelho para baixa)

**Tabela de Comparáveis:**
- Tabela formatada com todas as 11 colunas
- Linhas alternadas para fácil leitura
- Ajustes destacados

**Notas e Disclaimers:**
- Metodologia de análise
- Critérios de seleção dos comparáveis
- Avisos legais

**Rodapé:**
- Número da página
- Informações de contato

#### Opção 2: Quick PDF (Rápido)
Clique em **"Quick PDF"** para gerar um relatório simplificado sem imagens, ideal para compartilhamento rápido.

### 5. Ajustes Manuais
- Adicione ajustes de valor (+/-) em cada comparável
- Útil para compensar diferenças como:
  - Piscina (+$10,000)
  - Reformas necessárias (-$15,000)
  - Garagem extra (+$5,000)
  - Etc.

## 📍 Como Acessar

### Via Navegação
1. Acesse `/marketing/comps` diretamente
2. Ou navegue pelo sidebar: **Marketing → Comps Analysis**

### Via Leads Manager
1. Vá para `/marketing/leads`
2. Clique no ícone de casa (🏠) na coluna de ações de qualquer lead com propriedade

### Via Botão Customizado
Use o componente `ViewCompsButton` em qualquer lugar:

```tsx
import { ViewCompsButton } from '@/components/ViewCompsButton';

// Sem propriedade específica
<ViewCompsButton />

// Com propriedade específica
<ViewCompsButton propertyId={property.id} />
```

## 🔧 Configuração e Personalização

### Modificar Logo/Branding no PDF

Edite em `src/utils/pdfExport.ts`:

```typescript
const addHeader = (doc: jsPDF, reportTitle: string) => {
  // Altere aqui
  doc.text('MyLocalInvest', 20, 25);
  doc.text('Orlando Real Estate Investment', 20, 32);

  // Para adicionar logo real:
  // const logo = await loadImageAsBase64('URL_DA_LOGO');
  // doc.addImage(logo, 'PNG', 20, 15, 40, 15);
}
```

### Modificar Cores do PDF

```typescript
// Cor primária (azul)
doc.setTextColor(37, 99, 235);

// Cor de fundo dos cards
doc.setFillColor(239, 246, 255);

// Tendência verde
doc.setTextColor(34, 197, 94);

// Tendência vermelha
doc.setTextColor(239, 68, 68);
```

### Adicionar Mais Campos nos Comparáveis

1. Atualize a interface `ComparableProperty` em `CompsAnalysis.tsx`
2. Adicione o campo na função `generateComparables()`
3. Inclua na tabela de exportação em `pdfExport.ts`

## 📊 Dados e Integração

### Dados Atuais
- **Mock Data**: Sistema gera comparáveis realísticos baseados no valor estimado da propriedade
- **Variação**: ±15% do valor base
- **Datas**: Vendas nos últimos 120 dias

### Integração com APIs Reais

Para conectar com MLS, Zillow, ou outras fontes:

```typescript
// Em CompsAnalysis.tsx, substitua generateComparables():

const fetchRealComparables = async (property: Property) => {
  const response = await fetch(`/api/comps`, {
    method: 'POST',
    body: JSON.stringify({
      address: property.address,
      city: property.city,
      state: property.state,
      radius: 1, // milhas
      limit: 5
    })
  });

  const comps = await response.json();
  setComparables(comps);
};
```

### Salvar Relatórios no Banco

Atualize a função `saveReport()`:

```typescript
const saveReport = async () => {
  const { error } = await supabase
    .from('property_comps')
    .insert({
      property_id: selectedProperty.id,
      comparables: comparables,
      analysis: analysis,
      created_at: new Date().toISOString()
    });

  // Tratar erro/sucesso
};
```

## 🎨 Campos do Relatório PDF

### Informações da Propriedade
- ✅ Endereço completo
- ✅ Cidade, Estado, CEP
- ✅ Valor estimado
- ✅ Oferta atual em dinheiro
- ✅ Imagem da propriedade

### Comparáveis (5 propriedades)
- ✅ Número sequencial (#1-5)
- ✅ Endereço
- ✅ Data de venda
- ✅ Preço de venda
- ✅ Metragem (sqft)
- ✅ Preço por pé quadrado
- ✅ Quartos/Banheiros
- ✅ Distância (milhas)
- ✅ Dias no mercado (DOM)
- ✅ Ajuste manual
- ✅ Preço ajustado

### Análise
- ✅ Preço médio de venda
- ✅ Preço médio por sqft
- ✅ Faixa de valor sugerida
- ✅ Tendência de mercado (%, direção)

### Metadados
- ✅ Data do relatório
- ✅ Nome da empresa
- ✅ Informações de contato
- ✅ Número da página
- ✅ Notas metodológicas
- ✅ Disclaimers legais

## 🐛 Troubleshooting

### PDF não está sendo gerado
1. Verifique se as dependências foram instaladas: `npm list jspdf jspdf-autotable`
2. Abra o console do navegador (F12) para ver erros
3. Verifique se uma propriedade está selecionada

### Imagem não aparece no PDF
1. Verifique se `property_image_url` não é null
2. Confirme que a URL da imagem é acessível
3. Teste se há CORS issues (imagens de outro domínio)

### Erro de permissão ao instalar
```bash
# Limpe o cache do npm
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstale
npm install
```

### Tabela cortada no PDF
- Ajuste o tamanho da fonte em `pdfExport.ts`
- Reduza número de colunas ou use página landscape:
```typescript
const doc = new jsPDF('landscape'); // ao invés de portrait
```

## 📞 Suporte

Para questões ou melhorias:
1. Revise este README
2. Verifique os comentários no código
3. Consulte a documentação do jsPDF: https://github.com/parallax/jsPDF

## ✨ Próximas Melhorias Sugeridas

- [ ] Adicionar gráficos de tendência ao PDF
- [ ] Permitir upload de fotos dos comparáveis
- [ ] Integração com Google Maps para mostrar localização
- [ ] Salvar histórico de relatórios gerados
- [ ] Enviar PDF por email diretamente
- [ ] Template customizável de relatório
- [ ] Comparação lado a lado de propriedades
- [ ] Exportar para Excel/CSV além de PDF
