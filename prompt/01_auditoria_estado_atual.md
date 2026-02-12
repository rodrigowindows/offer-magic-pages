PROMPT 01 - AUDITORIA REAL DO ESTADO ATUAL (SEM IMPLEMENTAR)

Referencia visual (abrir antes de comecar)
1) Guia principal:
- docs/process5/GUIA_EXECUCAO_5_PASSOS.html
2) Guia complementar de fluxo atual:
- docs/process5/FLUXO_ATUAL_E_SUGESTOES.html

Contexto
Voce esta no repositorio Orlando/Step 5 - Outreach & Campaigns.
Sua tarefa e fazer auditoria tecnica real do fluxo de 5 passos (Base, Analise, Contatos, Comparativos, Oferta minima), sem assumir nada sem evidencias.

Arquivos que DEVEM ser auditados
- src/pages/ImportProperties.tsx
- src/components/CSVImporter.tsx
- src/components/BulkImportDialog.tsx
- src/components/ColumnMappingDialog.tsx
- src/components/ColumnMappingDialogWithAI.tsx
- src/pages/Admin.tsx
- src/components/AdvancedPropertyFilters.tsx
- src/components/UnifiedPropertyFilters.tsx
- src/components/PropertyApprovalFilter.tsx
- src/components/PropertyApprovalDialog.tsx
- src/components/ApprovedPropertiesExport.tsx
- src/pages/SkipTrace.tsx
- src/pages/SkipTracePage.tsx
- src/components/SkipTracingImporter.tsx
- src/components/SkipTraceDataViewer.tsx
- src/components/ManualCompsManager.tsx
- src/components/marketing/CompsAnalysis.tsx
- src/utils/urlUtils.ts
- supabase/functions/track-link-click/index.ts
- supabase/functions/track-analytics/index.ts

Comandos obrigatorios
1) rg -n "import_batch|import_date|last_sale|pool|year_built|lot_size|square_feet|bedrooms|bathrooms" src supabase
2) rg -n "approval_status|approved_by|approved_at|rejection_reason|rejection_notes|PropertyApproval" src supabase
3) rg -n "skip|phone|email|owner|person2|person3|relative" src supabase
4) rg -n "comp|manual_comps|sale_price|square_feet|qr|property_url" src supabase
5) npm run type-check

Entregaveis (obrigatorio criar)
- docs/process5/01-auditoria-matriz.md
- docs/process5/01-auditoria-riscos.md

Formato da matriz
Para cada requisito, marcar:
- Confirmado
- Parcial
- Ausente
E sempre informar evidencia com caminho + linha.

Regra critica
Nao alterar codigo funcional neste prompt. So auditoria e documentacao.
