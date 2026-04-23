# Requisitos da Página `/process` (Triagem)

Documento consolidado dos requisitos de avaliação e rejeição de propriedades.
Atualizado: 2026-04-23

---

## 1. Motivos de Rejeição (REJECTION_REASONS)

Quando qualquer um destes for verdadeiro, **rejeitar imediatamente** — não rodar comps, skip trace, oferta nem comunicação.

| Valor | Label PT-BR | Regra de bloqueio |
|---|---|---|
| `agent-listed` | Anunciada por Corretor | Se imóvel está listado por agent/MLS → **rejeitar** (não fazemos wholesale em listings ativos) |
| `new-construction` | Casa Nova (<20 anos) | `year_built > (currentYear - 20)` |
| `recent-sale` | Recém Vendida (<2 anos) | `last_sale_date` dentro dos últimos 24 meses |
| `too-good-condition` | Casa em Bom Estado | Condition score alto / sem distress visual |
| `multi-family` | Multi-Family | `property_type` = duplex/triplex/4-plex |
| `hoa-restrictions` | Propriedade com HOA / HOI | HOA ativa que impede wholesale |
| `condominium` | Condomínio | property_type = condo |
| `apartment` | Apartamento | property_type = apartment |
| `land` | Terreno (Land) | Sem estrutura construída |
| `vacant-lot` | Lote Vazio | Lote sem casa |
| `no-equity` | Low-Equity | Equity estimada < 30% do estimated_value |
| `commercial` | Imóvel Comercial | property_type comercial |
| `photo-unavailable` | Foto Indisponível | Sem foto = não conseguimos avaliar visual |
| `llc-owned` | Proprietário LLC/Empresa | owner_name contém LLC/INC/CORP/TRUST |
| `no-address-number` | Endereço sem Número | address sem street number |
| `no-wholesale-margin` | Sem Margem p/ Wholesale | Margem < 15% sobre ARV |
| `investor-owned` | Proprietário Investidor / Repetido | Owner aparece em múltiplos deals |
| `mobile-home` | Mobile Home / Trailer | property_type mobile/manufactured |
| `public-property` | Propriedade Pública / Governo | Owner = governo/município |
| `too-expensive` | **Valor Muito Alto** | estimated_value acima do teto da nossa estratégia |
| `rural` | Área Rural / Roça | Fora de zona urbana alvo |
| `duplicate` | Duplicado | Já existe no banco |
| `wrong-location` | Localização errada | Fora do mercado alvo (FL) |
| `unwanted-area` | **Área não desejada** | Bairro fora da lista de targets |
| `flood-zone` | **Área de Alagamento (Flood Zone)** | Ver regra dedicada abaixo |
| `other` | Outro motivo | Texto livre obrigatório |

---

## 2. Flood Zone (FEMA)

**Verificação automática** via Edge Function FEMA na entrada do funil.
Campos: `flood_zone` (string) + `flood_zone_checked_at` (timestamp).

### Zonas de alto risco — exibir badge **🌊 FLOOD RISK** vermelho:
`AE`, `VE`, `A`, `V`, `AH`, `AO`

### Comportamento:
- Badge aparece no topo do `ScoresTable` quando `flood_zone` está em alto risco.
- **Não bloqueia automático** — deixar o analista decidir (alguns deals em zona AE ainda fazem sentido).
- Se o analista decidir rejeitar, usar motivo `flood-zone`.
- Zonas seguras (`X`, `B`, `C`, `D`) → não mostrar badge.

---

## 3. Regra "Se tem Agent → não fazer nada"

Se a propriedade está **listada com corretor** (MLS active, agent_listed flag, ou identificado durante revisão):

1. Marcar como rejected com motivo `agent-listed`.
2. **Pular**:
   - Skip tracing
   - Geração de comps
   - Cálculo de oferta (cash_offer_amount)
   - Envio de carta/SMS/email
   - Criação de página pública de oferta
3. Manter no histórico apenas para evitar reimportar.

---

## 4. Lead Score & AI Score

- **Lead Score (0–500)**: composto por completude de dados, AI score, qualidade de contato, sinais de distress.
  - ≥ 230 → ALTA prioridade (highlight)
  - 150–229 → PADRÃO
  - < 150 → BAIXA
- **AI Score (0–100)**: avaliação visual+contextual da IA.
  - ≥ 70 → BUY (forte)
  - 50–69 → HOLD (revisar)
  - 30–49 → ATENÇÃO
  - < 30 → FRACO

Ambos têm tooltip explicando a escala.

---

## 5. Lead Temperature (COLD / WARM / HOT)

- Default: `COLD`.
- **Auto**: ao primeiro clique em link rastreado (`track-link-click` Edge Function) → COLD vira WARM, **se** `lead_temperature_manual = false`.
- **Manual**: badge clicável (`LeadTemperatureBadge`) cicla COLD→WARM→HOT→COLD e seta `lead_temperature_manual = true` (impede sobrescrita automática).

---

## 6. Estrutura do Card de Propriedade (5 abas)

1. **Avaliação** — Foto + scores + dados financeiros + critical alerts (incluindo flood badge)
2. **Contatos** — Skip trace, telefones, emails, DNC/deceased flags
3. **Comps** — Análise de comparáveis (ATTOM V2 + manuais)
4. **Comunicações** — Histórico de SMS/email/letter/call enviados
5. **Notas** — `PropertyNotesPanel` com contador em tempo real

---

## 7. Notas de Aprovação / Rejeição

- Aprovação: prefixar com `✅ APROVADO — [observações]`
- Rejeição: prefixar com `❌ REJEITADO — [Motivo do REJECTION_REASONS]`
- Notas críticas (alertas bloqueantes) impedem aprovação até serem resolvidas.

---

## 8. Página Pública de Oferta (/property/:slug)

Disparada apenas para propriedades **aprovadas** (não para agent-listed, flood-rejeitadas, etc):
- Disclaimer beige no topo
- 5 botões dinâmicos (WhatsApp, SMS, Email, Calendly, Retell Call) puxando de `contact_settings`
- Tracking de cliques → bump automático de temperatura
