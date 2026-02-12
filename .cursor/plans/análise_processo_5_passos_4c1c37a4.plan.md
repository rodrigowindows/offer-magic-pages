---
name: Análise processo 5 passos
overview: "Análise completa do processo em 5 passos (base de imóveis elegíveis, análise aprovar/negar, captura de contatos, comparativos, oferta mínima): o que está alinhado com o pedido, o que já existe no código e o que falta implementar."
todos: []
isProject: false
---

# Análise completa: processo em 5 passos (imóveis elegíveis → oferta mínima)

## Visão geral do processo desejado


| Passo | Nome resumido | Atividade principal                                                                                                                |
| ----- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Base de dados | Upload de imóveis elegíveis + filtros (cidade, estado, data upload) + nome da base livre                                           |
| 2     | Análise       | Aprovar/Negar para abordagem + motivo de negação + analista + data + pré-negações automáticas + lista só elegíveis                 |
| 3     | Contatos      | Exportar nomes dos proprietários → upload resultados skip-trace (tel, email, endereço) + suporte a dono empresa + sócios           |
| 4     | Comparativos  | Copiar endereço → Zillow/Redfin → inserir comps (endereço, link, data venda, valor, área, quartos, banheiros) → preço médio $/sqft |
| 5     | Oferta mínima | ARV = sqft × $/sqft; Valor compra = ARV − reforma (leve/média/grande %) − comissão wholesale (%)                                   |


---

## Passo 1: Base de dados de imóveis elegíveis

### O que o processo pede

- **Campos no upload:** (a) endereço completo – número, rua, bairro, zip, cidade; (b) nome do dono; (c) endereço de residência do dono; (d) metragem construída; (e) metragem terreno; (f) data construção; (g) data última venda; (h) valor última venda; (i) quartos; (j) banheiros; (k) tem piscina (sim/não).
- **Upload:** carregar todos os dados disponíveis.
- **Seleção/filtros:** por cidade, estado e data do upload.
- **Nome da base:** livre (ex.: "BASE 3 IPTU sem pagamento", "BASE DE PROBATE", "BASE DE SEPARADOS").

### O que concordo

- Faz sentido centralizar o upload numa “primeira aba” e identificar cada lote por nome + data.
- Filtros por cidade, estado e data do upload são essenciais para trabalhar por base.

### O que já existe

- **Upload de propriedades:** [ImportProperties.tsx](src/pages/ImportProperties.tsx), [CSVImporter.tsx](src/components/CSVImporter.tsx), [BulkImportDialog.tsx](src/components/BulkImportDialog.tsx), [ColumnMappingDialog](src/components/ColumnMappingDialog.tsx) com mapeamento de colunas CSV → DB.
- **Tabela `properties`:** tem entre outros: `address`, `city`, `state`, `zip_code`, `owner_name`, `owner_address` (e variantes mailing), `square_feet`, `lot_size`, `year_built`, `bedrooms`, `bathrooms`, `import_batch`, `import_date`.
- **Filtros no Admin:** [Admin.tsx](src/pages/Admin.tsx) usa `AdvancedPropertyFilters` com filtro por `import_batch` e `import_date` (from/to). Filtro por cidade/estado existe via `UnifiedPropertyFilters` / filtros avançados.
- **Nome da base:** o campo `import_batch` é usado como “batch” (ex.: "Import-2025-12-20"); o nome é definido no fluxo de import, mas não há um campo dedicado “nome da base” com rótulo livre tipo "BASE DE PROBATE".

### O que falta

- **Campos no banco:** (g) data última venda, (h) valor última venda e (k) piscina **não** aparecem na definição atual de `properties` em [types.ts](src/integrations/supabase/types.ts). É necessário adicionar (ex.: `last_sale_date`, `last_sale_value`, `has_pool` ou `pool`) e passar a mapeá-los no import.
- **Nome da base livre:** hoje `import_batch` é usado como identificador do lote; não há UI explícita para “nome da base” livre (ex.: "BASE 3 IPTU sem pagamento"). Pode-se: (i) usar `import_batch` como esse nome e permitir edição livre na tela de import, ou (ii) adicionar um campo `base_name`/`import_batch_label` e exibir nos filtros.
- **Aba dedicada Passo 1:** o fluxo atual é “Admin” + “Import” em rotas separadas; não há uma “Aba 1” única que mostre “só upload + filtros por cidade/estado/data e nome da base”. Dá para criar uma aba “Base de imóveis” que reúna upload + lista filtrada por cidade, estado, data e nome da base.

