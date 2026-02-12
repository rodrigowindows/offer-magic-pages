PROMPT 04 - PASSO 1 (IMPORT): MAPEAR NOVOS CAMPOS NO PIPELINE

Pre-condicao
Prompt 03 concluido com migracao aplicada no codigo.

Objetivo
Atualizar pipeline de import para aceitar e persistir os novos campos do Passo 1.

Arquivos que DEVEM ser revisados e ajustados
- src/pages/ImportProperties.tsx
- src/components/CSVImporter.tsx
- src/components/BulkImportDialog.tsx
- src/components/ColumnMappingDialog.tsx
- src/components/ColumnMappingDialogWithAI.tsx

Mapeamentos obrigatorios
- data ultima venda -> last_sale_date
- valor ultima venda -> last_sale_value
- piscina -> has_pool (aceitar yes/no, sim/nao, true/false, 1/0)
- nome da base -> import_batch OU base_name (decisao documentada)

Regras
- CSV antigo sem essas colunas nao pode quebrar.
- Manter comportamento atual para colunas existentes.
- Normalizar dados no parse (numero, boolean, data).

Entregaveis
- codigo atualizado
- docs/process5/04-import-mapeamento.md com exemplos de cabecalho CSV aceito

Validacao
- npm run type-check
- executar fluxo de import com CSV de teste e registrar resultado no doc
