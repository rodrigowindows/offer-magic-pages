/**
 * Template Preview Page - Shows all templates with offer links for each property
 * Preview SMS and email templates with actual property data and tracking links
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  Eye,
  Copy,
  ExternalLink,
  QrCode,
  Link,
  RefreshCw,
} from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useMarketingStore } from '@/store/marketingStore';
import type { SavedTemplate, Property } from '@/types/marketing.types';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  preferred_phones?: string[];
  preferred_emails?: string[];
  skip_tracing_data?: {
    preferred_phones?: string[];
    preferred_emails?: string[];
  };
  [key: string]: string | number | boolean | null | undefined | object;
}

export default function TemplatePreview() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLinks, setGeneratingLinks] = useState(false);

  const { templates } = useTemplates();
  const { settings } = useMarketingStore();
  const { toast } = useToast();

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10); // Limit to first 10 for preview

        if (error) {
          console.error('Error loading properties:', error);
          toast({
            title: 'Erro ao carregar propriedades',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setProperties(data || []);
          if (data && data.length > 0) {
            setSelectedProperty(data[0]);
          }
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

  const generateTemplateContent = (template: SavedTemplate, property: Property) => {
    let content = template.content;
    let subject = template.subject || '';

    // Generate property URL with tracking
    const propertyUrl = `${settings.company.website}/property/${property.id}?source=template_preview&template=${template.id}`;

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

    // Replace variables
    const replacements = {
      '{name}': property.owner_name || 'Owner',
      '{address}': property.address,
      '{city}': property.city,
      '{state}': property.state,
      '{zip_code}': property.zip_code,
      '{cash_offer}': property.cash_offer_amount ? `$${property.cash_offer_amount.toLocaleString()}` : '$XXX,XXX',
      '{property_url}': propertyUrl,
      '{qr_code_url}': qrCodeUrl,
      '{phone}': settings.company.contact_phone,
      '{company_name}': settings.company.company_name,
      '{seller_name}': settings.company.company_name,
      '{source_channel}': template.channel,
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
      subject = subject.replace(new RegExp(key, 'g'), value);
    });

    return { content, subject, propertyUrl, qrCodeUrl };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: 'Conteúdo copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o conteúdo.',
        variant: 'destructive',
      });
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading templates and properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Template Preview with Offer Links</h1>
        <p className="text-muted-foreground">
          Preview all templates with actual property data and tracking links
        </p>
      </div>

      {/* Property Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Select Property for Preview
          </CardTitle>
          <CardDescription>
            Choose a property to see how templates will look with real data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="property-select">Property</Label>
              <Select
                value={selectedProperty?.id || ''}
                onValueChange={(value) => {
                  const property = properties.find(p => p.id === value);
                  setSelectedProperty(property || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} - {property.city}, {property.state}
                      {property.cash_offer_amount && ` - $${property.cash_offer_amount.toLocaleString()}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProperty && (
              <div className="text-sm text-muted-foreground">
                <div>Owner: {selectedProperty.owner_name || 'Not specified'}</div>
                <div>Offer: {selectedProperty.cash_offer_amount ? `$${selectedProperty.cash_offer_amount.toLocaleString()}` : 'Not set'}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {selectedProperty && (
        <div className="grid gap-6">
          {templates.map((template) => {
            const { content, subject, propertyUrl, qrCodeUrl } = generateTemplateContent(template, selectedProperty);

            return (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.channel === 'sms' && <MessageSquare className="w-5 h-5 text-blue-500" />}
                        {template.channel === 'email' && <Mail className="w-5 h-5 text-green-500" />}
                        {template.channel === 'call' && <Phone className="w-5 h-5 text-purple-500" />}
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{template.channel.toUpperCase()}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Property URL */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Property Offer Link</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Link className="w-4 h-4 text-muted-foreground" />
                      <code className="flex-1 text-sm break-all">{propertyUrl}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(propertyUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInNewTab(propertyUrl)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* QR Code URL */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">QR Code URL</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                      <code className="flex-1 text-sm break-all">{qrCodeUrl}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(qrCodeUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInNewTab(qrCodeUrl)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Template Content */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Template Content</Label>

                    {template.channel === 'email' && subject && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Subject:</div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{subject}</div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {template.channel === 'sms' && 'SMS Message:'}
                        {template.channel === 'email' && 'Email Body:'}
                        {template.channel === 'call' && 'Voicemail Script:'}
                      </div>
                      <div className={`p-4 rounded-lg border ${
                        template.channel === 'sms' ? 'bg-blue-50 border-blue-200' :
                        template.channel === 'email' ? 'bg-green-50 border-green-200' :
                        'bg-purple-50 border-purple-200'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {content}
                        </div>
                      </div>
                    </div>

                    {/* Character/Word Count */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {template.channel === 'sms' && `Characters: ${content.length}`}
                        {template.channel === 'email' && `Words: ${content.split(' ').length}`}
                        {template.channel === 'call' && `Words: ${content.split(' ').length}`}
                      </span>
                      <span>Template ID: {template.id}</span>
                    </div>
                  </div>

                  {/* Copy Content Button */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(content)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy {template.channel.toUpperCase()} Content
                    </Button>
                    {template.channel === 'email' && subject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`Subject: ${subject}\n\n${content}`)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Full Email
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This preview shows how each template will render with actual property data.
          All links include tracking parameters for campaign analytics.
          Use the copy buttons to quickly copy content for testing or manual sending.
        </AlertDescription>
      </Alert>
    </div>
  );
}