// Example API route for handling marketing webhooks
// This would be implemented in your backend API (Next.js API routes, Express, etc.)

import { NextApiRequest, NextApiResponse } from 'next';
import { processMarketingWebhook } from '@/components/WebhookHandler';

// Example webhook handler for Twilio
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Body, From, To, MessageSid } = req.body;

    // Process Twilio webhook
    const result = await processMarketingWebhook({
      event_type: Body ? 'sms_reply' : 'call_received',
      phone_number: From,
      message: Body,
      timestamp: new Date().toISOString(),
      metadata: {
        twilio_message_sid: MessageSid,
        to_number: To,
        provider: 'twilio'
      }
    });

    if (result.success) {
      res.status(200).json({ status: 'ok' });
    } else {
      console.error('Webhook processing failed:', result.error);
      res.status(500).json({ error: 'Processing failed' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Example webhook handler for generic marketing API
export async function handleGenericWebhook(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      event_type,
      property_id,
      campaign_id,
      phone_number,
      message,
      timestamp,
      ...metadata
    } = req.body;

    const result = await processMarketingWebhook({
      event_type,
      property_id,
      campaign_id,
      phone_number,
      message,
      timestamp: timestamp || new Date().toISOString(),
      metadata
    });

    if (result.success) {
      res.status(200).json({ status: 'processed', campaign_log_id: result.campaignLogId });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Example webhook handler for SendGrid
export async function handleSendGridWebhook(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const { event: eventType, email, timestamp, sg_message_id, ...metadata } = event;

      // Map SendGrid events to our event types
      let mappedEventType: string;
      switch (eventType) {
        case 'open':
          mappedEventType = 'email_opened';
          break;
        case 'click':
          mappedEventType = 'email_clicked';
          break;
        default:
          continue; // Skip unknown events
      }

      await processMarketingWebhook({
        event_type: mappedEventType,
        phone_number: null, // SendGrid uses email, we'll need to match by other means
        timestamp: new Date(timestamp * 1000).toISOString(), // SendGrid uses Unix timestamp
        metadata: {
          sendgrid_message_id: sg_message_id,
          email,
          provider: 'sendgrid',
          ...metadata
        }
      });
    }

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/*
USAGE EXAMPLES:

1. Twilio Webhook URL: https://your-app.com/api/webhooks/twilio
2. Generic Webhook URL: https://your-app.com/api/webhooks/marketing
3. SendGrid Webhook URL: https://your-app.com/api/webhooks/sendgrid

Configure these URLs in your respective service dashboards.

Example webhook payload from your marketing API:
{
  "event_type": "call_received",
  "property_id": "uuid-of-property",
  "phone_number": "+1234567890",
  "timestamp": "2026-01-08T10:30:00Z",
  "message": "Customer called back",
  "metadata": {
    "call_duration": 120,
    "agent_name": "John Doe"
  }
}
*/