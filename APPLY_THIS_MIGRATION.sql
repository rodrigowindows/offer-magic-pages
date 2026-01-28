-- ============================================================================
-- MIGRATION COMPLETA - MANUAL COMPS SYSTEM
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie ESTE ARQUIVO COMPLETO
-- 2. Vá em: https://supabase.com/dashboard
-- 3. Clique em: SQL Editor (no menu lateral)
-- 4. Cole TODO este conteúdo
-- 5. Clique em: RUN (ou Ctrl+Enter)
-- 6. Aguarde "Success ✓"
-- ============================================================================

-- Limpar constraints problemáticas
ALTER TABLE IF EXISTS public.manual_comps_links
DROP CONSTRAINT IF EXISTS check_comp_data_structure;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.manual_comps_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    property_address TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    comp_data JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Garantir que coluna comp_data existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'manual_comps_links'
        AND column_name = 'comp_data'
    ) THEN
        ALTER TABLE public.manual_comps_links ADD COLUMN comp_data JSONB;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id
ON public.manual_comps_links(property_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_user_id
ON public.manual_comps_links(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_comp_data
ON public.manual_comps_links USING GIN (comp_data);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_created_at
ON public.manual_comps_links(created_at DESC);

-- Ativar Row Level Security
ALTER TABLE public.manual_comps_links ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can insert their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can update their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can delete their own manual comps" ON public.manual_comps_links;

-- Criar políticas de segurança
CREATE POLICY "Users can view their own manual comps"
ON public.manual_comps_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual comps"
ON public.manual_comps_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual comps"
ON public.manual_comps_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual comps"
ON public.manual_comps_links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar função para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_manual_comps_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS update_manual_comps_links_updated_at_trigger ON public.manual_comps_links;

CREATE TRIGGER update_manual_comps_links_updated_at_trigger
    BEFORE UPDATE ON public.manual_comps_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_manual_comps_links_updated_at();

-- Dar permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_comps_links TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Adicionar comentários
COMMENT ON TABLE public.manual_comps_links IS
'Stores manually added comparable properties with optional full data';

COMMENT ON COLUMN public.manual_comps_links.comp_data IS
'Optional JSON data containing full comp details: {
  "sale_price": number,
  "square_feet": number,
  "bedrooms": number,
  "bathrooms": number,
  "sale_date": "YYYY-MM-DD"
}';

-- ============================================================================
-- ✅ MIGRATION CONCLUÍDA!
-- ============================================================================
-- Agora você pode:
-- 1. Fechar esta janela
-- 2. Voltar para o app
-- 3. Recarregar a página (F5)
-- 4. Testar adicionar manual comps
-- ============================================================================
