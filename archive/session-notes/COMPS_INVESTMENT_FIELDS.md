# 💰 Campos de Investimento - Análise de Comps

## Resumo das Melhorias Implementadas

Atualizamos a tela de Comps Analysis para incluir campos essenciais para análise de investimento imobiliário, baseados em planilhas profissionais de comps.

---

## 📊 Novos Campos Adicionados

### **Tabela de Comparáveis - Colunas:**

| Campo | Descrição | Exemplo | Importância |
|-------|-----------|---------|-------------|
| **Address** | Endereço da propriedade | 1210 N Evergreen St | Localização |
| **Sale Date** | Data da venda | Dec 17, 2025 | Recência (3-6 meses ideal) |
| **Price/Unit** | Preço por unidade | $45,000 | Métrica para multi-family |
| **Sqft** | Metragem quadrada da casa | 1,312 | Comparação de tamanho |
| **$/Sqft** | Preço por pé quadrado | $82 | Métrica padrão de mercado |
| **Beds/Ba** | Quartos/Banheiros | 4bd / 1ba | Configuração |
| **Units** | Número de unidades | 4 | Multi-family vs single |
| **Rent/Unit** | Aluguel por unidade | $500 | Potencial de renda |
| **NOI** | Net Operating Income | $10,800 | Lucro operacional |
| **Cap Rate** | Taxa de capitalização | 6.00% | Retorno do investimento |
| **Condition** | Condição da propriedade | Reformada | Estado atual |

---

## 🔢 Métricas de Investimento Calculadas

### 1. **Cap Rate (Taxa de Capitalização)**
```
Fórmula: (NOI / Preço de Venda) × 100
Exemplo: ($10,800 / $180,000) × 100 = 6.00%

Interpretação:
✅ Acima de 6% → Bom investimento
⚠️ 4-6% → Moderado
❌ Abaixo de 4% → Fraco retorno
```

### 2. **NOI (Net Operating Income)**
```
Fórmula: (Receita Anual de Aluguel × (1 - Expense Ratio))
Exemplo: ($2,000 × 12) × (1 - 0.55) = $10,800

Components:
- Receita Total = Rent/Unit × Units × 12 meses
- Expense Ratio = 50-65% (operacional)
- NOI = Lucro após despesas operacionais
```

### 3. **Price/Unit (Preço por Unidade)**
```
Fórmula: Preço Total / Número de Unidades
Exemplo: $180,000 / 4 units = $45,000/unit

Uso: Comparar multi-family properties
```

### 4. **Rent/Unit (Aluguel por Unidade)**
```
Fórmula: Total Rent / Units
Exemplo: $2,000 / 4 = $500/unit

Benchmark: ~0.8% do valor da unidade
```

### 5. **Expense Ratio**
```
Range: 50-65% das receitas
Média: 55%

Inclui:
- Property taxes
- Insurance
- Maintenance
- Utilities
- Management fees
- Reserves
```

---

## 🏷️ Estados de Condição

| Badge | Condição | Descrição | Impacto no Preço |
|-------|----------|-----------|------------------|
| 🟢 **Reformada** | reformed | Completamente renovada | +15% a +25% |
| 🔵 **Boa** | good | Bem mantida, pronta | Baseline |
| 🟡 **Precisa Reforma** | needs_work | Requer trabalho | -10% a -20% |
| 🔴 **As-is** | as-is | Vendida no estado atual | -20% a -35% |

---

## 📈 Cards de Análise de Mercado

### Cards Padrão (sempre mostrados):
1. **Avg Sale Price** - Preço médio de venda
2. **Avg Price/Sqft** - Preço médio por pé quadrado
3. **Suggested Value Range** - Faixa de valor sugerida
4. **Market Trend** - Tendência de mercado (% up/down)

### Cards de Investimento (mostrados quando disponíveis):
5. **Avg Cap Rate** - Taxa de capitalização média
6. **Avg NOI** - NOI médio
7. **Avg Rent/Unit** - Aluguel médio por unidade

---

## 🎯 Exemplo Real vs Mockup

### Baseado no exemplo fornecido:

**Propriedade: Memphis Multi-Family**

| # | Address | Units | Total Rent | Rent/Unit | SOLD FOR | PRICE/UNIT | NOI | CAP RATE |
|---|---------|-------|------------|-----------|----------|------------|-----|----------|
| 1 | 1210 N Evergreen St | 4 | $2,000 | $500 | $180,000 | $45,000 | $10,800 | 6.00% |
| 2 | 198 N Evergreen St | 3 | $1,805 | $602 | $151,700 | $50,567 | $9,747 | 6.43% |
| 3 | 912 Hubert Ave | 4 | $2,365 | $591 | $205,000 | $51,250 | $12,771 | 6.23% |

**Médias:**
- Avg Sale Price: $178,900
- Avg Price/Unit: $48,938
- Avg Rent/Unit: $564
- Avg Cap Rate: 6.22%
- Avg NOI: $11,106

---

## 🔍 Como Interpretar os Dados

### Análise de Cap Rate:
```
6.00% - 6.50% → Mercado competitivo, bom investimento
5.00% - 5.99% → Retorno moderado
4.00% - 4.99% → Retorno baixo, mercado premium
< 4.00% → Evitar (a menos que seja apreciação)
> 7.00% → Ótimo retorno (verificar riscos)
```

