/**
 * Clicks Analytics — hook for fetching and processing click metrics
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClickAnalytic {
  id: string;
  property_id: string | null;
  event_type: string;
  source: string;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
  device_type?: string | null;
  ip_address?: string | null;
  city?: string | null;
  country?: string | null;
  property_address?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  all_phones?: string[];
  all_emails?: string[];
}

export interface ClickMetrics {
  total: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  byDate: Record<string, number>;
  recentClicks: ClickAnalytic[];
}

const EMPTY_METRICS: ClickMetrics = {
  total: 0, bySource: {}, byCampaign: {}, byDate: {}, recentClicks: [],
};

export function useClicksAnalytics(dateRange: '7' | '30' | '90' | 'all', sourceFilter: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ClickMetrics>(EMPTY_METRICS);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let dateFilter: Date | null = null;
      if (dateRange !== 'all') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(dateRange));
      }

      let query = supabase
        .from('property_analytics')
        .select(`*, properties (address, city, state, zip_code, owner_name, owner_phone, phone1, phone2, phone3, phone4, phone5, phone6, phone7, email1, email2, person2_phone1, person2_phone2, person2_email1, person2_email2, person3_phone1, person3_email1, matched_first_name, matched_last_name, tags)`)
        .order('created_at', { ascending: false });

      if (dateFilter) query = query.gte('created_at', dateFilter.toISOString());
      if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);

      const { data, error } = await query.limit(1000);
      if (error) throw error;

      const clicks = data || [];
      const bySource: Record<string, number> = {};
      const byCampaign: Record<string, number> = {};
      const byDate: Record<string, number> = {};

      clicks.forEach((click) => {
        const source = (click as any).source || 'direct';
        bySource[source] = (bySource[source] || 0) + 1;
        const campaign = click.event_type || 'page_view';
        byCampaign[campaign] = (byCampaign[campaign] || 0) + 1;
        const date = new Date(click.created_at || '').toISOString().split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      });

      const mappedClicks: ClickAnalytic[] = clicks.map((c) => {
        const prop = (c as any).properties;
        const contactName = prop?.owner_name || (prop?.matched_first_name && prop?.matched_last_name ? `${prop.matched_first_name} ${prop.matched_last_name}` : null);

        // Collect all unique phones
        const phoneCols = ['owner_phone', 'phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'phone6', 'phone7', 'person2_phone1', 'person2_phone2', 'person3_phone1'];
        const allPhones: string[] = [];
        if (prop) {
          for (const col of phoneCols) {
            const val = prop[col];
            if (typeof val === 'string' && val.trim() && !allPhones.includes(val.trim())) allPhones.push(val.trim());
          }
          // Tagged phones
          if (Array.isArray(prop.tags)) {
            for (const tag of prop.tags) {
              if (typeof tag === 'string' && (tag.startsWith('pref_phone:') || tag.startsWith('manual_phone:'))) {
                const phone = tag.replace(/^(pref_phone:|manual_phone:)/, '').trim();
                if (phone && !allPhones.includes(phone)) allPhones.push(phone);
              }
            }
          }
        }

        // Collect all unique emails
        const emailCols = ['email1', 'email2', 'person2_email1', 'person2_email2', 'person3_email1'];
        const allEmails: string[] = [];
        if (prop) {
          for (const col of emailCols) {
            const val = prop[col];
            if (typeof val === 'string' && val.trim() && !allEmails.includes(val.trim().toLowerCase())) allEmails.push(val.trim().toLowerCase());
          }
          if (Array.isArray(prop.tags)) {
            for (const tag of prop.tags) {
              if (typeof tag === 'string' && (tag.startsWith('pref_email:') || tag.startsWith('manual_email:'))) {
                const email = tag.replace(/^(pref_email:|manual_email:)/, '').trim().toLowerCase();
                if (email && !allEmails.includes(email)) allEmails.push(email);
              }
            }
          }
        }

        return {
          id: c.id, property_id: c.property_id, event_type: c.event_type,
          source: (c as any).source || 'direct', referrer: c.referrer, user_agent: c.user_agent,
          created_at: c.created_at || '', device_type: c.device_type, ip_address: c.ip_address,
          city: c.city, country: c.country,
          property_address: prop ? `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}` : null,
          contact_name: contactName,
          contact_phone: allPhones[0] || null,
          contact_email: allEmails[0] || null,
          all_phones: allPhones,
          all_emails: allEmails,
        };
      });

      setMetrics({ total: clicks.length, bySource, byCampaign, byDate, recentClicks: mappedClicks.slice(0, 20) });
    } catch (error) {
      console.error('❌ [ClicksAnalytics] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { loading, metrics, refresh: fetchData };
}

// ─── UI Helpers ──────────────────────────────────────────────────

import { Mail, MessageSquare, Phone, MousePointerClick } from 'lucide-react';

export const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'sms': return MessageSquare;
    case 'email': case 'email-qr': return Mail;
    case 'call': return Phone;
    default: return MousePointerClick;
  }
};

export const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case 'sms': return 'text-primary';
    case 'email': case 'email-qr': return 'text-primary';
    case 'call': return 'text-primary';
    case 'carta': case 'letter': return 'text-primary';
    default: return 'text-muted-foreground';
  }
};

export const getTimeAgo = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return { text: 'Just now', color: 'bg-green-500' };
  if (diffMins < 60) return { text: `${diffMins} min ago`, color: diffMins < 30 ? 'bg-green-500' : 'bg-yellow-500' };
  if (diffHours < 24) return { text: `${diffHours}h ago`, color: diffHours < 2 ? 'bg-yellow-500' : 'bg-orange-500' };
  if (diffDays < 7) return { text: `${diffDays}d ago`, color: 'bg-muted' };
  return { text: `${diffDays}d ago`, color: 'bg-muted' };
};
