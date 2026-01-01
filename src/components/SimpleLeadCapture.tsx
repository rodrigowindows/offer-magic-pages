import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleLeadCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  propertyAddress: string;
  offerAmount: number;
}

export const SimpleLeadCapture = ({
  isOpen,
  onClose,
  onSubmit,
  propertyAddress,
  offerAmount,
}: SimpleLeadCaptureProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(email);
      toast({
        title: "Success! 🎉",
        description: "Your cash offer is now revealed below",
      });
    } catch (error) {
      console.error("Error submitting email:", error);
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
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Your Cash Offer is Ready!
            </h2>
            <p className="text-muted-foreground">
              See your personalized offer for
            </p>
            <p className="font-semibold text-lg mt-1">{propertyAddress}</p>
          </div>

          {/* Blurred Offer */}
          <div className="relative p-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border-2 border-dashed border-primary/30">
            <div className="relative">
              <p className="text-5xl font-bold text-primary blur-md select-none">
                {formatCurrency(offerAmount)}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <p className="text-sm font-medium mb-3 text-center">
                Enter your email to reveal your offer
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`pl-10 text-lg py-6 ${error ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-lg py-6"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Revealing Your Offer...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Reveal My Cash Offer
                </>
              )}
            </Button>
          </form>

          {/* Trust Indicators */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Your email is secure and will never be shared
            </p>
            <p className="text-xs text-muted-foreground">
              No spam, no pressure • We respect your privacy
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
