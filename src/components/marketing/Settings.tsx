/**
 * Settings Page
 * Configurações globais do sistema de marketing
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketingStore } from '@/store/marketingStore';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Building2, Cpu, Zap, Save, Database, Link } from 'lucide-react';
import type { MarketingSettings } from '@/types/marketing.types';
import { CompsApiSettings } from '@/components/CompsApiSettings';
import { ManualCompsManager } from '@/components/ManualCompsManager';

// Schema de validação
const settingsSchema = z.object({
  // Company
  company_name: z.string().min(2, 'Company name required'),
  contact_phone: z.string().min(10, 'Valid phone required'),
  contact_phone_alt: z.string().optional(),
  city: z.string().min(2, 'City required'),
  region: z.string().optional(),

  // LLM
  use_llm: z.boolean(),
  llm_model: z.enum(['mistral', 'llama', 'gpt-4']),
  llm_prompt_style: z.enum(['persuasive', 'friendly', 'professional', 'casual']),

  // API
  marketing_url: z.string().url('Valid URL required'),
  llm_url: z.string().url('Valid URL required').optional().or(z.literal('')),

  // Defaults
  default_channels: z.array(z.enum(['sms', 'email', 'call'])).min(1),
  default_voicemail_style: z.enum(['random', 'template_1', 'template_2']),
  default_test_mode: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const Settings = () => {
  const settings = useMarketingStore((state) => state.settings);
  const updateSettings = useMarketingStore((state) => state.updateSettings);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: settings.company.company_name,
      contact_phone: settings.company.contact_phone,
      contact_phone_alt: settings.company.contact_phone_alt,
      city: settings.company.city,
      region: settings.company.region,

      use_llm: settings.llm.use_llm,
      llm_model: settings.llm.llm_model,
      llm_prompt_style: settings.llm.llm_prompt_style,

      marketing_url: settings.api.marketing_url,
      llm_url: settings.api.llm_url,

      default_channels: settings.defaults.channels,
      default_voicemail_style: settings.defaults.voicemail_style,
      default_test_mode: settings.defaults.test_mode,
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    const newSettings: Partial<MarketingSettings> = {
      company: {
        company_name: data.company_name,
        contact_phone: data.contact_phone,
        contact_phone_alt: data.contact_phone_alt || '',
        from_phone_number: settings.company.from_phone_number,
        city: data.city,
        region: data.region || data.city,
      },
      llm: {
        use_llm: data.use_llm,
        llm_model: data.llm_model,
        llm_prompt_style: data.llm_prompt_style,
        llm_max_words_voicemail: settings.llm.llm_max_words_voicemail,
      },
      api: {
        marketing_url: data.marketing_url,
        llm_url: data.llm_url,
      },
      defaults: {
        channels: data.default_channels,
        voicemail_style: data.default_voicemail_style,
        test_mode: data.default_test_mode,
      },
    };

    updateSettings(newSettings);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your marketing system configuration
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="company">
              <Building2 className="w-4 h-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="llm">
              <Cpu className="w-4 h-4 mr-2" />
              AI/LLM
            </TabsTrigger>
            <TabsTrigger value="api">
              <Zap className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="comps">
              <Database className="w-4 h-4 mr-2" />
              Comps API
            </TabsTrigger>
            <TabsTrigger value="manual-comps">
              <Link className="w-4 h-4 mr-2" />
              Manual Comps
            </TabsTrigger>
            <TabsTrigger value="defaults">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Defaults
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Details that will appear in your communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    {...form.register('company_name')}
                    placeholder="Your Company LLC"
                  />
                  {form.formState.errors.company_name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.company_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    {...form.register('contact_phone')}
                    placeholder="(123) 456-7890"
                  />
                  {form.formState.errors.contact_phone && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.contact_phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone_alt">Alternate Phone</Label>
                  <Input
                    id="contact_phone_alt"
                    {...form.register('contact_phone_alt')}
                    placeholder="(123) 456-7891"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    {...form.register('region')}
                    placeholder="Miami-Dade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="Orlando"
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Settings */}
          <TabsContent value="llm">
            <Card>
              <CardHeader>
                <CardTitle>AI/LLM Configuration</CardTitle>
                <CardDescription>
                  Configure the AI model used for message generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="use_llm">Enable AI Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate personalized messages
                    </p>
                  </div>
                  <Switch
                    id="use_llm"
                    checked={form.watch('use_llm')}
                    onCheckedChange={(checked) => form.setValue('use_llm', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_model">LLM Model *</Label>
                  <Select
                    value={form.watch('llm_model')}
                    onValueChange={(value) =>
                      form.setValue('llm_model', value as 'mistral' | 'llama' | 'gpt-4')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral">Mistral</SelectItem>
                      <SelectItem value="llama">Llama</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_prompt_style">Prompt Style *</Label>
                  <Select
                    value={form.watch('llm_prompt_style')}
                    onValueChange={(value) =>
                      form.setValue('llm_prompt_style', value as 'persuasive' | 'friendly' | 'professional' | 'casual')
                    }
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure backend API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="marketing_url">Marketing API URL *</Label>
                  <Input
                    id="marketing_url"
                    {...form.register('marketing_url')}
                    placeholder="https://marketing.workfaraway.com"
                  />
                  {form.formState.errors.marketing_url && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.marketing_url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_url">LLM API URL (Optional)</Label>
                  <Input
                    id="llm_url"
                    {...form.register('llm_url')}
                    placeholder="https://llm.workfaraway.com"
                  />
                  {form.formState.errors.llm_url && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.llm_url.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comps API Settings */}
          <TabsContent value="comps">
            <CompsApiSettings />
          </TabsContent>

          {/* Manual Comps Settings */}
          <TabsContent value="manual-comps">
            <ManualCompsManager />
          </TabsContent>

          {/* Default Settings */}
          <TabsContent value="defaults">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>
                  Default values for new communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Channels</Label>
                  <div className="space-y-2">
                    {(['sms', 'email', 'call'] as const).map((channel) => (
                      <div key={channel} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`channel-${channel}`}
                          checked={form.watch('default_channels').includes(channel)}
                          onChange={(e) => {
                            const current = form.watch('default_channels');
                            if (e.target.checked) {
                              form.setValue('default_channels', [...current, channel]);
                            } else {
                              form.setValue(
                                'default_channels',
                                current.filter((c) => c !== channel)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`channel-${channel}`} className="cursor-pointer">
                          {channel.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="default_voicemail_style">Default Voicemail Style</Label>
                  <Select
                    value={form.watch('default_voicemail_style')}
                    onValueChange={(value) =>
                      form.setValue('default_voicemail_style', value as 'random' | 'template_1' | 'template_2')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="template_1">Template 1</SelectItem>
                      <SelectItem value="template_2">Template 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="default_test_mode">Default Test Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Start in test mode by default (recommended)
                    </p>
                  </div>
                  <Switch
                    id="default_test_mode"
                    checked={form.watch('default_test_mode')}
                    onCheckedChange={(checked) =>
                      form.setValue('default_test_mode', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
