/**
 * Hook for template variable replacement and preview rendering.
 * Extracted from CampaignManager for modularity.
 */

import { useMarketingStore } from '@/store/marketingStore';
import { generateDirectPropertyUrlBySlug, generateTrackedPropertyUrlBySlug } from '@/utils/urlUtils';
import { formatCurrency } from '@/lib/utils';
import { createPropertySlug, type CampaignProperty } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

export interface TemplateRendererOptions {
  selectedChannel: Channel;
  selectedTemplate: { id: string; name: string; body: string; subject?: string; channel: string; is_default?: boolean } | null | undefined;
}

export const useTemplateRenderer = ({ selectedChannel, selectedTemplate }: TemplateRendererOptions) => {
  const settings = useMarketingStore((state) => state.settings);

  const replaceVariables = (
    content: string,
    prop: CampaignProperty,
    extras: {
      propertyUrl: string;
      qrCodeUrl: string;
      googleMapsImage: string;
      trackingPixel?: string;
      unsubscribeUrl?: string;
    }
  ): string => {
    let result = content;
    result = result.replace(/\{name\}/g, prop.owner_name || 'Owner');
    result = result.replace(/\{owner_name\}/g, prop.owner_name || 'Owner');
    result = result.replace(/\{address\}/g, prop.address);
    result = result.replace(/\{city\}/g, prop.city);
    result = result.replace(/\{state\}/g, prop.state);
    result = result.replace(/\{zip_code\}/g, prop.zip_code);
    result = result.replace(/\{cash_offer\}/g, prop.cash_offer_amount ? formatCurrency(prop.cash_offer_amount) : '$XXX,XXX');
    result = result.replace(/\{estimated_value\}/g, (prop as any).estimated_value ? formatCurrency((prop as any).estimated_value) : '$XXX,XXX');
    result = result.replace(/\{property_image\}/g, (prop as any).property_image_url || extras.googleMapsImage);
    result = result.replace(/\{property_photo\}/g, (prop as any).property_image_url || extras.googleMapsImage);
    result = result.replace(/\{property_map\}/g, extras.googleMapsImage);
    result = result.replace(/\{company_name\}/g, settings.company.company_name);
    result = result.replace(/\{phone\}/g, settings.company.contact_phone);
    result = result.replace(/\{seller_name\}/g, settings.company.company_name);
    result = result.replace(/\{full_address\}/g, `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`);
    result = result.replace(/\{property_url\}/g, extras.propertyUrl);
    result = result.replace(/\{qr_code_url\}/g, extras.qrCodeUrl);
    result = result.replace(/\{source_channel\}/g, selectedChannel);
    if (extras.trackingPixel) result = result.replace(/\{tracking_pixel\}/g, extras.trackingPixel);
    if (extras.unsubscribeUrl) result = result.replace(/\{unsubscribe_url\}/g, extras.unsubscribeUrl);
    return result;
  };

  const buildExtras = (prop: CampaignProperty, trackingId?: string) => {
    const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    const propertySlug = prop.slug || createPropertySlug(prop.address);
    const propertyUrl = generateDirectPropertyUrlBySlug(propertySlug, selectedChannel);
    const qrPropertyUrl = generateTrackedPropertyUrlBySlug(propertySlug, `${selectedChannel}-qr`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPropertyUrl)}`;
    const googleMapsImage = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(fullAddress)}&zoom=15&size=600x300&markers=color:red%7C${encodeURIComponent(fullAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    const trackingPixel = trackingId
      ? `<img src="${window.location.origin}/track/open?tid=${trackingId}" width="1" height="1" style="display:none;" alt="" />`
      : undefined;
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?property=${prop.id}`;

    return { propertyUrl, qrCodeUrl, googleMapsImage, trackingPixel, unsubscribeUrl };
  };

  /** Render template preview for display (no tracking) */
  const renderTemplatePreview = (prop: CampaignProperty, type: 'body' | 'subject' = 'body'): string => {
    if (!selectedTemplate) return 'Selecione um template';

    const extras = buildExtras(prop);

    if (type === 'subject' && selectedTemplate.subject) {
      let subject = selectedTemplate.subject;
      subject = subject.replace(/\{address\}/g, prop.address);
      subject = subject.replace(/\{name\}/g, prop.owner_name || 'Owner');
      subject = subject.replace(/\{city\}/g, prop.city);
      subject = subject.replace(/\{state\}/g, prop.state);
      return subject;
    }

    return replaceVariables(selectedTemplate.body, prop, extras);
  };

  /** Generate final template content for sending (with tracking) */
  const generateTemplateContent = (
    template: { body: string; subject?: string },
    prop: CampaignProperty,
    trackingId?: string
  ): { content: string; subject: string } => {
    const extras = buildExtras(prop, trackingId);
    const content = replaceVariables(template.body, prop, extras);
    const subject = template.subject?.replace(/\{address\}/g, prop.address) || `Cash Offer for ${prop.address}`;
    return { content, subject };
  };

  return { renderTemplatePreview, generateTemplateContent };
};
