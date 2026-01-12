/**
 * Template Preview Selector
 * Seletor de template com preview ao lado em tempo real
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Phone, Eye, Code } from 'lucide-react';
import type { SavedTemplate } from '@/types/marketing.types';

interface TemplatePreviewSelectorProps {
  templates: SavedTemplate[];
  selectedTemplate: SavedTemplate | null;
  onSelect: (template: SavedTemplate) => void;
  previewData?: {
    name: string;
    address: string;
    city: string;
    state: string;
    cash_offer: string;
    estimated_value: string;
    phone: string;
    property_url: string;
    qr_code_url: string;
  };
}

export const TemplatePreviewSelector = ({
  templates,
  selectedTemplate,
  onSelect,
  previewData = {
    name: 'John Smith',
    address: '123 Main Street',
    city: 'Orlando',
    state: 'FL',
    cash_offer: '$180,000',
    estimated_value: '$250,000',
    phone: '(786) 882-8251',
    property_url: 'https://offer.mylocalinvest.com/property/123-main-st?src=preview',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://offer.mylocalinvest.com/property/123-main-st'
  }
}: TemplatePreviewSelectorProps) => {
  const [showHtmlCode, setShowHtmlCode] = useState(false);

  // Group templates by channel
  const templatesByChannel = useMemo(() => {
    return {
      sms: templates.filter(t => t.channel === 'sms'),
      email: templates.filter(t => t.channel === 'email'),
      call: templates.filter(t => t.channel === 'call'),
    };
  }, [templates]);

  // Render template with preview data
  const renderPreview = (template: SavedTemplate | null) => {
    if (!template) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Selecione um template para ver o preview</p>
          </div>
        </div>
      );
    }

    let content = template.body || '';

    // Replace template variables
    const googleMapsPreview = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(previewData.address + ', ' + previewData.city)}&zoom=15&size=600x300&markers=color:red%7C${encodeURIComponent(previewData.address)}&key=YOUR_GOOGLE_MAPS_API_KEY`;

    const replacements: Record<string, string> = {
      '{name}': previewData.name,
      '{address}': previewData.address,
      '{city}': previewData.city,
      '{state}': previewData.state,
      '{cash_offer}': previewData.cash_offer,
      '{estimated_value}': previewData.estimated_value,
      '{phone}': previewData.phone,
      '{property_url}': previewData.property_url,
      '{qr_code_url}': previewData.qr_code_url,
      '{property_image}': googleMapsPreview,
      '{property_photo}': googleMapsPreview,
      '{property_map}': googleMapsPreview,
      '{company_name}': 'MyLocalInvest',
      '{seller_name}': 'Mike Johnson',
      '{unsubscribe_url}': 'https://mylocalinvest.com/unsubscribe',
      '{tracking_pixel}': '',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
    });

    // Render based on channel
    if (template.channel === 'email') {
      if (showHtmlCode) {
        return (
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[500px]">
            {content}
          </pre>
        );
      }
      return (
        <iframe
          srcDoc={content}
          className="w-full h-[500px] border rounded-lg bg-white"
          sandbox="allow-same-origin"
          title="Email Preview"
        />
      );
    }

    // SMS or Call - show as plain text
    return (
      <div className="p-6 bg-muted rounded-lg">
        <div className="bg-white rounded-lg p-4 shadow-sm max-w-md">
          <div className="flex items-start gap-3">
            {template.channel === 'sms' ? (
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
            ) : (
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {template.channel === 'sms' ? 'Text Message' : 'Voice Message'}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {content}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {Math.ceil(content.length / 160)} SMS segment(s) • {content.length} characters
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Template</CardTitle>
          <CardDescription>
            Escolha um template para visualizar o preview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sms">
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS ({templatesByChannel.sms.length})
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Email ({templatesByChannel.email.length})
              </TabsTrigger>
              <TabsTrigger value="call">
                <Phone className="w-4 h-4 mr-2" />
                Call ({templatesByChannel.call.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {templatesByChannel.sms.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{template.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {template.body?.substring(0, 80)}...
                          </p>
                        </div>
                        {template.is_default && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  {templatesByChannel.sms.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum template SMS disponível
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {templatesByChannel.email.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-sm">{template.name}</span>
                          </div>
                          {template.subject && (
                            <p className="text-xs text-gray-600 mt-1">
                              Subject: {template.subject}
                            </p>
                          )}
                        </div>
                        {template.is_default && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  {templatesByChannel.email.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum template Email disponível
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="call" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {templatesByChannel.call.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-sm">{template.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {template.body?.substring(0, 80)}...
                          </p>
                        </div>
                        {template.is_default && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  {templatesByChannel.call.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum template Call disponível
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Visualização em tempo real com dados de exemplo
              </CardDescription>
            </div>
            {selectedTemplate?.channel === 'email' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHtmlCode(!showHtmlCode)}
              >
                {showHtmlCode ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Preview
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Ver Código
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedTemplate && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getChannelIcon(selectedTemplate.channel)}
                {selectedTemplate.channel.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium">{selectedTemplate.name}</span>
            </div>
          )}
          {renderPreview(selectedTemplate)}
        </CardContent>
      </Card>
    </div>
  );
};
