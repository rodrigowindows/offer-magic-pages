# Prompts - Processo 5 Passos

Esta pasta contem os prompts numerados (01 a 15) para implementar e validar o fluxo de 5 passos:
Base de imoveis -> Analise -> Contatos -> Comparativos -> Oferta minima.

## Guia visual (principal)

Antes de executar os prompts, abra no navegador:

- [docs/process5/GUIA_EXECUCAO_5_PASSOS.html](../docs/process5/GUIA_EXECUCAO_5_PASSOS.html)

Esse guia mostra:
- O que ja existe no codigo
- O que falta por passo
- Telas necessarias (wireframes)
- Ordem dos 15 prompts com links diretos

Guia complementar (detalhe de rotas e fluxo atual):
- [docs/process5/FLUXO_ATUAL_E_SUGESTOES.html](../docs/process5/FLUXO_ATUAL_E_SUGESTOES.html)

## Ordem dos prompts

| # | Arquivo | Objetivo |
|---|---------|----------|
| 01 | 01_auditoria_estado_atual.md | Auditoria real do codigo (sem implementar) |
| 02 | 02_validacao_auditoria_e_plano.md | Validar auditoria e gerar plano em fases |
| 03 | 03_migracao_schema_passo1.md | Schema: last_sale_date, last_sale_value, has_pool, base_name |
| 04 | 04_import_mapeamento_passo1.md | Mapear novos campos no pipeline de import |
| 05 | 05_ui_passo1_base_imoveis.md | UI Passo 1: upload + filtros + listagem |
| 06 | 06_ui_passo2_analise.md | UI Passo 2: aprovar/negar rapido |
| 07 | 07_regras_pre_negacao_sugestao.md | Regras de pre-negacao (sugestao) |
| 08 | 08_permissoes_analistas_passo2.md | Permissoes de analista |
| 09 | 09_passo3_export_skiptrace_aprovadas.md | Export CSV so aprovadas para skip-trace |
| 10 | 10_passo3_upload_skiptrace_multifonte_pj.md | Upload retorno + multifonte + PJ/socios |
| 11 | 11_passo4_ui_comparativos.md | UI Passo 4: comparativos por elegivel |
| 12 | 12_passo4_calculo_medio_sqft.md | Calculo medio $/sqft robusto |
| 13 | 13_passo5_oferta_minima_formula.md | Passo 5: ARV - reforma - comissao |
| 14 | 14_integracao_5_abas_fluxo.md | Integracao do fluxo em 5 abas |
| 15 | 15_validacao_final_regressao_release.md | Validacao final e release |

## Regra de execucao

Execute em ordem. O proximo prompt deve validar o resultado do anterior antes de seguir.