---

## Passo 2: Análise (aprovar/negar para abordagem)

### O que o processo pede

- Aba prática e rápida: selecionar imóvel → **APROVADA** ou **NEGADA** para abordagem.
- **NEGADA:** obrigatório motivo de negação.
- **Pré-negações automáticas** (sugestões): propriedades novas (&lt;20 anos), vendidas recentemente (&lt;2 anos), “Casa Boa”, Multi-Family, com HOI, Land, Low-Equity, anunciada por corretor, comercial.
- Gravar: **analista**, **data da decisão**, **motivo de negação** (quando negado).
- Login importante: analistas Edson, Josiane, Rodrigo.
- Ao final: ver **apenas lista das propriedades elegíveis** (aprovadas) para a próxima fase.

### O que concordo

- Fluxo aprovar/negar com motivo obrigatório em negação e auditoria (quem/quando) é o correto.
- Pré-sugestões de negação aceleram e padronizam; o analista pode confirmar ou sobrescrever.

### O que já existe

- **Aprovar/Rejeitar:** [PropertyApprovalDialog.tsx](src/components/PropertyApprovalDialog.tsx) com APROVAR/REJEITAR, lista de motivos em [REJECTION_REASONS](src/components/PropertyApprovalDialog.tsx) (too-good-condition, llc-owned, commercial, duplicate, wrong-location, no-equity, already-contacted, occupied-rented, **recent-sale**, hoa-restrictions, title-issues, other).
- **Banco:** `approval_status`, `approved_by`, `approved_by_name`, `approved_at`, `rejection_reason`, `rejection_notes` em `properties` (migrations 20251216/20251217).
- **Filtro por status:** [PropertyApprovalFilter](src/components/PropertyApprovalFilter.tsx); [Admin.tsx](src/pages/Admin.tsx) usa e tem “Approved properties” export ([ApprovedPropertiesExport](src/components/ApprovedPropertiesExport.tsx)).
- **Analista:** `approved_by` (userId) e `approved_by_name` são gravados; login via Supabase Auth (não há lista fixa “Edson, Josiane, Rodrigo” no código; são usuários do sistema).
- **Score/Recomendação automática:** [propertyScoring.ts](src/utils/propertyScoring.ts) e [PropertyScoreCard](src/components/PropertyScoreCard.tsx) fazem recomendação approve/review/reject com base em location, value, condition, trend – **não** são as mesmas regras do Passo 2 (não há “&lt;20 anos”, “venda &lt;2 anos”, Multi-Family, HOI, Land, Low-Equity, corretor, comercial).

### O que falta

- **Pré-negações automáticas** conforme lista do processo: (a) propriedade nova (&lt;20 anos), (b) vendida recentemente (&lt;2 anos), (c) Casa Boa, (d) Multi-Family, (e) com HOI, (f) Land, (g) Low-Equity, (h) anunciada por corretor, (i) comercial. Isso exige: (1) dados no banco (year_built, last_sale_date já citados no Passo 1; property_type, listing/agent flag, etc.) e (2) regras no front (ou backend) que marquem “sugestão de negação” com motivo; o analista só confirma ou muda.
- **Aba “Passo 2”** dedicada: hoje a análise é feita dentro do Admin (filtros + cards + PropertyApprovalDialog). Uma aba “Análise para abordagem” com lista rápida (ex.: tabela ou cards compactos), atalhos de teclado (já há A/R no dialog) e vista “só elegíveis” ao final está parcialmente coberta pelo filtro “Approved” + export; pode ser tornada mais explícita e rápida.
- **Restringir analistas:** se for obrigatório que só Edson, Josiane e Rodrigo aprovem/negem, isso seria uma regra de permissão (roles/whitelist); hoje não existe.

---

## Passo 3: Captura de contatos (skip-trace)

### O que o processo pede

- A partir da base **aprovada**, extrair lista com **nomes dos proprietários** para enviar ao mercado (skip-trace).
- Na mesma página: **upload dos resultados** (telefone, email, endereço) obtidos externamente.
- Mesmo dono pode ter dados de **mais de um fornecedor** (manter múltiplas fontes).
- Se o dono for **empresa:** guardar nome da empresa + contato da empresa **e** nome(s) do(s) **sócio(s)** (decisão de venda é de pessoa física).

