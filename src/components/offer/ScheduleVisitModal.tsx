import { useState } from "react";
import { z } from "zod";
import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  propertyAddress?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Valid 10-digit phone required"),
  preferred_times: z.string().trim().min(1, "Please tell us your preferred time").max(500),
});


const ScheduleVisitModal = ({ open, onOpenChange, propertyId, propertyAddress }: ScheduleVisitModalProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", preferred_times: "" });

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
          action_type: "schedule_visit",
          property_id: propertyId,
          property_address: propertyAddress,
          ...parsed.data,
        },
      });
      if (error) throw error;
      toast({ title: "Visit request received!", description: "We'll confirm your visit shortly." });
      setForm({ name: "", phone: "", preferred_times: "" });
      onOpenChange(false);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again or call us.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Schedule a Visit
          </DialogTitle>
          <DialogDescription>
            A quick visit often lets us improve the price for {propertyAddress || "your property"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="sv-name">Name *</Label>
              <Input id="sv-name" data-field="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="sv-phone">Phone *</Label>
              <Input id="sv-phone" data-field="phone" type="tel" placeholder="(305) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="sv-times">Best times for a visit *</Label>
            <Textarea
              id="sv-times"
              data-field="preferred_times"
              placeholder="Tomorrow afternoon, Friday morning, etc."
              value={form.preferred_times}
              onChange={(e) => setForm({ ...form, preferred_times: e.target.value })}
              rows={3}
              required
            />
          </div>
          <Button type="submit" data-action="submit-schedule-visit" disabled={submitting} className="w-full">
            {submitting ? "Sending..." : "Request Visit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitModal;
