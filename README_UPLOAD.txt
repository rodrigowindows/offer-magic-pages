================================================================================
COMO FAZER UPLOAD DAS 242 LEADS PARA SUPABASE
================================================================================

PROBLEMA: A tabela 'priority_leads' nao existe no Supabase (ERROR 404)
SOLUCAO: Voce precisa criar a tabela manualmente primeiro

================================================================================
OPCAO 1: UPLOAD VIA DASHBOARD (MAIS FACIL - 3 MINUTOS)
================================================================================

PASSO 1: Abra o Supabase SQL Editor
URL: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql

PASSO 2: Crie uma nova query
- Clique em "+ New query"

PASSO 3: Copie o SQL
- Abra o arquivo: setup_supabase_tables.sql (nesta pasta)
- Selecione TUDO (Ctrl+A)
- Copie (Ctrl+C)

PASSO 4: Cole e Execute
- Cole no SQL Editor do Supabase (Ctrl+V)
- Clique em "RUN" (botao verde) OU pressione Ctrl+Enter
- Aguarde a mensagem de sucesso

PASSO 5: Importe o CSV
- Va para: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor
- Clique na tabela "priority_leads" (vai aparecer na lista apos criar)
- Clique em "Insert" > "Import data from CSV"
- Selecione o arquivo: SUPABASE_UPLOAD_242_LEADS.csv
- Clique em "Import"
- Aguarde 1-2 minutos

PRONTO! Voce ter 242 leads no Supabase

================================================================================
OPCAO 2: UPLOAD VIA SCRIPT PYTHON (DEPOIS DE CRIAR A TABELA)
================================================================================

PASSO 1: Crie a tabela (mesmo processo do PASSO 1-4 acima)

PASSO 2: Rode o script de upload
cd "Step 5 - Outreach & Campaigns"
python simple_upload.py

O script vai fazer upload automatico das 242 leads em batches de 10.

================================================================================
VERIFICAR SE FUNCIONOU
================================================================================

1. Abra: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor

2. Clique na tabela "priority_leads"

3. Voce deve ver 242 linhas (rows)

4. Teste alguns filtros:
   - priority_tier = 'P1-CRITICAL' (deve mostrar 3 leads)
   - priority_tier = 'P2-HIGH' (deve mostrar 35 leads)
   - is_vacant_land = true (deve mostrar 4 leads)

================================================================================
ARQUIVOS IMPORTANTES
================================================================================

- setup_supabase_tables.sql      <- SQL para criar a tabela
- SUPABASE_UPLOAD_242_LEADS.csv  <- Dados das 242 leads prontas
- simple_upload.py               <- Script Python para upload automatico
- GUIA_RAPIDO_UPLOAD.md          <- Guia detalhado em portugues

================================================================================
TOP 3 LEADS MAIS QUENTES (P1-CRITICAL)
================================================================================

1. Account: 28-22-29-5600-81200
   Owner: GLOVER RICHARD G
   Lead Score: 212, Condition: 9/10

2. Account: 28-22-29-5600-81200
   Owner: GLOVER RICHARD G
   Lead Score: 192, Condition: 9/10

3. Account: 28-22-29-5600-81200
   Owner: GLOVER RICHARD G
   Lead Score: 182, Condition: 9/10

================================================================================
RESUMO DAS 242 LEADS
================================================================================

Properties (238):
  - P1-CRITICAL: 3 leads
  - P2-HIGH: 35 leads
  - P3-GOOD: 19 leads
  - P4-MEDIUM: 84 leads
  - P5-FAIR: 75 leads
  - P6-LOWER: 22 leads

Vacant Land (4):
  - All high priority (score 180-210)

Total: 242 leads prontas para contato
Imagens: 242/242 disponiveis

================================================================================
PRECISA DE AJUDA?
================================================================================

Se tiver problemas:
1. Verifique se esta logado no Supabase com a conta correta
2. Confirme que o project ID esta correto: atwdkhlyrffbaugkaker
3. Tente fazer logout e login novamente no Supabase

================================================================================
