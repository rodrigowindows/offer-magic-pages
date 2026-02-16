import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessageSquare, Phone, Users } from "lucide-react";
import { formatOffer, getOfferType, type OfferData } from "@/utils/offerUtils";
import { trackABEvent } from "@/utils/abTesting";
import { supabase } from "@/integrations/supabase/client";
import SocialProofBanner from "@/components/SocialProofBanner";
import { useToast } from "@/hooks/use-toast";

type SocialProofFlow = "interested" | "questions";

interface SocialProofVariantProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

const testimonials = [
  {
    name: "Carlos M.",
    text: "Fair offer and easy close. We finished in less than two weeks.",
  },
  {
    name: "Angela R.",
    text: "No repairs and no surprises. The process was straightforward.",
  },
  {
    name: "Jason L.",
    text: "Communication was clear from day one, and timeline matched what was promised.",
  },
];

export const SocialProofVariant = ({ property }: SocialProofVariantProps) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [flow, setFlow] = useState<SocialProofFlow>("interested");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    void trackABEvent(property.id, "social-proof", "offer_revealed");
  }, [property.id]);

  const openForm = (nextFlow: SocialProofFlow) => {
    setFlow(nextFlow);
    setShowForm(true);

    if (nextFlow === "interested") {
      void trackABEvent(property.id, "social-proof", "clicked_interested");
    } else {
      void trackABEvent(property.id, "social-proof", "clicked_questions");
    }

    void trackABEvent(property.id, "social-proof", "form_started", { flow: nextFlow });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedName = formData.fullName.trim();
    const normalizedPhone = formData.phone.trim();

    try {
      const { error } = await supabase
        .from("property_leads")
        .upsert(
          {
            property_id: property.id,
            full_name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            interest_level: "interested",
            status: flow === "interested" ? "interested" : "new",
            notes: `Social proof variant (${flow})`,
            user_agent: navigator.userAgent,
          },
          {
            onConflict: "property_id,email,interest_level",
          },
        );

      if (error) {
        throw error;
      }

      void trackABEvent(property.id, "social-proof", "form_submitted", {
        flow,
        has_phone: Boolean(normalizedPhone),
      });

      if (normalizedPhone) {
        void trackABEvent(property.id, "social-proof", "phone_collected", {
          phone_last4: normalizedPhone.replace(/\D/g, "").slice(-4),
        });
      }

      setSubmitted(true);
      setShowForm(false);
      setFormData({ fullName: "", email: "", phone: "" });
      toast({
        title: "Request received",
        description: "Our team will contact you shortly.",
      });
    } catch (error) {
      console.error("Error submitting social-proof lead:", error);
      toast({
        title: "Unable to submit right now",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const offerType = getOfferType(property);
  const offerAmount = property.cash_offer_amount || Math.round(property.estimated_value * 0.7);
  const offerDisplay = offerType === "range"
    ? formatOffer(property, { shortForm: true })
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(offerAmount);

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto border-primary/40">
        <CardContent className="py-12 text-center space-y-3">
          <h2 className="text-3xl font-bold">Thanks, we got your request</h2>
          <p className="text-muted-foreground">
            A local specialist will review your property details and contact you soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SocialProofBanner propertyId={property.id} />

      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Trusted by nearby homeowners</CardTitle>
          <p className="text-muted-foreground">
            Offer for {property.address}, {property.city}, {property.state}
          </p>
          <p className="text-4xl font-bold text-primary">{offerDisplay}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Users className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-sm font-semibold">142 homeowners helped</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-sm font-semibold">Average close in 11 days</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Phone className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-sm font-semibold">Local support team</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">"{item.text}"</p>
                <p className="mt-2 text-sm font-semibold">{item.name}</p>
              </div>
            ))}
          </div>

          {!showForm && (
            <div className="flex flex-col gap-3 md:flex-row">
              <Button className="flex-1" size="lg" onClick={() => openForm("interested")}>
                I am ready to talk
              </Button>
              <Button className="flex-1" size="lg" variant="outline" onClick={() => openForm("questions")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                I have questions
              </Button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
              <div>
                <Label htmlFor="social-fullName">Name</Label>
                <Input
                  id="social-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="social-email">Email</Label>
                <Input
                  id="social-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="social-phone">Phone</Label>
                <Input
                  id="social-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Send my request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

