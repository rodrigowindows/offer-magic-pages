import { useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useMarketingStore } from '@/store/marketingStore';
import type { SavedTemplate, Channel } from '@/types/marketing.types';
import { DEFAULT_TEMPLATES } from '@/constants/defaultTemplates';

export const useTemplates = () => {
  const store = useMarketingStore();
  const templates = store.templates;

  // Inicializar e atualizar templates padrão
  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => {
      if (templates.length === 0) {
        // Carregar templates padrão se nenhum existir
        DEFAULT_TEMPLATES.forEach(template => {
          store.addTemplate(template);
        });
        toast.info('Templates padrão foram carregados automaticamente');
      } else {
        // Verificar se templates padrão precisam ser atualizados
        let updatedCount = 0;
        DEFAULT_TEMPLATES.forEach(defaultTemplate => {
          const existingTemplate = templates.find(t => t.id === defaultTemplate.id);
          if (existingTemplate && existingTemplate.is_default) {
            // Verificar se a data do template padrão é mais recente
            const defaultDate = new Date(defaultTemplate.updated_at).getTime();
            const existingDate = new Date(existingTemplate.updated_at).getTime();

            // Atualizar se a data do código for mais nova OU se o conteúdo mudou
            const needsUpdate = defaultDate > existingDate ||
                              existingTemplate.body !== defaultTemplate.body ||
                              existingTemplate.subject !== defaultTemplate.subject ||
                              existingTemplate.name !== defaultTemplate.name;

            if (needsUpdate) {
              console.log(`🔄 Updating default template: ${defaultTemplate.name}`, {
                defaultDate: new Date(defaultDate).toISOString(),
                existingDate: new Date(existingDate).toISOString(),
                isNewer: defaultDate > existingDate
              });

              store.updateTemplate(existingTemplate.id, {
                body: defaultTemplate.body,
                subject: defaultTemplate.subject,
                name: defaultTemplate.name,
                updated_at: defaultTemplate.updated_at,
              });
              updatedCount++;
            }
          } else if (!existingTemplate) {
            // Template padrão não existe, adicionar
            store.addTemplate(defaultTemplate);
            updatedCount++;
          }
        });

        if (updatedCount > 0) {
          toast.info(`${updatedCount} template(s) padrão foram atualizados`);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
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