### O que concordo

- Export de proprietários (aprovados) + upload de resultado é o fluxo correto.
- Múltiplas fontes por proprietário e estrutura empresa + sócios são importantes para wholesale.

### O que já existe

- **API/Export:** [get-skip-trace-data](supabase/functions/get-skip-trace-data/index.ts) retorna propriedades com resumo de phones/emails; suporta filtros (propertyId, limit, offset, hasSkipTraceData, search). Não há endpoint específico “só aprovadas” nem export CSV “só nomes para skip-trace”.
- **Upload de resultados:** [SkipTracingImporter.tsx](src/components/SkipTracingImporter.tsx) processa CSV (ex.: "Input Property Address", City, State, Zip) e atualiza propriedades com phones/emails; match por endereço.
- **Estrutura de contatos:** `properties` tem phone1–7, email1–2, owner_phone, owner_email, person2_*, person3_*, relative1–5 (nome e phones). Não há modelo explícito “empresa (nome + contato) + sócios (nomes + contatos)”;
- **Página Skip Trace:** [SkipTrace.tsx](src/pages/SkipTrace.tsx) + [SkipTraceDataViewer](src/components/SkipTraceDataViewer.tsx) para visualizar dados; [SkipTracingDataModal](src/components/SkipTracingDataModal.tsx) para editar. Não há “export só aprovadas” nem “upload na mesma tela” como fluxo único.

### O que falta

- **Export para skip-trace:** botão/fluxo que gere CSV (ou arquivo) apenas de propriedades **aprovadas** com colunas: endereço, cidade, estado, zip, nome do dono (e, se existir, nome empresa + sócios) para enviar ao fornecedor externo.
- **Upload na mesma aba:** garantir que a tela “Passo 3” tenha: (1) export “lista de proprietários (aprovados)” e (2) upload do arquivo retornado pelo fornecedor, usando o importer existente ou equivalente.
- **Modelo empresa + sócios:** hoje person2/person3 e relatives podem ser usados de forma genérica; não há campos dedicados “owner_is_company”, “company_name”, “company_phone”, “officer1_name”, “officer1_phone”, etc. Pode-se estender o schema e o importer para aceitar empresa + sócios/officers e exibir na mesma página.

---

## Passo 4: Comparativos (comps)

### O que o processo pede

- **Copiar endereço** da propriedade (para colar no Zillow/Redfin).
- Para cada elegível, analista encontra **3–4 comps** (perto, reformados, vendidos recentemente) e insere: (a) endereço completo, (b) link Zillow/Redfin, (c) data venda, (d) valor venda, (e) área construída, (f) área total, (g) quartos, (h) banheiros.
- Calcular **preço médio por sqft** a partir dos comps inseridos.

### O que concordo

- Comps manuais com link e campos padronizados são necessários; $/sqft médio é a base para o Passo 5.

### O que já existe

- **Comps manuais:** [ManualCompsManager.tsx](src/components/ManualCompsManager.tsx), [manualCompsService.ts](src/services/manualCompsService.ts); tabela `manual_comps_links` com `property_id`, `url`, `source` (zillow, redfin, etc.), `property_address`, `comp_data` (JSONB).
- **comp_data:** já suporta sale_price, square_feet, bedrooms, bathrooms, sale_date (e semelhantes); link está em `url`.
- **Cálculo $/sqft:** em [ManualCompsManager.tsx](src/components/ManualCompsManager.tsx) (linhas ~1312–1330) é calculado avg price per sqft a partir dos comps com `sale_price` e `square_feet`; valor estimado = avg $/sqft × sqft da propriedade.
- **Copiar endereço:** não há um botão explícito “Copiar endereço para Zillow/Redfin” na mesma tela dos comps; o analista pode copiar do card da propriedade.

### O que falta

- **Botão “Copiar endereço”** na tela de comps (Passo 4) para colar no Zillow/Redfin.
- **Campos explícitos por comp:** garantir que o formulário de cada comp tenha todos: endereço completo, link, data venda, valor venda, área construída, área total, quartos, banheiros (alguns já estão em `comp_data`; área total pode estar como `lot_size` ou outro campo no JSONB).
- **Aba “Passo 4”** clara: hoje os comps manuais vivem dentro do fluxo de uma propriedade (ex.: Admin → propriedade → Comps). Uma aba “Comparativos” que liste só elegíveis e permita abrir comps por propriedade + copiar endereço + preço médio $/sqft em destaque atende ao processo.

