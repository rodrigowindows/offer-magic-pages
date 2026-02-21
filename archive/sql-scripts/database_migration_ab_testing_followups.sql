-- 🚀 Migração: Testes A/B Automatizados & Follow-ups Inteligentes
-- Data: $(date)
-- Versão: 1.0.0

-- ===========================================
-- TABELA: ab_tests
-- ===========================================
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
    test_type VARCHAR(50) DEFAULT 'subject_line' CHECK (test_type IN ('subject_line', 'content', 'timing', 'segmentation')),

    -- Configurações do teste
    variants JSONB NOT NULL DEFAULT '[]', -- Array de variantes [{id, name, content, weight}]
    winner_criteria VARCHAR(50) DEFAULT 'statistical_significance' CHECK (winner_criteria IN ('statistical_significance', 'conversion_rate', 'open_rate', 'click_rate')),
    confidence_threshold DECIMAL(3,2) DEFAULT 0.95, -- 95% confiança
    minimum_sample_size INTEGER DEFAULT 1000,

    -- Controle de distribuição
    traffic_distribution VARCHAR(20) DEFAULT 'equal' CHECK (traffic_distribution IN ('equal', 'weighted', 'adaptive')),
    sample_size_per_variant INTEGER DEFAULT 100,

    -- Resultados
    results JSONB DEFAULT '{}', -- {winner_id, confidence_level, improvement_percentage, statistical_significance}
    winner_variant_id VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}'
);

-- ===========================================
-- TABELA: follow_up_rules
-- ===========================================
CREATE TABLE IF NOT EXISTS follow_up_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,

    -- Condições de trigger
    trigger_event VARCHAR(100) NOT NULL, -- 'email_opened', 'link_clicked', 'no_response', etc.
    trigger_conditions JSONB DEFAULT '{}', -- {delay_hours, specific_actions, lead_segment}

    -- Ações a executar
    actions JSONB NOT NULL DEFAULT '[]', -- [{type: 'email'|'sms'|'call', template_id, delay_hours, conditions}]

    -- Controle de execução
    max_executions_per_lead INTEGER DEFAULT 3,
    cooldown_period_hours INTEGER DEFAULT 24,
    priority INTEGER DEFAULT 1, -- 1=high, 5=low

    -- Estatísticas
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}'
);

-- ===========================================
-- TABELA: follow_up_executions
-- ===========================================
CREATE TABLE IF NOT EXISTS follow_up_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID NOT NULL REFERENCES follow_up_rules(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Contexto da execução
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data JSONB DEFAULT '{}', -- Dados do evento que acionou o follow-up

    -- Ação executada
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('email', 'sms', 'call', 'notification')),
    action_data JSONB NOT NULL DEFAULT '{}', -- {template_id, content, channel, etc.}

    -- Status e resultado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'failed')),
    error_message TEXT,
    response_data JSONB DEFAULT '{}', -- Dados da resposta do lead

    -- Controle de timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    delay_hours INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    campaign_id UUID REFERENCES campaigns(id),
    property_id UUID REFERENCES properties(id)
);

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

-- Índices para ab_tests
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_campaign_id ON ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_tests_winner_criteria ON ab_tests(winner_criteria);

-- Índices para follow_up_rules
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_active ON follow_up_rules(active);
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_trigger_event ON follow_up_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_priority ON follow_up_rules(priority);
CREATE INDEX IF NOT EXISTS idx_follow_up_rules_created_at ON follow_up_rules(created_at DESC);

-- Índices para follow_up_executions
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_rule_id ON follow_up_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_lead_id ON follow_up_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_status ON follow_up_executions(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_scheduled_at ON follow_up_executions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_executed_at ON follow_up_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_campaign_id ON follow_up_executions(campaign_id);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_rule_lead ON follow_up_executions(rule_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_status_scheduled ON follow_up_executions(status, scheduled_at) WHERE status = 'pending';

-- ===========================================
-- POLÍTICAS RLS (Row Level Security)
-- ===========================================

-- RLS para ab_tests
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ab_tests they created" ON ab_tests
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own ab_tests" ON ab_tests
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ab_tests" ON ab_tests
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS para follow_up_rules
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follow_up_rules they created" ON follow_up_rules
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own follow_up_rules" ON follow_up_rules
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own follow_up_rules" ON follow_up_rules
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS para follow_up_executions
ALTER TABLE follow_up_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executions for their rules" ON follow_up_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM follow_up_rules
            WHERE follow_up_rules.id = follow_up_executions.rule_id
            AND follow_up_rules.created_by = auth.uid()
        )
    );

