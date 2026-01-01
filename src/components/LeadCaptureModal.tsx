import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Lock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadCaptureData {
  fullName: string;
  email: string;
  phone: string;
  isOwner: boolean;
  sellingTimeline: string;
}

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadCaptureData) => Promise<void>;
  propertyAddress: string;
  offerAmount: number;
}

export const LeadCaptureModal = ({
  isOpen,
  onClose,
  onSubmit,
  propertyAddress,
  offerAmount,
}: LeadCaptureModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeadCaptureData>({
    fullName: "",
    email: "",
    phone: "",
    isOwner: false,
    sellingTimeline: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LeadCaptureData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadCaptureData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Invalid phone number (use format: 123-456-7890)";
    }

    if (!formData.isOwner) {
      newErrors.isOwner = "You must confirm you are the property owner";
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
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast({
        title: "Success!",
        description: "Your cash offer is now revealed below",
      });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
            Reveal Your Cash Offer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Blurred Offer Preview */}
          <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border-2 border-dashed border-primary/30">
            <p className="text-sm text-muted-foreground mb-1">Cash Offer for</p>
            <p className="font-semibold text-foreground mb-3">{propertyAddress}</p>
            <div className="relative inline-block">
              <p className="text-4xl font-bold text-primary blur-sm select-none">
                {formatCurrency(offerAmount)}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary/60" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Complete form below to reveal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
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

            {/* Email */}
            <div>
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
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

            {/* Owner Checkbox */}
            <div className="flex items-start space-x-2 p-3 bg-muted rounded-lg">
              <Checkbox
                id="isOwner"
                checked={formData.isOwner}
                onCheckedChange={(checked) => setFormData({ ...formData, isOwner: checked as boolean })}
              />
              <div className="space-y-1">
                <label
                  htmlFor="isOwner"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I am the current property owner <span className="text-destructive">*</span>
                </label>
                {errors.isOwner && (
                  <p className="text-xs text-destructive">{errors.isOwner}</p>
                )}
              </div>
            </div>

            {/* Selling Timeline */}
            <div>
              <Label>
                When do you want to sell? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.sellingTimeline}
                onValueChange={(value) => setFormData({ ...formData, sellingTimeline: value })}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                  <RadioGroupItem value="asap" id="asap" />
                  <Label htmlFor="asap" className="cursor-pointer font-normal flex-1">
                    ASAP - Within 30 days
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                  <RadioGroupItem value="1-3months" id="1-3months" />
                  <Label htmlFor="1-3months" className="cursor-pointer font-normal flex-1">
                    1-3 months
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                  <RadioGroupItem value="3-6months" id="3-6months" />
                  <Label htmlFor="3-6months" className="cursor-pointer font-normal flex-1">
                    3-6 months
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                  <RadioGroupItem value="6-12months" id="6-12months" />
                  <Label htmlFor="6-12months" className="cursor-pointer font-normal flex-1">
                    6-12 months
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                  <RadioGroupItem value="exploring" id="exploring" />
                  <Label htmlFor="exploring" className="cursor-pointer font-normal flex-1">
                    Just exploring / Not sure yet
                  </Label>
                </div>
              </RadioGroup>
              {errors.sellingTimeline && (
                <p className="text-xs text-destructive mt-1">{errors.sellingTimeline}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-lg py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Revealing Your Offer...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Reveal My Cash Offer
                </>
              )}
            </Button>

            {/* Privacy Notice */}
            <p className="text-xs text-center text-muted-foreground">
              <Lock className="inline w-3 h-3 mr-1" />
              Your information is secure and will never be shared. We respect your privacy.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