---

## Passo 5: Oferta mínima

### O que o processo pede

- **Fórmula:**  
  - ARV = sqft da casa elegível × preço médio $/sqft (dos comps).  
  - Valor compra = ARV − valor reforma − comissão wholesale.
- **Reforma:** (i) leve (ex.: 10%), (ii) média (25%), (iii) grande (40%) – parametrizável em % ou valor.  
- **Comissão wholesale:** % ou valor.  
- Dois parâmetros imputados pelo analista: tipo de reforma e comissão.

### O que concordo

- A fórmula está correta para wholesale; percentuais parametrizáveis são essenciais.

### O que já existe

- **Campos de oferta:** `properties` tem `cash_offer_amount`, `min_offer_amount`, `max_offer_amount`, `estimated_value`; [Admin](src/pages/Admin.tsx) e [OfferConfiguration](src/components/OfferConfiguration.tsx) editam oferta.
- **Cálculo a partir de comps:** [ManualCompsManager](src/components/ManualCompsManager.tsx) calcula avg $/sqft e “valor estimado” (ARV); exibe faixas de oferta em % (60%, 70%, …, 90%) do valor – **não** é a fórmula “ARV − reforma % − comissão %”.
- **AVM/Comps:** [avmService.ts](src/services/avmService.ts) e [CompsAnalysis](src/components/marketing/CompsAnalysis.tsx) calculam valor a partir de comps; não há tela dedicada “reforma leve/média/grande + comissão wholesale → min offer”.

### O que falta

- **Tela/aba Passo 5:** para cada elegível, inputs: (1) tipo de reforma (leve/média/grande com % ou valor), (2) comissão wholesale (% ou valor). Cálculo: ARV = sqft × avg $/sqft (vindo dos comps do Passo 4); Valor compra = ARV − reforma − comissão; gravar em `min_offer_amount` (e opcionalmente `max_offer_amount` ou campo dedicado).
- **Parâmetros globais:** tabela ou config para percentuais padrão (ex.: leve 10%, média 25%, grande 40%) editáveis; comissão padrão.
- **Integração:** garantir que o avg $/sqft usado no Passo 5 seja o mesmo calculado no Passo 4 (comps manuais) ou, se houver, da análise ATTOM/API.

---

## Resumo: concordâncias, já feito e falta


| Passo | Concordância                                               | Já feito                                                                                             | Falta                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Upload + filtros + nome base                               | Import CSV, import_batch/import_date, filtros cidade/estado/data no Admin; campos a–f,i,j no DB      | last_sale_date, last_sale_value, has_pool no DB; nome base livre na UI; aba “Passo 1” reunindo upload + filtros                                                                           |
| **2** | Aprovar/negar + motivo + analista + data + lista elegíveis | PropertyApprovalDialog, rejection_reason, approved_by/approved_at, filtro approved, export aprovadas | Pré-negações automáticas (regras: &lt;20 anos, &lt;2 anos venda, Casa Boa, Multi-Family, HOI, Land, Low-Equity, corretor, comercial); aba Passo 2 rápida; (opcional) restringir analistas |
| **3** | Export proprietários + upload resultados + empresa/sócios  | get-skip-trace-data, SkipTracingImporter, estrutura phone/email multi-pessoa                         | Export CSV “só aprovadas” para skip-trace; mesma aba export + upload; modelo empresa + sócios (campos + UI)                                                                               |
| **4** | Copiar endereço + comps (8 campos) + $/sqft médio          | ManualCompsManager, manual_comps_links, comp_data, cálculo avg $/sqft                                | Botão copiar endereço; garantir 8 campos por comp (incl. área total); aba “Passo 4” com lista elegíveis                                                                                   |
| **5** | ARV = sqft × $/sqft; Compra = ARV − reforma − comissão     | min_offer_amount, max_offer_amount, cálculo ARV em ManualCompsManager (parcial)                      | Tela Passo 5: reforma (leve/média/grande %) + comissão %; fórmula completa; parâmetros globais; usar $/sqft do Passo 4                                                                    |


---

## Estrutura atual vs. estrutura “5 abas”

