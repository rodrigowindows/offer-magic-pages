PROMPT 03 - PASSO 1 (SCHEMA): MIGRACOES ADITIVAS E TIPAGEM

Objetivo
Implementar somente o schema minimo para Passo 1, sem alterar UX completa ainda.

Campos alvo na tabela properties (aditivos)
- last_sale_date (date ou timestamp)
- last_sale_value (numeric)
- has_pool (boolean)
- base_name (text) APENAS se import_batch nao puder ser usado como nome livre

Arquivos para alterar
- supabase/migrations/* (nova migracao)
- src/integrations/supabase/client.ts (se necessario)
- tipos locais usados em componentes de import/admin

Regras de implementacao
- Nao remover nem renomear coluna existente.
- Se existir campo equivalente, documentar mapeamento e nao duplicar.
- Garantir default e nullability sem quebrar dados antigos.

Entregaveis
- migracao SQL
- docs/process5/03-schema-passo1.md com:
  - campos adicionados
  - justificativa
  - impacto nos componentes

Validacao obrigatoria
- npm run type-check
- npm run build (se falhar, documentar erro exato)

Commit sugerido
feat(step1): add property fields for last sale and pool
