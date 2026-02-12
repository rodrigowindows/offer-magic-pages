PROMPT 12 - PASSO 4: CALCULO MEDIO POR SQFT (ROBUSTO)

Pre-condicao
Prompt 11 concluido.

Objetivo
Padronizar e validar calculo medio de preco por sqft com transparencia.

Regras de calculo
- incluir apenas comps com sale_price > 0 e square_feet > 0
- exibir quantos comps validos entraram
- exibir formula final e media
- tratar outliers (documentar estrategia)

Implementacao recomendada
- service reutilizavel ex: src/services/compsPricing.ts
- UI exibe detalhes do calculo

Entregaveis
- service + integracao
- docs/process5/12-calculo-medio-sqft.md
- testes unitarios

Validacao
- npm run type-check
- rodar testes unitarios do service
