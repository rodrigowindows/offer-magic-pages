import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Clock, Play, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  property_ids: string[];
  scheduled_at: string;
  time_slot: string;
  status: string;
  executed_at?: string;
  results?: any;
  error_message?: string;
}

export const ScheduledCampaigns = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadScheduledCampaigns();
  }, []);

  const loadScheduledCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_campaigns')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading scheduled campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCampaignNow = async (campaignId: string) => {
    setExecuting(campaignId);
    try {
      // Call the process function
      const { data, error } = await supabase.functions.invoke('process-scheduled-campaigns');

      if (error) throw error;

      toast({
        title: 'Campaign Executed',
        description: 'Campaign has been processed successfully',
      });

      // Reload campaigns
      await loadScheduledCampaigns();
    } catch (error) {
      console.error('Error executing campaign:', error);
      toast({
        title: 'Execution Failed',
        description: 'Failed to execute campaign',
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled campaign?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campaign Deleted',
        description: 'Scheduled campaign has been deleted',
      });

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'processing':
        return <Badge variant="default"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading scheduled campaigns...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Campaigns
          </CardTitle>
          <CardDescription>
            Manage your scheduled marketing campaigns for optimal timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No scheduled campaigns found. Use the Campaign Manager to schedule campaigns for better response rates.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{campaign.campaign_name}</h3>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline">{campaign.campaign_type.toUpperCase()}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <span className="font-medium">Scheduled:</span>
                            <br />
                            {format(new Date(campaign.scheduled_at), 'MMM dd, yyyy hh:mm a')}
                          </div>
                          <div>
                            <span className="font-medium">Time Slot:</span>
                            <br />
                            {campaign.time_slot}
                          </div>
                          <div>
                            <span className="font-medium">Properties:</span>
                            <br />
                            {campaign.property_ids.length}
                          </div>
                          {campaign.executed_at && (
                            <div>
                              <span className="font-medium">Executed:</span>
                              <br />
                              {format(new Date(campaign.executed_at), 'MMM dd, hh:mm a')}
                            </div>
                          )}
                        </div>

                        {campaign.results && (
                          <div className="text-sm">
                            <span className="font-medium">Results:</span>
                            <span className="ml-2">
                              ✅ {campaign.results.success_count || 0} success •
                              ❌ {campaign.results.error_count || 0} failed
                            </span>
                          </div>
                        )}

                        {campaign.error_message && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertDescription className="text-sm">
                              {campaign.error_message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {campaign.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeCampaignNow(campaign.id)}
                            disabled={executing === campaign.id}
                          >
                            {executing === campaign.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Play className="w-3 h-3 mr-1" />
                            )}
                            Execute Now
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};