PROMPT 08 - PASSO 2: PERMISSOES DE ANALISTA

Pre-condicao
Prompt 06/07 concluido.

Objetivo
Restringir acao de aprovar/negar para usuarios autorizados, sem hardcode fraco no frontend.

Requisito de negocio inicial
Analistas iniciais: Edson, Josiane, Rodrigo.

Implementacao
- Criar controle por role/permissao (ex: tabela de perfis, claim, ou policy)
- Frontend deve ocultar/desabilitar a acao se sem permissao
- Backend/persistencia deve recusar update sem permissao

Arquivos provaveis
- fluxo de auth atual
- componentes de aprovacao (PropertyApprovalDialog etc.)
- policies/migracoes se necessarias

Entregaveis
- controle funcional
- docs/process5/08-permissoes-analistas.md

Validacao
- npm run type-check
- teste com usuario autorizado e nao autorizado
