import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin } from "lucide-react";

interface ContactFormProps {
  propertyAddress?: string;
  propertyId?: string;
  onSubmit?: () => void;
}

const ContactForm = ({ propertyAddress = "", propertyId, onSubmit }: ContactFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
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

    // Track inquiry submission
    await trackInquiry();

    // Track form submission with GA4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_submission', {
        property_address: formData.propertyAddress,
        form_name: 'cash_offer_request'
      });
    }

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Thank you for your interest!",
      description: "We'll review your information and get back to you within 24 hours.",
    });

    // Call onSubmit callback if provided (for A/B test tracking)
    onSubmit?.();

    setIsSubmitting(false);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      propertyAddress: propertyAddress
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact-form" className="py-16 md:py-20 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-strong p-8 md:p-12 border border-border">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Get Your Fair Cash Offer Today
              </h2>
              <p className="text-lg text-muted-foreground">
                Fill out the form below and we'll contact you within 24 hours with your personalized offer
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-semibold">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(305) 555-0123"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress" className="text-foreground font-semibold">
                    Property Address *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="propertyAddress"
                      name="propertyAddress"
                      type="text"
                      required
                      value={formData.propertyAddress}
                      onChange={handleChange}
                      placeholder="123 Main St, Miami, FL"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center">
                  By submitting this form, you agree to our privacy policy and consent to be contacted 
                  about your cash offer. We respect your privacy and will never share your information.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-6 h-auto font-bold shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? "Submitting..." : "Get Your Fair Cash Offer"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                No obligation • Free consultation • Confidential
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
