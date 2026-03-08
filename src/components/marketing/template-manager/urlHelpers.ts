/**
 * URL generation helpers for template preview and tracking
 */

const createPropertySlug = (address: string, city: string, zip: string): string => {
  const addressSlug = address.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  const citySlug = city.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
  return `${addressSlug}-${citySlug}-${zip}`;
};

export const generatePropertyUrl = (
  address = '25217 MATHEW ST',
  city = 'UNINCORPORATED',
  zip = '32709',
  sourceChannel = 'email'
) => {
  const propertySlug = createPropertySlug(address, city, zip);
  return `https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/track-link-click?slug=${propertySlug}&src=${sourceChannel.toLowerCase()}`;
};

export const generateQrCodeUrl = (
  address = '25217 MATHEW ST',
  city = 'UNINCORPORATED',
  zip = '32709',
  sourceChannel = 'email'
) => {
  const qrPropertyUrl = generatePropertyUrl(address, city, zip, `${sourceChannel}-qr`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPropertyUrl)}`;
};

export const generateTrackingPixel = (propertyId = 'sample', sourceChannel = 'email') => {
  return `<img src="https://offer.mylocalinvest.com/track/open/${propertyId}?src=${sourceChannel}&t=${Date.now()}" width="1" height="1" style="display:none;" alt="" />`;
};

export const generateUnsubscribeUrl = (email = 'example@email.com') => {
  return `https://offer.mylocalinvest.com/unsubscribe?email=${encodeURIComponent(email)}`;
};

export const replaceTemplateVariables = (text: string, channel: string) => {
  const fullAddress = '25217 MATHEW ST, UNINCORPORATED, FL 32709';
  const googleMapsPreview = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(fullAddress)}&zoom=15&size=600x300&markers=color:red%7C${encodeURIComponent(fullAddress)}&key=YOUR_GOOGLE_MAPS_API_KEY`;

  const sampleValues: Record<string, string> = {
    name: 'BURROWS MARGARET',
    address: '25217 MATHEW ST',
    city: 'UNINCORPORATED',
    state: 'FL',
    zip_code: '32709',
    cash_offer: '$70,000',
    company_name: 'MyLocalInvest',
    phone: '(786) 882-8251',
    seller_name: 'Alex Johnson',
    estimated_value: '$100,000',
    offer_percentage: '70',
    property_url: generatePropertyUrl('25217 MATHEW ST', 'UNINCORPORATED', '32709', channel),
    qr_code_url: generateQrCodeUrl('25217 MATHEW ST', 'UNINCORPORATED', '32709', channel),
    property_image: googleMapsPreview,
    property_photo: googleMapsPreview,
    property_map: googleMapsPreview,
    source_channel: channel.toUpperCase(),
    tracking_pixel: generateTrackingPixel('sample-property-id', channel),
    button_click_url: `https://your-domain.supabase.co/functions/v1/track-button-click?id=sample-tracking-id&src=${channel}`,
    unsubscribe_url: generateUnsubscribeUrl('example@email.com'),
  };

  return text.replace(/{([^}]+)}/g, (match, variable) => sampleValues[variable] || match);
};
