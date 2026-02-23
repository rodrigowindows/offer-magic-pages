import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Play, Mail, MessageSquare, Phone, ArrowRight } from "lucide-react";
import { addDays } from "date-fns";

interface Property {
  id: string;
  address: string;
  city: string;
}

interface StartSequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProperties: Property[];
}

export const StartSequenceDialog = ({ open, onOpenChange, selectedProperties }: StartSequenceDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("");

  const { data: sequences } = useQuery({
    queryKey: ["sequences"],
    queryFn: async () => {
      const { data: seqs, error: seqError } = await supabase
        .from("campaign_sequences")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (seqError) throw seqError;

      const { data: steps, error: stepsError } = await supabase
        .from("sequence_steps")
        .select("*")
        .order("step_order", { ascending: true });
      if (stepsError) throw stepsError;

      return seqs?.map(seq => ({
        ...seq,
        steps: steps?.filter(s => s.sequence_id === seq.id) || [],
      }));
    },
  });

  const startSequenceMutation = useMutation({
    mutationFn: async () => {
      const sequence = sequences?.find(s => s.id === selectedSequenceId);
      if (!sequence || !sequence.steps?.length) throw new Error("Invalid sequence");

      const firstStep = sequence.steps[0];
      const secondStep = sequence.steps[1];
      
      const propertySequences = selectedProperties.map(property => ({
        property_id: property.id,
        sequence_id: selectedSequenceId,
        current_step: 1,
        status: "active",
        started_at: new Date().toISOString(),
        last_step_at: new Date().toISOString(),
        next_step_due: secondStep 
          ? addDays(new Date(), secondStep.delay_days).toISOString()
          : null,
      }));

      const { error } = await supabase
        .from("property_sequences")
        .insert(propertySequences);
      if (error) throw error;

      // Create follow-up reminders for next steps
      if (secondStep) {
        const reminders = selectedProperties.map(property => ({
          property_id: property.id,
          reminder_type: "sequence_step",
          due_date: addDays(new Date(), secondStep.delay_days).toISOString(),
          notes: `Step 2: ${secondStep.channel} follow-up`,
        }));

        await supabase.from("follow_up_reminders").insert(reminders);
      }

      return { firstStep, count: selectedProperties.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["property-sequences"] });
      queryClient.invalidateQueries({ queryKey: ["follow-up-reminders"] });
      onOpenChange(false);
      toast({ 
        title: "Sequence started",
        description: `${result.count} properties added to sequence. First step: ${result.firstStep.channel}`,
      });
    },
    onError: (error) => {
      toast({ title: "Error starting sequence", description: error.message, variant: "destructive" });
    },
  });

  const selectedSequence = sequences?.find(s => s.id === selectedSequenceId);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Multi-Channel Sequence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Selected Properties: <Badge variant="secondary">{selectedProperties.length}</Badge>
            </p>
            <div className="max-h-24 overflow-y-auto text-sm space-y-1 bg-muted/50 rounded p-2">
              {selectedProperties.slice(0, 5).map(p => (
                <p key={p.id} className="truncate">{p.address}, {p.city}</p>
              ))}
              {selectedProperties.length > 5 && (
                <p className="text-muted-foreground">+{selectedProperties.length - 5} more...</p>
              )}
            </div>
          </div>

          <div>
            <Label>Select Sequence</Label>
            <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sequence..." />
              </SelectTrigger>
              <SelectContent>
                {sequences?.map(seq => (
                  <SelectItem key={seq.id} value={seq.id}>
                    {seq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSequence && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Sequence Steps:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSequence.steps?.map((step: any, i: number) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <div className="flex items-center gap-1 px-2 py-1 bg-background rounded border border-border text-sm">
                      {getChannelIcon(step.channel)}
                      <span className="capitalize">{step.channel}</span>
                      {step.delay_days > 0 && (
                        <span className="text-muted-foreground text-xs">
                          +{step.delay_days}d
                        </span>
                      )}
                    </div>
                    {i < (selectedSequence.steps?.length || 0) - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              {selectedSequence.description && (
                <p className="text-xs text-muted-foreground mt-2">{selectedSequence.description}</p>
              )}
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={() => startSequenceMutation.mutate()}
            disabled={!selectedSequenceId || startSequenceMutation.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Sequence for {selectedProperties.length} Properties
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};