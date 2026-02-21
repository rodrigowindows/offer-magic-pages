# 🎯 Guia Completo de Componentes - Sistema de Marketing

## ✅ STATUS ATUAL (COMPLETADOS)

### Arquivos Base
- ✅ `src/types/marketing.types.ts` - Tipos completos + test_mode
- ✅ `src/services/api.ts` - Axios configurado
- ✅ `src/services/marketingService.ts` - Todos os endpoints
- ✅ `src/store/marketingStore.ts` - Zustand store + test_mode default
- ✅ `src/utils/validators.ts` - Validações Zod
- ✅ `src/utils/formatters.ts` - Formatação
- ✅ `src/hooks/useMarketing.ts` - Hook principal + test_mode
- ✅ `src/hooks/useTemplates.ts` - Gerenciamento de templates
- ✅ `src/hooks/useBatchUpload.ts` - Upload CSV/JSON

### Componentes
- ✅ `src/components/marketing/Step1RecipientInfo.tsx` - Completo
- ✅ `src/components/marketing/TestModeToggle.tsx` - Toggle de teste

---

## 📝 COMPONENTES A CRIAR

### 1. Step2ChannelsConfig.tsx

```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Mail, Phone, Building2, Bot } from 'lucide-react';
import { TestModeToggle } from './TestModeToggle';
import type { Channel, LLMModel, LLMPromptStyle } from '@/types/marketing.types';

export function Step2ChannelsConfig() {
  const store = useMarketingStore();
  const { selectedChannels, companyConfig, llmConfig } = store.wizard;

  const handleChannelToggle = (channel: Channel) => {
    store.toggleChannel(channel);
  };

  const handleCompanyChange = (field: string, value: string) => {
    store.setCompanyConfig({ [field]: value });
  };

  const handleLLMChange = (field: string, value: any) => {
    store.setLLMConfig({ [field]: value });
  };

  const canProceed = selectedChannels.length > 0;

  return (
    <div className="space-y-6">
      {/* Test Mode Toggle */}
      <TestModeToggle />

      {/* Channel Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Communication Channels</CardTitle>
          <CardDescription>Choose at least one channel to send communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SMS */}
            <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedChannels.includes('sms') ? 'border-primary bg-primary/5' : 'border-border'
            }`} onClick={() => handleChannelToggle('sms')}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedChannels.includes('sms')}
                  onCheckedChange={() => handleChannelToggle('sms')}
                />
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">Text message</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedChannels.includes('email') ? 'border-primary bg-primary/5' : 'border-border'
            }`} onClick={() => handleChannelToggle('email')}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedChannels.includes('email')}
                  onCheckedChange={() => handleChannelToggle('email')}
                />
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">Email message</p>
                </div>
              </div>
            </div>

            {/* Call */}
            <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedChannels.includes('call') ? 'border-primary bg-primary/5' : 'border-border'
            }`} onClick={() => handleChannelToggle('call')}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedChannels.includes('call')}
                  onCheckedChange={() => handleChannelToggle('call')}
                />
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Phone Call</p>
                  <p className="text-sm text-muted-foreground">Voice call</p>
                </div>
              </div>
            </div>
          </div>

          {selectedChannels.length === 0 && (
            <p className="text-sm text-destructive">Please select at least one channel</p>
          )}
        </CardContent>
      </Card>

      {/* Company Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>Company & Contact Information</CardTitle>
          </div>
          <CardDescription>Configure your company details for communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={companyConfig.company_name}
                onChange={(e) => handleCompanyChange('company_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={companyConfig.city}
                onChange={(e) => handleCompanyChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={companyConfig.contact_phone}
                onChange={(e) => handleCompanyChange('contact_phone', e.target.value)}
                placeholder="(786) 882-8251"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone_alt">Alternative Phone</Label>
              <Input
                id="contact_phone_alt"
                value={companyConfig.contact_phone_alt}
                onChange={(e) => handleCompanyChange('contact_phone_alt', e.target.value)}
                placeholder="504-383-7989"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_phone_number">From Phone Number (10 digits)</Label>
              <Input
                id="from_phone_number"
                value={companyConfig.from_phone_number}
                onChange={(e) => handleCompanyChange('from_phone_number', e.target.value)}
                maxLength={10}
                placeholder="7868828251"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={companyConfig.region}
                onChange={(e) => handleCompanyChange('region', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM/AI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <CardTitle>AI Configuration</CardTitle>
          </div>
          <CardDescription>Configure AI to rewrite and optimize your messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use_llm">Use AI to Rewrite Messages</Label>
              <p className="text-sm text-muted-foreground">
                AI will optimize your messages for better engagement
              </p>
            </div>
            <Switch
              id="use_llm"
              checked={llmConfig.use_llm}
              onCheckedChange={(checked) => handleLLMChange('use_llm', checked)}
            />
          </div>

          {llmConfig.use_llm && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="llm_model">AI Model</Label>
                  <Select
                    value={llmConfig.llm_model}
                    onValueChange={(value: LLMModel) => handleLLMChange('llm_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                      <SelectItem value="llama">Llama</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_prompt_style">Writing Style</Label>
                  <Select
                    value={llmConfig.llm_prompt_style}
                    onValueChange={(value: LLMPromptStyle) => handleLLMChange('llm_prompt_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="llm_max_words_voicemail">
                    Max Words for Voicemail ({llmConfig.llm_max_words_voicemail})
                  </Label>
                  <input
                    type="range"
                    id="llm_max_words_voicemail"
                    min="10"
                    max="100"
                    value={llmConfig.llm_max_words_voicemail}
                    onChange={(e) => handleLLMChange('llm_max_words_voicemail', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.previousStep()}>
          Previous
        </Button>
        <Button onClick={() => store.nextStep()} disabled={!canProceed}>
          Next Step
        </Button>
      </div>
    </div>
  );
}

export default Step2ChannelsConfig;
```

---

### 2. Step3MessageCustomization.tsx

```tsx
import { useState } from 'react';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Eye, Sparkles } from 'lucide-react';
import { generateMessagePreview } from '@/services/marketingService';
import {
  DEFAULT_SMS_TEMPLATE,
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_BODY,
  DEFAULT_VOICEMAIL_TEMPLATE_1,
  DEFAULT_VOICEMAIL_TEMPLATE_2,
} from '@/types/marketing.types';

export function Step3MessageCustomization() {
  const store = useMarketingStore();
  const { selectedChannels, recipientInfo, companyConfig, customMessages } = store.wizard;

  const [smsMode, setSmsMode] = useState<'template' | 'custom'>('template');
  const [emailMode, setEmailMode] = useState<'template' | 'custom'>('template');
  const [voicemailMode, setVoicemailMode] = useState<'template_1' | 'template_2' | 'random' | 'custom'>('random');

  // SMS Handlers
  const getSMSPreview = () => {
    const template = smsMode === 'custom' && customMessages.sms ? customMessages.sms : DEFAULT_SMS_TEMPLATE;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  // Email Handlers
  const getEmailPreview = () => {
    const template = emailMode === 'custom' && customMessages.emailBody ? customMessages.emailBody : DEFAULT_EMAIL_BODY;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  const getEmailSubject = () => {
    const subject = emailMode === 'custom' && customMessages.emailSubject ? customMessages.emailSubject : DEFAULT_EMAIL_SUBJECT;
    return generateMessagePreview(subject, recipientInfo, companyConfig);
  };

  // Voicemail Handlers
  const getVoicemailPreview = () => {
    if (voicemailMode === 'custom' && customMessages.voicemail) {
      return generateMessagePreview(customMessages.voicemail, recipientInfo, companyConfig);
    }

    const template = voicemailMode === 'template_2' ? DEFAULT_VOICEMAIL_TEMPLATE_2 : DEFAULT_VOICEMAIL_TEMPLATE_1;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize Messages</CardTitle>
          <CardDescription>
            Personalize your communications for each channel. Variables like {'{name}'} will be replaced automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={selectedChannels[0]} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedChannels.length}, 1fr)` }}>
              {selectedChannels.includes('sms') && (
                <TabsTrigger value="sms">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </TabsTrigger>
              )}
              {selectedChannels.includes('email') && (
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
              )}
              {selectedChannels.includes('call') && (
                <TabsTrigger value="call">
                  <Phone className="w-4 h-4 mr-2" />
                  Voicemail
                </TabsTrigger>
              )}
            </TabsList>

            {/* SMS Tab */}
            {selectedChannels.includes('sms') && (
              <TabsContent value="sms" className="space-y-4 mt-6">
                <RadioGroup value={smsMode} onValueChange={(v: any) => setSmsMode(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="sms-template" />
                    <Label htmlFor="sms-template">Use Default Template</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="sms-custom" />
                    <Label htmlFor="sms-custom">Custom Message</Label>
                  </div>
                </RadioGroup>

                {smsMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_sms">Custom SMS Message</Label>
                    <Textarea
                      id="custom_sms"
                      value={customMessages.sms || ''}
                      onChange={(e) => store.setCustomMessage('sms', e.target.value)}
                      rows={5}
                      placeholder="Enter your custom SMS message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{name}'}, {'{address}'}, {'{contact_phone}'}, {'{company_name}'}, {'{city}'}
                    </p>
                  </div>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm">{getSMSPreview()}</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {/* Email Tab */}
            {selectedChannels.includes('email') && (
              <TabsContent value="email" className="space-y-4 mt-6">
                <RadioGroup value={emailMode} onValueChange={(v: any) => setEmailMode(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="email-template" />
                    <Label htmlFor="email-template">Use Default Template</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="email-custom" />
                    <Label htmlFor="email-custom">Custom Email</Label>
                  </div>
                </RadioGroup>

                {emailMode === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="custom_email_subject">Subject</Label>
                      <Input
                        id="custom_email_subject"
                        value={customMessages.emailSubject || ''}
                        onChange={(e) => store.setCustomMessage('emailSubject', e.target.value)}
                        placeholder="Enter email subject..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom_email_body">Email Body</Label>
                      <Textarea
                        id="custom_email_body"
                        value={customMessages.emailBody || ''}
                        onChange={(e) => store.setCustomMessage('emailBody', e.target.value)}
                        rows={10}
                        placeholder="Enter your email message..."
                      />
                      <p className="text-xs text-muted-foreground">
                        HTML supported. Variables: {'{name}'}, {'{address}'}, {'{seller_name}'}, {'{contact_phone}'}, {'{company_name}'}
                      </p>
                    </div>
                  </>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm font-medium mb-1">Subject: {getEmailSubject()}</p>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded max-h-48 overflow-y-auto">
                      {getEmailPreview()}
                    </div>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {/* Voicemail Tab */}
            {selectedChannels.includes('call') && (
              <TabsContent value="call" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>Voicemail Template</Label>
                  <RadioGroup value={voicemailMode} onValueChange={(v: any) => {
                    setVoicemailMode(v);
                    store.setVoicemailStyle(v === 'custom' ? 'random' : v);
                  }}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template_1" id="vm-template1" />
                      <Label htmlFor="vm-template1">Template 1 (Casual/Direct)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template_2" id="vm-template2" />
                      <Label htmlFor="vm-template2">Template 2 (Formal/Professional)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="random" id="vm-random" />
                      <Label htmlFor="vm-random">Random (Default)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="vm-custom" />
                      <Label htmlFor="vm-custom">Custom Voicemail</Label>
                    </div>
                  </RadioGroup>
                </div>

                {voicemailMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_voicemail">Custom Voicemail Script</Label>
                    <Textarea
                      id="custom_voicemail"
                      value={customMessages.voicemail || ''}
                      onChange={(e) => store.setCustomMessage('voicemail', e.target.value)}
                      rows={6}
                      placeholder="Enter your voicemail script..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{name}'}, {'{address}'}, {'{seller_name}'}, {'{contact_phone_alt}'}
                    </p>
                  </div>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm">{getVoicemailPreview()}</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.previousStep()}>
          Previous
        </Button>
        <Button onClick={() => store.nextStep()}>
          Next: Confirm & Send
        </Button>
      </div>
    </div>
  );
}

export default Step3MessageCustomization;
```

---

Devido ao limite de espaço, vou criar um arquivo adicional com os componentes restantes...

