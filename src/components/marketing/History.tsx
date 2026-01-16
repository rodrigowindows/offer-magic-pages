/**
 * Histórico de Comunicações
 * Lista e filtra todas as comunicações enviadas
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  TestTube2,
  Calendar,
  RefreshCw,
  Eye,
  AlertCircle,
  Clock,
  Send,
  MailOpen,
  MousePointerClick,
} from 'lucide-react';

interface CampaignLog {
  id: string;
  property_id: string | null;
  channel: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;
  property_address: string | null;
  sent_at: string;
  tracking_id: string;
  metadata: any;
  campaign_type: string;
  html_content?: string | null;
  status?: string | null;
  api_response?: any;
  api_status?: number | null;
}

export const History = () => {
  const [history, setHistory] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<string>('all');

  // Fetch history from database
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching campaign history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtros aplicados
  const filteredHistory = useMemo(() => {
    return (Array.isArray(history) ? history : []).filter((item) => {
      // Search
      const matchesSearch =
        searchTerm === '' ||
        (typeof item.recipient_name === 'string' && item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof item.recipient_phone === 'string' && item.recipient_phone.includes(searchTerm)) ||
        (typeof item.recipient_email === 'string' && item.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof item.property_address === 'string' && item.property_address.toLowerCase().includes(searchTerm.toLowerCase()));

      // Channel filter
      const matchesChannel =
        channelFilter === 'all' || item.channel === channelFilter;

      // Campaign type filter
      const matchesCampaignType =
        campaignTypeFilter === 'all' || item.campaign_type === campaignTypeFilter;

      return matchesSearch && matchesChannel && matchesCampaignType;
    });
  }, [history, searchTerm, channelFilter, campaignTypeFilter]);

  // Exportar para CSV
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Name',
      'Phone',
      'Email',
      'Address',
      'Channel',
      'Campaign Type',
      'Template',
      'Tracking ID',
    ];

    const rows = filteredHistory.map((item) => [
      new Date(item.sent_at).toISOString(),
      item.recipient_name || '',
      item.recipient_phone || '',
      item.recipient_email || '',
      item.property_address || '',
      item.channel || '',
      item.campaign_type,
      item.metadata?.template_name || '',
      item.tracking_id,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const channelIcons = {
    sms: MessageSquare,
    email: Mail,
    call: Phone,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Communication History</h1>
        <p className="text-muted-foreground">
          View and manage all sent communications
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Channel Filter */}
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Call</SelectItem>
              </SelectContent>
            </Select>

            {/* Campaign Type Filter */}
            <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Campaign Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
                <SelectItem value="sequence">Sequence</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={fetchHistory}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredHistory.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {filteredHistory.length} of {history.length} communications
            </span>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading communications...
            </CardContent>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {history.length === 0
                ? 'No communications yet. Send your first campaign to see it here!'
                : 'No communications match your filters.'}
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
};

// Componente individual de histórico
const HistoryItem = ({ item }: { item: CampaignLog }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const channelIcons: Record<string, any> = {
    sms: MessageSquare,
    email: Mail,
    call: Phone,
  };

  const Icon = item.channel ? channelIcons[item.channel] : MessageSquare;

  // Status icon and color
  const getStatusInfo = () => {
    const status = item.status || 'sent';
    switch (status) {
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-green-500', label: 'Delivered', bg: 'bg-green-50' };
      case 'opened':
        return { icon: MailOpen, color: 'text-blue-500', label: 'Opened', bg: 'bg-blue-50' };
      case 'clicked':
        return { icon: MousePointerClick, color: 'text-purple-500', label: 'Clicked', bg: 'bg-purple-50' };
      case 'bounced':
        return { icon: XCircle, color: 'text-orange-500', label: 'Bounced', bg: 'bg-orange-50' };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-500', label: 'Failed', bg: 'bg-red-50' };
      case 'sent':
      default:
        return { icon: Send, color: 'text-gray-500', label: 'Sent', bg: 'bg-gray-50' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div>
          {/* Header Row */}
          <div
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0`} />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {item.recipient_name || 'Unknown'}
                    <Badge variant="outline" className="capitalize">
                      {item.campaign_type}
                    </Badge>
                    <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.recipient_phone && item.recipient_phone}
                    {item.recipient_email && (item.recipient_phone ? ` • ${item.recipient_email}` : item.recipient_email)}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.sent_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.sent_at).toLocaleTimeString()}
                </div>
              </div>
            </div>

          {/* Channel Badge */}
          {item.channel && (
            <div className="flex gap-2 mb-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {item.channel.toUpperCase()}
              </Badge>
              {item.metadata?.template_name && (
                <Badge variant="outline">
                  {item.metadata.template_name}
                </Badge>
              )}
            </div>
          )}
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Content Preview */}
              {item.html_content && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Content Preview:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreview(!showPreview);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  </div>
                  {showPreview && (
                    <div className="border rounded-lg p-4 bg-white max-h-96 overflow-auto">
                      <div dangerouslySetInnerHTML={{ __html: item.html_content }} />
                    </div>
                  )}
                </div>
              )}

              {/* API Response */}
              {item.api_response && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">API Response:</span>
                    <Badge variant={item.api_status === 200 || item.api_status === 201 ? 'default' : 'destructive'}>
                      Status: {item.api_status || 'N/A'}
                    </Badge>
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(item.api_response, null, 2)}
                  </pre>
                </div>
              )}

              {/* Property Address */}
              {item.property_address && (
                <div>
                  <span className="text-sm font-medium">Property Address: </span>
                  <span className="text-sm text-muted-foreground">
                    {item.property_address}
                  </span>
                </div>
              )}

              {/* Email Subject */}
              {item.metadata?.subject && (
                <div>
                  <span className="text-sm font-medium">Email Subject: </span>
                  <span className="text-sm text-muted-foreground">
                    {item.metadata.subject}
                  </span>
                </div>
              )}

              {/* Tracking ID */}
              {item.tracking_id && (
                <div>
                  <span className="text-sm font-medium">Tracking ID: </span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {item.tracking_id}
                  </code>
                </div>
              )}

              {/* Other Metadata */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium hover:text-primary">
                    Additional Metadata
                  </summary>
                  <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default History;
