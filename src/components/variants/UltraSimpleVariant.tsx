import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { defaultOffer, formatCurrency } from "@/lib/utils";
import { Check, Phone, MapPin, Download, Loader2, CalendarClock } from "lucide-react";
import { trackABEvent } from "@/utils/abTesting";
import { trackGAEvent } from "@/utils/gtag";
import { formatOffer, getOfferType, type OfferData } from "@/utils/offerUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeature } from "@/contexts/FeatureToggleContext";
import jsPDF from "jspdf";
import OfferActionsHub from "@/components/offer/OfferActionsHub";

interface UltraSimpleVariantProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

export const UltraSimpleVariant = ({ property }: UltraSimpleVariantProps) => {
  const showValues = useFeature('showPublicPropertyValues');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formType, setFormType] = useState<'accept' | 'questions' | 'increase'>('accept');
  const { toast } = useToast();

  useEffect(() => {
    void trackABEvent(property.id, 'ultra-simple', 'offer_revealed');
  }, [property.id]);

  const handleScheduleCall = () => {
    void trackABEvent(property.id, 'ultra-simple', 'clicked_schedule_call');
    void trackABEvent(property.id, 'ultra-simple', 'form_started', { flow: 'schedule_call' });
    setFormType('accept');
    setShowContactForm(true);
  };

  const handleScheduleVisit = () => {
    void trackABEvent(property.id, 'ultra-simple', 'clicked_schedule_visit');
    void trackABEvent(property.id, 'ultra-simple', 'form_started', { flow: 'schedule_visit' });
    setFormType('questions');
    setShowContactForm(true);
  };

  const handleIncreaseOffer = () => {
    void trackABEvent(property.id, 'ultra-simple', 'clicked_increase_offer');
    void trackABEvent(property.id, 'ultra-simple', 'form_started', { flow: 'increase_offer' });
    trackGAEvent('offer_increase_clicked', {
      offer_id: property.id,
      property_address: `${property.address}, ${property.city}, ${property.state}`,
      variant: 'ultra-simple',
    });
    setFormType('increase');
    setFormData({ name: '', email: '', phone: '' });
    setShowIncreaseModal(true);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    void trackABEvent(property.id, 'ultra-simple', 'clicked_download_pdf');
    try {
      const offerAmount = property.cash_offer_amount || defaultOffer(property.estimated_value);
      const doc = new jsPDF();
      
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Cash Offer Letter', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text('My Local Invest', 105, 28, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Property:', 20, 55);
      doc.setFontSize(12);
      doc.text(`${property.address}, ${property.city}, ${property.state}`, 20, 63);

      doc.setFontSize(14);
      doc.text('Your Fair Cash Offer:', 20, 80);
      doc.setFontSize(28);
      doc.setTextColor(34, 197, 94);
      doc.text(formatCurrency(offerAmount), 20, 95);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('What We Offer:', 20, 115);
      doc.setFontSize(11);
      const benefits = [
        '✓ Close in 7-14 Days - Fast closing guaranteed',
        '✓ No Repairs Needed - We buy as-is',
        '✓ No Realtor Fees - Save thousands',
        '✓ No Hidden Costs - What you see is what you get',
        '✓ No Obligation - Accept or decline freely',
      ];
      benefits.forEach((b, i) => doc.text(b, 25, 125 + i * 8));

      doc.setFontSize(14);
      doc.text('Ready to move forward?', 20, 175);
      doc.setFontSize(11);
      doc.text('Visit: https://offer.mylocalinvest.com', 20, 185);
      doc.text('Or call us to discuss this offer.', 20, 193);

      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });

      doc.save(`Cash-Offer-${property.address.replace(/\s+/g, '-')}.pdf`);

      await supabase.from('property_analytics').insert({
        property_id: property.id,
        event_type: 'pdf_download',
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'direct',
      });

      toast({ title: "PDF Downloaded!", description: "Your offer letter has been saved." });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedName = formData.name.trim();
    const normalizedPhone = formData.phone.trim();

    void trackABEvent(property.id, 'ultra-simple', 'form_submitted', {
      has_name: Boolean(normalizedName),
      has_email: Boolean(normalizedEmail),
      has_phone: Boolean(normalizedPhone),
      flow: formType,
    });

    if (normalizedPhone) {
      void trackABEvent(property.id, 'ultra-simple', 'phone_collected', {
        phone_last4: normalizedPhone.replace(/\D/g, '').slice(-4),
      });
    }
    
    try {
      const { error } = await supabase
        .from('property_leads')
        .insert({
          property_id: property.id,
          full_name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          interest_level: 'interested',
          status: 'new',
          notes: formType === 'accept'
            ? 'Accepted offer from ultra-simple variant'
            : formType === 'increase'
            ? '🔼 Wants HIGHER offer — requested callback (ultra-simple variant)'
            : 'Asked questions from ultra-simple variant',
          user_agent: navigator.userAgent,
        });

      // 23505 = unique violation — treat as success.
      if (error && error.code !== '23505') throw error;

      await supabase.from('property_analytics').insert({
        property_id: property.id,
        event_type: formType === 'accept' ? 'offer_accepted' : 'inquiry_submitted',
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'direct',
      });

      // Google Analytics — track the higher-offer request specifically
      if (formType === 'increase') {
        trackGAEvent('offer_increase_requested', {
          offer_id: property.id,
          property_address: `${property.address}, ${property.city}, ${property.state}`,
          property_city: property.city,
          property_state: property.state,
          variant: 'ultra-simple',
          has_phone: Boolean(normalizedPhone),
        });
      }

      toast({
        title: "Received!",
        description: "We'll contact you shortly.",
      });
      setFormData({ name: '', email: '', phone: '' });
      setShowContactForm(false);
      setShowIncreaseModal(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const offerType = getOfferType(property);
  const offerDisplay = formatOffer(property, { shortForm: true });

  return (
    <div className="space-y-8">
      {/* Main Offer Card */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-8">
          <div className="text-center space-y-6">
            {/* Offer Amount */}
            <div>
              <p className="text-lg text-muted-foreground mb-2">
                {offerType === 'range' ? 'Your Cash Offer Range' : 'Your Fair Cash Offer'}
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-primary">
                {offerType === 'range' ? offerDisplay : formatCurrency(property.cash_offer_amount || defaultOffer(property.estimated_value))}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                For {property.address}, {property.city}, {property.state}
              </p>
              {offerType === 'range' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Final offer determined after property inspection
                </p>
              )}
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 py-6">
              <div className="flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-green-600" />
                <p className="font-semibold">Close in 7-14 Days</p>
                <p className="text-xs text-muted-foreground">Fast closing guaranteed</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-green-600" />
                <p className="font-semibold">No Repairs Needed</p>
                <p className="text-xs text-muted-foreground">We buy as-is</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-green-600" />
                <p className="font-semibold">No Realtor Fees</p>
                <p className="text-xs text-muted-foreground">Save thousands</p>
              </div>
            </div>

            {/* CTAs - Intent-driven hierarchy */}
            {!showContactForm ? (
              <OfferActionsHub
                propertyId={property.id}
                propertyAddress={property.address}
                currentOffer={property.estimated_value}
                onDownloadPdf={handleDownloadPDF}
                onTrack={(action) => {
                  void trackABEvent(property.id, 'ultra-simple', 'form_started', { flow: action });
                }}
              />
            ) : (
              /* Contact Form */
              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Phone className="mr-2 h-5 w-5" />}
                  {isSubmitting ? 'Submitting...' : "Submit - We'll Call You"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Is this offer binding?</p>
              <p className="text-sm text-muted-foreground">
                No, this is a no-obligation cash offer. You can accept or decline at any time.
              </p>
            </div>
            <div>
              <p className="font-semibold">How fast can you close?</p>
              <p className="text-sm text-muted-foreground">
                We can close in as little as 7 days, or on your timeline.
              </p>
            </div>
            <div>
              <p className="font-semibold">Do I need to make repairs?</p>
              <p className="text-sm text-muted-foreground">
                No repairs needed. We buy houses in any condition.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Increase My Offer — Modal */}
      <Dialog open={showIncreaseModal} onOpenChange={setShowIncreaseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📈 Request a Higher Offer
            </DialogTitle>
            <DialogDescription>
              Leave your contact and our team will call you to discuss a better price for{' '}
              <span className="font-medium text-foreground">{property.address}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="increase-name">Name</Label>
              <Input
                id="increase-name"
                data-field="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="increase-email">Email</Label>
              <Input
                id="increase-email"
                data-field="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="increase-phone">Phone</Label>
              <Input
                id="increase-phone"
                data-field="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-action="submit-increase-offer"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Phone className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Submitting...' : "Request Higher Offer — Call Me"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No obligation. We'll call you within 1 business day.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
