# 🔧 Corrigir Erro de Permissão nos Templates

## ❌ Problema

Você está vendo este erro no console:
```
❌ Erro ao inserir templates padrão: {code: '42501', message: 'new row violates row-level security policy for table "templates"'}
POST https://atwdkhlyrffbaugkaker.supabase.co/rest/v1/templates 401 (Unauthorized)
```

**Causa:** A tabela `templates` no Supabase está configurada para aceitar apenas usuários autenticados, mas a aplicação está tentando acessar sem autenticação.

---

## ✅ Solução

Execute o SQL abaixo no Supabase para permitir acesso público aos templates:

### 1️⃣ Acesse o SQL Editor do Supabase

Abra: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql

### 2️⃣ Execute este SQL

Copie e cole o conteúdo do arquivo:
```
supabase/migrations/20260112_update_templates_rls_public.sql
```

Ou execute diretamente:

```sql
-- Remove as políticas antigas (somente para authenticated)
DROP POLICY IF EXISTS "Allow authenticated users to read templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to update templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to delete templates" ON public.templates;

-- Cria novas políticas que permitem acesso público (anon + authenticated)
CREATE POLICY "Allow public read access to templates"
  ON public.templates
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to templates"
  ON public.templates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to templates"
  ON public.templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to templates"
  ON public.templates
  FOR DELETE
  USING (true);
```

### 3️⃣ Recarregue a Aplicação

Após executar o SQL, recarregue a página da aplicação (Ctrl+Shift+R).

---

## 🔍 Verificação

Para verificar se funcionou, execute no SQL Editor:

```sql
-- Ver as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'templates'
ORDER BY policyname;

-- Ver os templates
SELECT id, name, channel, is_default FROM public.templates;
```

---

## 📝 Notas de Segurança

Esta configuração permite acesso **público** (anônimo) aos templates. Isso é adequado porque:

- ✅ Templates não contêm dados sensíveis
- ✅ Aplicação é para uso interno
- ✅ Simplifica o desenvolvimento sem necessidade de autenticação

Se no futuro você quiser restringir o acesso, será necessário implementar autenticação de usuários no frontend.

---

## 🎯 Resultado Esperado

Depois de executar o SQL, você verá no console:

```
📥 Primeira vez - inserindo templates padrão no banco
✅ Templates padrão inseridos com sucesso!
📊 Template stats: {total: 8, bySMS: 3, byEmail: 2, byCall: 3}
```

E os templates funcionarão normalmente! 🎉
