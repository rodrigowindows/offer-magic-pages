import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Check,
  Phone,
  Mail,
  Download,
  Sparkles,
} from "lucide-react";

interface OfferRevealCardProps {
  cashOfferAmount: number;
  estimatedValue: number;
  propertyAddress: string;
  leadName: string;
}

export const OfferRevealCard = ({
  cashOfferAmount,
  estimatedValue,
  propertyAddress,
  leadName,
}: OfferRevealCardProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [displayAmount, setDisplayAmount] = useState(0);

  // Animate the number counting up
  useEffect(() => {
    setIsAnimating(true);
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = cashOfferAmount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, cashOfferAmount);
      setDisplayAmount(Math.floor(current));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayAmount(cashOfferAmount);
        setIsAnimating(false);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [cashOfferAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const savingsFromNoRealtor = estimatedValue * 0.06; // 6% realtor fee
  const closingSpeed = "7-14 days";

  return (
    <div className="space-y-6">
      {/* Main Offer Card */}
      <Card className="border-2 border-primary shadow-lg relative overflow-hidden">
        {/* Celebration Effect */}
        {isAnimating && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-pulse pointer-events-none" />
        )}

        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Congratulations, {leadName.split(' ')[0]}! 🎉
          </CardTitle>
          <p className="text-muted-foreground">Your cash offer is ready</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Property Address */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Cash Offer for</p>
            <p className="text-lg font-semibold">{propertyAddress}</p>
          </div>

          {/* The Big Reveal - Cash Offer Amount */}
          <div className="text-center p-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
              Your Cash Offer
            </p>
            <div className={`text-5xl md:text-6xl font-bold text-primary transition-all ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              {formatCurrency(displayAmount)}
            </div>
            <Badge className="mt-4" variant="secondary">
              <Check className="w-3 h-3 mr-1" />
              No Obligation • Valid for 30 Days
            </Badge>
          </div>

          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
              <p className="text-lg font-semibold">{formatCurrency(estimatedValue)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-600" />
              <p className="text-xs text-muted-foreground mb-1">Your Cash Offer</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(cashOfferAmount)}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">Why Our Cash Offer?</h3>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Close in {closingSpeed}</p>
                  <p className="text-xs text-muted-foreground">Fast closing guaranteed</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No repairs needed</p>
                  <p className="text-xs text-muted-foreground">We buy as-is, any condition</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Save {formatCurrency(savingsFromNoRealtor)} in fees</p>
                  <p className="text-xs text-muted-foreground">No realtor commissions</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">We cover closing costs</p>
                  <p className="text-xs text-muted-foreground">Zero fees, zero hassle</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button className="w-full text-lg py-6" size="lg">
              <Check className="mr-2 h-5 w-5" />
              Accept This Offer
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Call Us
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>

            <Button variant="ghost" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Offer (PDF)
            </Button>
          </div>

          {/* Next Steps */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  What Happens Next?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Our team will contact you within 24 hours to answer any questions and guide you through the next steps. You can accept this offer anytime within 30 days.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-sm mb-1">Is this offer binding?</p>
            <p className="text-xs text-muted-foreground">
              No, this is a no-obligation cash offer. You have 30 days to decide with zero pressure.
            </p>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">How fast can you close?</p>
            <p className="text-xs text-muted-foreground">
              We can close in as little as 7 days, or on your timeline. You choose the closing date that works best for you.
            </p>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Do I need to make repairs?</p>
            <p className="text-xs text-muted-foreground">
              Absolutely not. We buy houses in any condition - no repairs, no cleaning, no staging required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
