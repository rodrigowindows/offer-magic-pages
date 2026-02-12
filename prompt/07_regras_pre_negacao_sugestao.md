PROMPT 07 - PASSO 2: REGRAS DE PRE-NEGACAO (SUGESTAO)

Pre-condicao
Prompt 06 concluido.

Objetivo
Implementar engine de regras para sugerir pre-negacao (nao bloquear decisao humana).

Regras solicitadas
- propriedade nova (<20 anos)
- venda recente (<2 anos)
- casa boa
- multi-family
- HOA/HOI
- land
- low-equity
- anunciada por corretor
- comercial

Implementacao recomendada
- criar service isolado, ex: src/services/eligibilityRules.ts
- retorno estruturado: [{code, label, severity, reason}]
- UI mostra sugestoes e permite override do analista

Dados faltantes
Se alguma regra nao tiver dado suficiente no banco, marcar "indisponivel" de forma transparente.

Entregaveis
- service + integracao no passo 2
- docs/process5/07-regras-pre-negacao.md (matriz regra -> campo)

Validacao
- npm run type-check
- testes unitarios da engine
