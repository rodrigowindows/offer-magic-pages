PROMPT 13 - PASSO 5: OFERTA MINIMA (ARV - REFORMA - WHOLESALE)

Pre-condicao
Passo 4 com media sqft confiavel.

Objetivo
Implementar calculo de oferta minima por propriedade elegivel.

Formula obrigatoria
- ARV = sqft da elegivel * preco medio por sqft
- Valor compra minimo = ARV - reforma - comissao wholesale

Entradas do analista
- reforma: leve/media/grande (default 10/25/40) e aceitar % ou valor fixo
- comissao wholesale: % ou valor fixo

Persistencia
- gravar parametros usados, usuario, timestamp
- gravar resultado em campos apropriados (ex min_offer_amount)

Arquivos provaveis
- src/components/OfferConfiguration.tsx (se existir)
- src/pages/Admin.tsx
- componentes de oferta/comps

Entregaveis
- UI do passo 5
- calculo persistido
- docs/process5/13-step5-oferta-minima.md

Validacao
- npm run type-check
- cenarios:
  - reforma em %
  - reforma em valor
  - comissao em %
  - comissao em valor
