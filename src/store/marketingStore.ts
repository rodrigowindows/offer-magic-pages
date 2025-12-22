import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RecipientInfo,
  CompanyConfig,
  LLMConfig,
  Channel,
  VoicemailStyle,
  CommunicationHistory,
  DashboardStats,
  SavedTemplate,
  MarketingSettings,
  DEFAULT_COMPANY_CONFIG,
  DEFAULT_LLM_CONFIG,
} from '@/types/marketing.types';

interface WizardState {
  currentStep: number;
  recipientInfo: Partial<RecipientInfo>;
  batchRecipients: Partial<RecipientInfo>[];
  selectedChannels: Channel[];
  companyConfig: CompanyConfig;
  llmConfig: LLMConfig;
  voicemailStyle: VoicemailStyle;
  customMessages: {
    sms?: string;
    emailSubject?: string;
    emailBody?: string;
    voicemail?: string;
  };
  isBatchMode: boolean;
}

interface MarketingStore {
  // Estado do Wizard
  wizard: WizardState;

  // Histórico
  history: CommunicationHistory[];

  // Estatísticas
  stats: DashboardStats | null;

  // Templates salvos
  templates: SavedTemplate[];

  // Configurações
  settings: MarketingSettings;

  // Status da API
  apiHealthy: boolean;

  // Loading states
  isLoading: boolean;
  isSending: boolean;

  // ===== AÇÕES DO WIZARD =====
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWizard: () => void;

  setRecipientInfo: (info: Partial<RecipientInfo>) => void;
  setBatchRecipients: (recipients: Partial<RecipientInfo>[]) => void;
  setIsBatchMode: (isBatch: boolean) => void;

  setSelectedChannels: (channels: Channel[]) => void;
  toggleChannel: (channel: Channel) => void;

  setCompanyConfig: (config: Partial<CompanyConfig>) => void;
  setLLMConfig: (config: Partial<LLMConfig>) => void;
  setVoicemailStyle: (style: VoicemailStyle) => void;

  setCustomMessage: (channel: 'sms' | 'emailSubject' | 'emailBody' | 'voicemail', message: string) => void;

  // ===== AÇÕES DE HISTÓRICO =====
  addToHistory: (item: CommunicationHistory) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;

  // ===== AÇÕES DE ESTATÍSTICAS =====
  updateStats: (stats: DashboardStats) => void;

  // ===== AÇÕES DE TEMPLATES =====
  addTemplate: (template: SavedTemplate) => void;
  updateTemplate: (id: string, template: Partial<SavedTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setDefaultTemplate: (id: string, channel: Channel) => void;

  // ===== AÇÕES DE CONFIGURAÇÕES =====
  updateSettings: (settings: Partial<MarketingSettings>) => void;

  // ===== AÇÕES DE STATUS =====
  setApiHealthy: (healthy: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSending: (sending: boolean) => void;
}

const initialWizardState: WizardState = {
  currentStep: 1,
  recipientInfo: {},
  batchRecipients: [],
  selectedChannels: ['sms', 'email', 'call'],
  companyConfig: DEFAULT_COMPANY_CONFIG,
  llmConfig: DEFAULT_LLM_CONFIG,
  voicemailStyle: 'random',
  customMessages: {},
  isBatchMode: false,
};

export const useMarketingStore = create<MarketingStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      wizard: initialWizardState,
      history: [],
      stats: null,
      templates: [],
      settings: {
        company: DEFAULT_COMPANY_CONFIG,
        llm: DEFAULT_LLM_CONFIG,
        api: {
          marketing_url: 'https://marketing.workfaraway.com',
        },
        defaults: {
          channels: ['sms', 'email', 'call'],
          voicemail_style: 'random',
          test_mode: true, // PADRÃO: Modo de teste ativado
        },
      },
      apiHealthy: false,
      isLoading: false,
      isSending: false,

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DO WIZARD =====
      setCurrentStep: (step) =>
        set((state) => ({
          wizard: { ...state.wizard, currentStep: step },
        })),

      nextStep: () =>
        set((state) => ({
          wizard: { ...state.wizard, currentStep: Math.min(state.wizard.currentStep + 1, 4) },
        })),

      previousStep: () =>
        set((state) => ({
          wizard: { ...state.wizard, currentStep: Math.max(state.wizard.currentStep - 1, 1) },
        })),

      resetWizard: () =>
        set((state) => ({
          wizard: {
            ...initialWizardState,
            companyConfig: state.settings.company,
            llmConfig: state.settings.llm,
            selectedChannels: state.settings.defaults.channels,
            voicemailStyle: state.settings.defaults.voicemail_style,
          },
        })),

      setRecipientInfo: (info) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            recipientInfo: { ...state.wizard.recipientInfo, ...info },
          },
        })),

      setBatchRecipients: (recipients) =>
        set((state) => ({
          wizard: { ...state.wizard, batchRecipients: recipients },
        })),

      setIsBatchMode: (isBatch) =>
        set((state) => ({
          wizard: { ...state.wizard, isBatchMode: isBatch },
        })),

      setSelectedChannels: (channels) =>
        set((state) => ({
          wizard: { ...state.wizard, selectedChannels: channels },
        })),

      toggleChannel: (channel) =>
        set((state) => {
          const current = state.wizard.selectedChannels;
          const updated = current.includes(channel)
            ? current.filter((c) => c !== channel)
            : [...current, channel];

          return {
            wizard: { ...state.wizard, selectedChannels: updated },
          };
        }),

      setCompanyConfig: (config) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            companyConfig: { ...state.wizard.companyConfig, ...config },
          },
        })),

      setLLMConfig: (config) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            llmConfig: { ...state.wizard.llmConfig, ...config },
          },
        })),

      setVoicemailStyle: (style) =>
        set((state) => ({
          wizard: { ...state.wizard, voicemailStyle: style },
        })),

      setCustomMessage: (channel, message) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            customMessages: {
              ...state.wizard.customMessages,
              [channel]: message,
            },
          },
        })),

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DE HISTÓRICO =====
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history],
        })),

      clearHistory: () => set({ history: [] }),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DE ESTATÍSTICAS =====
      updateStats: (stats) => set({ stats }),

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DE TEMPLATES =====
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, template],
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date() } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      setDefaultTemplate: (id, channel) =>
        set((state) => ({
          templates: state.templates.map((t) => ({
            ...t,
            is_default: t.id === id && t.channel === channel,
          })),
        })),

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DE CONFIGURAÇÕES =====
      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
            company: updates.company
              ? { ...state.settings.company, ...updates.company }
              : state.settings.company,
            llm: updates.llm ? { ...state.settings.llm, ...updates.llm } : state.settings.llm,
            api: updates.api ? { ...state.settings.api, ...updates.api } : state.settings.api,
            defaults: updates.defaults
              ? { ...state.settings.defaults, ...updates.defaults }
              : state.settings.defaults,
          },
        })),

      // ===== IMPLEMENTAÇÃO DAS AÇÕES DE STATUS =====
      setApiHealthy: (healthy) => set({ apiHealthy: healthy }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsSending: (sending) => set({ isSending: sending }),
    }),
    {
      name: 'marketing-storage', // Nome da chave no localStorage
      partialize: (state) => ({
        // Apenas persistir configurações, templates e histórico
        history: state.history,
        templates: state.templates,
        settings: state.settings,
      }),
    }
  )
);

export default useMarketingStore;