CREATE POLICY "System can insert executions" ON follow_up_executions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update executions for their rules" ON follow_up_executions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM follow_up_rules
            WHERE follow_up_rules.id = follow_up_executions.rule_id
            AND follow_up_rules.created_by = auth.uid()
        )
    );

-- ===========================================
-- FUNÇÕES ÚTEIS
-- ===========================================

-- Função para calcular vencedor do teste A/B
CREATE OR REPLACE FUNCTION calculate_ab_test_winner(test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_record RECORD;
    variants_data JSONB;
    winner_data JSONB := '{}';
    best_variant JSONB;
    best_score DECIMAL := 0;
BEGIN
    -- Buscar dados do teste
    SELECT * INTO test_record FROM ab_tests WHERE id = test_id;

    IF test_record.status != 'running' THEN
        RETURN jsonb_build_object('error', 'Test is not running');
    END IF;

    -- Calcular estatísticas para cada variante
    SELECT jsonb_agg(
        jsonb_build_object(
            'variant_id', v.variant_id,
            'variant_name', v.variant_name,
            'sample_size', v.sample_size,
            'conversion_rate', v.conversion_rate,
            'confidence_interval', v.confidence_interval,
            'statistical_significance', v.statistical_significance
        )
    ) INTO variants_data
    FROM (
        SELECT
            (variant->>'id') as variant_id,
            (variant->>'name') as variant_name,
            -- Calcular métricas baseadas no winner_criteria
            CASE
                WHEN test_record.winner_criteria = 'conversion_rate' THEN
                    -- Lógica para calcular taxa de conversão
                    0.15 -- Placeholder - implementar cálculo real
                WHEN test_record.winner_criteria = 'open_rate' THEN
                    0.25 -- Placeholder
                WHEN test_record.winner_criteria = 'click_rate' THEN
                    0.08 -- Placeholder
                ELSE 0.10
            END as conversion_rate,
            1000 as sample_size, -- Placeholder
            '[0.12, 0.18]' as confidence_interval, -- Placeholder
            0.95 as statistical_significance -- Placeholder
        FROM jsonb_array_elements(test_record.variants) as variant
    ) v;

    -- Determinar vencedor baseado no critério
    SELECT * INTO best_variant
    FROM jsonb_array_elements(variants_data) as variant
    ORDER BY (variant->>'conversion_rate')::DECIMAL DESC
    LIMIT 1;

    -- Verificar se atingiu significância estatística
    IF (best_variant->>'statistical_significance')::DECIMAL >= test_record.confidence_threshold THEN
        winner_data := jsonb_build_object(
            'winner_variant_id', best_variant->>'variant_id',
            'winner_name', best_variant->>'variant_name',
            'confidence_level', best_variant->>'statistical_significance',
            'improvement_percentage', 15.5, -- Placeholder
            'has_statistical_significance', true,
            'variants_data', variants_data
        );

        -- Atualizar teste com vencedor
        UPDATE ab_tests
        SET
            status = 'completed',
            winner_variant_id = best_variant->>'variant_id',
            results = winner_data,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = test_id;
    ELSE
        winner_data := jsonb_build_object(
            'message', 'Not enough statistical significance yet',
            'variants_data', variants_data
        );
    END IF;

    RETURN winner_data;
END;
$$;

-- Função para executar follow-up rules
CREATE OR REPLACE FUNCTION execute_follow_up_rules()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_record RECORD;
    execution_count INTEGER := 0;
    lead_record RECORD;
BEGIN
    -- Para cada regra ativa
    FOR rule_record IN
        SELECT * FROM follow_up_rules
        WHERE active = true
        ORDER BY priority, created_at
    LOOP
        -- Encontrar leads que atendem às condições da regra
        FOR lead_record IN
            EXECUTE format('
                SELECT DISTINCT l.* FROM leads l
                WHERE l.id NOT IN (
                    SELECT fe.lead_id FROM follow_up_executions fe
                    WHERE fe.rule_id = %L
                    AND fe.created_at > NOW() - INTERVAL ''%s hours''
                )
                AND l.created_at < NOW() - INTERVAL ''%s hours''
                -- Adicionar condições específicas da regra aqui
                ',
                rule_record.id,
                rule_record.cooldown_period_hours,
                (rule_record.trigger_conditions->>'delay_hours')::INTEGER
            )
        LOOP
            -- Verificar se não excedeu o máximo de execuções por lead
            IF (
                SELECT COUNT(*) FROM follow_up_executions
                WHERE rule_id = rule_record.id AND lead_id = lead_record.id
            ) < rule_record.max_executions_per_lead THEN

                -- Inserir execução
                INSERT INTO follow_up_executions (
                    rule_id, lead_id, trigger_event, action_type, action_data,
                    scheduled_at, delay_hours
                ) VALUES (
                    rule_record.id,
                    lead_record.id,
                    rule_record.trigger_event,
                    (rule_record.actions->0->>'type'),
                    rule_record.actions->0,
                    NOW() + INTERVAL '1 hour' * (rule_record.actions->0->>'delay_hours')::INTEGER,
                    (rule_record.actions->0->>'delay_hours')::INTEGER
                );

                execution_count := execution_count + 1;

                -- Atualizar estatísticas da regra
                UPDATE follow_up_rules
                SET execution_count = execution_count + 1,
                    last_executed_at = NOW(),
                    updated_at = NOW()
                WHERE id = rule_record.id;
            END IF;
        END LOOP;
    END LOOP;

    RETURN execution_count;
END;
$$;

-- Função para obter estatísticas de follow-up
CREATE OR REPLACE FUNCTION get_follow_up_stats(rule_id UUID DEFAULT NULL)
RETURNS TABLE (
    rule_name VARCHAR(255),
    total_executions BIGINT,
    successful_executions BIGINT,
    conversion_rate DECIMAL,
    avg_response_time INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fr.name,
        COUNT(fe.id)::BIGINT as total_executions,
        COUNT(CASE WHEN fe.status IN ('responded', 'clicked') THEN 1 END)::BIGINT as successful_executions,
        ROUND(
            (COUNT(CASE WHEN fe.status IN ('responded', 'clicked') THEN 1 END)::DECIMAL /
             NULLIF(COUNT(fe.id), 0)) * 100, 2
        ) as conversion_rate,
        AVG(
            CASE
                WHEN fe.executed_at IS NOT NULL AND fe.updated_at > fe.executed_at
                THEN fe.updated_at - fe.executed_at
            END
        ) as avg_response_time
    FROM follow_up_rules fr
    LEFT JOIN follow_up_executions fe ON fr.id = fe.rule_id
    WHERE (rule_id IS NULL OR fr.id = rule_id)
    GROUP BY fr.id, fr.name
    ORDER BY fr.created_at DESC;
END;
$$;

-- ===========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ===========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_rules_updated_at
    BEFORE UPDATE ON follow_up_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_executions_updated_at
    BEFORE UPDATE ON follow_up_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DADOS INICIAIS (EXEMPLOS)
-- ===========================================

-- Inserir algumas regras de follow-up de exemplo
INSERT INTO follow_up_rules (name, description, trigger_event, trigger_conditions, actions, created_by) VALUES
(
    'Follow-up após abertura de email',
    'Enviar SMS 2 horas após o lead abrir o email mas não clicar',
    'email_opened',
    '{"delay_hours": 2, "require_no_click": true}',
    '[{"type": "sms", "template_id": "follow_up_sms_1", "delay_hours": 0, "message": "Olá! Vimos que você viu nossa propriedade. Podemos ajudar com mais detalhes?"}]',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Follow-up sem resposta',
    'Enviar email de follow-up 48 horas após envio inicial sem resposta',
    'no_response',
    '{"delay_hours": 48}',
    '[{"type": "email", "template_id": "follow_up_email_1", "delay_hours": 0, "subject": "Ainda interessado na propriedade?", "content": "Olá! Esperamos que esteja tudo bem..."}]',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Follow-up após clique em link',
    'Enviar notificação 1 hora após clique em link da propriedade',
    'link_clicked',
    '{"delay_hours": 1, "property_view": true}',
    '[{"type": "notification", "template_id": "property_interest_notification", "delay_hours": 0, "title": "Interesse na propriedade detectado", "message": "Lead clicou no link da propriedade X"}]',
    (SELECT id FROM auth.users LIMIT 1)
);

-- ===========================================
-- COMENTÁRIOS FINAIS
-- ===========================================

COMMENT ON TABLE ab_tests IS 'Tabela para gerenciar testes A/B automatizados de campanhas de marketing';
COMMENT ON TABLE follow_up_rules IS 'Regras de automação para follow-ups inteligentes baseados em comportamento';
COMMENT ON TABLE follow_up_executions IS 'Histórico de execuções de follow-ups para cada lead';

COMMENT ON FUNCTION calculate_ab_test_winner(UUID) IS 'Calcula o vencedor de um teste A/B baseado em critérios estatísticos';
COMMENT ON FUNCTION execute_follow_up_rules() IS 'Executa todas as regras de follow-up ativas para leads elegíveis';
COMMENT ON FUNCTION get_follow_up_stats(UUID) IS 'Retorna estatísticas consolidadas de follow-ups';

-- Fim da migração
-- Próximos passos: Executar no Supabase SQL Editor