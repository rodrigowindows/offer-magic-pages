/**
 * Campaign Creator - Step-by-step campaign creation wizard
 * Modern wizard interface for creating and launching marketing campaigns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  Send,
  Loader2,
  Eye,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  Target,
  Settings,
  FileText,
  Play,
  Link,
  BarChart3,
  Zap,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplatesDB';
import type { SavedTemplate, Channel } from '@/types/marketing.types';

interface CampaignProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string | null;
  cash_offer_amount?: number | null;
  estimated_value?: number | null;
  approval_status?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  email1?: string | null;
  email2?: string | null;
}

type WizardStep = 'template' | 'properties' | 'configure' | 'preview' | 'send';

interface CampaignConfig {
  template: SavedTemplate | null;
  channels: Channel[];
  trackingId: string;
  phoneColumns: string[];
  emailColumns: string[];
  scheduleDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  maxContactsPerProperty: number;
  testMode: boolean;
  complianceCheck: boolean;
}

interface SendResults {
  success: number;
  failed: number;
}

// Helper to create SEO-friendly slug from property address
const createPropertySlug = (address: string, city: string, zip: string): string => {
  const addressSlug = address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  const citySlug = city
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  return `${addressSlug}-${citySlug}-${zip}`;
};

export default function CampaignCreator() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    template: null,
    channels: [],
    trackingId: '',
    phoneColumns: ['phone1', 'phone2'],
    emailColumns: ['email1', 'email2'],
    priority: 'normal',
    maxContactsPerProperty: 1,
    testMode: false,
    complianceCheck: true,
  });
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<CampaignProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendResults, setSendResults] = useState<SendResults | null>(null);

  const { templates } = useTemplates();
  const { settings } = useMarketingStore();

  // Load properties from database
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('id, address, city, state, zip_code, owner_name, cash_offer_amount, estimated_value, approval_status, phone1, phone2, email1, email2')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading properties:', error);
          toast({
            title: 'Erro ao carregar propriedades',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setProperties((data as CampaignProperty[]) || []);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        toast({
          title: 'Erro ao carregar propriedades',
          description: 'Não foi possível carregar as propriedades.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [toast]);

  const steps = [
    { id: 'template', title: 'Choose Template', icon: FileText },
    { id: 'properties', title: 'Select Properties', icon: Target },
    { id: 'configure', title: 'Configure', icon: Settings },
    { id: 'preview', title: 'Preview', icon: Eye },
    { id: 'send', title: 'Send Campaign', icon: Send },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Generate tracking ID
  useEffect(() => {
    if (!campaignConfig.trackingId) {
      const trackingId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCampaignConfig(prev => ({ ...prev, trackingId }));
    }
  }, [campaignConfig.trackingId]);

  const getSelectedProperties = () => {
    return properties.filter(prop => selectedPropertyIds.includes(prop.id));
  };

  const getAllPhones = (property: CampaignProperty): string[] => {
    const phones: string[] = [];
    if (property.phone1) phones.push(String(property.phone1));
    if (property.phone2) phones.push(String(property.phone2));
    return [...new Set(phones)];
  };

  const getAllEmails = (property: CampaignProperty): string[] => {
    const emails: string[] = [];
    if (property.email1) emails.push(String(property.email1));
    if (property.email2) emails.push(String(property.email2));
    return [...new Set(emails)];
  };

  const generatePropertyUrl = (property: CampaignProperty, source: string = 'sms'): string => {
    const slug = createPropertySlug(property.address, property.city, property.zip_code);
    return `https://offer.mylocalinvest.com/property/${slug}?src=${source}`;
  };

  const generateTemplateContent = (template: SavedTemplate, property: CampaignProperty) => {
    let content = template.body;
    let subject = template.subject || '';

    const sourceChannel = campaignConfig.channels.length > 0 ? campaignConfig.channels[0] : 'sms';
    const propertyUrl = generatePropertyUrl(property, sourceChannel);
    // QR Code URL has different source to track QR scans separately
    const qrPropertyUrl = generatePropertyUrl(property, `${sourceChannel}-qr`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPropertyUrl)}`;

    // Google Maps static image for property location
    const googleMapsImage = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address + ', ' + property.city + ', ' + property.state)}&zoom=15&size=600x300&markers=color:red%7C${encodeURIComponent(property.address + ', ' + property.city)}&key=YOUR_GOOGLE_MAPS_API_KEY`;

    const replacements: Record<string, string> = {
      '{name}': property.owner_name || 'Owner',
      '{owner_name}': property.owner_name || 'Owner',
      '{address}': property.address,
      '{city}': property.city,
      '{state}': property.state,
      '{zip_code}': property.zip_code,
      '{cash_offer}': property.cash_offer_amount ? `$${property.cash_offer_amount.toLocaleString()}` : '$XXX,XXX',
      '{estimated_value}': property.estimated_value ? `$${property.estimated_value.toLocaleString()}` : '$XXX,XXX',
      '{property_url}': propertyUrl,
      '{qr_code_url}': qrCodeUrl,
      '{property_image}': (property as any).property_image_url || googleMapsImage,
      '{property_photo}': (property as any).property_image_url || googleMapsImage,
      '{property_map}': googleMapsImage,
      '{phone}': settings.company.contact_phone,
      '{company_name}': settings.company.company_name,
      '{seller_name}': settings.company.company_name,
      '{source_channel}': sourceChannel,
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const escapedKey = key.replace(/[{}]/g, '\\$&');
      content = content.replace(new RegExp(escapedKey, 'g'), value);
      subject = subject.replace(new RegExp(escapedKey, 'g'), value);
    });

    return { content, subject };
  };

  const getContactStats = () => {
    const selectedProps = getSelectedProperties();
    let totalPhones = 0;
    let totalEmails = 0;

    selectedProps.forEach(prop => {
      totalPhones += getAllPhones(prop).length;
      totalEmails += getAllEmails(prop).length;
    });

    return {
      totalProperties: selectedProps.length,
      totalPhones,
      totalEmails,
      propertiesWithPhones: selectedProps.filter(p => getAllPhones(p).length > 0).length,
      propertiesWithEmails: selectedProps.filter(p => getAllEmails(p).length > 0).length,
    };
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id as WizardStep);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as WizardStep);
    }
  };

  const handleTemplateSelect = (template: SavedTemplate) => {
    setCampaignConfig(prev => ({ ...prev, template }));
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleChannelToggle = (channel: Channel) => {
    setCampaignConfig(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    setSending(true);
    setSendResults(null);

    let successCount = 0;
    let failCount = 0;

    for (const prop of selectedProps) {
      try {
        const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        const allPhones = getAllPhones(prop);
        const allEmails = getAllEmails(prop);

        let sent = false;

        if (campaignConfig.channels.includes('sms') && allPhones.length > 0) {
          const { content } = generateTemplateContent(campaignConfig.template!, prop);

          for (const phone of allPhones) {
            try {
              await sendSMS({
                phone_number: phone,
                body: content,
              });
              sent = true;
              break;
            } catch (error) {
              console.error('SMS error:', error);
            }
          }
        }

        if (campaignConfig.channels.includes('email') && allEmails.length > 0) {
          const { content, subject } = generateTemplateContent(campaignConfig.template!, prop);

          for (const email of allEmails) {
            try {
              await sendEmail({
                receiver_email: email,
                subject: subject,
                message_body: content,
              });
              sent = true;
              break;
            } catch (error) {
              console.error('Email error:', error);
            }
          }
        }

        if (campaignConfig.channels.includes('call') && allPhones.length > 0) {
          const { content } = generateTemplateContent(campaignConfig.template!, prop);

          for (const phone of allPhones) {
            try {
              await initiateCall({
                name: prop.owner_name || 'Owner',
                address: fullAddress,
                from_number: settings.company.contact_phone,
                to_number: phone,
                voicemail_drop: content,
                seller_name: settings.company.company_name,
              });
              sent = true;
              break;
            } catch (error) {
              console.error('Call error:', error);
            }
          }
        }

        if (sent) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error: unknown) {
        console.error(`Error sending to ${prop.id}:`, error);
        failCount++;
      }
    }

    setSending(false);
    setSendResults({ success: successCount, failed: failCount });
    setShowSendDialog(false);

    toast({
      title: 'Campanha Finalizada',
      description: `✅ ${successCount} enviados com sucesso, ❌ ${failCount} falharam`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Template</h2>
              <p className="text-muted-foreground">Select a template for your campaign</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    campaignConfig.template?.id === template.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.channel}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{template.channel}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Properties</h2>
              <p className="text-muted-foreground">Choose properties to include in your campaign</p>
            </div>

            {!loading && (
              <div className="flex flex-wrap gap-4 items-center justify-between border-b pb-2 mb-2">
                <div className="text-sm text-muted-foreground">
                  Selecionados: <span className="font-semibold">{selectedPropertyIds.length}</span> |
                  Com telefone: <span className="font-semibold">{properties.filter(p => getAllPhones(p).length > 0).length}</span> |
                  Com email: <span className="font-semibold">{properties.filter(p => getAllEmails(p).length > 0).length}</span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading properties...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {properties.map((property) => (
                    <Card key={property.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedPropertyIds.includes(property.id)}
                          onCheckedChange={() => handlePropertyToggle(property.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{property.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zip_code}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {getAllPhones(property).length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Phone className="w-3 h-3 mr-1" />
                                {getAllPhones(property).length} phones
                              </Badge>
                            )}
                            {getAllEmails(property).length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                {getAllEmails(property).length} emails
                              </Badge>
                            )}
                            {property.cash_offer_amount && (
                              <Badge variant="default" className="text-xs">
                                ${property.cash_offer_amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Configure Campaign</h2>
              <p className="text-muted-foreground">Choose communication channels</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Communication Channels</CardTitle>
                <CardDescription>Select how you want to reach your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('sms')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('sms')}
                  >
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-medium">SMS</div>
                      <div className="text-sm text-muted-foreground">Text messages</div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('email')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('email')}
                  >
                    <CardContent className="p-4 text-center">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">Email messages</div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('call')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('call')}
                  >
                    <CardContent className="p-4 text-center">
                      <Phone className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <div className="font-medium">Call</div>
                      <div className="text-sm text-muted-foreground">Phone calls</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Configure sending behavior and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Campaign Priority</Label>
                      <Select
                        value={campaignConfig.priority}
                        onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                          setCampaignConfig(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="normal">Normal Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Test Mode</Label>
                      <Checkbox
                        checked={campaignConfig.testMode}
                        onCheckedChange={(checked) =>
                          setCampaignConfig(prev => ({ ...prev, testMode: checked === true }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Compliance Check</Label>
                      <Checkbox
                        checked={campaignConfig.complianceCheck}
                        onCheckedChange={(checked) =>
                          setCampaignConfig(prev => ({ ...prev, complianceCheck: checked === true }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview':
        const stats = getContactStats();
        const sampleProperty = getSelectedProperties()[0];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Preview Campaign</h2>
              <p className="text-muted-foreground">Review your campaign before sending</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Contact Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contact Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Properties:</span>
                    <span className="font-medium">{stats.totalProperties}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Total Phones:</span>
                    <span className="font-medium">{stats.totalPhones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Emails:</span>
                    <span className="font-medium">{stats.totalEmails}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Campaign Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <span className="font-medium">{campaignConfig.template?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Channels:</span>
                    <div className="flex gap-1">
                      {campaignConfig.channels.map(channel => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Estimate */}
              <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Cost Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${((stats.totalPhones * 0.02) + (stats.totalEmails * 0.01)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                </CardContent>
              </Card>
            </div>

            {/* Message Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Message Content Preview</CardTitle>
                <CardDescription>Preview of actual messages that will be sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleProperty && campaignConfig.template && (
                  <>
                    {campaignConfig.channels.includes('sms') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="w-4 h-4" />
                          SMS Message
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded border">
                          {generateTemplateContent(campaignConfig.template, sampleProperty).content}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Link className="w-3 h-3" />
                          Property URL: {generatePropertyUrl(sampleProperty, 'sms')}
                        </div>
                      </div>
                    )}

                    {campaignConfig.channels.includes('email') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email Message
                        </div>
                        <div className="text-sm bg-white p-4 rounded border">
                          <div className="font-medium border-b pb-2 mb-2">
                            Subject: {generateTemplateContent(campaignConfig.template, sampleProperty).subject}
                          </div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: generateTemplateContent(campaignConfig.template, sampleProperty).content
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Link className="w-3 h-3" />
                          Property URL: {generatePropertyUrl(sampleProperty, 'email')}
                        </div>
                      </div>
                    )}

                    {campaignConfig.channels.includes('call') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="w-4 h-4" />
                          Call Message
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded border">
                          {generateTemplateContent(campaignConfig.template, sampleProperty).content}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This campaign will be sent to {stats.totalProperties} properties using {campaignConfig.channels.length} communication channels.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'send':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Send Campaign</h2>
              <p className="text-muted-foreground">Launch your campaign to reach potential sellers</p>
            </div>

            <Card className="text-center">
              <CardContent className="p-8">
                <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Ready to Launch!</h3>
                <p className="text-muted-foreground mb-6">
                  Your campaign is configured and ready to send to {getSelectedProperties().length} properties
                  via {campaignConfig.channels.join(', ')}.
                </p>

                {sendResults && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{sendResults.success}</div>
                        <div className="text-sm text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{sendResults.failed}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={() => setShowSendDialog(true)}
                  disabled={sending || getSelectedProperties().length === 0}
                  className="w-full max-w-xs"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Campaign...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return campaignConfig.template !== null;
      case 'properties':
        return selectedPropertyIds.length > 0;
      case 'configure':
        return campaignConfig.channels.length > 0;
      case 'preview':
        return true;
      case 'send':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg -z-10"></div>
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campaign Creator
          </h1>
          <p className="text-muted-foreground text-lg">Create and launch marketing campaigns step by step</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStepIndex > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                            : isActive
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg animate-pulse'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-xs mt-2 text-center max-w-20">
                        <div className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStepIndex < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => setShowSendDialog(true)} disabled={!canProceed()}>
            <Send className="w-4 h-4 mr-2" />
            Send Campaign
          </Button>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Campaign Launch</DialogTitle>
            <DialogDescription>
              Are you ready to send this campaign to {getSelectedProperties().length} properties?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Template:</span>
                <div>{campaignConfig.template?.name}</div>
              </div>
              <div>
                <span className="font-medium">Channels:</span>
                <div>{campaignConfig.channels.join(', ')}</div>
              </div>
              <div>
                <span className="font-medium">Properties:</span>
                <div>{getSelectedProperties().length}</div>
              </div>
              <div>
                <span className="font-medium">Tracking ID:</span>
                <div className="font-mono text-xs">{campaignConfig.trackingId}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCampaign} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
