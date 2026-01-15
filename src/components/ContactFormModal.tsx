import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContactFormModalProps {
  propertyAddress?: string;
  propertyId?: string;
  onSubmit?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  triggerElement?: React.ReactNode;
}

const ContactFormModal = ({
  propertyAddress = "",
  propertyId,
  onSubmit,
  buttonText = "I'm Interested",
  buttonClassName,
  triggerElement
}: ContactFormModalProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyAddress: propertyAddress
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trackInquiry = async () => {
    if (!propertyId) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.functions.invoke('track-analytics', {
        body: {
          propertyId,
          eventType: 'inquiry_submitted',
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('Error tracking inquiry:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save lead to database
      const { supabase } = await import("@/integrations/supabase/client");

      const { data, error } = await supabase
        .from('property_leads')
        .insert({
          email: formData.email,
          phone: formData.phone,
          property_id: propertyId || null,
          full_name: formData.name || 'Not Provided',
          status: 'new',
          selling_timeline: 'exploring', // Default value required by schema
          interest_level: 'high',
          ip_address: null, // Can be detected if needed
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving lead:', error);
        throw error;
      }

      console.log('✅ Lead saved successfully:', data);

      // Track inquiry submission
      await trackInquiry();

      // Track form submission with GA4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'form_submission', {
          property_address: formData.propertyAddress,
          form_name: 'cash_offer_request_modal',
          form_type: 'interested_button'
        });
      }

      toast({
        title: "Thank you for your interest! 🎉",
        description: "We'll contact you within 24 hours with your personalized cash offer.",
      });

      // Call onSubmit callback if provided (for A/B test tracking)
      onSubmit?.();

      setFormData({
        name: "",
        email: "",
        phone: "",
        propertyAddress: propertyAddress
      });

      setOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const defaultTrigger = (
    <Button
      size="lg"
      className={buttonClassName || "bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-8 h-auto font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-pulse"}
    >
      <Check className="w-6 h-6 mr-2" />
      {buttonText}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerElement || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Get Your Fair Cash Offer
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Just provide your contact info and we'll reach out within 24 hours
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Your Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="h-12 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="(305) 555-0123"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyAddress" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Property Address
              </Label>
              <Input
                id="propertyAddress"
                name="propertyAddress"
                type="text"
                value={formData.propertyAddress}
                onChange={handleChange}
                placeholder="Property address"
                className="h-12 text-base bg-muted"
                readOnly
              />
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              By submitting, you agree to be contacted about your cash offer.
              We respect your privacy and will never share your information.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 h-auto font-bold shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Get My Offer Now
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ✓ No obligation • ✓ Free consultation • ✓ Confidential
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;
