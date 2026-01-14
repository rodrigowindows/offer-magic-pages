// ===== TIPOS DE DADOS =====

export type Channel = 'sms' | 'email' | 'call';

export type LLMModel = 'mistral' | 'llama' | 'gpt-4';

export type LLMPromptStyle = 'persuasive' | 'friendly' | 'professional' | 'casual';

export type VoicemailStyle = 'random' | 'template_1' | 'template_2';

export type CommunicationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked';

// ===== INTERFACES =====

export interface RecipientInfo {
  name: string;
  phone_number: string;
  email: string;
  address: string;
  seller_name?: string;
}

export interface CompanyConfig {
  company_name: string;
  contact_phone: string;
  contact_phone_alt: string;
  from_phone_number: string;
  city: string;
  region: string;
  website?: string;        // ADICIONAR
}

export interface LLMConfig {
  use_llm: boolean;
  llm_model: LLMModel;
  llm_prompt_style: LLMPromptStyle;
  llm_max_words_voicemail: number;
}

export interface MessageTemplates {
  sms_template?: string;
  email_subject_template?: string;
  email_body_template?: string;
  voicemail_template_1?: string;
  voicemail_template_2?: string;
}

export interface CustomMessages {
  custom_sms_body?: string;
  custom_email_subject?: string;
  custom_email_body?: string;
  custom_voicemail?: string;
}

export interface CommunicationPayload extends RecipientInfo, CompanyConfig, LLMConfig, MessageTemplates, CustomMessages {
  channels: Channel[];
  voicemail_style: VoicemailStyle;
  test_mode?: boolean; // NOVO: Modo de teste - não envia comunicações reais
}

export interface ChannelResponse {
  status_code: number;
  response: any;
  body?: string;
  title?: string;
}

export interface SMSResponse extends ChannelResponse {
  sms_body: string;
  sms_status_code: number;
  sms_response: any;
}

export interface EmailResponse extends ChannelResponse {
  email_title: string;
  email_body: string;
  email_status_code: number;
  email_response: any;
}

export interface CallResponse extends ChannelResponse {
  voicemail_body: string;
  call_status_code: number;
  call_response: any;
}

export interface CommunicationResponse {
  sms_body?: string;
  sms_status_code?: number;
  sms_response?: any;
  email_title?: string;
  email_body?: string;
  email_status_code?: number;
  email_response?: any;
  voicemail_body?: string;
  call_status_code?: number;
  call_response?: any;
  error?: string;
}

export interface SendSMSRequest {
  phone_number: string;
  body: string;
  test_mode?: boolean;
}

export interface SendEmailRequest {
  receiver_email: string;
  subject: string;
  message_body: string;
  image?: File;
  test_mode?: boolean;
}

export interface InitiateCallRequest {
  phone: string;              // Número do destinatário (ex: "+17868828251")
  agent_id: string;           // ID do agente Retell (ex: "agent_9ccc12...78e")
  from_number: string;        // Número de origem (ex: "+17869606820")
  dynamic_variables: {        // Variáveis dinâmicas para substituição na transcrição
    customer_name: string;
    address: string;
    seller_name: string;
    voicemail_drop: string;
  };
  test_mode?: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
}

// ===== HISTÓRICO E ESTATÍSTICAS =====

export interface CommunicationHistory {
  id: string;
  timestamp: Date;
  recipient: RecipientInfo;
  channels: Channel[];
  response: CommunicationResponse;
  status: CommunicationStatus;
  test_mode?: boolean; // Indica se foi enviado em modo de teste
  sent_by?: string | null; // user id who sent the communication
}

export interface ChannelStats {
  total: number;
  sent: number;
  failed: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
}

export interface DashboardStats {
  sms: ChannelStats;
  email: ChannelStats;
  call: ChannelStats;
  period: '24h' | '7d' | '30d';
}

// ===== TEMPLATES SALVOS =====

export interface SavedTemplate {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  content?: string;        // ADICIONAR
  message_template?: string; // ADICIONAR
  description?: string;    // ADICIONAR
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  version?: number;        // Versão do template (para controle de atualizações)
  edited_manually?: boolean; // Se foi editado manualmente (não sobrescrever)
}

// ===== BATCH UPLOAD =====

export interface BatchRecipient extends RecipientInfo {}

export interface BatchUploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    recipient: Partial<RecipientInfo>;
    error: string;
  }>;
}

// ===== CONFIGURAÇÕES =====

export interface MarketingSettings {
  company: CompanyConfig;
  llm: LLMConfig;
  api: {
    marketing_url: string;
    llm_url?: string;
  };
  defaults: {
    channels: Channel[];
    voicemail_style: VoicemailStyle;
    test_mode: boolean; // NOVO: Modo de teste padrão
  };
}

// ===== DEFAULTS =====

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  company_name: 'Miami Local Investors',
  contact_phone: '(786)882-8251',
  contact_phone_alt: '504-383-7989',
  from_phone_number: '7868828251',
  city: 'Miami',
  region: 'Miami',
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  use_llm: true,
  llm_model: 'mistral',
  llm_prompt_style: 'persuasive',
  llm_max_words_voicemail: 30,
};

export const DEFAULT_SMS_TEMPLATE = `Hi {name}, thinking about selling your house at {address}? I buy houses for cash, as-is, no fees. We are local {city} investors. Would love to chat if you're interested. {contact_phone}. Best regards, {company_name}`;

export const DEFAULT_EMAIL_SUBJECT = 'Cash Offer for Your Property';

export const DEFAULT_EMAIL_BODY = `Dear {name},

I hope this message finds you well. My name is {seller_name} and I represent {company_name}, a local real estate investment company serving the {region} area.

We are interested in making a cash offer for your property located at {address}.

What we offer:
• Fast cash payment - close in as little as 7 days
• No repairs needed - we buy as-is
• No realtor fees or commissions
• No closing costs for you
• Flexible closing date

If you're interested in discussing this opportunity, please don't hesitate to reach out to me at {contact_phone} or {contact_phone_alt}.

Best regards,
{seller_name}
{company_name}
{contact_phone}`;

export const DEFAULT_VOICEMAIL_TEMPLATE_1 = `Hey {name}, my name's {seller_name} — I'm a local buyer looking at a few units in your area, and I came across yours at {address}. I know this is a little out of the blue, but I wanted to see if you'd ever consider a cash offer — no agents, no repairs. Totally flexible. If there's even a small chance you'd consider it, call or text me back at {contact_phone_alt}. I'll keep it quick. Thanks, {seller_name}`;

export const DEFAULT_VOICEMAIL_TEMPLATE_2 = `Hey {name}, this is {seller_name}. I'm calling about your property at {address}. There's something I'd like to discuss with you that might be of interest. Could you give me a call back when you get a chance? My number is {contact_phone_alt}. Thanks.`;

// ===== VALIDAÇÕES =====

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
