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

  const safeTemplates = Array.isArray(templates) ? templates : [];

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        await insertDefaultTemplates();
        await loadTemplates();
        return;
      }

      const templatesWithDates: SavedTemplate[] = data.map(t => ({
        ...t,
        channel: t.channel as Channel,
        created_at: new Date(t.created_at),
        updated_at: new Date(t.updated_at),
      }));

      setTemplates(templatesWithDates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      const { error } = await supabase.from('templates').insert(templatesToInsert);
      if (error) throw error;
      toast.success('Templates padrão carregados');
    } catch (error) {
      console.error('Erro ao inserir templates padrão:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAndUpdateDefaultTemplates = async (currentTemplates: SavedTemplate[]) => {
    let updatedCount = 0;
    try {
      for (const defaultTemplate of DEFAULT_TEMPLATES) {
        const existingTemplate = currentTemplates.find(t => t.id === defaultTemplate.id);

        if (existingTemplate && existingTemplate.is_default) {
          if (existingTemplate.edited_manually) {
            const codeVersion = defaultTemplate.version || 1;
            const savedVersion = existingTemplate.version || 1;
            if (codeVersion > savedVersion) {
              await updateTemplate(existingTemplate.id, {
                body: defaultTemplate.body, subject: defaultTemplate.subject,
                name: defaultTemplate.name, version: codeVersion, edited_manually: false,
              });
              updatedCount++;
            }
          } else {
            const contentChanged = existingTemplate.body !== defaultTemplate.body ||
              existingTemplate.subject !== defaultTemplate.subject ||
              existingTemplate.name !== defaultTemplate.name;
            if (contentChanged) {
              await updateTemplate(existingTemplate.id, {
                body: defaultTemplate.body, subject: defaultTemplate.subject,
                name: defaultTemplate.name, version: defaultTemplate.version || 1,
              });
              updatedCount++;
            }
          }
        } else if (!existingTemplate) {
          await addTemplate(defaultTemplate);
          updatedCount++;
        }
      }
      if (updatedCount > 0) toast.info(`${updatedCount} template(s) atualizados`);
    } catch (error) {
      console.error('Erro em checkAndUpdateDefaultTemplates:', error);
    }
  };

  const addTemplate = async (template: SavedTemplate) => {
    try {
      const { error } = await supabase.from('templates').insert({
        id: template.id, name: template.name, channel: template.channel,
        subject: template.subject, body: template.body, is_default: template.is_default,
        version: template.version || 1, edited_manually: template.edited_manually || false,
      });
      if (error) throw error;
      await loadTemplates();
      toast.success('Template criado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const updateTemplate = async (id: string, updates: Partial<SavedTemplate>) => {
    try {
      const template = templates.find(t => t.id === id);
      if (template?.is_default && !Object.prototype.hasOwnProperty.call(updates, 'edited_manually')) {
        updates.edited_manually = true;
      }

      const dbUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        dbUpdates[key] = value instanceof Date ? value.toISOString() : value;
      }

      const { error } = await supabase.from('templates').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await loadTemplates();
      toast.success('Template atualizado');
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      await loadTemplates();
      toast.success('Template deletado');
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast.error('Erro ao deletar template');
    }
  };

  const setAsDefault = async (id: string, channel: Channel) => {
    try {
      const { error: unsetError } = await supabase.from('templates').update({ is_default: false }).eq('channel', channel).eq('is_default', true).neq('id', id);
      if (unsetError) throw unsetError;
      const { error: setError } = await supabase.from('templates').update({ is_default: true }).eq('id', id);
      if (setError) throw setError;
      await loadTemplates();
      toast.success('Template padrão atualizado');
    } catch (error) {
      console.error('Erro ao definir template padrão:', error);
      toast.error('Erro ao atualizar template padrão');
    }
  };

  const getTemplatesByChannel = useCallback(
    (channel: Channel): SavedTemplate[] => {
      try {
        return safeTemplates.filter(t => t.channel === channel);
      } catch {
        return [];
      }
    },
    [safeTemplates]
  );

  const getDefaultTemplate = useCallback(
    (channel: Channel): SavedTemplate | undefined => {
      try {
        return safeTemplates.find(t => t.channel === channel && t.is_default);
      } catch {
        return undefined;
      }
    },
    [safeTemplates]
  );

  const templateStats = useMemo(() => {
    try {
      return {
        total: safeTemplates.length,
        bySMS: safeTemplates.filter(t => t?.channel === 'sms').length,
        byEmail: safeTemplates.filter(t => t?.channel === 'email').length,
        byCall: safeTemplates.filter(t => t?.channel === 'call').length,
      };
    } catch {
      return { total: 0, bySMS: 0, byEmail: 0, byCall: 0 };
    }
  }, [safeTemplates]);

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    templates: safeTemplates,
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
