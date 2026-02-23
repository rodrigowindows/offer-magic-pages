/**
 * Automated Follow-up Sequences
 * Sistema de sequências automatizadas de follow-up
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus,
  Play,
  Pause,
  Settings,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FollowUpSequence {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  steps: FollowUpStep[];
  created_at: string;
  updated_at: string;
}

interface FollowUpStep {
  id: string;
  delay_hours: number;
  channel: 'sms' | 'email' | 'call';
  template_id: string;
  conditions?: {
    min_score?: number;
    engagement_level?: string;
    preferred_channel?: string;
  };
}

const AutomatedSequences = () => {
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSequence, setCreatingSequence] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<FollowUpSequence | null>(null);
  const { toast } = useToast();

  // Form state for new sequence
  const [newSequence, setNewSequence] = useState({
    name: '',
    description: '',
    trigger_event: 'initial_contact',
    is_active: true,
    steps: [] as FollowUpStep[]
  });

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      setLoading(true);
      // Use campaign_sequences table which exists in the schema
      const { data, error } = await supabase
        .from('campaign_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to FollowUpSequence format
      const mappedSequences: FollowUpSequence[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        trigger_event: 'initial_contact',
        is_active: item.is_active || false,
        steps: [],
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setSequences(mappedSequences);
    } catch (error) {
      console.error('Error loading sequences:', error);
      toast({
        title: "Error",
        description: "Failed to load follow-up sequences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_sequences')
        .insert([{
          name: newSequence.name,
          description: newSequence.description,
          is_active: newSequence.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      const newSeq: FollowUpSequence = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        trigger_event: newSequence.trigger_event,
        is_active: data.is_active || false,
        steps: newSequence.steps,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSequences([newSeq, ...sequences]);
      setNewSequence({
        name: '',
        description: '',
        trigger_event: 'initial_contact',
        is_active: true,
        steps: []
      });
      setCreatingSequence(false);

      toast({
        title: "Success",
        description: "Follow-up sequence created successfully"
      });
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast({
        title: "Error",
        description: "Failed to create follow-up sequence",
        variant: "destructive"
      });
    }
  };

  const toggleSequence = async (sequenceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('campaign_sequences')
        .update({ is_active: isActive })
        .eq('id', sequenceId);

      if (error) throw error;

      setSequences(sequences.map(seq =>
        seq.id === sequenceId ? { ...seq, is_active: isActive } : seq
      ));

      toast({
        title: "Success",
        description: `Sequence ${isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error toggling sequence:', error);
      toast({
        title: "Error",
        description: "Failed to update sequence status",
        variant: "destructive"
      });
    }
  };

  const addStepToSequence = () => {
    const newStep: FollowUpStep = {
      id: `step_${Date.now()}`,
      delay_hours: 24,
      channel: 'sms',
      template_id: '',
      conditions: {}
    };

    setNewSequence({
      ...newSequence,
      steps: [...newSequence.steps, newStep]
    });
  };

  const updateStep = (stepId: string, updates: Partial<FollowUpStep>) => {
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    });
  };

  const removeStep = (stepId: string) => {
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps.filter(step => step.id !== stepId)
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'initial_contact': 'Initial Contact',
      'link_click': 'Link Click',
      'email_open': 'Email Open',
      'no_response': 'No Response',
      'property_viewed': 'Property Viewed'
    };
    return labels[trigger] || trigger;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automated Follow-up Sequences</h2>
          <p className="text-muted-foreground">Create intelligent, multi-step follow-up campaigns</p>
        </div>
        <Dialog open={creatingSequence} onOpenChange={setCreatingSequence}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sequence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Follow-up Sequence</DialogTitle>
              <DialogDescription>
                Build an automated sequence of follow-ups triggered by lead behavior
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sequence Name</Label>
                  <Input
                    id="name"
                    value={newSequence.name}
                    onChange={(e) => setNewSequence({...newSequence, name: e.target.value})}
                    placeholder="e.g., Hot Lead Nurture"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger Event</Label>
                  <Select
                    value={newSequence.trigger_event}
                    onValueChange={(value) => setNewSequence({...newSequence, trigger_event: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial_contact">Initial Contact</SelectItem>
                      <SelectItem value="link_click">Link Click</SelectItem>
                      <SelectItem value="email_open">Email Open</SelectItem>
                      <SelectItem value="no_response">No Response</SelectItem>
                      <SelectItem value="property_viewed">Property Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSequence.description}
                  onChange={(e) => setNewSequence({...newSequence, description: e.target.value})}
                  placeholder="Describe what this sequence does..."
                />
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Follow-up Steps</Label>
                  <Button onClick={addStepToSequence} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-3">
                  {newSequence.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-1">
                            <Badge variant="outline">{index + 1}</Badge>
                          </div>

                          <div className="col-span-2">
                            <Label className="text-sm">Delay (hours)</Label>
                            <Input
                              type="number"
                              value={step.delay_hours}
                              onChange={(e) => updateStep(step.id, { delay_hours: parseInt(e.target.value) || 0 })}
                              min="0"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-sm">Channel</Label>
                            <Select
                              value={step.channel}
                              onValueChange={(value: 'sms' | 'email' | 'call') => updateStep(step.id, { channel: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="call">Call</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-3">
                            <Label className="text-sm">Template ID</Label>
                            <Input
                              value={step.template_id}
                              onChange={(e) => updateStep(step.id, { template_id: e.target.value })}
                              placeholder="template_id"
                            />
                          </div>

                          <div className="col-span-3">
                            <Label className="text-sm">Min Score (optional)</Label>
                            <Input
                              type="number"
                              value={step.conditions?.min_score || ''}
                              onChange={(e) => updateStep(step.id, {
                                conditions: { ...step.conditions, min_score: parseInt(e.target.value) || undefined }
                              })}
                              placeholder="e.g., 50"
                              min="0"
                              max="100"
                            />
                          </div>

                          <div className="col-span-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeStep(step.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreatingSequence(false)}>
                  Cancel
                </Button>
                <Button onClick={createSequence} disabled={!newSequence.name || newSequence.steps.length === 0}>
                  Create Sequence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sequences List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{sequence.name}</CardTitle>
                  <CardDescription>{sequence.description}</CardDescription>
                </div>
                <Badge variant={sequence.is_active ? "default" : "secondary"}>
                  {sequence.is_active ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                  {sequence.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Trigger: {getTriggerLabel(sequence.trigger_event)}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Steps ({sequence.steps.length})</div>
                  {sequence.steps.slice(0, 3).map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {step.delay_hours}h
                      </Badge>
                      {getChannelIcon(step.channel)}
                      <span className="capitalize">{step.channel}</span>
                      {step.conditions?.min_score && (
                        <Badge variant="secondary" className="text-xs">
                          ≥{step.conditions.min_score}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {sequence.steps.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{sequence.steps.length - 3} more steps
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSequence(sequence.id, !sequence.is_active)}
                  >
                    {sequence.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Sequence Performance Insights</CardTitle>
          <CardDescription>AI-powered recommendations for sequence optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Optimization Tip:</strong> Sequences with SMS follow-ups within 5 minutes of initial contact
              show 40% higher response rates. Consider shortening delays for high-priority leads.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">68%</div>
              <div className="text-sm text-muted-foreground">SMS Response Rate</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">42%</div>
              <div className="text-sm text-muted-foreground">Email Open Rate</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">23%</div>
              <div className="text-sm text-muted-foreground">Call Connect Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AutomatedSequences };
