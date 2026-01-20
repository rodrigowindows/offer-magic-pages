# 🔧 PROMPT PARA LOVABLE - SUPABASE MIGRATIONS

Copie e cole este prompt completo no Lovable para executar as migrations necessárias:

---

## CONTEXTO

Preciso que você execute 2 migrations no Supabase para completar as features de **Comps Analysis** e **Communication History**. Estas migrations já estão criadas no código mas precisam ser aplicadas no banco de dados.

---

## MIGRATION 1: Campaign Logs - HTML Content & Status Tracking

**Propósito:** Armazenar conteúdo HTML completo de emails/SMS enviados e rastrear status de entrega com badges coloridos.

**SQL para executar:**

```sql
-- Add html_content and channel fields to campaign_logs
-- This stores the full HTML/text content sent and the communication channel

ALTER TABLE public.campaign_logs
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS channel TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Add index for faster filtering by status and channel
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON public.campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_channel ON public.campaign_logs(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON public.campaign_logs(sent_at DESC);

-- Comment on columns
COMMENT ON COLUMN public.campaign_logs.html_content IS 'Full HTML or text content of the communication sent';
COMMENT ON COLUMN public.campaign_logs.channel IS 'Communication channel: email, sms, call, letter';
COMMENT ON COLUMN public.campaign_logs.status IS 'Delivery status: sent, delivered, bounced, failed, opened, clicked';
```

**Features habilitadas:**
- ✅ Preview HTML completo de emails no componente History
- ✅ Status badges coloridos (delivered=🟢, opened=🔵, clicked=🟣, bounced=🟠, failed=🔴)
- ✅ Filtrar comunicações por canal (email/SMS/call/letter)
- ✅ Rastrear engajamento (opened, clicked)

---

## MIGRATION 2: Manual Comps Links - Property Association

**Propósito:** Permitir usuários salvarem links do Trulia/Zillow/Redfin associados a propriedades específicas do sistema.

**SQL para executar:**

```sql
-- Create manual_comps_links table for saving comps links from Trulia/Zillow/Redfin
CREATE TABLE IF NOT EXISTS public.manual_comps_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_address TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('trulia', 'zillow', 'redfin', 'realtor', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_address ON public.manual_comps_links(property_address);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id ON public.manual_comps_links(property_id);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_user_id ON public.manual_comps_links(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_created_at ON public.manual_comps_links(created_at DESC);

-- Enable RLS
ALTER TABLE public.manual_comps_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own manual comps links"
  ON public.manual_comps_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual comps links"
  ON public.manual_comps_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual comps links"
  ON public.manual_comps_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual comps links"
  ON public.manual_comps_links FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manual_comps_links_updated_at BEFORE UPDATE
  ON public.manual_comps_links FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

**Features habilitadas:**
- ✅ Salvar links de páginas de comps do Trulia, Zillow, Redfin
- ✅ Associar links a propriedades específicas (dropdown de seleção)
- ✅ Auto-preencher endereço ao selecionar propriedade
- ✅ Filtrar links salvos por propriedade
- ✅ RLS garante que cada usuário vê apenas seus próprios links
- ✅ Detecção automática da fonte (trulia/zillow/redfin/realtor/other)

---

## COMO APLICAR

**Opção 1: Via Lovable (Recomendado)**
1. Use sua integração com Supabase
2. Execute cada migration SQL acima
3. Confirme que não há erros

**Opção 2: Manual no Supabase Dashboard**
1. Acesse Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole Migration 1 → Click **Run**
4. Cole Migration 2 → Click **Run**
5. Verifique que não há erros

---

## VALIDAÇÃO

Após executar as migrations, confirme que:

### Migration 1 - Campaign Logs
```sql
-- Deve retornar 3 novas colunas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaign_logs'
AND column_name IN ('html_content', 'channel', 'status');
```

### Migration 2 - Manual Comps Links
```sql
-- Deve retornar a nova tabela
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'manual_comps_links';

-- Deve retornar 4 policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'manual_comps_links';
```

---

## TROUBLESHOOTING

### Se Migration 1 falhar:
- ✅ Tabela `campaign_logs` existe? Se não, crie primeiro
- ✅ Coluna `sent_at` existe? É necessária para o index

### Se Migration 2 falhar:
- ✅ Tabela `properties` existe? É necessária para foreign key
- ✅ Tabela `auth.users` existe? É necessária para foreign key
- ✅ Function `update_updated_at_column()` já existe? Se sim, pode ignorar esse erro

---

## RESULTADO ESPERADO

Após executar com sucesso:

✅ **Campaign Logs:**
- 3 novas colunas: `html_content`, `channel`, `status`
- 3 novos indexes para performance
- Component History mostrará preview HTML e status badges

✅ **Manual Comps Links:**
- Nova tabela `manual_comps_links` criada
- 4 RLS policies ativas
- Component ManualCompsManager funcionando com Supabase
- Dropdown de propriedades funcionando
- Auto-preenchimento de endereço funcionando

---

## PÓS-MIGRATION

1. **Teste Campaign Logs:**
   - Envie um email de teste
   - Verifique que HTML foi salvo
   - Verifique status badge na History

2. **Teste Manual Comps:**
   - Vá em Comps Analysis → Tab "Links Salvos"
   - Selecione uma propriedade
   - Adicione link do Trulia
   - Verifique que salvou no Supabase

---

**Execute estas migrations e me avise quando concluir para validarmos juntos!**

---

**Arquivos relacionados no código:**
- `supabase/migrations/20260116_add_html_content_to_campaign_logs.sql`
- `supabase/migrations/create_manual_comps_links.sql`
- `src/components/marketing/History.tsx` (usa campaign_logs)
- `src/components/ManualCompsManager.tsx` (usa manual_comps_links)
