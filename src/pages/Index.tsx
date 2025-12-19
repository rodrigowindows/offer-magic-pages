import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { z } from "zod";

// Form validation schema
const leadFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(
    /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    "Telefone inválido. Use formato: (407) 555-0123"
  ),
  address: z.string().min(10, "Por favor, forneça o endereço completo"),
  message: z.string().optional(),
});

const Index = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validated = leadFormSchema.parse(formData);

      // Check for duplicates (same address)
      const { data: existing } = await supabase
        .from("properties")
        .select("id, address")
        .ilike("address", `%${validated.address}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: "⚠️ Já Recebemos Seu Pedido",
          description: "Encontramos um pedido anterior com este endereço. Entraremos em contato em breve!",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      // Create a new property lead
      const slug = validated.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase
        .from("properties")
        .insert([
          {
            owner_name: formData.name,
            owner_phone: formData.phone,
            address: formData.address,
            slug: slug,
            zip_code: "00000",
            estimated_value: 0,
            cash_offer_amount: 0,
            status: "active",
            lead_status: "new",
          },
        ]);

      if (error) throw error;

      toast({
        title: "✅ Request Received!",
        description: "We'll contact you within 24 hours with a cash offer.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Erro de Validação",
          description: "Por favor, corrija os erros no formulário",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao enviar o formulário",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              MyLocalInvest
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Orlando's Trusted Cash Home Buyers
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Left: Benefits */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Get a Fair Cash Offer Today
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Facing tax deed issues in Orlando? We help homeowners with fast, fair cash offers.
                  No repairs needed, no commissions, and we can close in as little as 7 days.
                </p>

                {/* Benefits List */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">No Repairs Needed</h3>
                      <p className="text-sm text-muted-foreground">
                        We buy houses in any condition - as-is
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Fast Closing</h3>
                      <p className="text-sm text-muted-foreground">
                        Close in as little as 7 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">No Fees or Commissions</h3>
                      <p className="text-sm text-muted-foreground">
                        We cover all closing costs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Fair Cash Offers</h3>
                      <p className="text-sm text-muted-foreground">
                        Transparent pricing, no hidden fees
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <a
                    href="tel:407-555-0123"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Call Us: (407) 555-0123
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Lead Capture Form */}
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Request Your Cash Offer
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll contact you within 24 hours
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-red-500" : ""}
                    required
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="(407) 555-0123"
                      className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Property Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="123 Main St, Orlando, FL 32801"
                      className={`pl-10 ${errors.address ? "border-red-500" : ""}`}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Additional Information
                  </label>
                  <Textarea
                    placeholder="Tell us about your situation..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5 mr-2" />
                      Get My Cash Offer
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  No obligation. We respect your privacy.
                </p>
              </form>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <div className="text-4xl font-bold text-primary mb-2">7 Days</div>
              <p className="text-muted-foreground">Average closing time</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <div className="text-4xl font-bold text-primary mb-2">$0</div>
              <p className="text-muted-foreground">Fees or commissions</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-muted-foreground">Fair cash offers</p>
            </div>
          </div>

          {/* Footer Link */}
          <div className="text-center">
            <a
              href="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Team Member? Sign in here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
