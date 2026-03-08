import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Mail, Phone, RefreshCw, ArrowUpRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface CampaignLog {
  id: string;
  campaign_type: string;
  channel: string | null;
  property_address: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  sent_at: string;
  status: string | null;
  link_clicked: boolean | null;
  clicked_at: string | null;
  first_response_at: string | null;
  click_count: number | null;
}

interface ChannelStats {
  total: number;
  responded: number;
  clicked: number;
  rate: number;
}

export const ResponseDashboard = () => {
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('campaign_logs')
        .select('id, campaign_type, channel, property_address, recipient_phone, recipient_email, recipient_name, sent_at, status, link_clicked, clicked_at, first_response_at, click_count')
        .order('sent_at', { ascending: false })
        .limit(500);
      setLogs((data as CampaignLog[]) || []);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getStats = (channel?: string): ChannelStats => {
    const filtered = channel ? logs.filter(l => l.channel === channel) : logs;
    const total = filtered.length;
    const responded = filtered.filter(l => l.first_response_at).length;
    const clicked = filtered.filter(l => l.link_clicked).length;
    return { total, responded, clicked, rate: total > 0 ? Math.round((responded / total) * 100) : 0 };
  };

  const allStats = getStats();
  const smsStats = getStats('sms');
  const emailStats = getStats('email');
  const callStats = getStats('call');

  const filteredLogs = activeChannel === 'all' ? logs : logs.filter(l => l.channel === activeChannel);

  const channelIcons: Record<string, React.ReactNode> = {
    sms: <MessageSquare className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    call: <Phone className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Dashboard de Respostas</h2>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Enviados', value: allStats.total, color: 'text-foreground' },
          { label: 'Respostas', value: allStats.responded, color: 'text-green-600' },
          { label: 'Clicks', value: allStats.clicked, color: 'text-blue-600' },
          { label: 'Taxa Resposta', value: `${allStats.rate}%`, color: allStats.rate > 5 ? 'text-green-600' : 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { ch: 'sms', stats: smsStats, icon: <MessageSquare className="h-4 w-4" />, label: 'SMS' },
          { ch: 'email', stats: emailStats, icon: <Mail className="h-4 w-4" />, label: 'Email' },
          { ch: 'call', stats: callStats, icon: <Phone className="h-4 w-4" />, label: 'Chamadas' },
        ].map(({ ch, stats, icon, label }) => (
          <Card key={ch} className="cursor-pointer hover:ring-1 hover:ring-primary" onClick={() => setActiveChannel(ch)}>
            <CardContent className="p-3 flex items-center gap-2">
              {icon}
              <div>
                <p className="text-xs font-bold">{label}</p>
                <p className="text-[10px] text-muted-foreground">{stats.total} enviados · {stats.responded} respostas</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs table */}
      <Card>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Histórico de Engajamento</CardTitle>
            <div className="flex gap-1">
              {['all', 'sms', 'email', 'call'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                    activeChannel === ch ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {ch === 'all' ? 'Todos' : ch.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-80 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">Nenhum registro encontrado</p>
            ) : (
              <table className="w-full text-[11px]">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1 font-medium">Canal</th>
                    <th className="text-left px-2 py-1 font-medium">Destinatário</th>
                    <th className="text-left px-2 py-1 font-medium">Propriedade</th>
                    <th className="text-left px-2 py-1 font-medium">Enviado</th>
                    <th className="text-left px-2 py-1 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.slice(0, 100).map(log => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-2 py-1">
                        <Badge variant="outline" className="text-[10px] gap-0.5">
                          {channelIcons[log.channel || ''] || null}
                          {log.channel?.toUpperCase() || '—'}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 truncate max-w-[120px]">
                        {log.recipient_name || log.recipient_phone || log.recipient_email || '—'}
                      </td>
                      <td className="px-2 py-1 truncate max-w-[150px]">{log.property_address || '—'}</td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {new Date(log.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-2 py-1">
                        {log.first_response_at ? (
                          <Badge className="text-[10px] bg-green-100 text-green-800 border-green-200">Respondeu</Badge>
                        ) : log.link_clicked ? (
                          <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-200">
                            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                            Click {log.click_count && log.click_count > 1 ? `(${log.click_count})` : ''}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            Aguardando
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
