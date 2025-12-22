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
