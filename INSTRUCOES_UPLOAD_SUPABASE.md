# Instruções para Upload das 242 Leads Prioritárias

## Status Atual

✅ **Análise Completa**: 984/984 propriedades analisadas
✅ **Leads Selecionadas**: 242 leads prioritárias preparadas
✅ **Imagens**: 242/242 imagens disponíveis
⚠️ **Upload**: Falhou - tabela não existe no Supabase

## O Problema

O upload falhou com o erro:
```
Could not find the table 'public.priority_leads'
```

Isso significa que você precisa criar a tabela no Supabase primeiro.

## Solução: 2 Opções

### OPÇÃO 1: Criar Tabela no Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**:
   - URL: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker
   - Faça login

2. **Vá para SQL Editor**:
   - No menu lateral, clique em "SQL Editor"
   - Clique em "+ New query"

3. **Execute o SQL**:
   - Abra o arquivo `setup_supabase_tables.sql` nesta pasta
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verifique a Criação**:
   - No menu lateral, vá em "Table Editor"
   - Você deve ver a tabela `priority_leads`

5. **Execute o Upload Novamente**:
   ```bash
   cd "Step 5 - Outreach & Campaigns"
   python upload_priority_leads.py
   ```

### OPÇÃO 2: Upload Manual via Dashboard (Mais Simples)

Se você não quer mexer com SQL, pode fazer upload manual dos CSVs:

1. **Acesse Table Editor no Supabase**:
   - URL: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor

2. **Crie a Tabela Manualmente**:
   - Clique em "+ New Table"
   - Nome: `priority_leads`
   - Use o arquivo `setup_supabase_tables.sql` como referência para as colunas

3. **Importe os CSVs**:
   - Clique em "Insert" > "Import data from CSV"
   - Selecione o arquivo `Step 4 - AI Review & Evaluate/CONTACT_LISTS/CONTACT_LIST_FOCUSED.csv`
   - Repita para `Step 4 - AI Review & Evaluate/CONTACT_LISTS/VACANT_LAND/VACANT_LAND_PRIORITY.csv`

## Arquivos Prontos para Upload

### Dados das Leads (242 total)
- **Properties**: `../Step 4 - AI Review & Evaluate/CONTACT_LISTS/CONTACT_LIST_FOCUSED.csv` (238 leads)
- **Vacant Land**: `../Step 4 - AI Review & Evaluate/CONTACT_LISTS/VACANT_LAND/VACANT_LAND_PRIORITY.csv` (4 leads)

### Imagens (242 total)
- **Diretório**: `../Step 3 - Download Images/property_photos/`
- Todas as 242 imagens estão disponíveis

## Breakdown das 242 Leads

### Properties (238)
- **P1-CRITICAL**: 3 propriedades (Score 180+, Condition 9-10/10)
- **P2-HIGH**: 35 propriedades (Score 235+, Condition 7-8/10)
- **P3-GOOD**: 19 propriedades (Score 200+, Condition 5-8/10)
- **P4-MEDIUM**: 84 propriedades
- **P5-FAIR**: 75 propriedades
- **P6-LOWER**: 22 propriedades

### Vacant Land (4)
- Score 180-210 (alta prioridade)
- Todas com delinquência fiscal

## Top 3 Leads (Mais Quentes)

1. **28-22-29-5600-81200**
   - Prioridade: P1-CRITICAL
   - Dono: GLOVER RICHARD G
   - Score: 212, Condição: 9/10

2. **28-22-29-5600-81200**
   - Prioridade: P1-CRITICAL
   - Dono: GLOVER RICHARD G
   - Score: 192, Condição: 9/10

3. **28-22-29-5600-81200**
   - Prioridade: P1-CRITICAL
   - Dono: GLOVER RICHARD G
   - Score: 182, Condição: 9/10

## Próximos Passos

Depois que a tabela for criada e os dados forem carregados:

1. **Configurar permissões de acesso** (Row Level Security)
2. **Upload das imagens** para o storage bucket
3. **Testar queries** para filtrar as melhores leads
4. **Integrar com frontend** para visualização

## Precisa de Ajuda?

Se encontrar problemas:
1. Verifique se está logado no Supabase com as credenciais corretas
2. Confirme que o projeto ID está correto: `atwdkhlyrffbaugkaker`
3. Execute o script em modo preview primeiro: `python upload_priority_leads.py --preview`
