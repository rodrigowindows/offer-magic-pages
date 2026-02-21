import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultOffer } from "@/lib/utils";
import { AlertTriangle, Clock, Phone } from "lucide-react";
import OfferCountdown from "@/components/OfferCountdown";
import { formatOffer, getOfferType, type OfferData } from "@/utils/offerUtils";
import { trackABEvent } from "@/utils/abTesting";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UrgencyFlow = "accept" | "questions";

interface UrgencyVariantProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

export const UrgencyVariant = ({ property }: UrgencyVariantProps) => {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flow, setFlow] = useState<UrgencyFlow>("accept");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    sellingTimeline: "asap",
  });
  const { toast } = useToast();

  useEffect(() => {
    void trackABEvent(property.id, "urgency", "offer_revealed");
  }, [property.id]);

  const openForm = (nextFlow: UrgencyFlow) => {
    setFlow(nextFlow);
    setShowForm(true);

    if (nextFlow === "accept") {
      void trackABEvent(property.id, "urgency", "clicked_accept");
    } else {
      void trackABEvent(property.id, "urgency", "clicked_questions");
    }

    void trackABEvent(property.id, "urgency", "form_started", { flow: nextFlow });
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
            selling_timeline: formData.sellingTimeline,
            interest_level: "interested",
            status: "interested",
            notes: `Urgency variant (${flow})`,
            user_agent: navigator.userAgent,
          },
          {
            onConflict: "property_id,email,interest_level",
          },
        );

      if (error) {
        throw error;
      }

      void trackABEvent(property.id, "urgency", "form_submitted", {
        flow,
        selling_timeline: formData.sellingTimeline,
      });

      if (normalizedPhone) {
        void trackABEvent(property.id, "urgency", "phone_collected", {
          phone_last4: normalizedPhone.replace(/\D/g, "").slice(-4),
        });
      }

      setSubmitted(true);
      setShowForm(false);
      toast({
        title: "Offer reserved",
        description: "A specialist will contact you shortly.",
      });
    } catch (error) {
      console.error("Error submitting urgency lead:", error);
      toast({
        title: "Unable to reserve now",
        description: "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const offerType = getOfferType(property);
  const offerAmount = property.cash_offer_amount || defaultOffer(property.estimated_value);
  const offerDisplay = offerType === "range"
    ? formatOffer(property, { shortForm: true })
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(offerAmount);

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto border-primary/40">
        <CardContent className="py-12 text-center space-y-3">
          <h2 className="text-3xl font-bold">Your request is locked in</h2>
          <p className="text-muted-foreground">
            We will call you soon to finalize the next steps for your property.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
            <div>
              <h2 className="text-xl font-bold">Limited-time offer window</h2>
              <p className="text-sm text-muted-foreground">
                This cash offer is currently prioritized in our acquisition queue and may be adjusted soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <OfferCountdown expirationDays={2} />

      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Current cash offer</CardTitle>
          <p className="text-muted-foreground">
            {property.address}, {property.city}, {property.state}
          </p>
          <p className="text-4xl font-bold text-primary">{offerDisplay}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              Priority slots remaining this cycle: 2
            </div>
            <p className="text-muted-foreground mt-1">
              Lock your spot now to keep this valuation on file.
            </p>
          </div>

          {!showForm && (
            <div className="grid gap-3 md:grid-cols-2">
              <Button size="lg" onClick={() => openForm("accept")}>
                Lock this offer
              </Button>
              <Button size="lg" variant="outline" onClick={() => openForm("questions")}>
                I need details first
              </Button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
              <div>
                <Label htmlFor="urgency-name">Name</Label>
                <Input
                  id="urgency-name"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="urgency-email">Email</Label>
                <Input
                  id="urgency-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="urgency-phone">Phone</Label>
                <Input
                  id="urgency-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="urgency-timeline">Selling timeline</Label>
                <select
                  id="urgency-timeline"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.sellingTimeline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sellingTimeline: e.target.value }))}
                >
                  <option value="asap">ASAP - within 30 days</option>
                  <option value="1-3months">1-3 months</option>
                  <option value="3-6months">3-6 months</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Reserve my offer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="rounded-lg bg-primary/5 p-3 text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Prefer to call now? Reach us at 786-882-8251.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

