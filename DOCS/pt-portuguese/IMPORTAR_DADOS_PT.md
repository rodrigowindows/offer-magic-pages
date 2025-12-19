# 📥 Importar Dados e Imagens - Guia Rápido

Guia completo para subir suas 15.070 propriedades e 984 imagens para o Lovable/Supabase sem perder dados existentes.

---

## 🎯 O Que Você Tem

- **15.070 propriedades** no CSV `RESULTS/01_MASTER_Combined_Tax_Visual_Analysis.csv`
- **984 fotos** em `Step 3 - Download Images/property_photos/`
- **Dados existentes** no Lovable com aprovações/rejeições de usuários

**Objetivo**: Juntar tudo sem perder aprovações, rejeições ou rastreamento de usuários.

---

## ✅ Como Funciona: UPSERT (Atualizar ou Inserir)

O sistema usa lógica **UPSERT**:
- Se propriedade existe (mesmo `account_number`): **ATUALIZA** apenas campos vazios (preserva aprovações)
- Se propriedade é nova: **INSERE** com status `pending`

Garante:
- ✅ Aprovações/rejeições existentes preservadas
- ✅ Novas propriedades adicionadas
- ✅ Dados faltantes preenchidos

---

## 📋 Passo a Passo

### **Passo 1: Configurar Ambiente**

#### 1.1 Criar arquivo `.env`

Na pasta `tools/`, crie arquivo `.env`:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_KEY=sua-chave-service-role-aqui
```

**Onde pegar as chaves:**
1. Vá para: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. **Settings** → **API**
4. Copie:
   - `URL` → SUPABASE_URL
   - `anon public` → SUPABASE_ANON_KEY
   - `service_role` → SUPABASE_SERVICE_KEY

⚠️ **IMPORTANTE**: Use a chave **service_role** (não a anon) para import de dados.

#### 1.2 Instalar dependências

```bash
cd "Step 5 - Outreach & Campaigns/tools"
pip install requests python-dotenv supabase pandas
```

---

### **Passo 2: Criar Bucket de Imagens no Supabase**

#### 2.1 No Supabase Dashboard:

1. **Storage** → **Create Bucket**
2. Nome: `property-photos`
3. Marcar **Public** ✅
4. Click **Create**

#### 2.2 Configurar permissões públicas:

1. Clique no bucket `property-photos`
2. **Settings** → **Public** = ON

---

### **Passo 3: Subir Imagens**

```bash
cd "Step 5 - Outreach & Campaigns/tools"
python upload_images_to_supabase.py
```

**O que acontece:**
- Sobe as 984 imagens para Supabase Storage
- Cada imagem fica acessível em: `https://[projeto].supabase.co/storage/v1/object/public/property-photos/[account-number].jpg`
- Se rodar 2x, não duplica (pula imagens existentes)

**Resultado esperado:**
```
📸 Found 984 images to upload
✅ Uploaded: 23-22-28-7975-00330.jpg
✅ Uploaded: 15-21-28-0000-00066.jpg
...
✅ Successfully uploaded: 984/984
```

---

### **Passo 4: Importar Dados do CSV**

```bash
python import_csv_to_supabase.py
```

**O que acontece:**
- Lê o CSV com 15.070 propriedades
- Para cada propriedade:
  - Se já existe: ATUALIZA apenas campos vazios (PRESERVA aprovações)
  - Se é nova: INSERE com status `pending`
- Vincula imagens via campo `photo_url`

**Resultado esperado:**
```
📊 Loaded 15070 properties from CSV
✅ Inserted: 23-22-28-7975-00330
🔄 Updated: 15-21-28-0000-00066 (3 fields)
...
✅ Total processed: 15070/15070
📥 Inserted (new): 14500
🔄 Updated (existing): 450
⏭️  Skipped (complete): 120
```

---

### **Passo 5: Verificar Importação**

#### 5.1 No Supabase Dashboard:

1. **Table Editor** → `properties`
2. Veja suas propriedades importadas
3. Verifique que aprovações/rejeições estão preservadas

#### 5.2 No App Lovable:

1. Faça deploy (migrações rodam automaticamente)
2. Vá para página **Admin**
3. Filtre por status de aprovação
4. Veja que imagens aparecem corretamente

---

## 🔧 Solução de Problemas

### ❌ Imagens não aparecem?

**Solução**: Verificar que bucket é público
1. Supabase → **Storage** → `property-photos`
2. **Settings** → **Public** = ON

### ❌ Erro no script de import?

**Soluções**:
- Verificar `.env` tem chaves corretas
- Usar **Service Role Key** (não anon key)
- Verificar nomes de colunas no CSV

### ❌ Propriedades duplicadas?

**Não duplica!** O script detecta por `account_number`:
- Mesmo número = ATUALIZA (não duplica)
- Número diferente = INSERE novo

---

## 📊 Resultados Esperados

Depois da importação:
- ✅ **15.070 propriedades** no banco
- ✅ **984 imagens** no Storage
- ✅ **Todas aprovações/rejeições preservadas**
- ✅ **Novas propriedades** com status `pending`
- ✅ **Imagens vinculadas** via `photo_url`

---

## 🚀 Próximos Passos

Após importar:

1. **Deploy no Lovable** (migrações rodam automaticamente)
2. **Testar filtros** (por usuário, por status de aprovação)
3. **Revisar imagens** (ver se aparecem)
4. **Começar revisão** de propriedades pendentes com equipe

---

## 📁 Arquivos Criados

```
tools/
├── upload_images_to_supabase.py   # Sobe 984 imagens
├── import_csv_to_supabase.py      # Importa 15.070 propriedades
├── .env                           # Chaves API (NÃO commitar!)
├── .env.example                   # Exemplo do .env
└── .gitignore                     # Ignora .env no git
```

---

## ⚠️ Segurança

**NUNCA commit o arquivo `.env` no git!**

- Arquivo `.gitignore` já está configurado para ignorar `.env`
- Use `.env.example` para documentar quais chaves são necessárias
- Service Role Key tem acesso ADMIN - mantenha em segredo

---

## ❓ FAQ

**P: Isso vai sobrescrever minhas aprovações existentes?**
R: Não. O script exclui especificamente campos de aprovação das atualizações.

**P: E se eu rodar a importação 2 vezes?**
R: Seguro. Só atualiza campos vazios, não cria duplicados.

**P: Posso importar em lotes menores?**
R: Sim. Filtre o CSV primeiro, depois rode o script no arquivo menor.

**P: Como deletar tudo e reimportar?**
R: No Supabase → Table Editor → Delete all rows. Depois rode o script novamente.

**P: Quanto tempo demora?**
R:
- Upload de imagens: ~5-10 minutos (984 fotos)
- Import de dados: ~10-15 minutos (15.070 propriedades)

---

## 🎉 Resumo

1. Crie `.env` com chaves do Supabase
2. Crie bucket `property-photos` (público)
3. Rode `upload_images_to_supabase.py`
4. Rode `import_csv_to_supabase.py`
5. Verifique no Supabase e no Lovable
6. Done! 🚀

---

**Dúvidas?** Veja [IMPORT_DATA_GUIDE.md](./IMPORT_DATA_GUIDE.md) (versão em inglês com mais detalhes).
