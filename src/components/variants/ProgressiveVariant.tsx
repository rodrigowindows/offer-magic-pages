import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SimpleLeadCapture } from "@/components/lead/SimpleLeadCapture";
import { OfferRevealCard } from "@/components/offer/OfferRevealCard";
import { defaultOffer } from "@/lib/utils";
import { InterestCapture } from "@/components/lead/InterestCapture";
import { ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { formatOffer, getOfferAverage, getOfferType, type OfferData } from "@/utils/offerUtils";
import { trackABEvent } from "@/utils/abTesting";
import { supabase } from "@/integrations/supabase/client";

type ProgressiveStep = "intent" | "capture" | "revealed" | "completed";
type ProgressiveIntent = "interested" | "questions";

interface ProgressiveVariantProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

const getOfferAmount = (property: ProgressiveVariantProps["property"]) => {
  const average = getOfferAverage(property);
  if (average > 0) {
    return Math.round(average);
  }

  if (property.cash_offer_amount && property.cash_offer_amount > 0) {
    return Math.round(property.cash_offer_amount);
  }

  return defaultOffer(property.estimated_value);
};

export const ProgressiveVariant = ({ property }: ProgressiveVariantProps) => {
  const [step, setStep] = useState<ProgressiveStep>("intent");
  const [intent, setIntent] = useState<ProgressiveIntent>("interested");
  const [email, setEmail] = useState("");

  const offerType = getOfferType(property);
  const offerAmount = getOfferAmount(property);
  const offerDisplay = offerType === "range"
    ? formatOffer(property, { shortForm: true })
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(offerAmount);

  const handleIntent = (nextIntent: ProgressiveIntent) => {
    setIntent(nextIntent);
    setStep("capture");

    if (nextIntent === "interested") {
      void trackABEvent(property.id, "progressive", "clicked_interested");
    } else {
      void trackABEvent(property.id, "progressive", "clicked_questions");
    }

    void trackABEvent(property.id, "progressive", "form_started", {
      stage: "intent",
      intent: nextIntent,
    });
  };

  const handleEmailSubmit = async (submittedEmail: string) => {
    const normalizedEmail = submittedEmail.trim().toLowerCase();
    const emailDomain = normalizedEmail.includes("@") ? normalizedEmail.split("@")[1] : null;

    const { error } = await supabase
      .from("property_leads")
      .upsert(
        {
          property_id: property.id,
          email: normalizedEmail,
          interest_level: "email-only",
          status: "new",
          notes: `Email captured via progressive variant (${intent})`,
          offer_viewed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
        {
          onConflict: "property_id,email,interest_level",
          ignoreDuplicates: true,
        },
      );

    if (error) {
      throw error;
    }

    setEmail(normalizedEmail);
    setStep("revealed");

    void trackABEvent(property.id, "progressive", "email_submitted", {
      email_domain: emailDomain,
      intent,
    });

    void trackABEvent(property.id, "progressive", "offer_revealed");
  };

  const handleInterestSubmit = async (data: {
    fullName: string;
    phone: string;
    sellingTimeline: string;
  }) => {
    const normalizedName = data.fullName.trim();
    const normalizedPhone = data.phone.trim();

    const { error } = await supabase
      .from("property_leads")
      .upsert(
        {
          property_id: property.id,
          email,
          full_name: normalizedName,
          phone: normalizedPhone,
          selling_timeline: data.sellingTimeline,
          interest_level: "interested",
          status: "interested",
          notes: `Progressive variant completed (${intent})`,
          user_agent: navigator.userAgent,
        },
        {
          onConflict: "property_id,email,interest_level",
        },
      );

    if (error) {
      throw error;
    }

    void trackABEvent(property.id, "progressive", "form_submitted", {
      selling_timeline: data.sellingTimeline,
      has_phone: Boolean(normalizedPhone),
      intent,
    });

    if (normalizedPhone) {
      void trackABEvent(property.id, "progressive", "phone_collected", {
        phone_last4: normalizedPhone.replace(/\D/g, "").slice(-4),
      });
    }

    setStep("completed");
  };

  if (step === "capture") {
    return (
      <SimpleLeadCapture
        isOpen={true}
        onClose={() => setStep("intent")}
        onSubmit={handleEmailSubmit}
        propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
        offerAmount={offerAmount}
      />
    );
  }

  if (step === "revealed") {
    return (
      <div className="space-y-6">
        <OfferRevealCard
          cashOfferAmount={offerAmount}
          estimatedValue={property.estimated_value}
          propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
          leadName="there"
        />
        <InterestCapture
          email={email}
          onSubmit={handleInterestSubmit}
          onInterestedClick={() => {
            void trackABEvent(property.id, "progressive", "clicked_interested", { stage: "revealed" });
            void trackABEvent(property.id, "progressive", "form_started", { stage: "details" });
          }}
          onJustEmailClick={() => {
            void trackABEvent(property.id, "progressive", "clicked_questions", { stage: "revealed" });
          }}
        />
      </div>
    );
  }

  if (step === "completed") {
    return (
      <Card className="max-w-2xl mx-auto border-primary/30">
        <CardContent className="py-10 text-center space-y-3">
          <h2 className="text-3xl font-bold">Thanks, we received your details</h2>
          <p className="text-muted-foreground">
            A specialist will contact you shortly to review next steps for your property.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto border-2 border-primary/20">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-3xl">A simpler path to your cash offer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Property</p>
          <p className="font-semibold">{property.address}, {property.city}, {property.state}</p>
          <p className="text-2xl font-bold text-primary">{offerDisplay}</p>
          <p className="text-sm text-muted-foreground">
            Quick process: confirm interest first, then share your contact details.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            size="lg"
            className="h-auto py-5"
            onClick={() => handleIntent("interested")}
          >
            <span className="flex items-center gap-2">
              I am interested
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-5"
            onClick={() => handleIntent("questions")}
          >
            <span className="flex items-center gap-2">
              I have questions first
              <MessageSquare className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

