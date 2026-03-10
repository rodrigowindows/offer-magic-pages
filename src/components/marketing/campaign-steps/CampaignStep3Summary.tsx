import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, MessageSquare, Mail, Phone, Users, Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Channel } from '@/types/marketing.types';
import type { CampaignTemplate } from '@/types/campaign.types';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';

interface Props {
  selectedIds: string[];
  selectedChannel: Channel;
  propsWithPhone: number;
  propsWithEmail: number;
  selectedTemplate?: CampaignTemplate;
  selectedProps?: CampaignProperty[];
  getAllPhones?: (p: CampaignProperty) => string[];
  getAllEmails?: (p: CampaignProperty) => string[];
  onContactAdded?: () => void;
}

export function CampaignStep3Summary({ selectedIds, selectedChannel, propsWithPhone, propsWithEmail, selectedTemplate, selectedProps, getAllPhones, getAllEmails, onContactAdded }: Props) {
  const [addingForId, setAddingForId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddManualPhone = async (prop: CampaignProperty) => {
    const value = inputValue.trim();
    if (!value || !prop.id) return;

    setSaving(true);
    try {
      const existingTags = Array.isArray(prop.tags) ? prop.tags.filter((t): t is string => typeof t === 'string') : [];
      const tag = `manual_phone:${value}`;
      if (existingTags.includes(tag)) {
        setInputValue('');
        setAddingForId(null);
        return;
      }
      const newTags = [...existingTags, tag];
      const { error } = await supabase.from('properties').update({ tags: newTags }).eq('id', prop.id);
      if (error) throw error;

      // Update in-memory tags so UI refreshes immediately
      (prop as any).tags = newTags;
      setInputValue('');
      setAddingForId(null);
      onContactAdded?.();
    } catch (err) {
      console.error('Error adding manual phone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveManualPhone = async (prop: CampaignProperty, phone: string) => {
    if (!prop.id) return;
    setSaving(true);
    try {
      const existingTags = Array.isArray(prop.tags) ? prop.tags.filter((t): t is string => typeof t === 'string') : [];
      const newTags = existingTags.filter(t => t !== `manual_phone:${phone}`);
      const { error } = await supabase.from('properties').update({ tags: newTags }).eq('id', prop.id);
      if (error) throw error;
      (prop as any).tags = newTags;
      onContactAdded?.();
    } catch (err) {
      console.error('Error removing manual phone:', err);
    } finally {
      setSaving(false);
    }
  };

  const showManualInput = selectedChannel === 'sms' || selectedChannel === 'call';

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
              {showManualInput && <span className="text-xs font-normal text-muted-foreground ml-2">Click + to add manual phone</span>}
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {selectedProps.map((prop) => {
                const contacts = selectedChannel === 'email'
                  ? (getAllEmails ? getAllEmails(prop) : [])
                  : (getAllPhones ? getAllPhones(prop) : []);
                const manualPhones = Array.isArray(prop.tags)
                  ? prop.tags.filter((t): t is string => typeof t === 'string' && t.startsWith('manual_phone:')).map(t => t.replace('manual_phone:', ''))
                  : [];
                const isAdding = addingForId === prop.id;

                return (
                  <div key={prop.id} className="p-2 border rounded text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate max-w-[40%]">{prop.address}</div>
                      <div className="flex flex-wrap gap-1 items-center justify-end">
                        {contacts.length > 0 ? contacts.map((c, i) => {
                          const isManual = manualPhones.includes(c);
                          return (
                            <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isManual ? 'bg-warning/15 text-warning-foreground border border-warning/30' : 'bg-primary/10 text-primary'}`}>
                              {selectedChannel === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />} {c}
                              {isManual && (
                                <button onClick={() => handleRemoveManualPhone(prop, c)} className="ml-0.5 hover:text-destructive" disabled={saving}>
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          );
                        }) : (
                          <span className="text-xs text-muted-foreground">No contact</span>
                        )}
                        {showManualInput && !isAdding && (
                          <button
                            onClick={() => { setAddingForId(prop.id); setInputValue(''); }}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Add manual phone"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isAdding && (
                      <div className="flex items-center gap-2 ml-4">
                        <Input
                          placeholder="(555) 123-4567"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddManualPhone(prop); if (e.key === 'Escape') setAddingForId(null); }}
                          className="h-7 text-xs w-40"
                          autoFocus
                          disabled={saving}
                        />
                        <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => handleAddManualPhone(prop)} disabled={saving || !inputValue.trim()}>
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingForId(null)} disabled={saving}>
                          Cancel
                        </Button>
                      </div>
                    )}
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