### Análise de Rent/Unit:
```
Regra 1% Rule:
Rent/Unit deveria ser ~1% do preço da unidade
$500/mo → Ideal para unidade de $50,000
$600/mo → Ideal para unidade de $60,000

Se está abaixo → Renegociar ou evitar
Se está acima → Excelente oportunidade
```

### Análise de Condição:
```
Reformed → Pague premium, sem surpresas
Good → Padrão, faça inspeção normal
Needs Work → Desconte custos de reforma
As-is → Desconto significativo, para investidores experientes
```

---

## 💡 Fluxo de Análise Recomendado

### 1. Analisar Comparáveis
```
✅ Verificar vendas recentes (últimos 6 meses)
✅ Comparar Cap Rates
✅ Avaliar condição vs preço
✅ Checar rent/unit vs mercado
✅ Calcular NOI potencial
```

### 2. Calcular Oferta
```
Baseado em:
- Avg Cap Rate alvo (6%+)
- Rent/Unit realista
- Custo de reformas necessárias
- Expense Ratio esperado (55%)
- ROI desejado
```

### 3. Exemplo de Cálculo de Oferta
```
Propriedade Alvo:
- 4 units
- Condição: Needs Work
- Rent potencial: $550/unit

Cálculo:
1. Receita anual: $550 × 4 × 12 = $26,400
2. NOI (55% expense): $26,400 × 0.45 = $11,880
3. Cap Rate alvo: 6.5%
4. Valor máximo: $11,880 / 0.065 = $182,769
5. Custos de reforma: -$15,000
6. Oferta: $167,769 → arredondar para $165,000
```

---

## 📱 Interface Visual

### Badges de Cap Rate
- **Verde (>6%)**: Bom retorno
- **Cinza (4-6%)**: Retorno moderado
- **Vermelho (<4%)**: Retorno fraco (não exibido ainda, pode adicionar)

### Badges de Condição
- **Azul**: Reformada
- **Cinza**: Boa
- **Outline**: Precisa Reforma
- **Vermelho**: As-is

### Cores de Destaque
- **Rent/Unit**: Verde escuro (indica receita)
- **NOI**: Preto bold (métrica chave)
- **Cap Rate**: Badge colorido (KPI principal)
- **Price/Unit**: Bold (métrica de comparação)

---

## 🔄 Integração com Dados Reais

### Para conectar com MLS ou APIs:

```typescript
const fetchRealComparables = async (property: Property) => {
  const response = await fetch(`/api/mls/comps`, {
    method: 'POST',
    body: JSON.stringify({
      address: property.address,
      radius: 1, // mile
      propertyType: 'multi-family',
      soldWithin: 6, // months
      minUnits: 2,
      maxUnits: 6
    })
  });

  const comps = await response.json();

  // Transform para nosso formato
  const transformed = comps.map(comp => ({
    ...comp,
    units: comp.numberOfUnits,
    totalRent: comp.monthlyRent,
    rentPerUnit: comp.monthlyRent / comp.numberOfUnits,
    expenseRatio: 0.55,
    noi: calculateNOI(comp),
    capRate: calculateCapRate(comp),
    condition: mapCondition(comp.propertyCondition)
  }));

  setComparables(transformed);
};
```

---

## 📋 Checklist para Análise Completa

### Dados Obrigatórios:
- [ ] Endereço da propriedade
- [ ] Data da venda (< 6 meses)
- [ ] Preço de venda
- [ ] Metragem (sqft)
- [ ] Quartos/Banheiros
- [ ] Número de unidades
- [ ] Condição da propriedade

### Dados de Investimento:
- [ ] Aluguel por unidade
- [ ] NOI
- [ ] Cap Rate
- [ ] Expense Ratio
- [ ] Metragem do terreno (lot size)

### Análise:
- [ ] Comparar Cap Rates
- [ ] Verificar Price/Unit
- [ ] Analisar Rent/Unit vs mercado
- [ ] Calcular oferta baseada em métricas
- [ ] Documentar ajustes necessários

---

## 🚀 Próximas Melhorias Sugeridas

1. **Adicionar colunas opcionais:**
   - Lot Size (metragem terreno)
   - Year Built (ano de construção)
   - Distance (distância da propriedade alvo)
   - Days on Market (DOM)

2. **Filtros avançados:**
   - Filtrar por Cap Rate mínimo
   - Filtrar por condição
   - Filtrar por número de unidades
   - Filtrar por data de venda

3. **Visualizações:**
   - Gráfico de Cap Rate vs Preço
   - Gráfico de tendência de preços
   - Mapa com localização dos comps

4. **Exportação:**
   - Atualizar PDF para incluir novos campos
   - Exportar para Excel com todas as métricas
   - Template customizável de relatório

---

## 📞 Glossário de Termos

| Termo | Significado |
|-------|-------------|
| **Cap Rate** | Taxa de capitalização - ROI anual de um imóvel |
| **NOI** | Net Operating Income - Lucro operacional líquido |
| **Expense Ratio** | Percentual de despesas sobre receita |
| **Price/Unit** | Preço total dividido pelo número de unidades |
| **Rent/Unit** | Aluguel mensal por unidade |
| **DOM** | Days on Market - Dias no mercado |
| **Sqft** | Square feet - Pés quadrados |
| **Multi-family** | Propriedade com múltiplas unidades |
| **As-is** | Vendida no estado atual |
| **Reformed** | Reformada/Renovada |

---

**Criado:** Janeiro 2026
**Versão:** 2.0.0
**Última Atualização:** Janeiro 14, 2026
