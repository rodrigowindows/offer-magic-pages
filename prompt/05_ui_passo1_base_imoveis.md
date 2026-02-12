PROMPT 05 - PASSO 1 (UI): ABA BASE DE IMOVEIS

Pre-condicao
Prompts 03 e 04 concluidos.

Objetivo
Criar uma tela/aba unica para Passo 1 com upload + filtros + listagem operacional.

Escopo funcional minimo
- Upload de base
- Filtro por cidade
- Filtro por estado
- Filtro por data de upload
- Filtro por nome da base (import_batch/base_name)
- Tabela/lista com campos principais

Arquivos candidatos (usar os existentes, evitar duplicar)
- src/pages/ImportProperties.tsx
- src/pages/Admin.tsx
- src/components/AdvancedPropertyFilters.tsx
- src/components/UnifiedPropertyFilters.tsx

Se criar nova pagina
- src/pages/process/Step1BaseImoveis.tsx
- integrar rota/menu no arquivo de navegacao atual

Entregaveis
- tela funcional
- docs/process5/05-ui-step1.md

Validacao
- npm run type-check
- npm run build
- checklist manual com 5 cenarios
