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
import { MessageSquare, Mail, Phone, Eye } from 'lucide-react';
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

  // ✅ CORREÇÃO: Garantir que há um canal selecionado
  const defaultChannel = selectedChannels.includes('sms')
    ? 'sms'
    : selectedChannels.includes('email')
    ? 'email'
    : selectedChannels.includes('call')
    ? 'call'
    : 'sms';

  // Helper to get recipient with defaults
  const getRecipientWithDefaults = () => ({
    name: recipientInfo.name || 'Customer',
    address: recipientInfo.address || 'Property Address',
    seller_name: recipientInfo.seller_name,
  });

  // SMS Handlers
  const getSMSPreview = () => {
    const template = smsMode === 'custom' && customMessages.sms ? customMessages.sms : DEFAULT_SMS_TEMPLATE;
    return generateMessagePreview(template, getRecipientWithDefaults(), companyConfig);
  };

  // Email Handlers
  const getEmailPreview = () => {
    const template = emailMode === 'custom' && customMessages.emailBody ? customMessages.emailBody : DEFAULT_EMAIL_BODY;
    return generateMessagePreview(template, getRecipientWithDefaults(), companyConfig);
  };

  const getEmailSubject = () => {
    const subject = emailMode === 'custom' && customMessages.emailSubject ? customMessages.emailSubject : DEFAULT_EMAIL_SUBJECT;
    return generateMessagePreview(subject, getRecipientWithDefaults(), companyConfig);
  };

  // Voicemail Handlers
  const getVoicemailPreview = () => {
    if (voicemailMode === 'custom' && customMessages.voicemail) {
      return generateMessagePreview(customMessages.voicemail, getRecipientWithDefaults(), companyConfig);
    }

    const template = voicemailMode === 'template_2' ? DEFAULT_VOICEMAIL_TEMPLATE_2 : DEFAULT_VOICEMAIL_TEMPLATE_1;
    return generateMessagePreview(template, getRecipientWithDefaults(), companyConfig);
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
          <Tabs defaultValue={defaultChannel} className="w-full">
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
