import { useState } from "react";
import { z } from "zod";
import { TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IncreaseOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  propertyAddress?: string;
  currentOffer?: number;
}

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Valid 10-digit phone required"),
  email: z.string().trim().email("Valid email required").max(255).optional().or(z.literal("")),
  desired_amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

const IncreaseOfferModal = ({ open, onOpenChange, propertyId, propertyAddress, currentOffer }: IncreaseOfferModalProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", desired_amount: "", reason: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please check the form", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-offer-action", {
        body: {
          action_type: "increase_offer",
          property_id: propertyId,
          property_address: propertyAddress,
          ...parsed.data,
        },
      });
      if (error) throw error;
      toast({ title: "Counter-offer received!", description: "We'll respond within 24 hours." });
      setForm({ name: "", phone: "", email: "", desired_amount: "", reason: "" });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Something went wrong", description: "Please try again or contact us directly.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Increase My Offer
          </DialogTitle>
          <DialogDescription>
            Tell us what you'd like for {propertyAddress || "your property"}. We review every request personally.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="io-amount">Your desired amount (USD) *</Label>
            <Input
              id="io-amount"
              data-field="desired_amount"
              type="number"
              min={1}
              placeholder={currentOffer ? `Current offer: $${currentOffer.toLocaleString()}` : "$250,000"}
              value={form.desired_amount}
              onChange={(e) => setForm({ ...form, desired_amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="io-reason">Why this amount? (optional)</Label>
            <Textarea
              id="io-reason"
              data-field="reason"
              placeholder="Recent renovations, comparable sales nearby, etc."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="io-name">Name *</Label>
              <Input id="io-name" data-field="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="io-phone">Phone *</Label>
              <Input id="io-phone" data-field="phone" type="tel" placeholder="(305) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="io-email">Email (optional)</Label>
            <Input id="io-email" data-field="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Button
            type="submit"
            data-action="submit-increase-offer"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? "Sending..." : "Send Counter-Offer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncreaseOfferModal;