Hoje: **Admin** (lista + filtros + aprovar/negar + oferta), **Admin/Import** (upload), **Skip Trace** (visualizar/importar contatos), **Marketing** (comps em contexto de campanha/comps analysis). Não há um wizard ou menu “Passo 1 … Passo 5”.

Sugestão para alinhar ao processo:

1. **Menu/abas “Processo”** com 5 itens: Base de imóveis | Análise | Contatos | Comparativos | Oferta mínima.
2. **Passo 1:** página que reúna upload + filtros por cidade, estado, data, nome da base (usar ou estender `import_batch`).
3. **Passo 2:** página “Análise” com lista (só pendentes ou todas) + aprovar/negar rápido + pré-sugestões + filtro “só elegíveis”.
4. **Passo 3:** página “Contatos” com export (aprovadas) + upload resultados + (futuro) empresa/sócios.
5. **Passo 4:** página “Comparativos” com lista elegíveis + por propriedade: copiar endereço + CRUD comps + exibir $/sqft médio.
6. **Passo 5:** página “Oferta mínima” com lista elegíveis + por propriedade: tipo reforma + comissão → cálculo e gravação de min_offer.

Com isso, o que concordo está refletido, o que já foi feito está mapeado nos arquivos acima e o que falta fica como backlog por passo.

---

## Mapeamento atual: rotas, menu e abas

### Rotas (App.tsx)


| Rota              | Página           | Uso no processo                                                                                   |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `/`               | Index            | Público (landing)                                                                                 |
| `/auth`           | Auth             | Login (analistas)                                                                                 |
| `/admin`          | Admin            | Dashboard + Review Queue + Properties + Campaigns + Analytics + Feature Toggles                   |
| `/admin/import`   | ImportProperties | Upload CSV + mapeamento + SkipTracingImporter na mesma tela                                       |
| `/skip-trace`     | SkipTrace        | Visualização de dados skip-trace (estatísticas + viewer)                                          |
| `/property/:slug` | Property         | Página pública da oferta                                                                          |
| `/features`       | FeaturesGuide    | Público                                                                                           |
| `/marketing/*`    | MarketingApp     | Dashboard, Campanhas, **Comps** (/marketing/comps), Leads, Letters, Send, History, Settings, etc. |


Não existe hoje: `/process/step1`, `/process/step2`, etc. Tudo está distribuído em Admin, Admin/Import, Skip Trace e Marketing.

### Menu global (MainNavigation.tsx)

Um único dropdown **"All Pages"** com itens planos:

- Home, Property Details, Features Guide  
- **Admin Dashboard** → `/admin`  
- Marketing Dashboard, New Communication, Communication History  
- **Skip Trace Data** → `/skip-trace`  
- **Import Properties** → `/admin/import`  
- MCP Tester, Sign In

Não há submenu "Processo" nem entradas "Passo 1", "Passo 2", etc.

### Abas internas do Admin (Admin.tsx, TabsList ~linhas 1154–1178)


