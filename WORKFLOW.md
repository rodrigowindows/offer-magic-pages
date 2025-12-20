# 🔄 Workflow Completo - Step 5 Orlando

Guia passo a passo para trabalhar com o projeto Step 5.

---

## 🚀 Setup Inicial (Primeira Vez)

### 1. Instalar dependências Node.js (Lovable/Frontend)
```bash
npm install
```

### 2. Instalar dependências Python (Scripts de dados)
```bash
cd scripts/
pip install -r requirements.txt
cd ..
```

### 3. Configurar variáveis de ambiente
Criar arquivo `.env` na raiz com:
```env
VITE_SUPABASE_URL=https://atwdkhlyrffbaugkaker.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui
```

### 4. Setup do banco de dados (apenas primeira vez)
```bash
cd scripts/
python setup_database.py
# Seguir instruções para criar tabela no Supabase Dashboard
cd ..
```

---

## 📊 Importar Novos Dados (do Step 4)

### Passo 1: Preparar dados
Combina CONTACT_LIST + VACANT_LAND em um único CSV otimizado:

```bash
cd scripts/
python prepare_for_manual_upload.py
```

**Output**: `SUPABASE_UPLOAD_242_LEADS.csv` (242 leads prontos)

### Passo 2: Upload de dados para Supabase
```bash
python simple_upload.py
```

**Progresso**: Upload em batches de 50 registros
**Resultado**: 242 leads no Supabase

### Passo 3: Upload de imagens
```bash
python upload_images.py
```

**Requisito**: Pasta `data/processed/FINAL_242_LEADS/` com imagens
**Resultado**: Imagens linkadas às propriedades (campo `image_url`)

### Passo 4: Verificar no app
```bash
cd ..
npm run dev
```

Abrir: http://localhost:8080

---

## 🛠️ Scripts Python Disponíveis

### Upload de dados:
- **simple_upload.py** ⭐ - Upload rápido e simples (recomendado)
- **upload_with_error_handling.py** - Upload linha por linha com debug detalhado

### Upload de imagens:
- **upload_images.py** ⭐ - Upload e link de imagens
- **upload_all_206_images.py** - Upload específico de 206 imagens
- **delete_old_images.py** - Limpar imagens antigas do Storage
- **update_image_urls.py** - Atualizar URLs de imagens no banco

### Setup:
- **setup_database.py** - Criar tabela no Supabase (primeira vez)
- **auto_setup_and_upload.py** - Setup + upload automático
- **prepare_for_manual_upload.py** ⭐ - Preparar dados do Step 4

### Organização:
- **organize_step5_SAFE.py** - Reorganizar projeto (já executado)
- **organize_step5_SAFE_fixed.py** - Versão corrigida do organizador

📚 **Documentação detalhada**: [docs/technical/EXPLICACAO_SCRIPTS_PYTHON.md](docs/technical/EXPLICACAO_SCRIPTS_PYTHON.md)

---

## 💻 Desenvolvimento Frontend (Lovable)

### Rodar em modo desenvolvimento:
```bash
npm run dev
```

### Build para produção:
```bash
npm run build
```

