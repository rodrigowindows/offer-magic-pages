import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  property_id: string | null;
  selling_timeline: string;
  status: string;
  created_at: string;
  updated_at: string;
  contacted: boolean;
  contacted_at: string | null;
  notes: string | null;
  properties?: {
    address: string;
    city: string;
    state: string;
    cash_offer_amount: number;
  };
}

interface LeadsStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  urgent: number;
}

export const LeadsManager = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats>({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  const fetchLeads = async () => {
    try {
      setLoading(true);

      // 1. Fetch form submissions from property_leads
      const { data: formLeads, error: formError } = await supabase
        .from('property_leads')
        .select(`
          *,
          properties (
            address,
            city,
            state,
            cash_offer_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (formError) throw formError;

      // 2. Fetch clicks from campaign_logs (link_clicked = true)
      const { data: campaignClicks, error: clickError } = await supabase
        .from('campaign_logs')
        .select(`
          id,
          property_id,
          channel,
          link_clicked,
          click_count,
          sent_at,
          first_response_at,
          properties (
            id,
            address,
            city,
            state,
            zip_code,
            owner_name,
            owner_phone,
            owner_email,
            cash_offer_amount,
            skip_trace_data
          )
        `)
        .eq('link_clicked', true)
        .order('sent_at', { ascending: false });

      if (clickError) {
        console.error('Error fetching campaign clicks:', clickError);
      }

      // 3. Convert campaign clicks to Lead format
      const clickLeads: Lead[] = (campaignClicks || [])
        .filter(click => click.properties) // Only clicks with valid properties
        .map(click => {
          const prop = click.properties!;
          // Get owner name from skip_trace_data or owner_name
          let ownerName = prop.owner_name || 'Unknown';
          if (prop.skip_trace_data) {
            if (prop.skip_trace_data.owner_name) {
              ownerName = prop.skip_trace_data.owner_name;
            } else if (prop.skip_trace_data.first_name && prop.skip_trace_data.last_name) {
              ownerName = `${prop.skip_trace_data.first_name} ${prop.skip_trace_data.last_name}`;
            }
          }

          return {
            id: click.id,
            full_name: ownerName,
            email: prop.owner_email || prop.skip_trace_data?.email1 || '',
            phone: prop.owner_phone || prop.skip_trace_data?.phone1 || '',
            property_id: click.property_id,
            selling_timeline: 'exploring', // Default for click-based leads
            status: 'new', // Default status for clicks
            created_at: click.first_response_at || click.sent_at,
            updated_at: click.first_response_at || click.sent_at,
            contacted: false,
            contacted_at: null,
            notes: `Clicou no link via ${click.channel} (${click.click_count || 1} cliques)`,
            properties: {
              address: prop.address,
              city: prop.city,
              state: prop.state,
              cash_offer_amount: prop.cash_offer_amount || 0,
            },
          };
        });

      // 4. Combine both sources (form leads + click leads)
      // Remove duplicates based on property_id (prefer form submissions)
      const allLeads = [...(formLeads || []), ...clickLeads];
      const uniqueLeads = allLeads.reduce((acc, lead) => {
        const existingIndex = acc.findIndex(l => l.property_id === lead.property_id);
        if (existingIndex === -1) {
          acc.push(lead);
        } else {
          // Keep form submission over click if both exist
          if (!acc[existingIndex].property_id || lead.property_id) {
            // If existing has no property_id or current has property_id, replace
            if (formLeads?.some(fl => fl.id === lead.id)) {
              acc[existingIndex] = lead;
            }
          }
        }
        return acc;
      }, [] as Lead[]);

      setLeads(uniqueLeads);
      calculateStats(uniqueLeads);

      toast({
        title: 'Leads carregados',
        description: `${uniqueLeads.length} leads encontrados (${formLeads?.length || 0} formulários + ${clickLeads.length} cliques)`,
      });
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData: Lead[]) => {
    setStats({
      total: leadsData.length,
      new: leadsData.filter(l => l.status === 'new').length,
      contacted: leadsData.filter(l => l.status === 'contacted').length,
      qualified: leadsData.filter(l => l.status === 'qualified').length,
      urgent: leadsData.filter(l => l.selling_timeline === 'asap').length,
    });
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('property_leads')
        .update({
          status: newStatus,
          contacted: newStatus !== 'new',
          contacted_at: newStatus !== 'new' ? new Date().toISOString() : null,
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Lead marcado como "${newStatus}"`,
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Endereço', 'Status', 'Timeline', 'Data'];
    const rows = filteredLeads.map(lead => [
      lead.full_name,
      lead.email,
      lead.phone,
      lead.properties?.address || 'N/A',
      lead.status,
      lead.selling_timeline,
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        lead =>
          lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          lead.properties?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Timeline filter
    if (timelineFilter !== 'all') {
      filtered = filtered.filter(lead => lead.selling_timeline === timelineFilter);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, timelineFilter, leads]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      new: { color: 'bg-blue-500', icon: Clock },
      contacted: { color: 'bg-yellow-500', icon: Phone },
      qualified: { color: 'bg-green-500', icon: CheckCircle2 },
      'not-interested': { color: 'bg-gray-500', icon: XCircle },
      closed: { color: 'bg-purple-500', icon: Star },
    };

    const badge = badges[status] || badges.new;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTimelineBadge = (timeline: string) => {
    const colors: Record<string, string> = {
      asap: 'bg-red-500',
      '1-3months': 'bg-orange-500',
      '3-6months': 'bg-yellow-500',
      '6-12months': 'bg-blue-500',
      exploring: 'bg-gray-500',
    };

    return (
      <Badge className={`${colors[timeline] || 'bg-gray-500'} text-white`}>
        {timeline}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Leads Management
          </h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os leads do formulário de contato
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLeads} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Novos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Contactados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{stats.contacted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Qualificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.qualified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="qualified">Qualificados</SelectItem>
                <SelectItem value="not-interested">Não Interessados</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Timelines</SelectItem>
                <SelectItem value="asap">ASAP</SelectItem>
                <SelectItem value="1-3months">1-3 meses</SelectItem>
                <SelectItem value="3-6months">3-6 meses</SelectItem>
                <SelectItem value="6-12months">6-12 meses</SelectItem>
                <SelectItem value="exploring">Explorando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Clique em um lead para ver detalhes e atualizar status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Propriedade</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <a href={`mailto:${lead.email}`} className="hover:underline">
                              {lead.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <a href={`tel:${lead.phone}`} className="hover:underline">
                              {lead.phone}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.properties ? (
                          <div className="flex items-start gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-1" />
                            <div>
                              <div>{lead.properties.address}</div>
                              <div className="text-muted-foreground text-xs">
                                {lead.properties.city}, {lead.properties.state}
                              </div>
                              {lead.properties.cash_offer_amount && (
                                <div className="text-green-600 font-semibold text-xs">
                                  ${lead.properties.cash_offer_amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getTimelineBadge(lead.selling_timeline)}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="qualified">Qualificado</SelectItem>
                            <SelectItem value="not-interested">Não Interessado</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
