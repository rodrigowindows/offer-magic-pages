PROMPT 09 - PASSO 3: EXPORT DE APROVADAS PARA SKIP TRACE

Pre-condicao
Passo 2 funcional.

Objetivo
Criar exportacao de arquivo para fornecedor externo com APENAS propriedades aprovadas.

Campos minimos no CSV de export
- property_id
- address
- city
- state
- zip_code
- owner_name
- owner_address (se houver)
- base_name/import_batch

Arquivos relevantes
- src/components/ApprovedPropertiesExport.tsx
- src/pages/SkipTrace.tsx
- src/pages/SkipTracePage.tsx
- src/hooks/useSkipTraceData.ts

Entregaveis
- botao/export funcional no Passo 3
- docs/process5/09-export-skiptrace.md com layout do CSV

Validacao
- npm run type-check
- gerar CSV real e confirmar que nao inclui negadas
