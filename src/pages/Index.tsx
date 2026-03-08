import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MapPin, DollarSign, CheckCircle, Star } from "lucide-react";
import { z } from "zod";
import { Helmet } from "react-helmet-async";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(
    /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    "Invalid phone. Use format: (407) 555-0123"
  ),
  address: z.string().min(10, "Please provide the full address"),
  message: z.string().optional(),
});

const BENEFITS = [
  { title: "No Repairs Needed", desc: "We buy houses in any condition — as-is" },
  { title: "Fast Closing", desc: "Close in as little as 7 days" },
  { title: "No Fees or Commissions", desc: "We cover all closing costs" },
  { title: "Fair Cash Offers", desc: "Transparent pricing, no hidden fees" },
] as const;

const STATS = [
  { value: "7 Days", label: "Average closing time" },
  { value: "$0", label: "Fees or commissions" },
  { value: "100%", label: "Fair cash offers" },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "MyLocalInvest",
  description: "Orlando's trusted cash home buyers. Fast, fair cash offers for your property.",
  url: "https://offer.mylocalinvest.com",
  telephone: "+1-786-882-8251",
  areaServed: { "@type": "City", name: "Orlando, FL" },
  priceRange: "$$",
};

const Index = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = leadFormSchema.parse(formData);

      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .ilike("address", `%${validated.address}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({ title: "⚠️ We Already Have Your Request", description: "We found a previous request with this address. We'll be in touch soon!", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const slug = validated.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase.from("properties").insert([{
        owner_name: formData.name,
        owner_phone: formData.phone,
        address: formData.address,
        slug, zip_code: "00000", estimated_value: 0, cash_offer_amount: 0,
        status: "active", lead_status: "new",
      }]);

      if (error) throw error;

      toast({ title: "✅ Request Received!", description: "We'll contact you within 24 hours with a cash offer." });
      setFormData({ name: "", email: "", phone: "", address: "", message: "" });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
        setErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please fix the errors in the form", variant: "destructive" });
      } else {
        const msg = error instanceof Error ? error.message : "An error occurred";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sell Your Orlando Home Fast for Cash | MyLocalInvest</title>
        <meta name="description" content="Get a fair, no-obligation cash offer for your Orlando property in 24 hours. No repairs, no fees, close in 7 days. MyLocalInvest — Orlando's trusted cash home buyers." />
        <link rel="canonical" href="https://offer.mylocalinvest.com/" />
        <meta property="og:title" content="Sell Your Orlando Home Fast for Cash | MyLocalInvest" />
        <meta property="og:description" content="Get a fair cash offer in 24 hours. No repairs, no fees, close in 7 days." />
        <meta property="og:url" content="https://offer.mylocalinvest.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Sell Your Orlando Home Fast for Cash | MyLocalInvest" />
        <meta name="twitter:description" content="Get a fair cash offer in 24 hours. No repairs, no fees, close in 7 days." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="text-center space-y-4 mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                MyLocalInvest
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Orlando's Trusted Cash Home Buyers
              </p>
            </header>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Benefits */}
              <section aria-label="Benefits" className="space-y-6">
                <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    Get a Fair Cash Offer Today
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Facing tax deed issues in Orlando? We help homeowners with fast, fair cash offers.
                    No repairs needed, no commissions, and we can close in as little as 7 days.
                  </p>

                  <ul className="space-y-4" role="list">
                    {BENEFITS.map(({ title, desc }) => (
                      <li key={title} className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                        <div>
                          <h3 className="font-semibold text-foreground">{title}</h3>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Social Proof */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      "They gave me a fair offer and closed in just 10 days. No hassle at all!"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">— Maria S., Orlando FL</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <a
                      href="tel:+17868828251"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-colors"
                    >
                      <Phone className="h-5 w-5" aria-hidden="true" />
                      Call Us: (786) 882-8251
                    </a>
                  </div>
                </div>
              </section>

              {/* Lead Form */}
              <section aria-label="Request cash offer form">
                <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Request Your Cash Offer
                    </h2>
                    <p className="text-muted-foreground">
                      Fill out the form below and we'll contact you within 24 hours
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <FormField label="Your Name" error={errors.name}>
                      <Input type="text" placeholder="John Smith" value={formData.name} onChange={handleChange("name")} className={errors.name ? "border-destructive" : ""} required aria-invalid={!!errors.name} />
                    </FormField>

                    <FormField label="Email" error={errors.email} icon={<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                      <Input type="email" placeholder="john@example.com" className={`pl-10 ${errors.email ? "border-destructive" : ""}`} value={formData.email} onChange={handleChange("email")} required aria-invalid={!!errors.email} />
                    </FormField>

                    <FormField label="Phone" error={errors.phone} icon={<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                      <Input type="tel" placeholder="(407) 555-0123" className={`pl-10 ${errors.phone ? "border-destructive" : ""}`} value={formData.phone} onChange={handleChange("phone")} required aria-invalid={!!errors.phone} />
                    </FormField>

                    <FormField label="Property Address" error={errors.address} icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                      <Input type="text" placeholder="123 Main St, Orlando, FL 32801" className={`pl-10 ${errors.address ? "border-destructive" : ""}`} value={formData.address} onChange={handleChange("address")} required aria-invalid={!!errors.address} />
                    </FormField>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Additional Information</label>
                      <Textarea placeholder="Tell us about your situation..." rows={4} value={formData.message} onChange={handleChange("message")} />
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : (
                        <><DollarSign className="h-5 w-5 mr-2" aria-hidden="true" />Get My Cash Offer</>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      No obligation. We respect your privacy.
                    </p>
                  </form>
                </div>
              </section>
            </div>

            {/* Stats */}
            <section aria-label="Statistics" className="grid md:grid-cols-3 gap-6 mb-12">
              {STATS.map(({ value, label }) => (
                <div key={label} className="bg-card rounded-xl p-6 border border-border text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{value}</div>
                  <p className="text-muted-foreground">{label}</p>
                </div>
              ))}
            </section>

            {/* Footer */}
            <footer className="text-center">
              <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Team Member? Sign in here
              </a>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
};

/** Reusable form field with label, error, and optional icon */
const FormField = ({ label, error, icon, children }: { label: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-medium text-foreground mb-1 block">{label} *</label>
    <div className={icon ? "relative" : undefined}>
      {icon}
      {children}
    </div>
    {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}
  </div>
);

export default Index;
