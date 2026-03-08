import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MapPin, DollarSign, CheckCircle, Star, ArrowRight, Shield, Clock, Home } from "lucide-react";
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
  { title: "No Repairs Needed", desc: "We buy houses in any condition — as-is", icon: Home },
  { title: "Close in 7 Days", desc: "Fast closing on your timeline", icon: Clock },
  { title: "No Fees or Commissions", desc: "We cover all closing costs", icon: Shield },
  { title: "Fair Cash Offers", desc: "Transparent pricing, no hidden fees", icon: DollarSign },
] as const;

const STATS = [
  { value: "7", suffix: "Days", label: "Average closing time" },
  { value: "$0", suffix: "", label: "Fees or commissions" },
  { value: "500+", suffix: "", label: "Homes purchased" },
] as const;

const PROCESS_STEPS = [
  { step: "1", title: "Tell Us About Your Property", desc: "Fill out a quick form or call us" },
  { step: "2", title: "Get Your Cash Offer", desc: "We'll present a fair, no-obligation offer within 24 hours" },
  { step: "3", title: "Close & Get Paid", desc: "Pick your closing date and get paid" },
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

      const { data, error } = await supabase.functions.invoke("capture-lead", {
        body: {
          name: validated.name,
          phone: validated.phone,
          email: validated.email,
          address: validated.address,
          message: formData.message,
        },
      });

      if (error) throw error;

      if (data?.error === 'duplicate') {
        toast({ title: "⚠️ We Already Have Your Request", description: "We found a previous request with this address. We'll be in touch soon!", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      if (data?.error) throw new Error(data.error);

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

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.06),transparent_50%)]" />
          
          <div className="container mx-auto px-4 py-10 md:py-24 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left: Copy */}
                <div className="space-y-4 md:space-y-6 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary tracking-wide uppercase">Orlando's #1 Cash Buyers</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                    Sell Your Home
                    <span className="block text-primary">Fast for Cash</span>
                  </h1>

                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                    Get a fair, no-obligation cash offer in 24 hours. No repairs, no fees, close in as little as 7 days.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="#get-offer"
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg shadow-primary/25 text-base sm:text-lg"
                    >
                      Get My Cash Offer
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <a
                      href="tel:+17868828251"
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-border hover:border-primary/50 text-foreground font-semibold rounded-xl transition-all hover:bg-primary/5"
                    >
                      <Phone className="h-5 w-5" />
                      (786) 882-8251
                    </a>
                  </div>

                  {/* Social proof - hidden on very small screens to save space */}
                  <div className="hidden sm:flex items-center gap-4 pt-2">
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] md:text-xs font-bold text-muted-foreground">
                          {['MS','JC','RL','AK'][i-1]}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">500+ homeowners helped</p>
                    </div>
                  </div>
                </div>

                {/* Right: Form */}
                <div id="get-offer" className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="bg-card rounded-2xl shadow-2xl shadow-primary/5 p-6 md:p-8 border border-border/50 backdrop-blur-sm">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        Request Your Cash Offer
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        We'll respond within 24 hours — no obligation
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                      <FormField label="Your Name" error={errors.name}>
                        <Input type="text" placeholder="John Smith" value={formData.name} onChange={handleChange("name")} className={`h-11 ${errors.name ? "border-destructive" : ""}`} required aria-invalid={!!errors.name} />
                      </FormField>

                      <FormField label="Email" error={errors.email} icon={<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                        <Input type="email" placeholder="john@example.com" className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`} value={formData.email} onChange={handleChange("email")} required aria-invalid={!!errors.email} />
                      </FormField>

                      <FormField label="Phone" error={errors.phone} icon={<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                        <Input type="tel" placeholder="(407) 555-0123" className={`pl-10 h-11 ${errors.phone ? "border-destructive" : ""}`} value={formData.phone} onChange={handleChange("phone")} required aria-invalid={!!errors.phone} />
                      </FormField>

                      <FormField label="Property Address" error={errors.address} icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
                        <Input type="text" placeholder="123 Main St, Orlando, FL 32801" className={`pl-10 h-11 ${errors.address ? "border-destructive" : ""}`} value={formData.address} onChange={handleChange("address")} required aria-invalid={!!errors.address} />
                      </FormField>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Additional Information</label>
                        <Textarea placeholder="Tell us about your situation..." rows={3} value={formData.message} onChange={handleChange("message")} />
                      </div>

                      <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.01]" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : (
                          <><DollarSign className="h-5 w-5 mr-2" aria-hidden="true" />Get My Cash Offer</>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        🔒 No obligation • We respect your privacy
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-border">
              {STATS.map(({ value, suffix, label }) => (
                <div key={label} className="py-5 sm:py-8 md:py-10 text-center px-1">
                  <div className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-primary tracking-tight">
                    {value}<span className="text-sm sm:text-lg md:text-2xl font-bold ml-0.5 sm:ml-1">{suffix}</span>
                  </div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section aria-label="Benefits" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                Why Homeowners Choose Us
              </h2>
              <p className="text-lg text-muted-foreground">
                We make selling your home simple, fast, and stress-free
              </p>
            </div>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {BENEFITS.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                      <p className="text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section aria-label="Process" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to sell your home
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
              {PROCESS_STEPS.map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                    {step}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl text-foreground font-medium italic leading-relaxed mb-6">
                "They gave me a fair offer and closed in just 10 days. No hassle at all! I was facing foreclosure and they really saved me."
              </blockquote>
              <div>
                <p className="font-bold text-foreground">Maria S.</p>
                <p className="text-sm text-muted-foreground">Orlando, FL</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-10 sm:py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-foreground mb-3 sm:mb-4">
              Ready to Sell Your Home?
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/80 mb-6 sm:mb-8 max-w-lg mx-auto">
              Get your free, no-obligation cash offer today. We respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="#get-offer"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-background text-foreground font-bold rounded-xl hover:bg-background/90 transition-all hover:scale-[1.02] text-base sm:text-lg shadow-xl"
              >
                <DollarSign className="h-5 w-5" />
                Get My Cash Offer
              </a>
              <a
                href="tel:+17868828251"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-primary-foreground/30 text-primary-foreground font-semibold rounded-xl hover:bg-primary-foreground/10 transition-all"
              >
                <Phone className="h-5 w-5" />
                Call (786) 882-8251
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container mx-auto px-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MyLocalInvest. All rights reserved.
            </p>
            <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Team Member? Sign in here
            </a>
          </div>
        </footer>
      </main>
    </>
  );
};

/** Reusable form field with label, error, and optional icon */
const FormField = forwardRef<HTMLDivElement, { label: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }>(
  ({ label, error, icon, children }, ref) => (
    <div ref={ref}>
      <label className="text-sm font-medium text-foreground mb-1 block">{label} *</label>
      <div className={icon ? "relative" : undefined}>
        {icon}
        {children}
      </div>
      {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}
    </div>
  )
);
FormField.displayName = "FormField";

export default Index;
