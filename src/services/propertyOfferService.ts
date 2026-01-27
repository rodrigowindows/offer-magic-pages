/**
 * Property Offer Service
 * Comprehensive service for managing property cash offers
 */

import { supabase } from '@/integrations/supabase/client';
import { generatePropertyOfferEmail } from '@/utils/emailTemplates';
import { downloadPropertyOfferPDF, generatePropertyOfferPDF } from '@/utils/pdfGenerator';

export interface PropertyOfferData {
  id: string;
  propertyId: string;
  offerAmount: number;
  estimatedValue?: number;
  closingDays: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  property: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
}

export interface OfferCampaignData {
  propertyId: string;
  offerAmount: number;
  estimatedValue?: number;
  closingDays?: number;
  recipientEmail: string;
  recipientName?: string;
  recipientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
  followUpDays?: number;
}

export class PropertyOfferService {
  /**
   * Generate QR code URL for property offer
   */
  static generateQRCodeUrl(offerUrl: string): string {
    // Using QR Server API to generate QR codes
    // In production, you might want to use a different service or generate locally
    const encodedUrl = encodeURIComponent(offerUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`;
  }

  /**
   * Create property slug for URL
   */
  static createPropertySlug(address: string, city: string): string {
    return `${address.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')}-${city.toLowerCase()}`;
  }

  /**
   * Create a new property offer
   */
  static async createOffer(offerData: Omit<PropertyOfferData, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; data?: PropertyOfferData; error?: string }> {
    const offer: PropertyOfferData = {
      ...offerData,
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft',
      createdAt: new Date(),
    };

    // In a real implementation, you would save this to the database
    console.log('Created offer:', offer);
    return { success: true, data: offer };
  }

  /**
   * Send offer via email campaign
   */
  static async sendOfferCampaign(campaignData: OfferCampaignData): Promise<{ success: boolean; offerId?: string; error?: string }> {
    try {
      const {
        propertyId,
        offerAmount,
        estimatedValue,
        closingDays = 14,
        recipientEmail,
        recipientName,
        recipientPhone,
        agentName = 'Local Cash Buyer',
        agentEmail = 'offers@localcashbuyer.com',
        agentPhone = '(555) 123-4567',
        sendEmail = true,
        sendSMS = false,
        followUpDays = 3
      } = campaignData;

      // Get property details from database
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError || !property) {
        return { success: false, error: 'Property not found' };
      }

      // Create offer record
      const offerData: Omit<PropertyOfferData, 'id' | 'createdAt' | 'status'> = {
        propertyId,
        offerAmount,
        estimatedValue,
        closingDays,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        recipientName,
        recipientEmail,
        recipientPhone,
        agentName,
        agentEmail,
        agentPhone,
        property: {
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zipCode: property.zip_code,
          propertyType: property.property_type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.square_feet
        }
      };

      const offerResult = await this.createOffer(offerData);

      if (!offerResult.success || !offerResult.data) {
        throw new Error(offerResult.error || 'Failed to create offer');
      }

      const offer = offerResult.data;

      // Send email if requested
      if (sendEmail) {
        // Create property URL and QR code
        const propertySlug = this.createPropertySlug(property.address || '', property.city || '');
        const propertyUrl = `${window.location.origin}/property/${propertySlug}?src=email`;
        const qrCodeUrl = this.generateQRCodeUrl(propertyUrl);

        const emailHtml = generatePropertyOfferEmail({
          property: {
            ...offer.property,
            offerAmount: offerAmount,
            closingDays: closingDays
          },
          recipientName: offer.recipientName,
          trackingUrl: `${window.location.origin}/api/track-open?offerId=${offer.id}`,
          acceptUrl: `${window.location.origin}/offer/${offer.id}/accept`,
          questionsUrl: `${window.location.origin}/offer/${offer.id}/questions`,
          pdfUrl: `${window.location.origin}/api/download-offer-pdf?offerId=${offer.id}`,
          propertyUrl: propertyUrl,
          qrCodeUrl: qrCodeUrl
        });

        // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
        console.log('Sending email to:', recipientEmail);
        console.log('Property URL:', propertyUrl);
        console.log('Email content length:', emailHtml.length);

        // For now, we'll simulate sending
        await this.logCampaignActivity(offer.id, 'email_sent', {
          recipient: recipientEmail,
          subject: `Cash Offer: $${offerAmount.toLocaleString()} for ${property.address}`,
          propertyUrl: propertyUrl
        });
      }

      // Send SMS if requested
      if (sendSMS && recipientPhone) {
        const smsMessage = `Cash offer: $${offerAmount.toLocaleString()} for ${property.address}. Reply YES to accept or call ${agentPhone} with questions.`;

        console.log('Sending SMS to:', recipientPhone);
        console.log('SMS content:', smsMessage);

        await this.logCampaignActivity(offer.id, 'sms_sent', {
          recipient: recipientPhone,
          message: smsMessage
        });
      }

      // Schedule follow-up
      if (followUpDays > 0) {
        await this.scheduleFollowUp(offer.id, followUpDays);
      }

      // Update offer status
      await this.updateOfferStatus(offer.id, 'sent');

      return { success: true, offerId: offer.id };

    } catch (error) {
      console.error('Error sending offer campaign:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate and download PDF offer
   */
  static async downloadOfferPDF(offerId: string): Promise<void> {
    try {
      // In a real implementation, fetch offer data from database
      // For now, we'll use mock data
      const mockOffer: PropertyOfferData = {
        id: offerId,
        propertyId: 'mock-property',
        offerAmount: 70000,
        closingDays: 14,
        status: 'sent',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        property: {
          address: '144 WASHINGTON AVE',
          city: 'EATONVILLE',
          state: 'FL',
          zipCode: '32751'
        }
      };

      const propertyDataForPdf = {
        ...mockOffer.property,
        offerAmount: mockOffer.offerAmount,
        closingDays: mockOffer.closingDays
      };

      await downloadPropertyOfferPDF({
        property: propertyDataForPdf,
        recipientName: mockOffer.recipientName,
        agentName: mockOffer.agentName,
        agentEmail: mockOffer.agentEmail,
        agentPhone: mockOffer.agentPhone,
        offerDate: mockOffer.createdAt,
        expirationDate: mockOffer.expiresAt
      });

      // Log the download
      await this.logCampaignActivity(offerId, 'pdf_downloaded', {
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Accept an offer
   */
  static async acceptOffer(offerId: string, acceptedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateOfferStatus(offerId, 'accepted');

      await this.logCampaignActivity(offerId, 'offer_accepted', {
        acceptedBy,
        timestamp: new Date().toISOString()
      });

      // Here you would trigger next steps:
      // - Schedule inspection
      // - Send acceptance confirmation
      // - Create closing timeline
      // - Notify agent/team

      return { success: true };

    } catch (error) {
      console.error('Error accepting offer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Handle offer questions/contact
   */
  static async handleOfferQuestions(offerId: string, contactMethod: 'phone' | 'email' | 'chat', message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.logCampaignActivity(offerId, 'contact_initiated', {
        method: contactMethod,
        message,
        timestamp: new Date().toISOString()
      });

      // Here you would:
      // - Route to appropriate agent
      // - Create support ticket
      // - Send automated response
      // - Schedule callback

      return { success: true };

    } catch (error) {
      console.error('Error handling offer questions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update offer status
   */
  private static async updateOfferStatus(offerId: string, status: PropertyOfferData['status']): Promise<void> {
    // In a real implementation, update database
    console.log(`Updated offer ${offerId} status to ${status}`);
  }

  /**
   * Log campaign activity
   */
  private static async logCampaignActivity(offerId: string, activity: string, data: any): Promise<void> {
    try {
      // Log to campaign_logs table with valid columns
      const { error } = await supabase
        .from('campaign_logs')
        .insert({
          tracking_id: offerId,
          campaign_type: activity,
          metadata: data,
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging campaign activity:', error);
      }
    } catch (error) {
      console.error('Error logging campaign activity:', error);
    }
  }

  /**
   * Schedule follow-up
   */
  private static async scheduleFollowUp(offerId: string, days: number): Promise<void> {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + days);

    try {
      // Use follow_up_reminders table instead of scheduled_campaigns
      // Since we don't have property_id here, just log the follow-up for now
      console.log(`Scheduled follow-up for offer ${offerId} in ${days} days (${followUpDate.toISOString()})`);
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    }
  }

  /**
   * Get offer analytics
   */
  static async getOfferAnalytics(offerId?: string): Promise<{
    totalOffers: number;
    sentOffers: number;
    acceptedOffers: number;
    conversionRate: number;
    averageResponseTime: number;
  }> {
    // In a real implementation, query database for analytics
    return {
      totalOffers: 150,
      sentOffers: 120,
      acceptedOffers: 15,
      conversionRate: 12.5,
      averageResponseTime: 2.3 // days
    };
  }
}