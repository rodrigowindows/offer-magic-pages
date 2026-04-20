
O usuário quer entender como fazer upload do **owner address** no fluxo `/process` e se isso é o mesmo que **mailing address**.

## Resposta direta

**Sim, na prática são a mesma coisa para envio de cartas/etiquetas**, mas o sistema tem 3 campos diferentes com prioridades distintas:

### Os 3 níveis de endereço (ordem de prioridade na hora de imprimir cartas/etiquetas):

```
1º  confirmed_mailing_address  ← MAIS CONFIÁVEL (skip trace verificou)
2º  owner_address               ← Endereço do dono no county records
3º  address (do imóvel)         ← Fallback (manda pro próprio imóvel)
```

A função `AveryLabelsPrintDialog` e `CashOfferLetter` usam essa cascata: se tiver `confirmed_mailing_address`, usa ele; senão `owner_address`; senão o endereço do imóvel.

## Como fazer upload no `/process`

Hoje no `/process` **NÃO existe** uma tela dedicada para upload em massa de owner/mailing address. As opções atuais são:

| Método | Onde | Para quê |
|---|---|---|
| **Edit individual** | `/admin` → tabela → ✏️ Edit | 1 imóvel por vez (campo `owner_address` + `owner_name`) |
| **Skip Trace** | `/process/contacts` | Enriquece via DataSift (preenche `confirmed_mailing_*` + telefones) |
| **CSV Import** | `/process/import` | Importa em massa, mas mapeia pra `owner_address`/owner_name (não pro confirmed_*) |
| **API endpoint** | `POST /functions/v1/update-mailing-address` | Atualização programática batch (preenche `confirmed_mailing_*`) |

## O gap

Não há um **upload CSV específico de mailing addresses confirmados** dentro do `/process`. Se você tem uma planilha com endereços corretos validados (ex: pós-skip-trace manual), tem que:
- Usar a Edge Function `update-mailing-address` via curl/Postman, OU
- Editar 1 a 1 no `/admin`

## Proposta (se você quiser que eu construa)

Adicionar em `/process` uma nova rota **`/process/mailing`** com:

1. **Upload CSV** com colunas: `slug` (ou `property_id`), `owner_name`, `mailing_address`, `mailing_city`, `mailing_state`, `mailing_zip`
2. **Preview** mostrando match por slug/address antes de salvar
3. **Botão "Confirmar"** → chama a Edge Function `update-mailing-address` em batch (ela já existe e funciona)
4. **Resultado** com contagem de sucesso/erro por linha

Reaproveita 100% a Edge Function que já está pronta. Só falta a UI.

## Esclarecimento sobre nomenclatura

- **owner_address** = endereço bruto do county (geralmente igual ao do imóvel se o dono mora lá)
- **mailing_address (confirmed_*)** = endereço pra onde MANDAR correspondência (pode ser diferente — out-of-state owners, trusts, etc.)
- Para imprimir cartas/etiquetas → o sistema **prefere o confirmed_mailing**, então é nele que você quer fazer upload se quer garantir entrega

Quer que eu implemente a tela de upload em `/process/mailing`?
