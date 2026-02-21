# 🗄️ Migração de Templates para Supabase

## ✅ O que foi feito:

1. ✅ Criada migration SQL: `supabase/migrations/20260112_create_templates_table.sql`
2. ✅ Criado novo hook: `src/hooks/useTemplatesDB.ts` (usa Supabase ao invés de localStorage)
3. ⏳ Falta executar a migration no Supabase

---

## 📋 Como executar a migration:

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Abra o Supabase Dashboard:**
   - Vá em: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker

2. **Acesse SQL Editor:**
   - Menu lateral → **SQL Editor**
   - Clique em **"+ New query"**

3. **Copie e cole este SQL:**

```sql
-- Create templates table for marketing templates
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  subject TEXT,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  edited_manually BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_channel ON public.templates(channel);
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON public.templates(is_default);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read templates"
  ON public.templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert templates"
  ON public.templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update templates"
  ON public.templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete templates"
  ON public.templates FOR DELETE TO authenticated USING (true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_templates_timestamp
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_templates_updated_at();
```

4. **Execute:**
   - Clique em **"Run"** (ou Ctrl+Enter)
   - Deve aparecer: "Success. No rows returned"

5. **Verifique:**
   - Menu lateral → **Table Editor**
   - Procure por **"templates"** na lista
   - Deve aparecer a nova tabela vazia

---

### Opção 2: Via Supabase CLI (se tiver instalado)

```bash
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
supabase db push
```

---

## 🔄 Depois de executar a migration:

### 1. Atualizar o código para usar `useTemplatesDB`:

O arquivo `src/hooks/useTemplates.ts` precisa ser substituído pelo novo `useTemplatesDB.ts`.

Ou podemos manter ambos e fazer uma migração gradual.

### 2. Testar:

1. Recarregue a aplicação
2. Vá em Templates
3. Os templates padrão devem ser inseridos automaticamente no banco
4. Edite um template → deve salvar no Supabase
5. Recarregue a página → template editado deve permanecer

---

## ✨ Vantagens da migração:

1. ✅ **Sem problemas de sincronização** - Todos os dispositivos veem os mesmos templates
2. ✅ **Versionamento funciona** - Templates padrão são atualizados corretamente
3. ✅ **Backup automático** - Templates salvos no banco
4. ✅ **Multi-usuário** - Vários usuários podem compartilhar templates
5. ✅ **Edições protegidas** - Sistema de `edited_manually` funciona perfeitamente

---

## 🐛 Troubleshooting:

### Erro: "relation templates does not exist"
- A migration não foi executada. Execute o SQL no dashboard.

### Erro: "permission denied for table templates"
- As policies RLS não foram criadas. Execute o SQL completo novamente.

### Templates não aparecem:
- Abra o console (F12) e veja os erros
- Verifique se está autenticado no Supabase

---

**👉 PRÓXIMO PASSO: Execute o SQL no Supabase Dashboard e me avise quando terminar!**
