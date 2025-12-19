# Guia Rápido: Upload das 242 Leads para Supabase

## Arquivo Pronto

✅ **SUPABASE_UPLOAD_242_LEADS.csv** (242 leads prontas)

## Opção Mais Rápida (5 minutos)

### Passo 1: Criar a Tabela no SQL Editor

1. **Abra**: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql

2. **Clique** em "+ New query"

3. **Copie TUDO** do arquivo `setup_supabase_tables.sql` e cole no editor

4. **Clique** em "Run" (botão verde) ou pressione `Ctrl+Enter`

5. **Aguarde** a mensagem de sucesso

### Passo 2: Importar o CSV

1. **Vá para**: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor

2. **Procure** a tabela `priority_leads` na lista à esquerda

3. **Clique** na tabela `priority_leads`

4. **Clique** no botão "Insert" (no topo)

5. **Selecione** "Import data from CSV"

6. **Escolha** o arquivo: `SUPABASE_UPLOAD_242_LEADS.csv`

7. **Clique** em "Import"

8. **Aguarde** o upload completar (pode levar 1-2 minutos)

## Verificar se Funcionou

1. Na página da tabela `priority_leads`, você deve ver 242 linhas

2. Você pode filtrar por:
   - `priority_tier` = 'P1-CRITICAL' (deve mostrar 3 leads)
   - `priority_tier` = 'P2-HIGH' (deve mostrar 35 leads)
   - `is_vacant_land` = true (deve mostrar 4 leads)

## Upload de Imagens (Opcional)

Se você quiser fazer upload das imagens também:

1. **Vá para**: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/storage

2. **Clique** em "Create a new bucket"

3. **Nome**: `property-images`

4. **Marque**: "Public bucket" (para as imagens serem acessíveis)

5. **Clique** em "Create bucket"

6. **Upload manual**:
   - Clique no bucket `property-images`
   - Clique em "Upload files"
   - Selecione as imagens da pasta: `Step 3 - Download Images/property_photos`
   - Clique em "Upload"

## Problemas?

### Erro: "Table already exists"
- Normal se você já executou o SQL antes
- Pule para o Passo 2

### Erro: "Permission denied"
- Verifique se você está logado com a conta correta
- Tente fazer logout e login novamente

### CSV não está sendo aceito
- Verifique se o arquivo não está aberto no Excel
- Feche o Excel e tente novamente

## Depois do Upload

Uma vez que os dados estiverem no Supabase, você poderá:

- Acessar via API REST
- Filtrar e ordenar as leads
- Integrar com seu frontend/website
- Criar dashboards personalizados

## Contato das Melhores Leads

**Top 3 P1-CRITICAL** (Score 180+, Condição 9-10/10):
- Account: 28-22-29-5600-81200 | Owner: GLOVER RICHARD G | Score: 212

**35 P2-HIGH** (Score 235+, Condição 7-8/10):
- Melhor: Account 24-22-28-7564-07080 | Owner: 6117 HUDSON STREET LAND TRUST | Score: 248

Total distressed properties prontas para contato: **238**
Total vacant land high-priority: **4**

---

**Data da criação**: 2025-12-19
**Total de leads**: 242 (238 properties + 4 land)
**Status**: ✅ Pronto para upload
