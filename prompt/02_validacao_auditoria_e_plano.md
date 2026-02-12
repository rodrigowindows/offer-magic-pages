PROMPT 02 - VALIDAR AUDITORIA E GERAR PLANO EXECUTAVEL

Entrada esperada
- docs/process5/01-auditoria-matriz.md
- docs/process5/01-auditoria-riscos.md

Objetivo
Validar se a auditoria esta correta comparando novamente com o codigo atual. Em seguida, gerar plano de implementacao em fases pequenas.

Passos obrigatorios
1) Revisar os 2 arquivos da auditoria.
2) Revalidar no codigo os itens marcados como Confirmado/Parcial/Ausente.
3) Corrigir inconsistencias detectadas.
4) Gerar backlog por fase com dependencia explicita.

Arquivos alvo para validacao
Mesmo conjunto do Prompt 01 +
- src/store/marketingStore.ts
- src/hooks/useMarketing.ts
- src/types/marketing.types.ts
- src/contexts/FeatureToggleContext.tsx

Entregaveis
- docs/process5/02-plano-fases.md
- docs/process5/02-backlog-priorizado.md

Cada fase deve conter
- objetivo
- arquivos a alterar
- migracao SQL necessaria
- criterio de aceite
- risco
- rollback

Validacao
- npm run type-check

Regra
Ainda nao implementar funcionalidades grandes. Este prompt e planejamento validado.
