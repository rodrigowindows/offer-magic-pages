import { Card, CardContent } from '@/components/ui/card';
import { Target, MessageSquare, Mail, Phone, Users, Ban } from 'lucide-react';
import type { Channel } from '@/types/marketing.types';
import type { CampaignTemplate } from '@/types/campaign.types';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';
import { ExcludePhonesList } from './ExcludePhonesList';

/** Normalize phone to digits only */
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

interface Props {
  selectedIds: string[];
  selectedChannel: Channel;
  propsWithPhone: number;
  propsWithEmail: number;
  selectedTemplate?: CampaignTemplate;
  selectedProps?: CampaignProperty[];
  getAllPhones?: (p: CampaignProperty) => string[];
  getAllEmails?: (p: CampaignProperty) => string[];
  excludedPhones?: string[];
  setExcludedPhones?: (phones: string[]) => void;
}

export function CampaignStep3Summary({ selectedIds, selectedChannel, propsWithPhone, propsWithEmail, selectedTemplate, selectedProps, getAllPhones, getAllEmails, excludedPhones, setExcludedPhones }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Campaign Summary</h2>
        <p className="text-muted-foreground">Review your campaign configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4"><Target className="h-6 w-6 text-primary" /></div>
              <div className="text-3xl font-bold text-primary mb-2">{selectedIds.length}</div>
              <div className="text-sm font-medium text-primary">Target Properties</div>
              <div className="text-xs text-primary/70 mt-1">Selected for outreach</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-accent/5">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                {selectedChannel === 'sms' && <MessageSquare className="h-6 w-6 text-accent" />}
                {selectedChannel === 'email' && <Mail className="h-6 w-6 text-accent" />}
                {selectedChannel === 'call' && <Phone className="h-6 w-6 text-accent" />}
              </div>
              <div className="text-3xl font-bold text-accent mb-2 capitalize">{selectedChannel}</div>
              <div className="text-sm font-medium text-accent">Communication Channel</div>
              <div className="text-xs text-accent/70 mt-1">From template selection</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-success/5">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4"><Users className="h-6 w-6 text-success" /></div>
              <div className="text-3xl font-bold text-success mb-2">
                {selectedChannel === 'email' ? propsWithEmail : propsWithPhone}
              </div>
              <div className="text-sm font-medium text-success">Valid Contacts</div>
              <div className="text-xs text-success/70 mt-1">With {selectedChannel === 'email' ? 'email' : 'phone'} available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedChannel !== 'email' && excludedPhones && setExcludedPhones && (
        <ExcludePhonesList excludedPhones={excludedPhones} setExcludedPhones={setExcludedPhones} />
      )}

      {selectedTemplate && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Template: {selectedTemplate.name}</h3>
            <p className="text-sm text-muted-foreground">Channel: {selectedChannel.toUpperCase()}</p>
          </CardContent>
        </Card>
      )}

      {selectedProps && selectedProps.length > 0 && (getAllPhones || getAllEmails) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {selectedChannel === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              Contacts per Property
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedProps.map((prop) => {
                const contacts = selectedChannel === 'email'
                  ? (getAllEmails ? getAllEmails(prop) : [])
                  : (getAllPhones ? getAllPhones(prop) : []);
                return (
                  <div key={prop.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="font-medium truncate max-w-[40%]">{prop.address}</div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {contacts.length > 0 ? contacts.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {selectedChannel === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />} {c}
                        </span>
                      )) : (
                        <span className="text-xs text-muted-foreground">No contact</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
