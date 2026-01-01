import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Phone, Send, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterestCaptureData {
  fullName: string;
  phone: string;
  sellingTimeline: string;
}

interface InterestCaptureProps {
  onSubmit: (data: InterestCaptureData) => Promise<void>;
  email: string;
}

export const InterestCapture = ({ onSubmit, email }: InterestCaptureProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InterestCaptureData>({
    fullName: "",
    phone: "",
    sellingTimeline: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InterestCaptureData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InterestCaptureData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Invalid phone number";
    }

    if (!formData.sellingTimeline) {
      newErrors.sellingTimeline = "Please select a timeline";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast({
        title: "Perfect! 🎉",
        description: "We'll call you shortly to discuss next steps",
      });
    } catch (error) {
      console.error("Error submitting interest:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJustEmail = async () => {
    try {
      toast({
        title: "Got it! 📧",
        description: "We've sent the full offer details to your email",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (showForm) {
    return (
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-center">Let's Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(321) 555-0123"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <Label>
                When do you want to sell? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.sellingTimeline}
                onValueChange={(value) => setFormData({ ...formData, sellingTimeline: value })}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                  <RadioGroupItem value="asap" id="asap" />
                  <Label htmlFor="asap" className="cursor-pointer font-normal flex-1">
                    ASAP - Within 30 days
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                  <RadioGroupItem value="1-3months" id="1-3months" />
                  <Label htmlFor="1-3months" className="cursor-pointer font-normal flex-1">
                    1-3 months
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                  <RadioGroupItem value="3-6months" id="3-6months" />
                  <Label htmlFor="3-6months" className="cursor-pointer font-normal flex-1">
                    3-6 months
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                  <RadioGroupItem value="not-sure" id="not-sure" />
                  <Label htmlFor="not-sure" className="cursor-pointer font-normal flex-1">
                    Not sure yet
                  </Label>
                </div>
              </RadioGroup>
              {errors.sellingTimeline && (
                <p className="text-xs text-destructive mt-1">{errors.sellingTimeline}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-lg py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-5 w-5" />
                  Submit - Call Me
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">What Would You Like to Do?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Option 1: I'm Interested */}
        <Button
          onClick={() => setShowForm(true)}
          className="w-full text-lg py-6 h-auto flex-col gap-1"
          size="lg"
        >
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span className="font-bold">I'm Interested - Let's Talk</span>
          </div>
          <span className="text-xs opacity-90 font-normal">
            Get a call from our team to discuss next steps
          </span>
        </Button>

        {/* Option 2: Just Send Details */}
        <Button
          onClick={handleJustEmail}
          variant="outline"
          className="w-full text-lg py-6 h-auto flex-col gap-1"
          size="lg"
        >
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <span className="font-bold">Just Email Me the Details</span>
          </div>
          <span className="text-xs opacity-70 font-normal">
            We'll send everything to {email}
          </span>
        </Button>

        {/* Trust Message */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          <Check className="inline w-3 h-3 mr-1" />
          No obligation • No pressure • You decide what's next
        </p>
      </CardContent>
    </Card>
  );
};
