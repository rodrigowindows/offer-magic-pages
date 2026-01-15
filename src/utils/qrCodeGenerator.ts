/**
 * QR Code Generator Utility
 * Provides multiple fallback options for QR code generation
 */

/**
 * Generate QR code URL using multiple providers with fallback
 *
 * Providers:
 * 1. QR Server API (Primary) - Free, no API key needed
 * 2. Chart.googleapis.com (Fallback 1) - Google Charts API
 * 3. QRCode.show (Fallback 2) - Simple QR service
 */
export const generateQRCodeUrl = (
  url: string,
  options: {
    size?: number;
    provider?: 'qrserver' | 'google' | 'qrcode-show';
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  } = {}
): string => {
  const {
    size = 200,
    provider = 'qrserver',
    errorCorrection = 'M'
  } = options;

  const encodedUrl = encodeURIComponent(url);

  switch (provider) {
    case 'google':
      // Google Charts API (deprecated but still works)
      return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodedUrl}&choe=UTF-8`;

    case 'qrcode-show':
      // QRCode.show - Simple alternative
      return `https://qrcode.show/${encodedUrl}`;

    case 'qrserver':
    default:
      // QR Server API - Most reliable
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=${errorCorrection}&margin=10&data=${encodedUrl}`;
  }
};

/**
 * Get QR code with automatic fallback
 * Returns an object with primary URL and fallback URLs
 */
export const getQRCodeWithFallbacks = (url: string, size: number = 200) => {
  return {
    primary: generateQRCodeUrl(url, { size, provider: 'qrserver' }),
    fallback1: generateQRCodeUrl(url, { size, provider: 'google' }),
    fallback2: generateQRCodeUrl(url, { size, provider: 'qrcode-show' }),
  };
};

/**
 * Generate QR code HTML with automatic fallback handling
 * Use this in email templates to ensure QR code always displays
 */
export const generateQRCodeHTML = (url: string, size: number = 200): string => {
  const qrCodes = getQRCodeWithFallbacks(url, size);

  return `
    <img
      src="${qrCodes.primary}"
      alt="QR Code"
      style="max-width: ${size}px; height: ${size}px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px; background: white;"
      onerror="this.onerror=null; this.src='${qrCodes.fallback1}';"
    />
  `.trim();
};

/**
 * Test QR code URL validity
 * Useful for debugging QR code issues
 */
export const testQRCodeUrl = async (url: string): Promise<boolean> => {
  try {
    const qrUrl = generateQRCodeUrl(url);
    const response = await fetch(qrUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('QR Code URL test failed:', error);
    return false;
  }
};