### Preview do build:
```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```
Step 5 - Outreach & Campaigns/
│
├── src/                          ← Código React/TypeScript
│   ├── components/               ← Componentes React
│   ├── hooks/                    ← Custom hooks
│   ├── lib/                      ← Utilities e helpers
│   └── pages/                    ← Páginas da aplicação
│
├── scripts/                      ← Scripts Python
│   ├── simple_upload.py          ← Upload de dados
│   ├── upload_images.py          ← Upload de imagens
│   ├── prepare_for_manual_upload.py  ← Preparar dados
│   └── requirements.txt          ← Dependências Python
│
├── data/                         ← Dados CSV
│   └── processed/                ← CSVs processados
│       ├── FINAL_242_LEADS/      ← Imagens das propriedades
│       └── *.csv                 ← Dados para upload
│
├── database/                     ← SQL files
│   ├── setup_supabase_tables.sql ← Schema da tabela
│   └── fix_rls_policy.sql        ← Políticas de segurança
│
├── docs/                         ← Documentação
│   ├── technical/                ← Docs técnicas
│   ├── setup/                    ← Guias de setup
│   └── reports/                  ← Relatórios
│
├── public/                       ← Assets públicos
├── supabase/                     ← Config Supabase
│
├── package.json                  ← Dependências Node.js
├── vite.config.ts                ← Config Vite
├── .env                          ← Variáveis de ambiente
└── WORKFLOW.md                   ← Este arquivo
```

---

## 🔍 Troubleshooting

### Problema: "Table does not exist"
**Causa**: Tabela não foi criada no Supabase
**Solução**:
```bash
cd scripts/
python setup_database.py
# Seguir instruções para criar manualmente no Dashboard
```

### Problema: Upload silenciosamente falhando
**Causa**: Dados com formato inválido
**Solução**: Usar script de debug
```bash
cd scripts/
python upload_with_error_handling.py
# Ver erros detalhados linha por linha
```

### Problema: Imagens não aparecem no app
**Checklist**:
1. ✅ Bucket `property-images` existe no Supabase Storage?
2. ✅ RLS policies permitem leitura pública?
3. ✅ Script `upload_images.py` rodou sem erros?
4. ✅ Campo `image_url` foi atualizado no banco?

### Problema: npm run dev não funciona
**Causa**: Dependências não instaladas ou cache corrompido
**Solução**:
```bash
npm cache clean --force
rm -rf node_modules
npm install
npm run dev
```

### Problema: pip install falha
**Causa**: Python ou pip desatualizado
**Solução**:
```bash
python --version  # Deve ser 3.8+
pip install --upgrade pip
pip install -r scripts/requirements.txt
```

---

## 📊 Fluxo Completo (Resumido)

### Para importar dados pela primeira vez:

```bash
# 1. Setup (apenas primeira vez)
npm install
cd scripts/ && pip install -r requirements.txt && cd ..

# 2. Preparar dados
cd scripts/
python prepare_for_manual_upload.py

# 3. Criar tabela (Dashboard manual - primeira vez)
python setup_database.py

# 4. Upload dados
python simple_upload.py

# 5. Upload imagens
python upload_images.py

# 6. Verificar
cd ..
npm run dev
```

### Para desenvolvimento do frontend:

```bash
npm run dev
# Editar arquivos em src/
# Browser auto-refresh
```

### Para atualizar dados (novos leads):

```bash
cd scripts/
python prepare_for_manual_upload.py
python simple_upload.py
python upload_images.py
```

---

## 🎯 Componentes Principais do App

### Admin Dashboard
- **Dashboard** - Visão geral e estatísticas
- **Properties** - Lista de todas as propriedades
- **Review Queue** ⭐ - Workflow rápido de revisão (3-5x mais rápido)
- **Team Activity** - Atividade da equipe

### Funcionalidades:
- ✅ Filtros unificados (status, prioridade, tags, etc)
- ✅ Quick Actions (adicionar, revisar, exportar)
- ✅ Review Queue com keyboard shortcuts
- ✅ Team Reports com export CSV (UTF-8 BOM)
- ✅ Error Boundary para crashes
- ✅ Empty States para melhor UX
- ✅ Lazy loading de imagens

### Landing Page (Pública)
- Captura de leads (Orlando-specific)
- Validação com Zod
- Detecção de duplicatas
- Formulário responsivo

---

## 📚 Documentação Adicional

- **Scripts Python**: [docs/technical/EXPLICACAO_SCRIPTS_PYTHON.md](docs/technical/EXPLICACAO_SCRIPTS_PYTHON.md)
- **Organização**: [docs/technical/ORGANIZATION.md](docs/technical/ORGANIZATION.md)
- **Melhorias**: [docs/reports/MELHORIAS_FINAIS.md](docs/reports/MELHORIAS_FINAIS.md)

---

## ✅ Checklist de Verificação

Antes de fazer deploy:

- [ ] `npm run build` sem erros
- [ ] Todas as imagens carregam corretamente
- [ ] Filtros funcionam em todas as tabs
- [ ] Review Queue com keyboard shortcuts funcionando
- [ ] Team Reports exportam com acentos corretos (UTF-8 BOM)
- [ ] Landing page captura leads corretamente
- [ ] Variáveis de ambiente corretas (.env)
- [ ] RLS policies configuradas no Supabase
- [ ] Bucket de imagens público (read)

---

**Última atualização**: 20 Dezembro 2025
**Projeto**: MyLocalInvest Orlando - Step 5
**Status**: ✅ Pronto para uso
