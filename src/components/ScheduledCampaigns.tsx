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
      // Use campaign_logs as a workaround since scheduled_campaigns doesn't exist
      const { data, error } = await supabase
        .from('campaign_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Map campaign_logs to ScheduledCampaign format
      const mappedCampaigns: ScheduledCampaign[] = (data || []).map(log => ({
        id: log.id,
        campaign_name: log.campaign_type || 'Campaign',
        campaign_type: log.channel || 'sms',
        property_ids: log.property_id ? [log.property_id] : [],
        scheduled_at: log.sent_at,
        time_slot: format(new Date(log.sent_at), 'HH:mm'),
        status: log.link_clicked ? 'completed' : 'pending',
        executed_at: log.clicked_at || undefined,
        results: log.api_response,
        error_message: log.api_status !== 200 ? 'Error occurred' : undefined,
      }));
      
      setCampaigns(mappedCampaigns);
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
        .from('campaign_logs')
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
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Campaigns
        </CardTitle>
        <CardDescription>
          View and manage your scheduled marketing campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No scheduled campaigns found. Create a new campaign to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{campaign.campaign_name}</span>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(campaign.scheduled_at), 'PPp')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Type: {campaign.campaign_type} • {campaign.property_ids.length} properties
                  </div>
                  {campaign.error_message && (
                    <p className="text-sm text-destructive">{campaign.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => executeCampaignNow(campaign.id)}
                      disabled={executing === campaign.id}
                    >
                      {executing === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCampaign(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
