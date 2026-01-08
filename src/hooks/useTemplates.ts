import { useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useMarketingStore } from '@/store/marketingStore';
import type { SavedTemplate, Channel } from '@/types/marketing.types';
import { DEFAULT_TEMPLATES } from '@/constants/defaultTemplates';

export const useTemplates = () => {
  const store = useMarketingStore();
  const templates = store.templates;

  // Inicializar templates padrão se nenhum existir
  useEffect(() => {
    if (templates.length === 0) {
      DEFAULT_TEMPLATES.forEach(template => {
        store.addTemplate(template);
      });
      toast.info('Templates padrão foram carregados automaticamente');
    }
  }, [templates.length, store]);

  // Obter templates por canal
  const getTemplatesByChannel = useCallback(
    (channel: Channel): SavedTemplate[] => {
      return templates.filter((t) => t.channel === channel);
    },
    [templates]
  );

  // Obter template padrão por canal
  const getDefaultTemplate = useCallback(
    (channel: Channel): SavedTemplate | undefined => {
      return templates.find((t) => t.channel === channel && t.is_default);
    },
    [templates]
  );

  // Criar novo template
  const createTemplate = useCallback(
    (
      name: string,
      channel: Channel,
      body: string,
      subject?: string,
      isDefault: boolean = false
    ) => {
      const newTemplate: SavedTemplate = {
        id: `${Date.now()}-${Math.random()}`,
        name,
        channel,
        subject,
        body,
        is_default: isDefault,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Se for marcado como padrão, desmarcar outros padrões do mesmo canal
      if (isDefault) {
        templates
          .filter((t) => t.channel === channel && t.is_default)
          .forEach((t) => {
            store.updateTemplate(t.id, { is_default: false });
          });
      }

      store.addTemplate(newTemplate);
      toast.success('Template created successfully');
      return newTemplate;
    },
    [templates, store]
  );

  // Atualizar template
  const updateTemplate = useCallback(
    (id: string, updates: Partial<SavedTemplate>) => {
      const template = templates.find((t) => t.id === id);

      if (!template) {
        toast.error('Template not found');
        return;
      }

      // Se marcando como padrão, desmarcar outros
      if (updates.is_default) {
        templates
          .filter((t) => t.channel === template.channel && t.is_default && t.id !== id)
          .forEach((t) => {
            store.updateTemplate(t.id, { is_default: false });
          });
      }

      store.updateTemplate(id, updates);
      toast.success('Template updated successfully');
    },
    [templates, store]
  );

  // Deletar template
  const deleteTemplate = useCallback(
    (id: string) => {
      store.deleteTemplate(id);
      toast.success('Template deleted successfully');
    },
    [store]
  );

  // Definir template padrão
  const setAsDefault = useCallback(
    (id: string) => {
      const template = templates.find((t) => t.id === id);

      if (!template) {
        toast.error('Template not found');
        return;
      }

      // Desmarcar outros padrões do mesmo canal
      templates
        .filter((t) => t.channel === template.channel && t.is_default)
        .forEach((t) => {
          store.updateTemplate(t.id, { is_default: false });
        });

      // Marcar este como padrão
      store.updateTemplate(id, { is_default: true });
      toast.success('Default template updated');
    },
    [templates, store]
  );

  // Estatísticas de templates
  const templateStats = useMemo(() => {
    return {
      total: templates.length,
      bySMS: templates.filter((t) => t.channel === 'sms').length,
      byEmail: templates.filter((t) => t.channel === 'email').length,
      byCall: templates.filter((t) => t.channel === 'call').length,
      defaults: templates.filter((t) => t.is_default).length,
    };
  }, [templates]);

  return {
    // Estado
    templates,
    templateStats,

    // Ações
    getTemplatesByChannel,
    getDefaultTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setAsDefault,
  };
};

export default useTemplates;
