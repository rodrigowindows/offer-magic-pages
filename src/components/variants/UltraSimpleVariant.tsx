import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Phone, Mail, Download } from "lucide-react";
import { trackABEvent } from "@/utils/abTesting";
import { formatOffer, getOfferType, type OfferData } from "@/utils/offerUtils";

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAccept = () => {
    trackABEvent(property.id, 'ultra-simple', 'clicked_accept');
    setShowContactForm(true);
  };

  const handleQuestions = () => {
    trackABEvent(property.id, 'ultra-simple', 'clicked_questions');
    // Open contact form or modal
    setShowContactForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackABEvent(property.id, 'ultra-simple', 'form_submitted', formData);
    // Save to database
    alert('Thanks! We\'ll contact you shortly.');
  };

  const offerType = getOfferType(property);
  const offerDisplay = formatOffer(property, { shortForm: true });

  return (
    <div className="space-y-8">
      {/* Main Offer Card */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-8">
          <div className="text-center space-y-6">
            {/* Offer Amount - SHOWN IMMEDIATELY */}
            <div>
              <p className="text-lg text-muted-foreground mb-2">
                {offerType === 'range' ? 'Your Cash Offer Range' : 'Your Fair Cash Offer'}
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-primary">
                {offerDisplay}
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

            {/* CTAs */}
            {!showContactForm ? (
              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  size="lg"
                  className="w-full md:w-auto px-12 text-lg"
                >
                  Accept This Offer
                </Button>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleQuestions}
                    variant="outline"
                    size="lg"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    I Have Questions
                  </Button>
                  <Button variant="outline" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                  </Button>
                </div>
              </div>
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
                <Button type="submit" className="w-full">
                  <Phone className="mr-2 h-5 w-5" />
                  Submit - We'll Call You
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
    </div>
  );
};
