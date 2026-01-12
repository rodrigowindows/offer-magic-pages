import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Executando migration: create templates table');

    // Executar SQL para criar a tabela
    const { data: tableData, error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_templates_channel ON public.templates(channel);
        CREATE INDEX IF NOT EXISTS idx_templates_is_default ON public.templates(is_default);

        ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
      `
    });

    if (tableError) {
      console.error('❌ Erro ao criar tabela:', tableError);
    } else {
      console.log('✅ Tabela criada com sucesso');
    }

    // Criar policies
    const { data: policyData, error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to read templates'
          ) THEN
            CREATE POLICY "Allow authenticated users to read templates"
              ON public.templates FOR SELECT TO authenticated USING (true);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert templates'
          ) THEN
            CREATE POLICY "Allow authenticated users to insert templates"
              ON public.templates FOR INSERT TO authenticated WITH CHECK (true);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update templates'
          ) THEN
            CREATE POLICY "Allow authenticated users to update templates"
              ON public.templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to delete templates'
          ) THEN
            CREATE POLICY "Allow authenticated users to delete templates"
              ON public.templates FOR DELETE TO authenticated USING (true);
          END IF;
        END
        $$;
      `
    });

    if (policyError) {
      console.error('❌ Erro ao criar policies:', policyError);
    } else {
      console.log('✅ Policies criadas com sucesso');
    }

    // Criar função e trigger
    const { data: functionData, error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = timezone('utc'::text, now());
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS update_templates_timestamp ON public.templates;

        CREATE TRIGGER update_templates_timestamp
          BEFORE UPDATE ON public.templates
          FOR EACH ROW
          EXECUTE FUNCTION public.update_templates_updated_at();
      `
    });

    if (functionError) {
      console.error('❌ Erro ao criar função/trigger:', functionError);
    } else {
      console.log('✅ Função e trigger criados com sucesso');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration executada com sucesso!',
      errors: {
        table: tableError?.message,
        policy: policyError?.message,
        function: functionError?.message,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na migration:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
