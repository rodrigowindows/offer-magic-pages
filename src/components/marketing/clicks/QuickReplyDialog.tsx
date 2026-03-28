/**
 * QuickReplyDialog — Send SMS/Email/Call directly from a click card (hot lead follow-up)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/hooks/useTemplatesDB';
import { useMarketingStore } from '@/store/marketingStore';
import { sendSMS, sendEmail, replaceVariables } from '@/services/marketingService';
import { supabase } from '@/integrations/supabase/client';
import {
  Send,
  MessageSquare,
  Mail,
  Loader2,
  CheckCircle,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import type { ClickAnalytic } from '@/hooks/useClicksAnalytics';
import type { Channel } from '@/types/marketing.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  click: ClickAnalytic;
}

export function QuickReplyDialog({ open, onOpenChange, click }: Props) {
  const { toast } = useToast();
  const { getTemplatesByChannel } = useTemplates();
  const settings = useMarketingStore((s) => s.settings);
  const companyConfig = useMarketingStore((s) => s.wizard.companyConfig);

  const [channel, setChannel] = useState<Channel>('sms');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const smsTemplates = getTemplatesByChannel('sms');
  const emailTemplates = getTemplatesByChannel('email');
  const templates = channel === 'sms' ? smsTemplates : emailTemplates;

  const hasPhone = !!click.contact_phone;
  const hasEmail = !!click.contact_email;

  // Auto-select available channel
  useEffect(() => {
    if (open) {
      setSent(false);
      if (hasPhone) setChannel('sms');
      else if (hasEmail) setChannel('email');
    }
  }, [open, hasPhone, hasEmail]);

  const applyTemplate = useCallback(
    (body: string, templateSubject?: string) => {
      const variables: Record<string, string> = {
        name: click.contact_name || 'Homeowner',
        address: click.property_address || '',
        city: '',
        state: '',
        phone: companyConfig.contact_phone,
        contact_phone: companyConfig.contact_phone,
        contact_phone_alt: companyConfig.contact_phone_alt,
        company_name: companyConfig.company_name,
        seller_name: companyConfig.company_name,
        property_url: click.referrer || '',
      };
      // Try to extract city/state from property_address "123 Main St, Orlando, FL 32819"
      if (click.property_address) {
        const parts = click.property_address.split(',').map((s) => s.trim());
        if (parts.length >= 3) {
          variables.city = parts[1];
          const stateZip = parts[2].split(' ');
          variables.state = stateZip[0] || '';
        }
      }
      setMessage(replaceVariables(body, variables));
      if (templateSubject) setSubject(replaceVariables(templateSubject, variables));
    },
    [click, companyConfig]
  );

  // Set default template on channel change
  useEffect(() => {
    if (!open) return;
    const defaultTpl = templates.find((t) => t.is_default) || templates[0];
    if (defaultTpl) {
      applyTemplate(defaultTpl.body, defaultTpl.subject);
    } else {
      setMessage('');
      setSubject('');
    }
  }, [channel, open, templates, applyTemplate]);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const trackingId = crypto.randomUUID();

      if (channel === 'sms') {
        if (!click.contact_phone) throw new Error('No phone number available');
        await sendSMS({ phone_number: click.contact_phone, body: message });
      } else if (channel === 'email') {
        if (!click.contact_email) throw new Error('No email available');
        await sendEmail({
          receiver_email: click.contact_email,
          subject: subject || 'Follow-up on your property',
          message_body: message,
        });
      }

      // Log to campaign_logs
      await supabase.from('campaign_logs').insert({
        tracking_id: trackingId,
        property_id: click.property_id,
        campaign_type: 'manual',
        channel,
        status: 'sent',
        recipient_phone: channel === 'sms' ? click.contact_phone : null,
        recipient_email: channel === 'email' ? click.contact_email : null,
        recipient_name: click.contact_name,
        property_address: click.property_address,
        html_content: message,
        sent_at: new Date().toISOString(),
        metadata: { source: 'quick_reply', click_id: click.id },
      });

      setSent(true);
      toast({ title: `${channel.toUpperCase()} sent!`, description: `Message sent to ${click.contact_name || click.contact_phone || click.contact_email}` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send';
      toast({ title: 'Send failed', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [channel, message, subject, click, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Quick Reply
          </DialogTitle>
          <DialogDescription>Send a follow-up message to this lead</DialogDescription>
        </DialogHeader>

        {/* Contact info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          {click.contact_name && (
            <div className="flex items-center gap-2 font-medium">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> {click.contact_name}
            </div>
          )}
          {click.property_address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {click.property_address}
            </div>
          )}
          <div className="flex items-center gap-3">
            {click.contact_phone && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" /> {click.contact_phone}
              </span>
            )}
            {click.contact_email && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {click.contact_email}
              </span>
            )}
          </div>
        </div>

        {/* Channel tabs */}
        <div className="flex gap-2">
          <Button
            variant={channel === 'sms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChannel('sms')}
            disabled={!hasPhone || sent}
            className="flex-1"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> SMS
          </Button>
          <Button
            variant={channel === 'email' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChannel('email')}
            disabled={!hasEmail || sent}
            className="flex-1"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
          </Button>
        </div>

        {/* Template picker */}
        {templates.length > 0 && !sent && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Templates</div>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <Badge
                  key={tpl.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs py-1 px-2"
                  onClick={() => applyTemplate(tpl.body, tpl.subject)}
                >
                  {tpl.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Email subject */}
        {channel === 'email' && !sent && (
          <input
            type="text"
            placeholder="Email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          />
        )}

        {/* Message body */}
        {!sent ? (
          <Textarea
            placeholder={`Type your ${channel} message...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={channel === 'sms' ? 4 : 8}
            className="text-sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="text-center">
              <p className="font-semibold text-green-700">Message Sent!</p>
              <p className="text-sm text-muted-foreground">
                {channel.toUpperCase()} delivered to {channel === 'sms' ? click.contact_phone : click.contact_email}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSent(false); }}>
              Send Another
            </Button>
          </div>
        )}

        {/* Send button */}
        {!sent && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {channel === 'sms' && message.length > 0 && `${message.length} chars`}
              {settings.defaults.test_mode && ' (Test Mode)'}
            </span>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-1.5" /> Send {channel.toUpperCase()}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
