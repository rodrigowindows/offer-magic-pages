PROMPT 14 - INTEGRACAO FINAL: MENU/FLUXO DE 5 ABAS

Pre-condicao
Passos 1-5 implementados individualmente.

Objetivo
Integrar tudo em um fluxo unico com navegacao clara:
- Passo 1 Base de imoveis
- Passo 2 Analise
- Passo 3 Contatos
- Passo 4 Comparativos
- Passo 5 Oferta minima

Requisitos
- manter telas legadas funcionando
- mostrar progresso por etapa
- facilitar transicao entre etapas com contexto da mesma propriedade

Arquivos para revisar
- rotas/navegacao atual
- src/pages/Admin.tsx
- src/pages/ImportProperties.tsx
- src/pages/SkipTrace.tsx

Entregaveis
- fluxo integrado
- docs/process5/14-integracao-5-abas.md

Validacao
- npm run type-check
- npm run build
- teste ponta a ponta com 1 propriedade (do upload ate oferta)
