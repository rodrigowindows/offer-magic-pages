

# Plano: Melhorias na UI do /process baseado no protótipo V3

## Resumo
Incorporar as melhores ideias do protótipo V3 na interface atual do `/process`, mantendo a arquitetura existente (React + Tailwind + Supabase) e melhorando tanto a experiência humana quanto a AI-operability.

## Mudancas Principais

### 1. Scores em formato tabela no PropertyCard
Substituir o grid de detalhes atual por uma tabela compacta no topo do card com as informacoes criticas:
- AI Score com cor semaforica e label (STRONG/REVIEW/CAUTION/WEAK)
- Lead Score com indicador (HIGH/STANDARD/LOW)
- Preco, Sqft, $/Sqft, Beds/Baths, Year Built
- "Meu Score" (AI Score input) inline na tabela, sempre visivel — sem toggle

### 2. Notas sempre visiveis
Remover o toggle de notas. O painel de notas fica sempre visivel abaixo da tabela de scores, com:
- Historico de notas existentes (scroll area compacta)
- Campo de nova nota com Enter para salvar
- Notas automaticas (geradas ao aprovar/rejeitar) com borda azul diferenciada

### 3. Comps em tabela inline
Mover a lista de comps de um componente separado para uma tabela integrada no card:
- Colunas: Endereco, Preco, Sqft, $/Sqft
- Botao "+ Adicionar Comp" abre linha de edicao inline
- Barra de resumo abaixo: Avg $/sqft, ARV, Margem

### 4. Oferta como campo direto
No fase "offer" do ActionArea, manter o input numerico direto (ja existe) mas adicionar:
- Calculo automatico de % do ARV ao lado
- Margem bruta visivel
- Remover qualquer fricao desnecessaria

### 5. Fotos sempre visiveis + Ctrl+V
Mover a galeria de fotos da propriedade para uma posicao mais proeminente com:
- Todas as fotos visiveis em linha horizontal com scroll
- Area de drop/paste para Ctrl+V
- Fotos de decisao coladas aparecem imediatamente

### 6. Rejeicao em 1 clique (opcional)
Adicionar modo de rejeicao rapida onde cada motivo e um botao que rejeita e registra em uma unica acao, sem precisar do formulario de dois passos.

### 7. data-action attributes para AI-operability
Adicionar `data-action` e `data-field` nos elementos interativos criticos para facilitar automacao via browser agents.

## Detalhes Tecnicos

### Arquivos a modificar:
1. **`src/components/review/PropertyCard.tsx`** — Refatorar layout: tabela de scores no topo, notas sempre visiveis, fotos proeminentes
2. **`src/components/review/AIScoreInput.tsx`** — Simplificar para renderizar como linha de tabela (inline)
3. **`src/components/review/ActionArea.tsx`** — Adicionar modo de rejeicao rapida (1-click), data-attributes
4. **`src/components/review/InlineCompsList.tsx`** — Converter para formato tabela com formulario inline de adicao
5. **`src/components/review/constants.ts`** — Adicionar helpers para score color/label

### Arquivos que NAO mudam:
- `ReviewQueue.tsx` — Orquestracao permanece igual
- `FilterBar.tsx` — Filtros ja funcionam bem
- `types.ts` — Tipos existentes suficientes
- Backend/Supabase — Nenhuma mudanca de schema

### Abordagem:
- Manter toda a logica de negocio existente (approve/reject flow, comps, keyboard shortcuts)
- Apenas reorganizar o layout e adicionar visibilidade aos componentes
- Usar componentes Tailwind/shadcn existentes (Table, Badge, Button, ScrollArea)
- Adicionar `data-action`/`data-field` nos elementos criticos para browser automation

