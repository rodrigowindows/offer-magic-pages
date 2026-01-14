import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { initiateCall } from '@/services/marketingService';
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
  Flame,
  MessageSquare,
  Trash2,
  PhoneCall,
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

export const LeadsManagerEnhanced = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
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
  const [showHotLeadsOnly, setShowHotLeadsOnly] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [callingLead, setCallingLead] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
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

      if (error) throw error;

      setLeads(data || []);
      calculateStats(data || []);

      toast({
        title: 'Leads carregados',
        description: `${data?.length || 0} leads encontrados`,
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

  // Real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'property_leads' },
        (payload) => {
          console.log('🔔 Lead updated in real-time!', payload);
          toast({
            title: '🔔 Novo Lead!',
            description: payload.eventType === 'INSERT' ? 'Um novo lead acabou de chegar!' : 'Lead atualizado',
          });
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const updateLeadNotes = async (leadId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('property_leads')
        .update({ notes })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Notas atualizadas',
        description: 'Observações salvas com sucesso',
      });

      setEditingNotes(null);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar notas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCallNow = async (lead: Lead) => {
    setCallingLead(lead.id);

    try {
      console.log('📞 Iniciando call para:', lead.full_name, lead.phone);

      const result = await initiateCall({
        name: lead.full_name,
        from_number: '7868828251', // Your company number
        to_number: lead.phone,
        address: lead.properties?.address || '',
        voicemail_drop: `Hi ${lead.full_name}, this is MyLocalInvest. We received your inquiry about ${lead.properties?.address}. We'd love to discuss our cash offer with you. Please call us back at 786-882-8251.`,
        seller_name: 'MyLocalInvest Team',
        test_mode: false,
      });

      console.log('✅ Call result:', result);

      // Update lead status to contacted
      await updateLeadStatus(lead.id, 'contacted');

      toast({
        title: '📞 Call Initiated!',
        description: `Calling ${lead.full_name} at ${lead.phone}`,
      });
    } catch (error: any) {
      console.error('❌ Call error:', error);
      toast({
        title: 'Erro ao iniciar chamada',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCallingLead(null);
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    const selectedIds = Array.from(selectedLeads);

    try {
      const { error } = await supabase
        .from('property_leads')
        .update({
          status: newStatus,
          contacted: newStatus !== 'new',
          contacted_at: newStatus !== 'new' ? new Date().toISOString() : null,
        })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Status atualizado em lote',
        description: `${selectedIds.length} leads atualizados`,
      });

      setSelectedLeads(new Set());
      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar em lote',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async () => {
    const selectedIds = Array.from(selectedLeads);

    if (!confirm(`Tem certeza que deseja deletar ${selectedIds.length} leads?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_leads')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Leads deletados',
        description: `${selectedIds.length} leads removidos`,
      });

      setSelectedLeads(new Set());
      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Endereço', 'Status', 'Timeline', 'Notas', 'Data'];
    const rows = filteredLeads.map(lead => [
      lead.full_name,
      lead.email,
      lead.phone,
      lead.properties?.address || 'N/A',
      lead.status,
      lead.selling_timeline,
      lead.notes || '',
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    a.click();
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;

    // Hot leads filter
    if (showHotLeadsOnly) {
      filtered = filtered.filter(lead => lead.selling_timeline === 'asap');
    }

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
  }, [searchTerm, statusFilter, timelineFilter, showHotLeadsOnly, leads]);

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
        {timeline === 'asap' && <Flame className="w-3 h-3 mr-1" />}
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
            Gerencie e acompanhe todos os leads - Atualizações em tempo real ✅
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

        <Card className="cursor-pointer hover:border-blue-500" onClick={() => setStatusFilter('new')}>
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

        <Card className="cursor-pointer hover:border-yellow-500" onClick={() => setStatusFilter('contacted')}>
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

        <Card className="cursor-pointer hover:border-green-500" onClick={() => setStatusFilter('qualified')}>
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

        <Card className="cursor-pointer hover:border-red-500" onClick={() => setShowHotLeadsOnly(!showHotLeadsOnly)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Flame className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="flex items-center space-x-2">
              <Switch
                id="hot-leads"
                checked={showHotLeadsOnly}
                onCheckedChange={setShowHotLeadsOnly}
              />
              <Label htmlFor="hot-leads" className="flex items-center gap-1 cursor-pointer">
                <Flame className="w-4 h-4 text-red-500" />
                Apenas Urgentes
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {selectedLeads.size} lead(s) selecionado(s)
              </div>
              <div className="flex gap-2">
                <Select onValueChange={bulkUpdateStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Atualizar Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacted">Marcar como Contactado</SelectItem>
                    <SelectItem value="qualified">Marcar como Qualificado</SelectItem>
                    <SelectItem value="not-interested">Marcar como Não Interessado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={bulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Clique para selecionar múltiplos leads e executar ações em lote
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.size === filteredLeads.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Propriedade</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className={selectedLeads.has(lead.id) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </TableCell>
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
                        {editingNotes === lead.id ? (
                          <div className="flex gap-1">
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Adicionar nota..."
                              className="min-h-[60px]"
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                onClick={() => updateLeadNotes(lead.id, notesValue)}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingNotes(null)}
                              >
                                ✗
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded text-sm"
                            onClick={() => {
                              setEditingNotes(lead.id);
                              setNotesValue(lead.notes || '');
                            }}
                          >
                            {lead.notes ? (
                              <div className="flex items-start gap-1">
                                <MessageSquare className="w-3 h-3 mt-1" />
                                <span className="line-clamp-2">{lead.notes}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Clique para adicionar nota
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCallNow(lead)}
                            disabled={callingLead === lead.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PhoneCall className="w-4 h-4 mr-1" />
                            {callingLead === lead.id ? 'Calling...' : 'Call Now'}
                          </Button>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
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
                        </div>
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
