import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail, MessageSquare, Phone, ArrowRight, Play, Pause, CheckCircle } from "lucide-react";

interface SequenceStep {
  id: string;
  step_order: number;
  channel: string;
  delay_days: number;
  message_template: string | null;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  steps?: SequenceStep[];
}

export const SequenceManager = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({ name: "", description: "" });
  const [newSteps, setNewSteps] = useState<{ channel: string; delay_days: number }[]>([
    { channel: "email", delay_days: 0 },
  ]);

  const { data: sequences, isLoading } = useQuery({
    queryKey: ["sequences"],
    queryFn: async () => {
      const { data: seqs, error: seqError } = await supabase
        .from("campaign_sequences")
        .select("*")
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
      })) as Sequence[];
    },
  });

  const { data: propertySequences } = useQuery({
    queryKey: ["property-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_sequences")
        .select("*, properties(address, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createSequenceMutation = useMutation({
    mutationFn: async () => {
      const { data: seq, error: seqError } = await supabase
        .from("campaign_sequences")
        .insert({ name: newSequence.name, description: newSequence.description })
        .select()
        .single();
      if (seqError) throw seqError;

      const stepsToInsert = newSteps.map((step, index) => ({
        sequence_id: seq.id,
        step_order: index + 1,
        channel: step.channel,
        delay_days: step.delay_days,
      }));

      const { error: stepsError } = await supabase
        .from("sequence_steps")
        .insert(stepsToInsert);
      if (stepsError) throw stepsError;

      return seq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      setIsCreateOpen(false);
      setNewSequence({ name: "", description: "" });
      setNewSteps([{ channel: "email", delay_days: 0 }]);
      toast({ title: "Sequence created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating sequence", description: error.message, variant: "destructive" });
    },
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaign_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      toast({ title: "Sequence deleted" });
    },
  });

  const addStep = () => {
    const lastStep = newSteps[newSteps.length - 1];
    setNewSteps([...newSteps, { channel: "sms", delay_days: lastStep.delay_days + 2 }]);
  };

  const removeStep = (index: number) => {
    if (newSteps.length > 1) {
      setNewSteps(newSteps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: string, value: string | number) => {
    const updated = [...newSteps];
    updated[index] = { ...updated[index], [field]: value };
    setNewSteps(updated);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "responded": return "default";
      case "paused": return "outline";
      default: return "secondary";
    }
  };

  const activeSequences = propertySequences?.filter(ps => ps.status === "active") || [];

  return (
    <div className="space-y-6">
      {/* Active Sequences Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSequences.length}</p>
                <p className="text-xs text-muted-foreground">Active Sequences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {propertySequences?.filter(ps => ps.status === "responded").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Got Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <Pause className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {propertySequences?.filter(ps => ps.status === "paused").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {propertySequences?.filter(ps => ps.status === "completed").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sequence Templates</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Sequence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Sequence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Sequence Name</Label>
                  <Input
                    value={newSequence.name}
                    onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                    placeholder="e.g., Aggressive Follow-up"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newSequence.description}
                    onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                    placeholder="e.g., For hot leads"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Steps</Label>
                    <Button variant="outline" size="sm" onClick={addStep}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  
                  {newSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <Select
                        value={step.channel}
                        onValueChange={(v) => updateStep(index, "channel", v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">after</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-16"
                        value={step.delay_days}
                        onChange={(e) => updateStep(index, "delay_days", parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                      {newSteps.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => createSequenceMutation.mutate()}
                  disabled={!newSequence.name || createSequenceMutation.isPending}
                >
                  Create Sequence
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : sequences?.length === 0 ? (
            <p className="text-muted-foreground">No sequences created yet.</p>
          ) : (
            <div className="space-y-4">
              {sequences?.map((seq) => (
                <div key={seq.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{seq.name}</h3>
                      {seq.description && (
                        <p className="text-sm text-muted-foreground">{seq.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSequenceMutation.mutate(seq.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {seq.steps?.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-1">
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                          {getChannelIcon(step.channel)}
                          <span className="capitalize">{step.channel}</span>
                          {step.delay_days > 0 && (
                            <span className="text-muted-foreground text-xs">
                              +{step.delay_days}d
                            </span>
                          )}
                        </div>
                        {i < (seq.steps?.length || 0) - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Property Sequences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Properties in Sequences</CardTitle>
        </CardHeader>
        <CardContent>
          {propertySequences?.length === 0 ? (
            <p className="text-muted-foreground">No properties in sequences yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Property</th>
                    <th className="text-left py-3 px-2 font-medium">Sequence</th>
                    <th className="text-center py-3 px-2 font-medium">Current Step</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Next Step Due</th>
                  </tr>
                </thead>
                <tbody>
                  {propertySequences?.slice(0, 10).map((ps: any) => {
                    const seq = sequences?.find(s => s.id === ps.sequence_id);
                    return (
                      <tr key={ps.id} className="border-b border-border/50">
                        <td className="py-3 px-2">
                          {ps.properties?.address}, {ps.properties?.city}
                        </td>
                        <td className="py-3 px-2">{seq?.name || "Unknown"}</td>
                        <td className="text-center py-3 px-2">
                          {ps.current_step} / {seq?.steps?.length || "?"}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={getStatusColor(ps.status)}>{ps.status}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          {ps.next_step_due 
                            ? new Date(ps.next_step_due).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};