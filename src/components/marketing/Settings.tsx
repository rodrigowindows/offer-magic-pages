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
import { Settings as SettingsIcon, Building2, Cpu, Zap, Save } from 'lucide-react';
import type { MarketingSettings } from '@/types/marketing.types';

// Schema de validação
const settingsSchema = z.object({
  // Company
  company_name: z.string().min(2, 'Company name required'),
  contact_phone: z.string().min(10, 'Valid phone required'),
  contact_phone_alt: z.string().optional(),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  city: z.string().min(2, 'City required'),

  // LLM
  llm_provider: z.enum(['openai', 'anthropic']),
  llm_model: z.string().min(1, 'Model required'),
  llm_temperature: z.number().min(0).max(2),

  // API
  marketing_url: z.string().url('Valid URL required'),
  llm_url: z.string().url('Valid URL required').optional().or(z.literal('')),

  // Defaults
  default_channels: z.array(z.enum(['sms', 'email', 'call'])).min(1),
  default_voicemail_style: z.enum(['professional', 'friendly', 'urgent', 'random']),
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
      website: settings.company.website,
      city: settings.company.city,

      llm_provider: settings.llm.llm_provider,
      llm_model: settings.llm.llm_model,
      llm_temperature: settings.llm.llm_temperature,

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
        contact_phone_alt: data.contact_phone_alt,
        website: data.website,
        city: data.city,
      },
      llm: {
        llm_provider: data.llm_provider,
        llm_model: data.llm_model,
        llm_temperature: data.llm_temperature,
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
          <TabsList className="grid w-full grid-cols-4">
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
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...form.register('website')}
                    placeholder="https://yourcompany.com"
                  />
                  {form.formState.errors.website && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.website.message}
                    </p>
                  )}
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
                <div className="space-y-2">
                  <Label htmlFor="llm_provider">LLM Provider *</Label>
                  <Select
                    value={form.watch('llm_provider')}
                    onValueChange={(value) =>
                      form.setValue('llm_provider', value as 'openai' | 'anthropic')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_model">Model *</Label>
                  <Input
                    id="llm_model"
                    {...form.register('llm_model')}
                    placeholder="gpt-4"
                  />
                  {form.formState.errors.llm_model && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.llm_model.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm_temperature">
                    Temperature ({form.watch('llm_temperature')})
                  </Label>
                  <input
                    type="range"
                    id="llm_temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    {...form.register('llm_temperature', { valueAsNumber: true })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = more focused, Higher = more creative
                  </p>
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
                      form.setValue('default_voicemail_style', value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
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
