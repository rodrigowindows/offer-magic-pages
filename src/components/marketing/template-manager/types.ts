/**
 * Types and constants for the Template Manager
 */
import type { Channel, SavedTemplate } from '@/types/marketing.types';

export interface TemplateFormData {
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  is_default: boolean;
  is_html: boolean;
}

export const INITIAL_FORM_DATA: TemplateFormData = {
  name: '',
  channel: 'email',
  subject: '',
  body: '',
  is_default: false,
  is_html: false,
};

export const TEMPLATE_VARIABLES = [
  { key: '{name}', description: 'Recipient name' },
  { key: '{address}', description: 'Property address' },
  { key: '{city}', description: 'City' },
  { key: '{state}', description: 'State' },
  { key: '{cash_offer}', description: 'Cash offer amount' },
  { key: '{estimated_value}', description: 'Estimated property value' },
  { key: '{company_name}', description: 'Company name' },
  { key: '{phone}', description: 'Contact phone' },
  { key: '{seller_name}', description: 'Seller/Agent name' },
  { key: '{property_url}', description: 'Property landing page URL' },
  { key: '{qr_code_url}', description: 'QR code image URL for property page' },
  { key: '{property_image}', description: 'Property photo (or Google Maps if no photo)' },
  { key: '{property_photo}', description: 'Property photo (same as property_image)' },
  { key: '{property_map}', description: 'Google Maps static image of property location' },
  { key: '{source_channel}', description: 'Source channel (SMS, Email, Call)' },
  { key: '{tracking_pixel}', description: 'Tracking pixel for email opens' },
  { key: '{button_click_url}', description: 'Trackable URL for button clicks' },
  { key: '{unsubscribe_url}', description: 'Unsubscribe URL' },
];
