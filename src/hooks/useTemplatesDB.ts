/**
 * useTemplatesDB - Hook para gerenciar templates no Supabase
 * Substitui o localStorage por banco de dados
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SavedTemplate, Channel } from '@/types/marketing.types';
import { DEFAULT_TEMPLATES } from '@/constants/defaultTemplates';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar templates do Supabase
  const loadTemplates = useCallback(async () => {
    console.log('🔄 loadTemplates: INICIO');
    setIsLoading(true);
    try {
      console.log('🔄 loadTemplates: Buscando templates do Supabase...');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ loadTemplates: Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ loadTemplates: Dados recebidos:', data?.length || 0, 'templates');

      if (!data || data.length === 0) {
        // Primeira vez - inserir templates padrão
        console.log('📥 Primeira vez - inserindo templates padrão no banco');
        await insertDefaultTemplates();
        console.log('✅ Templates padrão inseridos, recarregando...');
        await loadTemplates(); // Recarregar após inserir
        return;
      }

      console.log('🔄 loadTemplates: Convertendo datas...');
      // Converter datas de string para Date e garantir tipo Channel
      const templatesWithDates: SavedTemplate[] = data.map(t => {
        console.log('  - Processando template:', t.id, t.name);
        return {
          ...t,
          channel: t.channel as Channel,
          created_at: new Date(t.created_at),
          updated_at: new Date(t.updated_at),
        };
      });

      console.log('✅ loadTemplates: Definindo templates no estado');
      setTemplates(templatesWithDates);

      console.log('✅ loadTemplates: CONCLUÍDO');

      // REMOVIDO checkAndUpdateDefaultTemplates para evitar loops infinitos
      // Templates padrão serão inseridos apenas na primeira vez (data.length === 0)
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      console.log('🔄 loadTemplates: Finalizando (setIsLoading false)');
      setIsLoading(false);
    }
  }, []);

  // Inserir templates padrão no banco
  const insertDefaultTemplates = async () => {
    try {
      const templatesToInsert = DEFAULT_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        channel: t.channel,
        subject: t.subject,
        body: t.body,
        is_default: t.is_default,
        version: t.version || 1,
        edited_manually: t.edited_manually || false,
        created_at: t.created_at.toISOString(),
        updated_at: t.updated_at.toISOString(),
      }));

      const { error } = await supabase
        .from('templates')
        .insert(templatesToInsert);

      if (error) throw error;

      toast.success('Templates padrão carregados');
    } catch (error) {
      console.error('❌ Erro ao inserir templates padrão:', error);
    }
  };

  // Verificar e atualizar templates padrão
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAndUpdateDefaultTemplates = async (currentTemplates: SavedTemplate[]) => {
    console.log('🔍 checkAndUpdateDefaultTemplates: INICIO');
    let updatedCount = 0;

    try {
      console.log('🔍 Verificando', DEFAULT_TEMPLATES.length, 'templates padrão...');

      for (const defaultTemplate of DEFAULT_TEMPLATES) {
        console.log('  🔍 Verificando:', defaultTemplate.id, defaultTemplate.name);
        const existingTemplate = currentTemplates.find(t => t.id === defaultTemplate.id);

        if (existingTemplate && existingTemplate.is_default) {
          // Se foi editado manualmente, só atualizar se versão for maior
          if (existingTemplate.edited_manually) {
            const codeVersion = defaultTemplate.version || 1;
            const savedVersion = existingTemplate.version || 1;

            if (codeVersion > savedVersion) {
              console.log(`🔄 Nova versão disponível: ${defaultTemplate.name} (v${codeVersion})`);

              await updateTemplate(existingTemplate.id, {
                body: defaultTemplate.body,
                subject: defaultTemplate.subject,
                name: defaultTemplate.name,
                version: codeVersion,
                edited_manually: false,
              });
              updatedCount++;
            }
          } else {
            // Não editado manualmente, verificar se conteúdo mudou
            const contentChanged = existingTemplate.body !== defaultTemplate.body ||
                                 existingTemplate.subject !== defaultTemplate.subject ||
                                 existingTemplate.name !== defaultTemplate.name;

            if (contentChanged) {
              console.log(`🔄 Atualizando template: ${defaultTemplate.name}`);

              await updateTemplate(existingTemplate.id, {
                body: defaultTemplate.body,
                subject: defaultTemplate.subject,
                name: defaultTemplate.name,
                version: defaultTemplate.version || 1,
              });
              updatedCount++;
            }
          }
        } else if (!existingTemplate) {
          // Template padrão não existe, adicionar
          console.log(`➕ Adicionando template faltante: ${defaultTemplate.name}`);
          await addTemplate(defaultTemplate);
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ ${updatedCount} template(s) atualizados`);
        toast.info(`${updatedCount} template(s) atualizados`);
        // NÃO recarregar aqui - evita loop infinito
        // O loadTemplates já foi chamado pelas funções updateTemplate/addTemplate
      }

      console.log('✅ checkAndUpdateDefaultTemplates: CONCLUÍDO');
    } catch (error) {
      console.error('❌ checkAndUpdateDefaultTemplates: ERRO:', error);
    }
  };

  // Adicionar template
  const addTemplate = async (template: SavedTemplate) => {
    try {
      const { error} = await supabase
        .from('templates')
        .insert({
          id: template.id,
          name: template.name,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
          is_default: template.is_default,
          version: template.version || 1,
          edited_manually: template.edited_manually || false,
        });

      if (error) throw error;

      await loadTemplates();
      toast.success('Template criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  // Atualizar template
  const updateTemplate = async (id: string, updates: Partial<SavedTemplate>) => {
    try {
      const template = templates.find(t => t.id === id);

      // Se é template padrão sendo editado manualmente, marcar flag
      if (template?.is_default && !Object.prototype.hasOwnProperty.call(updates, 'edited_manually')) {
        updates.edited_manually = true;
        console.log(`📝 Marcando template como editado manualmente: ${template.name}`);
      }

      // Preparar updates para o banco (converter datas para string se necessário)
      const dbUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value instanceof Date) {
          dbUpdates[key] = value.toISOString();
        } else {
          dbUpdates[key] = value;
        }
      }

      const { error } = await supabase
        .from('templates')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await loadTemplates();
      toast.success('Template atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  // Deletar template
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadTemplates();
      toast.success('Template deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar template:', error);
      toast.error('Erro ao deletar template');
    }
  };

  // Definir como padrão
  const setAsDefault = async (id: string, channel: Channel) => {
    try {
      // Desmarcar outros templates padrão do mesmo canal
      const { error: unsetError } = await supabase
        .from('templates')
        .update({ is_default: false })
        .eq('channel', channel)
        .eq('is_default', true)
        .neq('id', id);

      if (unsetError) throw unsetError;

      // Marcar este como padrão
      const { error: setError } = await supabase
        .from('templates')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;

      await loadTemplates();
      toast.success('Template padrão atualizado');
    } catch (error) {
      console.error('❌ Erro ao definir template padrão:', error);
      toast.error('Erro ao atualizar template padrão');
    }
  };

  // Obter templates por canal
  const getTemplatesByChannel = useCallback(
    (channel: Channel): SavedTemplate[] => {
      return templates.filter(t => t.channel === channel);
    },
    [templates]
  );

  // Obter template padrão por canal
  const getDefaultTemplate = useCallback(
    (channel: Channel): SavedTemplate | undefined => {
      return templates.find(t => t.channel === channel && t.is_default);
    },
    [templates]
  );

  // Calcular estatísticas dos templates
  const templateStats = useMemo(() => {
    console.log('📊 Calculando template stats...');
    console.log('📊 templates.length:', templates?.length);

    if (!templates) {
      console.log('⚠️ templates é undefined/null!');
      return { total: 0, bySMS: 0, byEmail: 0, byCall: 0 };
    }

    const stats = {
      total: templates.length,
      bySMS: templates.filter(t => t?.channel === 'sms').length,
      byEmail: templates.filter(t => t?.channel === 'email').length,
      byCall: templates.filter(t => t?.channel === 'call').length,
    };
    console.log('📊 Template stats:', stats);
    return stats;
  }, [templates]);

  // Carregar templates ao montar
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    templates,
    isLoading,
    templateStats,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setAsDefault,
    getTemplatesByChannel,
    getDefaultTemplate,
    refreshTemplates: loadTemplates,
  };
};
