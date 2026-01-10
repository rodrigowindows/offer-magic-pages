/**
 * Histórico de Comunicações
 * Lista e filtra todas as comunicações enviadas
 */

import { useState, useMemo } from 'react';
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
import { useMarketingStore } from '@/store/marketingStore';
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
} from 'lucide-react';
import type { CommunicationHistory } from '@/types/marketing.types';

export const History = () => {
  const history = useMarketingStore((state) => state.history);
  const clearHistory = useMarketingStore((state) => state.clearHistory);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Filtros aplicados
  const filteredHistory = useMemo(() => {
    return (Array.isArray(history) ? history : []).filter((item) => {
      // Search
      const matchesSearch =
        searchTerm === '' ||
        (typeof item.recipient.name === 'string' && item.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof item.recipient.phone_number === 'string' && item.recipient.phone_number.includes(searchTerm)) ||
        (typeof item.recipient.email === 'string' && item.recipient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof item.recipient.address === 'string' && item.recipient.address.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      // Channel filter - safely check if channels is an array
      const matchesChannel =
        channelFilter === 'all' || (Array.isArray(item.channels) && item.channels.includes(channelFilter as any));

      // Mode filter (test/production)
      const matchesMode =
        modeFilter === 'all' ||
        (modeFilter === 'test' && item.test_mode) ||
        (modeFilter === 'production' && !item.test_mode);

      return matchesSearch && matchesStatus && matchesChannel && matchesMode;
    });
  }, [history, searchTerm, statusFilter, channelFilter, modeFilter]);

  // Exportar para CSV
  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Name',
      'Phone',
      'Email',
      'Address',
      'Channels',
      'Status',
      'Mode',
      'Response',
    ];

    const rows = filteredHistory.map((item) => [
      new Date(item.timestamp).toISOString(),
      item.recipient.name,
      item.recipient.phone_number,
      item.recipient.email || '',
      item.recipient.address || '',
      Array.isArray(item.channels) ? item.channels.join('; ') : '',
      item.status,
      item.test_mode ? 'Test' : 'Production',
      JSON.stringify(item.response),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-history-${new Date().toISOString().split('T')[0]}.csv`;
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
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

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

            {/* Mode Filter */}
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>

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
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {history.length === 0
                ? 'No communications yet. Send your first communication to see it here!'
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
const HistoryItem = ({ item }: { item: CommunicationHistory }) => {
  const [expanded, setExpanded] = useState(false);

  const channelIcons = {
    sms: MessageSquare,
    email: Mail,
    call: Phone,
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {item.status === 'sent' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium flex items-center gap-2">
                  {item.recipient.name}
                  {item.test_mode && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <TestTube2 className="w-3 h-3 mr-1" />
                      Test
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.recipient.phone_number}
                  {item.recipient.email && ` • ${item.recipient.email}`}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="flex gap-2 mb-3">
            {(Array.isArray(item.channels) ? item.channels : []).map((channel) => {
              const Icon = channelIcons[channel];
              return (
                <Badge key={channel} variant="secondary" className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {channel.toUpperCase()}
                </Badge>
              );
            })}
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {item.recipient.address && (
                <div>
                  <span className="text-sm font-medium">Address: </span>
                  <span className="text-sm text-muted-foreground">
                    {item.recipient.address}
                  </span>
                </div>
              )}

              {item.recipient.seller_name && (
                <div>
                  <span className="text-sm font-medium">Seller: </span>
                  <span className="text-sm text-muted-foreground">
                    {item.recipient.seller_name}
                  </span>
                </div>
              )}

              <div>
                <span className="text-sm font-medium">Response: </span>
                <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                  {JSON.stringify(item.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default History;
