import { Card, CardContent } from '@/components/ui/card';
import { Target, MessageSquare, Mail, Phone, Users } from 'lucide-react';
import type { Channel } from '@/types/marketing.types';

interface Props {
  selectedIds: string[];
  selectedChannel: Channel;
  propsWithPhone: number;
  propsWithEmail: number;
  selectedTemplate: any;
}

export function CampaignStep3Summary({ selectedIds, selectedChannel, propsWithPhone, propsWithEmail, selectedTemplate }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Campaign Summary</h2>
        <p className="text-muted-foreground">Review your campaign configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4"><Target className="h-6 w-6 text-blue-600" /></div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{selectedIds.length}</div>
              <div className="text-sm font-medium text-blue-700">Target Properties</div>
              <div className="text-xs text-blue-600 mt-1">Selected for outreach</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                {selectedChannel === 'sms' && <MessageSquare className="h-6 w-6 text-purple-600" />}
                {selectedChannel === 'email' && <Mail className="h-6 w-6 text-purple-600" />}
                {selectedChannel === 'call' && <Phone className="h-6 w-6 text-purple-600" />}
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2 capitalize">{selectedChannel}</div>
              <div className="text-sm font-medium text-purple-700">Communication Channel</div>
              <div className="text-xs text-purple-600 mt-1">From template selection</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4"><Users className="h-6 w-6 text-green-600" /></div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {selectedChannel === 'email' ? propsWithEmail : propsWithPhone}
              </div>
              <div className="text-sm font-medium text-green-700">Valid Contacts</div>
              <div className="text-xs text-green-600 mt-1">With {selectedChannel === 'email' ? 'email' : 'phone'} available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTemplate && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Template: {selectedTemplate.name}</h3>
            <p className="text-sm text-muted-foreground">Channel: {selectedChannel.toUpperCase()}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
