/**
 * Pre-built HTML email templates
 */

export const HTML_TEMPLATES = {
  modern: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personalized Property Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 Personalized Offer for Your Property</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear <strong>{name}</strong>,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">We are pleased to present you with a <strong>personalized offer</strong> for your property at:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">{address}</p>
          <p style="margin: 5px 0 0; color: #666;">{city}, {state}</p>
        </div>
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #e65100; font-weight: bold; margin: 0 0 10px;">✨ Why Sell to Us?</p>
          <ul style="margin: 0; padding-left: 20px; color: #333;">
            <li style="margin: 8px 0;">🚫 <strong>No Repairs</strong> - We buy as-is</li>
            <li style="margin: 8px 0;">💵 <strong>No Fees</strong> - Zero commissions or closing costs</li>
            <li style="margin: 8px 0;">⚡ <strong>Close Fast</strong> - In as little as 7 days</li>
            <li style="margin: 8px 0;">🔒 <strong>100% Confidential</strong> - Private transaction</li>
          </ul>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">This offer is <strong>valid for 7 days</strong>. No obligation to accept.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center" style="padding: 10px;">
              <a href="{button_click_url}" style="background-color: #667eea; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">👉 View Offer Details</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 10px;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px;">Prefer to talk? Give us a call:</p>
              <a href="tel:{phone}" style="background-color: #4caf50; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">📞 {phone}</a>
            </td>
          </tr>
        </table>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 12px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 15px 0; font-weight: 600;">📱 Scan with your phone:</p>
          <img src="{qr_code_url}" alt="QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block; border: 4px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px;" />
          <p style="font-size: 13px; color: #666; margin: 15px 0 0;">Can't scan? <a href="{property_url}" style="color: #667eea; text-decoration: none; font-weight: bold;">Click here instead</a></p>
        </div>
        {tracking_pixel}
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">{company_name}</p>
        <p style="margin: 5px 0 0; color: #999; font-size: 12px;">✓ Zero commissions • ✓ Zero closing costs • ✓ 100% confidential</p>
      </td>
    </tr>
  </table>
</body>
</html>`,

  minimal: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Property Offer</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">Property Offer</h2>
    <p>Hello {name},</p>
    <p>We have a <strong>personalized offer</strong> for your property at <strong>{address}, {city}, {state}</strong>.</p>
    <p>Please contact us at <a href="tel:{phone}">{phone}</a> to discuss this offer.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td align="center" style="padding: 10px;">
          <a href="{property_url}" style="background-color: #333; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Offer Details</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px;">
          <a href="tel:{phone}" style="background-color: #28a745; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call: {phone}</a>
        </td>
      </tr>
    </table>
    <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
      <p style="font-size: 13px; margin: 0 0 10px 0;">View your personalized offer page:</p>
      <img src="{qr_code_url}" alt="QR Code" style="width: 150px; height: 150px; margin: 0 auto; display: block;" />
      <p style="font-size: 13px; margin: 10px 0 5px 0;"><a href="{property_url}" style="color: #333; font-weight: bold; text-decoration: underline;">View Full Offer Details</a></p>
    </div>
    {tracking_pixel}
    <p>Best regards,<br><strong>{company_name}</strong></p>
  </div>
</body>
</html>`,

  professional: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 650px; margin: 20px auto; background-color: #ffffff; border: 1px solid #ddd;">
    <tr>
      <td style="padding: 30px; border-bottom: 3px solid #1a365d;">
        <h1 style="color: #1a365d; margin: 0; font-size: 24px; font-weight: normal;">{company_name}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Dear {name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Thank you for considering our services. We are writing to present a formal offer for your property located at:</p>
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; margin: 25px 0;">
          <strong>Property Address:</strong><br>
          {address}<br>
          {city}, {state}
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">We believe our offer represents fair market value and we are prepared to close quickly at your convenience.</p>
        <p style="font-size: 16px; color: #333; line-height: 1.8;">Please do not hesitate to contact us at <strong>{phone}</strong> to discuss this opportunity.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center" style="padding: 10px;">
              <a href="{property_url}" style="background-color: #1a365d; color: #ffffff; padding: 15px 40px; text-decoration: none; font-weight: bold; display: inline-block;">View Full Offer Details</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 10px;">
              <a href="tel:{phone}" style="background-color: #28a745; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; display: inline-block;">Call: {phone}</a>
            </td>
          </tr>
        </table>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;"><strong>View Full Details Online:</strong></p>
          <img src="{qr_code_url}" alt="QR Code" style="width: 180px; height: 180px; margin: 0 auto; display: block; border: 3px solid #1a365d;" />
          <p style="font-size: 14px; color: #666; margin: 15px 0 10px 0;"><a href="{property_url}" style="color: #1a365d; font-weight: bold; text-decoration: underline;">View Full Offer Details</a></p>
        </div>
        {tracking_pixel}
        <p style="font-size: 16px; color: #333; line-height: 1.8; margin-top: 30px;">Respectfully yours,<br><br><strong>{seller_name}</strong><br>{company_name}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; background-color: #1a365d; text-align: center;">
        <p style="margin: 0; color: #fff; font-size: 12px;">© {company_name} | All Rights Reserved</p>
        <p style="margin: 5px 0 0; color: #ccc; font-size: 11px;">
          <a href="{unsubscribe_url}" style="color: #ccc; text-decoration: underline;">Unsubscribe</a> from future communications
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
} as const;

export type HtmlTemplateKey = keyof typeof HTML_TEMPLATES;
