import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Eye, CheckCircle, Target, MessageSquare, Mail, Phone } from 'lucide-react';
import type { Channel } from '@/types/marketing.types';

interface Props {
  selectedChannel: Channel;
  setSelectedChannel: (c: Channel) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedTemplate: any;
  getTemplatesByChannel: (c: Channel) => any[];
  generateTemplateContent: (template: any, prop: any, trackingId?: string) => { content: string; subject: string };
}

export function CampaignStep1Template({
  selectedChannel, setSelectedChannel,
  selectedTemplateId, setSelectedTemplateId,
  selectedTemplate, getTemplatesByChannel,
  generateTemplateContent,
}: Props) {
  const sampleProp = {
    id: 'sample', address: '123 Main St', city: 'Orlando', state: 'FL',
    zip_code: '32801', matched_first_name: 'John', matched_last_name: 'Doe',
    estimated_value: 350000, cash_offer_amount: 245000,
    property_image_url: 'https://via.placeholder.com/600x300.png?text=Sample+Property+Photo',
    slug: 'sample-property',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose Template</h2>
        <p className="text-muted-foreground">Select a template for your campaign</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Available Templates</Label>
          <Tabs value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as Channel)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sms"><MessageSquare className="w-4 h-4 mr-2" />SMS</TabsTrigger>
              <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" />Email</TabsTrigger>
              <TabsTrigger value="call"><Phone className="w-4 h-4 mr-2" />Call</TabsTrigger>
            </TabsList>
          </Tabs>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {getTemplatesByChannel(selectedChannel).map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:bg-muted/50 hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {template.name}
                        {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {template.subject ? `Subject: ${template.subject.substring(0, 40)}...` : `${template.body.substring(0, 60)}...`}
                      </div>
                    </div>
                    {selectedTemplateId === template.id && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>
                </div>
              ))}
              {getTemplatesByChannel(selectedChannel).length === 0 && (
                <div className="p-8 border rounded-lg text-center text-muted-foreground bg-muted/20">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No {selectedChannel.toUpperCase()} templates</p>
                  <p className="text-xs mt-1">Create templates first to use this channel</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Template Preview */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" /> Live Preview
          </Label>
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">{selectedTemplate ? selectedTemplate.name : 'No template selected'}</CardTitle>
              {selectedTemplate?.subject && <CardDescription className="text-xs">Subject: {selectedTemplate.subject}</CardDescription>}
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="p-4 bg-background border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Preview with sample data:</div>
                    <div className="prose prose-sm max-w-none">
                      {selectedChannel === 'email' ? (
                        <iframe
                          srcDoc={generateTemplateContent(selectedTemplate, sampleProp as any, 'preview').content}
                          className="w-full border-0 rounded"
                          style={{ height: '300px', minHeight: '200px' }}
                          title="Email Template Preview"
                          sandbox=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">
                          {generateTemplateContent(selectedTemplate, sampleProp as any, 'preview').content}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 border rounded-lg">
                      <div className="text-muted-foreground mb-1">Channel</div>
                      <div className="font-medium capitalize">{selectedTemplate?.channel}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-muted-foreground mb-1">Type</div>
                      <div className="font-medium">{selectedTemplate?.is_default ? 'Default' : 'Custom'}</div>
                    </div>
                    {selectedChannel === 'sms' && selectedTemplate?.body && (
                      <div className="p-3 border rounded-lg col-span-2">
                        <div className="text-muted-foreground mb-1">Character Count</div>
                        <div className="font-medium">
                          {selectedTemplate.body.length} chars
                          {selectedTemplate.body.length > 160 && (
                            <span className="text-yellow-600 ml-2">(~{Math.ceil(selectedTemplate.body.length / 160)} SMS)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
