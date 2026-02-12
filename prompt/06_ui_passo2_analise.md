PROMPT 06 - PASSO 2: ABA ANALISE (APROVAR/NEGAR)

Pre-condicao
Passo 1 funcional.

Objetivo
Criar fluxo rapido de analise para decisao APROVADA/NEGADA para abordagem.

Requisitos
- NEGADA exige motivo obrigatorio
- Gravar analista + data/hora + motivo
- Mostrar lista filtravel (pendentes/aprovadas/negadas)
- Atalho rapido de decisao para produtividade

Arquivos que DEVEM ser reaproveitados
- src/components/PropertyApprovalDialog.tsx
- src/components/PropertyApprovalFilter.tsx
- src/pages/Admin.tsx

Se necessario criar nova pagina
- src/pages/process/Step2Analise.tsx

Entregaveis
- tela do passo 2
- docs/process5/06-step2-analise.md

Validacao
- npm run type-check
- teste manual:
  - aprovar 1 propriedade
  - negar 1 propriedade com motivo
  - verificar persistencia no banco
