
Diagnóstico do que está acontecendo (confere com o seu relato):
1) O comportamento atual realmente faz o botão de comparativos “sumir” em alguns momentos do fluxo.
- Hoje, o botão COMPS aparece só na fase de aprovação (`approvePhase = 'choose'`) na `ActionArea`.
- Depois que o modal fecha, o fluxo muda para oferta (`approvePhase = 'offer'`) e você perde um atalho claro para voltar aos comparativos.
- Em imóveis já aprovados (filtro “Aprovados”), a área de ação fica em modo leitura e não mostra ação de comparativos.

2) Existe risco real de perda de preenchimento parcial.
- O formulário do `CompsModal` é resetado quando abre/troca imóvel.
- Se você sair para Zillow/Redfin e voltar sem ter salvo, os campos preenchidos somem.

3) Sobre “entrou ou não entrou?”:
- O backend tem vários comparativos salvos para imóveis aprovados, mas também há imóvel aprovado recente com `comps_count = 0`, então sua dúvida faz sentido: hoje falta transparência imediata na tela principal para confirmar o que foi salvo.

Objetivo da correção:
- Garantir acesso contínuo aos comparativos (pendente, durante oferta e aprovado).
- Evitar perda de dados não salvos.
- Deixar visível na mesma tela quantos comparativos já existem por imóvel e quais são.
- Completar os campos operacionais do comparativo conforme fluxo do Passo 4.

Plano de implementação (ordem de execução):

Fase 1 — Tornar o acesso aos comparativos persistente
1. Ajustar `src/components/review/ActionArea.tsx`
- Incluir botão “Comparativos” também:
  - no estado padrão (antes de aprovar),
  - no estado `offer`,
  - e no modo leitura de “Aprovados”.
- Mostrar badge com quantidade de comps (ex.: `0`, `1`, `3`) para reduzir dúvida de salvamento.

2. Ajustar `src/components/shared/ReviewQueue.tsx`
- Desacoplar abertura do `CompsModal` da fase de aprovação.
- Permitir abrir o modal para o `currentProperty` em qualquer status.
- Manter comportamento atual de aprovação, mas sem bloquear reabertura de comps.
- Ao fechar modal: atualizar contagem/lista de comps sem forçar o usuário a perder contexto.

Fase 2 — Evitar perda de dados ao sair para Zillow/Redfin
3. Ajustar `src/components/process/CompsModal.tsx`
- Implementar rascunho local por imóvel (chave por `property.id`) para:
  - URL,
  - preço,
  - área,
  - demais campos novos.
- Limpar rascunho somente após salvar com sucesso ou cancelar explicitamente.
- Adicionar botão “Copiar endereço” da propriedade alvo no topo do modal.

Fase 3 — Completar campos do comparativo (Passo 4)
4. Evoluir formulário e payload de comps
- Em `CompsModal` + `useComps`, suportar campos:
  - endereço completo do comp,
  - link Zillow/Redfin,
  - data de venda,
  - valor de venda,
  - área construída,
  - área total,
  - quartos,
  - banheiros.
- Como `comp_data` já é JSONB, não é obrigatório criar migração para esses campos (armazenar no JSONB mantendo retrocompatibilidade).
- Atualizar tipagem em `src/hooks/useComps.ts` para contemplar os novos atributos no `SavedComp.comp_data`.

Fase 4 — Transparência imediata na tela principal
5. Exibir resumo/lista curta de comparativos na fila
- Em `ReviewQueue` (ou `PropertyCard`), mostrar:
  - contador de comps válidos,
  - mini-lista dos últimos comps salvos (preço, sqft, data, source),
  - atalho para “Ver todos / Editar comparativos”.
- Isso elimina a sensação de “salvei e desapareceu”.

Fase 5 — Cálculo robusto de média por sqft (consistência)
6. Padronizar cálculo em serviço reutilizável
- Criar serviço de cálculo (ex.: `src/services/compsPricing.ts`) para regra única:
  - incluir apenas `sale_price > 0` e `square_feet > 0`,
  - exibir quantidade válida,
  - mostrar fórmula final e média,
  - aplicar estratégia simples de outlier (documentada, sem alterar comportamento legado de forma brusca).
- Integrar no `CompsModal` e no trecho de cálculo do `ReviewQueue` para remover duplicação.

Arquivos previstos para alteração:
- `src/components/review/ActionArea.tsx`
- `src/components/shared/ReviewQueue.tsx`
- `src/components/process/CompsModal.tsx`
- `src/hooks/useComps.ts`
- `src/components/review/PropertyCard.tsx` (se resumo inline for aqui)
- `src/services/compsPricing.ts` (novo)
- `docs/process5/11-step4-comps-ui.md` (novo/atualizado)
- `docs/process5/12-calculo-medio-sqft.md` (novo/atualizado)

Banco de dados e segurança:
- Sem migração obrigatória para os novos campos do comp (JSONB já suporta).
- RLS de `manual_comps_links` já restringe por `user_id`; manter política atual.
- Não alterar arquivos gerados automaticamente de integração.

Validação (aceite):
1) Fluxo manual ponta a ponta
- Aprovar imóvel, abrir comparativos, adicionar 1 comp, fechar, reabrir e confirmar que continua visível.
- Adicionar 3–4 comps no mesmo imóvel sem “sumir botão”.
- Trocar de tela para Zillow e voltar: rascunho ainda preenchido.
- Ver imóvel aprovado e ainda conseguir abrir/editar comparativos.

2) Persistência e cálculo
- Conferir no backend se os comps foram salvos com `property_id` correto.
- Conferir média $/sqft com quantidade válida e fórmula exibida.

3) Regressão
- Aprovar/rejeitar/pular continuam funcionando.
- Sem quebra no fluxo de oferta rápida.
- `type-check` limpo.

Resultado esperado para você após essa entrega:
- O botão de comparativo não “desaparece” mais.
- Você consegue continuar cadastrando comps mesmo depois de aprovar.
- O que foi salvo fica claro na própria tela.
- Se sair para buscar dados e voltar, não perde preenchimento parcial.
