import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WebhookPayload {
  campaign_id?: string;
  property_id?: string;
  event_type: 'call_received' | 'link_clicked' | 'sms_reply' | 'email_opened' | 'email_clicked';
  phone_number?: string;
  message?: string;
  timestamp: string;
  metadata?: any;
}

export const WebhookHandler = () => {
  useEffect(() => {
    // Listen for webhook events from marketing APIs
    const handleWebhook = async (payload: WebhookPayload) => {
      try {
        console.log('Received webhook:', payload);

        // Find the campaign log entry
        let query = supabase.from('campaign_logs').select('*');

        if (payload.campaign_id) {
          query = query.eq('id', payload.campaign_id);
        } else if (payload.property_id) {
          query = query.eq('property_id', payload.property_id);
        } else if (payload.phone_number) {
          query = query.eq('recipient_phone', payload.phone_number);
        }

        const { data: campaignLog, error: findError } = await query
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findError || !campaignLog) {
          console.error('Campaign log not found for webhook:', payload);
          return;
        }

        // Update campaign log with webhook data
        const { error: updateError } = await supabase
          .from('campaign_logs')
          .update({
            webhook_events: supabase.sql`array_append(webhook_events, ${JSON.stringify({
              event_type: payload.event_type,
              timestamp: payload.timestamp,
              message: payload.message,
              metadata: payload.metadata
            })}`,
            // Update specific fields based on event type
            ...(payload.event_type === 'call_received' && {
              first_response_at: payload.timestamp,
              call_received: true
            }),
            ...(payload.event_type === 'link_clicked' && {
              link_clicked: true,
              link_clicked_at: payload.timestamp
            }),
            ...(payload.event_type === 'sms_reply' && {
              sms_reply_received: true,
              sms_reply_at: payload.timestamp,
              sms_reply_content: payload.message
            }),
            ...(payload.event_type === 'email_opened' && {
              email_opened: true,
              email_opened_at: payload.timestamp
            }),
            ...(payload.event_type === 'email_clicked' && {
              email_clicked: true,
              email_clicked_at: payload.timestamp
            })
          })
          .eq('id', campaignLog.id);

        if (updateError) {
          console.error('Error updating campaign log:', updateError);
        } else {
          console.log('Campaign log updated successfully');

          // Update property status if needed
          if (payload.event_type === 'call_received' || payload.event_type === 'link_clicked') {
            await supabase
              .from('properties')
              .update({
                lead_status: payload.event_type === 'call_received' ? 'contacted' : 'interested',
                last_contact_date: payload.timestamp
              })
              .eq('id', campaignLog.property_id);
          }
        }

      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    };

    // This component doesn't render anything, it's just for handling webhooks
    // In a real implementation, you'd have an API route that calls handleWebhook
    // For now, this is just the logic structure

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
};

// Export the handler function for use in API routes
export const processMarketingWebhook = async (payload: WebhookPayload) => {
  try {
    console.log('Processing marketing webhook:', payload);

    // Find the campaign log entry
    let query = supabase.from('campaign_logs').select('*');

    if (payload.campaign_id) {
      query = query.eq('id', payload.campaign_id);
    } else if (payload.property_id) {
      query = query.eq('property_id', payload.property_id);
    } else if (payload.phone_number) {
      query = query.eq('recipient_phone', payload.phone_number);
    }

    const { data: campaignLog, error: findError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError || !campaignLog) {
      console.error('Campaign log not found for webhook:', payload);
      return { success: false, error: 'Campaign log not found' };
    }

    // Update campaign log with webhook data
    const webhookEvent = {
      event_type: payload.event_type,
      timestamp: payload.timestamp,
      message: payload.message,
      metadata: payload.metadata
    };

    const { error: updateError } = await supabase
      .from('campaign_logs')
      .update({
        webhook_events: supabase.sql`array_append(COALESCE(webhook_events, ARRAY[]::jsonb[]), ${JSON.stringify(webhookEvent)})`,
        // Update specific fields based on event type
        ...(payload.event_type === 'call_received' && {
          first_response_at: payload.timestamp,
          call_received: true
        }),
        ...(payload.event_type === 'link_clicked' && {
          link_clicked: true,
          link_clicked_at: payload.timestamp
        }),
        ...(payload.event_type === 'sms_reply' && {
          sms_reply_received: true,
          sms_reply_at: payload.timestamp,
          sms_reply_content: payload.message
        }),
        ...(payload.event_type === 'email_opened' && {
          email_opened: true,
          email_opened_at: payload.timestamp
        }),
        ...(payload.event_type === 'email_clicked' && {
          email_clicked: true,
          email_clicked_at: payload.timestamp
        })
      })
      .eq('id', campaignLog.id);

    if (updateError) {
      console.error('Error updating campaign log:', updateError);
      return { success: false, error: updateError.message };
    }

    // Update property status if needed
    if (payload.event_type === 'call_received' || payload.event_type === 'link_clicked') {
      const newStatus = payload.event_type === 'call_received' ? 'contacted' : 'interested';

      await supabase
        .from('properties')
        .update({
          lead_status: newStatus,
          last_contact_date: payload.timestamp
        })
        .eq('id', campaignLog.property_id);
    }

    return { success: true, campaignLogId: campaignLog.id };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};