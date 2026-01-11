/**
 * Default Templates - Templates padrão pré-configurados para cada canal
 * Estes templates são carregados automaticamente quando nenhum template existe
 */

import type { SavedTemplate } from '@/types/marketing.types';

export const DEFAULT_TEMPLATES: SavedTemplate[] = [
  // ===== SMS TEMPLATES =====
  {
    id: 'sms-cash-offer-default',
    name: 'Cash Offer Standard',
    channel: 'sms',
    subject: '',
    body: 'Hi {name}! {cash_offer} cash offer for your home at {address}. Valid for 7 days. See details: {property_url} Call: {phone}',
    is_default: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'sms-follow-up',
    name: 'Follow-up SMS',
    channel: 'sms',
    subject: '',
    body: 'Hi {name}, our {cash_offer} offer for {address} is still available. We can close fast! Details: {property_url} Call: {phone}',
    is_default: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'sms-urgent',
    name: 'Urgent SMS',
    channel: 'sms',
    subject: '',
    body: '🚨 LAST CHANCE: {cash_offer} offer expires today! View now: {property_url} Call NOW: {phone}',
    is_default: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  // ===== EMAIL TEMPLATES =====
  {
    id: 'email-cash-offer-default',
    name: 'Professional Cash Offer',
    channel: 'email',
    subject: 'Cash Offer for Your Property at {address}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cash Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Cash Offer for Your Property</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear {name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">We are pleased to present you with a cash offer for your property at:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">{address}</p>
          <p style="margin: 5px 0 0; color: #666;">{city}, {state}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0;">Our Cash Offer</p>
          <p style="font-size: 36px; color: #28a745; font-weight: bold; margin: 10px 0;">{cash_offer}</p>
          <p style="font-size: 12px; color: #666; margin: 5px 0 0;">Estimated Property Value: {estimated_value}</p>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">This offer is valid for 7 days. Contact us to discuss!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:{phone}" style="background-color: #667eea; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call Us: {phone}</a>
        </div>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">Scan to view your personalized offer page:</p>
          <img src="{qr_code_url}" alt="QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block; border: 4px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <p style="font-size: 12px; color: #999; margin: 15px 0 0 0;">Or click here: <a href="{property_url}" style="color: #667eea; text-decoration: none; font-weight: bold;">View Full Offer Details</a></p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px; font-weight: bold;">{company_name}</p>
        <p style="margin: 5px 0; color: #999; font-size: 12px;">Trusted Miami Investors Since 2015</p>
        <p style="margin: 10px 0 5px; color: #999; font-size: 11px;">
          <a href="{unsubscribe_url}" style="color: #999; text-decoration: underline;">Unsubscribe</a> |
          <a href="mailto:info@mylocalinvest.com" style="color: #999; text-decoration: underline;">Contact Us</a>
        </p>
        <p style="margin: 5px 0 0; color: #ccc; font-size: 10px;">Zero commissions • Zero closing costs • 100% confidential</p>
      </td>
    </tr>
  </table>
  {tracking_pixel}
</body>
</html>`,
    is_default: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'email-follow-up',
    name: 'Follow-up Email',
    channel: 'email',
    subject: 'Following up on our cash offer for {address}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Follow-up on Your Property Offer</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
    <h2 style="color: #333; text-align: center;">Following Up on Your Property</h2>
    <p>Hello {name},</p>
    <p>I wanted to follow up on the cash offer we sent you for your property at <strong>{address}, {city}, {state}</strong>.</p>
    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px; color: #2e7d32; font-weight: bold;">Our Offer: {cash_offer}</p>
      <p style="margin: 5px 0 0; color: #666;">Estimated Value: {estimated_value}</p>
      <p style="margin: 5px 0 0; color: #666;">Still valid for the next few days</p>
    </div>
    <p>We're ready to move forward quickly and can close in as little as 7 days. Are you ready to sell?</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="tel:{phone}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Call Now: {phone}</a>
    </div>
    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-radius: 8px;">
      <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">View your complete offer details:</p>
      <img src="{qr_code_url}" alt="QR Code" style="width: 180px; height: 180px; margin: 0 auto; display: block; border: 3px solid #4CAF50;" />
      <p style="font-size: 12px; color: #999; margin: 15px 0 0 0;"><a href="{property_url}" style="color: #4CAF50; text-decoration: none; font-weight: bold;">Click here to view online</a></p>
    </div>
    <p>Best regards,<br><strong>{seller_name}</strong><br>{company_name}</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 5px 0; color: #999; font-size: 11px;">
        <a href="{unsubscribe_url}" style="color: #999; text-decoration: underline;">Unsubscribe</a> |
        <a href="mailto:info@mylocalinvest.com" style="color: #999; text-decoration: underline;">Contact Us</a>
      </p>
    </div>
  </div>
  {tracking_pixel}
</body>
</html>`,
    is_default: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  // ===== VOICEMAIL TEMPLATES =====
  {
    id: 'call-voicemail-default',
    name: 'Default Voicemail',
    channel: 'call',
    subject: '',
    body: 'Hi {name}, this is {seller_name} from {company_name}. We have a cash offer of {cash_offer} for your property at {address}. We can close in as little as 7 days with no repairs needed. View your complete offer details at {property_url} or call us back at {phone}. Thank you!',
    is_default: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'call-voicemail-urgent',
    name: 'Urgent Voicemail',
    channel: 'call',
    subject: '',
    body: 'Hi {name}, {seller_name} from {company_name}. URGENT: Our cash offer of {cash_offer} for {address} expires in 24 hours. This is a unique opportunity - view full details at {property_url} or call immediately at {phone}. Don\'t miss out!',
    is_default: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 'call-voicemail-follow-up',
    name: 'Follow-up Voicemail',
    channel: 'call',
    subject: '',
    body: 'Hi {name}, {seller_name} from {company_name} following up. Our {cash_offer} cash offer for your property at {address} is still available. No fees, no hassle. See all details at {property_url} or call when you can: {phone}.',
    is_default: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
];

/**
 * Função para inicializar templates padrão se nenhum existir
 */
export const initializeDefaultTemplates = (existingTemplates: SavedTemplate[]): SavedTemplate[] => {
  if (existingTemplates.length > 0) {
    return existingTemplates;
  }

  return DEFAULT_TEMPLATES;
};

/**
 * Categorias de templates para melhor organização
 */
export const TEMPLATE_CATEGORIES = {
  sms: {
    label: 'SMS Templates',
    description: 'Mensagens de texto rápidas e diretas',
    icon: '💬',
    templates: DEFAULT_TEMPLATES.filter(t => t.channel === 'sms')
  },
  email: {
    label: 'Email Templates',
    description: 'Emails profissionais com HTML',
    icon: '📧',
    templates: DEFAULT_TEMPLATES.filter(t => t.channel === 'email')
  },
  call: {
    label: 'Voicemail Templates',
    description: 'Mensagens para correio de voz',
    icon: '📞',
    templates: DEFAULT_TEMPLATES.filter(t => t.channel === 'call')
  }
};