| Tab value    | Nome visível    | Conteúdo principal                                                                                                                                                                       |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard`  | Dashboard       | MetricsDashboard, DashboardQuickActions, ApprovedPropertiesExport (não visível no trecho; verificar), AdminDashboardOverview, TeamActivityDashboard, TeamReportExporter, FollowUpManager |
| `review`     | Review Queue    | Apenas `<ReviewQueue />`                                                                                                                                                                 |
| `properties` | Properties      | UnifiedPropertyFilters + sub-tabs (table                                                                                                                                                 |
| `campaigns`  | Campaigns       | Conteúdo de campanhas                                                                                                                                                                    |
| `analytics`  | Analytics       | Conteúdo de analytics                                                                                                                                                                    |
| `features`   | Feature Toggles | FeatureTogglePanel                                                                                                                                                                       |


Ou seja: **Passo 1** (filtros por cidade, estado, data, base) está dentro de Admin → Properties, via **AdvancedPropertyFilters**; **Passo 2** (aprovar/negar) está em Review Queue + Properties (PropertyApprovalDialog + filtro approval).

### Onde cada peça do processo vive hoje


| Funcionalidade                                      | Onde está (arquivo / rota / aba)                                                                                                                                                                                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload CSV imóveis                                  | `src/pages/ImportProperties.tsx` – rota `/admin/import`. Batch name: estado `batchName` (~linha 96), usado no import.                                                                                                                                          |
| Filtro cidade / estado / import_batch / import_date | `src/components/AdvancedPropertyFilters.tsx` (city, county, importBatch, importDateFrom/To). Usado em Admin → Properties via `UnifiedPropertyFilters` → advanced. Query em Admin.tsx ~282–288 (import_batch, import_date).                                     |
| Aprovar / negar + motivo                            | `src/components/PropertyApprovalDialog.tsx`. Aberto a partir de cards/tabela no Admin (estado selectedPropertyForApproval).                                                                                                                                    |
| Filtro approval (pending/approved/rejected)         | Admin → Properties: `UnifiedPropertyFilters` (approvalStatus) + filteredProperties (approval_status) ~866–868.                                                                                                                                                 |
| Export “aprovadas”                                  | `src/components/ApprovedPropertiesExport.tsx` – usado no Dashboard do Admin (~1129). Exporta CSV com colunas básicas (Address, City, State, ZIP, Owner Name, Owner Phone, …) e opção extended. **Não** inclui owner_address nem import_batch nas basicHeaders. |
| Upload resultado skip-trace                         | `src/components/SkipTracingImporter.tsx` – já está na página **ImportProperties** (/admin/import), não em Skip Trace. Skip Trace (/skip-trace) é só visualização.                                                                                              |
| Comps manuais (lista + comp_data)                   | `src/components/ManualCompsManager.tsx` – usado dentro de `src/components/marketing/CompsAnalysis.tsx`, que é a rota **/marketing/comps** (MarketingApp). Também em Marketing Settings. Não está no Admin.                                                     |
| Cálculo $/sqft e oferta %                           | ManualCompsManager (~1312–1338): avg $/sqft, faixas 60–90%. Não há tela “reforma % + comissão % → min_offer”.                                                                                                                                                  |
| Edição min_offer_amount / max_offer_amount          | Admin: formulário de edição de propriedade (editFormData, ~1997–1998). Não há UI de “Passo 5” com ARV − reforma − comissão.                                                                                                                                    |


---

## Alterações específicas (o que alterar vs criar)

### Passo 1 – Base de imóveis


| O quê                                                      | Já existe?                                                                                                | Ação específica                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campos last_sale_date, last_sale_value, has_pool           | Não no schema                                                                                             | Nova migration em `supabase/migrations/`. Adicionar colunas em `properties`. Atualizar `src/integrations/supabase/types.ts` (gerado ou manual).                                                                                                                                                                                                                                                                                     |
| Nome da base livre                                         | Parcial: `import_batch` existe; em ImportProperties o label é “batch” e valor default `Import-YYYY-MM-DD` | Em **ImportProperties.tsx**: permitir input livre para “Nome da base” (ou renomear label do batchName) e gravar em `import_batch`. Em **AdvancedPropertyFilters**: já filtra por import_batch; opcionalmente exibir label “Nome da base” no UI.                                                                                                                                                                                     |
| Mapeamento CSV → last_sale_date, last_sale_value, has_pool | Não                                                                                                       | Em **ColumnMappingDialog** / **ImportProperties** (onde se monta o objeto para insert): mapear colunas CSV para last_sale_date, last_sale_value, has_pool. Normalizar has_pool (sim/não, 1/0, true/false).                                                                                                                                                                                                                          |
| Tela única “Passo 1” (upload + listagem filtrada)          | Não: upload em /admin/import; listagem filtrada em /admin (Properties)                                    | **Opção A:** Nova página `src/pages/process/Step1BaseImoveis.tsx` com upload (reusar componente de ImportProperties) + lista com filtros (reusar UnifiedPropertyFilters + tabela/cards). Rota ex.: `/process/step1`. **Opção B:** Manter /admin/import e Admin → Properties; adicionar no menu um link “Base de imóveis” que leve a /admin/import e documentar que filtros por base/cidade/estado/data estão em Admin → Properties. |


### Passo 2 – Análise


| O quê                                           | Já existe?                                                                                 | Ação específica                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog Aprovar/Negar + motivo + analista + data | Sim: PropertyApprovalDialog, REJECTION_REASONS, approved_by, approved_at, rejection_reason | Nenhuma alteração obrigatória no dialog para o fluxo básico. Opcional: alinhar rótulos de REJECTION_REASONS ao processo (ex.: “recent-sale” já existe).                                                                                                                                                                                                                                                                                                  |
| Review Queue / lista para análise               | Sim: aba “Review Queue” com `<ReviewQueue />`                                              | Verificar se ReviewQueue lista pendentes e abre PropertyApprovalDialog. Se sim, só falta pré-sugestões e (opcional) permissões.                                                                                                                                                                                                                                                                                                                          |
| Pré-negações automáticas (9 regras)             | Não                                                                                        | **Criar** `src/services/eligibilityRules.ts`: funções que recebem property e retornam sugestões (ex.: year_built &gt; now-20 → “propriedade nova”). Dados necessários: year_built, last_sale_date (Passo 1), property_type; se faltar campo (ex.: “anunciada por corretor”), retornar “indisponível”. **Alterar** ReviewQueue ou PropertyApprovalDialog: chamar eligibilityRules e exibir badges/botões de sugestão; analista pode confirmar ou ignorar. |
| Restringir a Edson, Josiane, Rodrigo            | Não                                                                                        | **Criar** regra de permissão: tabela ou config (ex.: `profiles.role = 'analyst'` ou lista de user_ids). **Alterar** PropertyApprovalDialog ou backend: antes de update, checar se usuário está autorizado; senão, desabilitar botões e/ou retornar erro.                                                                                                                                                                                                 |
| Ver “só elegíveis”                              | Sim                                                                                        | Admin → Properties → filtro approval = “approved”. ApprovedPropertiesExport já exporta só aprovadas. Nenhuma alteração obrigatória.                                                                                                                                                                                                                                                                                                                      |


### Passo 3 – Contatos


| O quê                               | Já existe?                                                                     | Ação específica                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Export CSV só aprovadas             | Parcial: ApprovedPropertiesExport exporta aprovadas, mas com colunas genéricas | **Alterar** ApprovedPropertiesExport: adicionar variante “Export para skip-trace” com colunas mínimas: property_id, address, city, state, zip_code, owner_name, owner_address (ou mailing), import_batch. Ou criar novo componente/botão “Export para skip-trace” que chame query aprovadas e gere esse CSV. |
| Onde fica o export “skip-trace”     | ApprovedPropertiesExport está no Dashboard do Admin                            | Decisão: manter no Dashboard ou criar página **Passo 3** (ex.: `/process/step3`) com (1) botão export skip-trace e (2) área de upload (reusar SkipTracingImporter). Se criar Passo 3, mover ou duplicar o export e o importer nessa página.                                                                  |
| Upload resultado skip-trace         | Sim: SkipTracingImporter em ImportProperties                                   | Já existe; só garantir que na “tela Passo 3” (se criada) o upload esteja visível (reusar SkipTracingImporter).                                                                                                                                                                                               |
| Múltiplas fontes / empresa + sócios | Parcial: phone1–7, person2, person3, relatives                                 | **Futuro:** migration + tipos para empresa/sócios; importer aceitar colunas “company_name”, “officer1_name”, etc. Não obrigatório para MVP.                                                                                                                                                                  |


### Passo 4 – Comparativos


| O quê                                                                                                  | Já existe?                                                                                  | Ação específica                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista de comps por propriedade + comp_data                                                             | Sim: ManualCompsManager, manual_comps_links, comp_data                                      | Garantir comp_data com área total (lot_sqft ou similar) se ainda não tiver.                                                                                                                                                                                                                                     |
| Botão “Copiar endereço”                                                                                | Não                                                                                         | **Alterar** ManualCompsManager ou CompsAnalysis: ao exibir a propriedade elegível, adicionar botão “Copiar endereço” que copie `address, city, state zip_code` (ou formato completo) para clipboard.                                                                                                            |
| 8 campos por comp (endereço, link, data venda, valor, área construída, área total, quartos, banheiros) | Parcial: url, property_address, comp_data (sale_price, square_feet, beds, baths, sale_date) | **Alterar** formulário de comp em ManualCompsManager: garantir campo “área total” (lot_size ou total_sqft) em comp_data e na UI. Link já é `url`.                                                                                                                                                               |
| Onde fica “Passo 4”                                                                                    | Comps em /marketing/comps (CompsAnalysis)                                                   | **Opção A:** Manter /marketing/comps; adicionar no menu “Processo” link “Comparativos” → /marketing/comps. **Opção B:** Nova página `/process/step4` que liste só propriedades aprovadas e, ao clicar, abra workspace de comps (reusar ManualCompsManager) + botão copiar endereço + exibir $/sqft em destaque. |
| Cálculo $/sqft robusto                                                                                 | Parcial em ManualCompsManager                                                               | **Opcional:** extrair para `src/services/compsPricing.ts` e usar em Passo 4 e Passo 5; testes unitários.                                                                                                                                                                                                        |


### Passo 5 – Oferta mínima


| O quê                                            | Já existe?                                                 | Ação específica                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Campos min_offer_amount, max_offer_amount        | Sim em properties e no edit do Admin                       | Usar para persistir resultado do cálculo.                                                                                                                                                                                                                                                                                                                                |
| Cálculo ARV = sqft × $/sqft                      | Parcial em ManualCompsManager (avg $/sqft × property sqft) | **Criar** tela ou seção “Passo 5”: input “tipo reforma” (leve 10% / média 25% / grande 40% ou valor fixo), input “comissão wholesale” (% ou valor). Fórmula: ARV = sqft_elegível × avg_price_per_sqft (buscar do Passo 4 / ManualComps ou campo persistido); Valor_compra = ARV − (reforma) − (comissão). Gravar em min_offer_amount (e opcionalmente max_offer_amount). |
| Onde fica “Passo 5”                              | Não existe                                                 | **Criar** página `src/pages/process/Step5OfertaMinima.tsx` (ou aba no Admin) que liste elegíveis e, por propriedade, mostre sqft, $/sqft (do Passo 4), inputs reforma/comissão, resultado e botão “Salvar oferta mínima”. Ou estender o modal de edição de oferta no Admin com seção “Cálculo wholesale” (ARV − reforma − comissão).                                     |
| Parâmetros globais (default 10/25/40%, comissão) | Não                                                        | **Opcional:** tabela ou config (ex.: `app_config` ou JSON em settings) para percentuais e comissão padrão.                                                                                                                                                                                                                                                               |


### Menu / fluxo das 5 abas


| O quê                         | Ação específica                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu “Processo” ou “5 passos” | **Alterar** MainNavigation.tsx: adicionar item “Processo” (ou “Pipeline”) com subitens: Base de imóveis, Análise, Contatos, Comparativos, Oferta mínima. Cada um pode apontar para rota nova (/process/step1 … step5) ou para as telas existentes (/admin/import, /admin com tab review, /skip-trace ou /process/step3, /marketing/comps, /process/step5). |
| Rotas /process/step1 … step5  | **Criar** em App.tsx rotas para Step1BaseImoveis, Step2Analise, Step3Contatos (opcional), Step4Comparativos (opcional), Step5OfertaMinima. Ou manter rotas atuais e só renomear/agrupar no menu.                                                                                                                                                           |


---

## Resumo executivo: onde está vs o que mexer

- **Passo 1:** Upload em `ImportProperties.tsx` (/admin/import). Filtros cidade/estado/base/data em `AdvancedPropertyFilters` + Admin Properties. **Alterar:** migration (last_sale_date, last_sale_value, has_pool), mapeamento no import, nome da base livre. **Opcional:** página Step1 que reúna upload + lista filtrada.
- **Passo 2:** Aprovar/negar em `PropertyApprovalDialog`; lista em Review Queue + Properties. **Alterar:** criar eligibilityRules (pré-negações) e integrar na UI; opcional restringir analistas. **Não criar** nova tela se Review Queue + Properties forem suficientes.
- **Passo 3:** Export aprovadas em `ApprovedPropertiesExport` (Dashboard Admin). Upload em `SkipTracingImporter` (em ImportProperties). **Alterar:** export “para skip-trace” com colunas mínimas (owner_address, import_batch). **Opcional:** página Step3 com export + upload.
- **Passo 4:** Comps em `ManualCompsManager` dentro de `/marketing/comps`. **Alterar:** botão “Copiar endereço”; garantir 8 campos (incl. área total). **Opcional:** página Step4 só elegíveis ou link no menu.
- **Passo 5:** min_offer no Admin (edit). **Criar:** UI de cálculo (ARV − reforma − comissão) e persistência; pode ser nova página Step5 ou seção no Admin/edit.
- **Menu:** **Alterar** MainNavigation para agrupar “Processo” com links para os 5 passos (rotas novas ou existentes).

