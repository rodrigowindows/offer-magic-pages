import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, MessageSquare, Mail, Phone, Users, Eye, Code, AlertCircle } from 'lucide-react';
import { dedupeContacts, extractTaggedContacts, type CampaignProperty } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

interface Props {
  selectedProps: CampaignProperty[];
  selectedChannel: Channel;
  selectedTemplate: any;
  propsWithPhone: number;
  propsWithEmail: number;
  getAllPhones: (p: CampaignProperty) => string[];
  getAllEmails: (p: CampaignProperty) => string[];
  renderTemplatePreview: (prop: CampaignProperty, type?: 'body' | 'subject') => string;
}

export function CampaignStep4Preview({
  selectedProps, selectedChannel, selectedTemplate,
  propsWithPhone, propsWithEmail,
  getAllPhones, getAllEmails, renderTemplatePreview,
}: Props) {
  const [previewRenderLimit, setPreviewRenderLimit] = useState(20);
  const [showHtmlCode, setShowHtmlCode] = useState(false);

  const getCampaignStats = () => {
    const approvedProps = selectedProps.filter(p => p.approval_status === 'approved');
    const propsWithPhones = selectedProps.filter(p => getAllPhones(p).length > 0);
    const propsWithEmails = selectedProps.filter(p => getAllEmails(p).length > 0);
    const taggedPhoneContacts = selectedProps.reduce((sum, p) => {
      const { preferredPhones, manualPhones } = extractTaggedContacts(p);
      return sum + dedupeContacts([...preferredPhones, ...manualPhones]).length;
    }, 0);
    const taggedEmailContacts = selectedProps.reduce((sum, p) => {
      const { preferredEmails, manualEmails } = extractTaggedContacts(p);
      return sum + dedupeContacts([...preferredEmails, ...manualEmails]).length;
    }, 0);
    return {
      totalProperties: selectedProps.length,
      approvedProperties: approvedProps.length,
      propertiesWithPhones: propsWithPhones.length,
      propertiesWithEmails: propsWithEmails.length,
      totalPhoneContacts: propsWithPhones.reduce((sum, p) => sum + getAllPhones(p).length, 0),
      totalEmailContacts: propsWithEmails.reduce((sum, p) => sum + getAllEmails(p).length, 0),
      taggedPhoneContacts,
      taggedEmailContacts,
    };
  };

  const stats = getCampaignStats();
  const totalContacts = selectedProps.reduce((total, prop) => {
    return total + (selectedChannel === 'email' ? getAllEmails(prop).length : getAllPhones(prop).length);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">📬 Preview Campaign</h2>
        <p className="text-muted-foreground">Review your campaign before sending</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Target Audience</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                ['Total Properties', stats.totalProperties],
                ['Approved', stats.approvedProperties],
                ['With Phones', stats.propertiesWithPhones],
                ['Total Phone Contacts', stats.totalPhoneContacts],
                ['Tagged Phones', stats.taggedPhoneContacts],
                ['With Emails', stats.propertiesWithEmails],
                ['Total Email Contacts', stats.totalEmailContacts],
                ['Tagged Emails', stats.taggedEmailContacts],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Campaign Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Template:</span><span className="font-semibold">{selectedTemplate?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Channels:</span><span className="font-semibold">{selectedChannel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expected Success:</span><span className="font-semibold text-green-600">15-25%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Previews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            📧 Message Content Preview
            <span className="text-sm text-muted-foreground font-normal ml-2">({selectedProps.length} properties • {totalContacts} contacts)</span>
          </CardTitle>
          <CardDescription>Preview of actual messages that will be sent</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProps.length > 0 && selectedTemplate ? (
            <div className="space-y-6">
              {selectedProps.length > previewRenderLimit && (
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <AlertDescription className="text-amber-900">Rendering limited to {previewRenderLimit} previews.</AlertDescription>
                </Alert>
              )}
              {selectedProps.slice(0, previewRenderLimit).map((property, index) => {
                const contacts = selectedChannel === 'email' ? getAllEmails(property) : getAllPhones(property);
                const bodyPreview = renderTemplatePreview(property);
                const subjectPreview = selectedChannel === 'email' ? renderTemplatePreview(property, 'subject') : '';
                return (
                  <div key={property.id || index} className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{index + 1}</div>
                          <h4 className="font-bold text-base text-gray-900">{property.address || 'N/A'}</h4>
                          {contacts.length > 1 && <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">{contacts.length} contacts</span>}
                        </div>
                        <div className="text-sm text-gray-600 ml-8">{property.city}, {property.state} {property.zip_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">${property.cash_offer_amount?.toLocaleString() || '0'}</div>
                        <div className="text-xs text-gray-500">Cash Offer</div>
                      </div>
                    </div>
                    {selectedChannel === 'sms' && (
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-blue-600" /><span className="font-medium">SMS Message</span></div>
                        <div className="bg-gray-50 p-3 rounded border text-sm">{bodyPreview}</div>
                        <div className="text-xs text-muted-foreground mt-2">~{bodyPreview.length} characters</div>
                      </div>
                    )}
                    {selectedChannel === 'email' && (
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-600" /><span className="font-medium">Email Message</span></div>
                          <Button variant="outline" size="sm" onClick={() => setShowHtmlCode(!showHtmlCode)} className="gap-2">
                            {showHtmlCode ? <><Eye className="w-4 h-4" /> Show Preview</> : <><Code className="w-4 h-4" /> Show HTML</>}
                          </Button>
                        </div>
                        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs text-blue-600 font-medium">Subject:</span>
                          <div className="text-sm font-medium text-gray-900 mt-1">{subjectPreview}</div>
                        </div>
                        <div className="bg-white border rounded">
                          {showHtmlCode ? (
                            <pre className="p-3 text-xs overflow-auto max-h-[400px] whitespace-pre-wrap font-mono">{bodyPreview}</pre>
                          ) : (
                            <iframe srcDoc={bodyPreview} className="w-full border-0 rounded" style={{ height: '400px' }} title={`Email Preview - ${property.address}`} sandbox="allow-popups" loading="lazy" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </div>
                    )}
                    {selectedChannel === 'call' && (
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-2"><Phone className="w-4 h-4 text-blue-600" /><span className="font-medium">Voicemail</span></div>
                        <div className="bg-gray-50 p-3 rounded border text-sm">{bodyPreview}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {previewRenderLimit < selectedProps.length && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setPreviewRenderLimit(prev => Math.min(prev + 20, selectedProps.length))}>Load 20 more previews</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Select properties and template to see preview</div>
          )}
        </CardContent>
      </Card>

      {/* Validation */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-green-600" /> Campaign Summary & Validation</CardTitle>
          <CardDescription>Final checklist before sending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Template</h4>
              <div className="pl-6 space-y-1 text-sm">
                <div className="flex justify-between"><span>Name:</span><span className="font-medium">{selectedTemplate?.name}</span></div>
                <div className="flex justify-between"><span>Channel:</span><span className="font-medium capitalize">{selectedChannel}</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Recipients</h4>
              <div className="pl-6 space-y-1 text-sm">
                <div className="flex justify-between"><span>Properties:</span><span className="font-medium">{selectedProps.length}</span></div>
                <div className="flex justify-between"><span>With contact:</span><span className="font-medium text-green-600">{selectedChannel === 'email' ? propsWithEmail : propsWithPhone}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
