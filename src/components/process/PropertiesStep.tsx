import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { PropertyImageDisplay } from '@/components/PropertyImageDisplay';
import { CSVImporter } from '@/components/CSVImporter';
import { Database, MapPin, Home, DollarSign, BedDouble, Bath, Ruler, Calendar, RefreshCw, Search, Upload, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  property_image_url: string | null;
  estimated_value: number | null;
  cash_offer_amount: number | null;
  status: string | null;
  lead_status: string | null;
  approval_status: string | null;
  owner_name: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  batch_name: string | null;
  created_at: string | null;
}

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const approvalColor = (status: string | null) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
};

interface PropertiesStepProps {
  selectedBatch?: string;
}

export const PropertiesStep = ({ selectedBatch }: PropertiesStepProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [batchName, setBatchName] = useState('');

  // Filters
  const [filterCity, setFilterCity] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');

  // Available filter values
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  const fetchFilterOptions = async () => {
    // Fetch distinct cities
    const { data: cityData } = await supabase
      .from('properties')
      .select('city')
      .not('city', 'is', null)
      .limit(200);
    if (cityData) {
      const uniqueCities = [...new Set(cityData.map(d => d.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    }

    // Fetch distinct states
    const { data: stateData } = await supabase
      .from('properties')
      .select('state')
      .not('state', 'is', null)
      .limit(200);
    if (stateData) {
      const uniqueStates = [...new Set(stateData.map(d => d.state).filter(Boolean))] as string[];
      setStates(uniqueStates.sort());
    }

    // Fetch distinct batch names
    const { data: batchData } = await supabase
      .from('properties')
      .select('batch_name')
      .not('batch_name', 'is', null)
      .limit(200);
    if (batchData) {
      const uniqueBatches = [...new Set(batchData.map(d => (d as any).batch_name).filter(Boolean))] as string[];
      setBatches(uniqueBatches.sort());
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('id, address, city, state, zip_code, property_image_url, estimated_value, cash_offer_amount, status, lead_status, approval_status, owner_name, property_type, bedrooms, bathrooms, square_feet, year_built, batch_name, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      if (filter === 'pending') {
        query = query.or('approval_status.is.null,approval_status.eq.pending');
      } else {
        query = query.eq('approval_status', filter);
      }
    }

    if (selectedBatch && selectedBatch !== 'all') {
      query = query.eq('import_batch', selectedBatch);
    }

    if (searchTerm.trim()) {
      query = query.ilike('address', `%${searchTerm.trim()}%`);
    }

    if (filterCity !== 'all') {
      query = query.eq('city', filterCity);
    }

    if (filterState !== 'all') {
      query = query.eq('state', filterState);
    }

    if (filterBatch !== 'all') {
      query = query.eq('batch_name', filterBatch);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties((data as Property[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [filter, selectedBatch, filterCity, filterState, filterBatch]);

  const handleSearch = () => {
    fetchProperties();
  };

  const handleImportComplete = () => {
    setShowImportDialog(false);
    setBatchName('');
    fetchProperties();
    fetchFilterOptions();
  };

  // Count stats
  const totalCount = properties.length;
  const approvedCount = properties.filter(p => p.approval_status === 'approved').length;
  const pendingCount = properties.filter(p => !p.approval_status || p.approval_status === 'pending').length;
  const rejectedCount = properties.filter(p => p.approval_status === 'rejected').length;

  return (
    <div className="px-3 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Passo 1: Base de Imóveis</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {totalCount} propriedades carregadas
            </p>
          </div>
        </div>
        <Button onClick={() => setShowImportDialog(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Importar Base</span>
          <span className="sm:hidden">Importar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
        <Card className="p-2 sm:p-3 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
          <p className="text-lg sm:text-2xl font-bold">{totalCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="p-2 sm:p-3 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pending')}>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Pendentes</p>
        </Card>
        <Card className="p-2 sm:p-3 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('approved')}>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Aprovados</p>
        </Card>
        <Card className="p-2 sm:p-3 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('rejected')}>
          <p className="text-lg sm:text-2xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Rejeitados</p>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        {/* Status filter buttons */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 -mx-1 px-1">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="shrink-0 text-xs sm:text-sm h-8"
            >
              {f === 'all' ? 'Todos' : f === 'approved' ? 'Aprovados' : f === 'pending' ? 'Pendentes' : 'Rejeitados'}
            </Button>
          ))}
        </div>

        {/* Advanced filters */}
        <div className="flex gap-2 flex-wrap">
          {states.length > 0 && (
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Estados</SelectItem>
                {states.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {cities.length > 0 && (
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Cidades</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {batches.length > 0 && (
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Bases</SelectItem>
                {batches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-2 text-sm border rounded-md bg-background w-full sm:w-56"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchProperties} className="gap-1 shrink-0 h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-36 sm:h-48 bg-muted" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && properties.length === 0 && (
        <Card className="p-6 sm:p-8 text-center border-dashed border-2">
          <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-3">Nenhuma propriedade encontrada.</p>
          <Button onClick={() => setShowImportDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Base de Imóveis
          </Button>
        </Card>
      )}

      {/* Properties Grid */}
      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {properties.map((prop) => (
            <Card key={prop.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <PropertyImageDisplay
                imageUrl={prop.property_image_url}
                address={prop.address || 'Sem endereço'}
                className="h-36 sm:h-48 w-full"
              />

              {/* Content */}
              <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                {/* Address */}
                <div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{prop.address || 'Sem endereço'}</p>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground ml-5 mt-0.5 truncate">
                    {[prop.city, prop.state, prop.zip_code].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Owner */}
                {prop.owner_name && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    Proprietário: {prop.owner_name}
                  </p>
                )}

                {/* Batch name tag */}
                {prop.batch_name && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {prop.batch_name}
                  </Badge>
                )}

                {/* Values */}
                <div className="flex gap-3">
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Estimado</p>
                    <p className="text-xs sm:text-sm font-semibold">{formatCurrency(prop.estimated_value)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Oferta</p>
                    <p className="text-xs sm:text-sm font-semibold text-primary">{formatCurrency(prop.cash_offer_amount)}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
                  {prop.property_type && (
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" /> {prop.property_type}
                    </span>
                  )}
                  {prop.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" /> {prop.bedrooms}
                    </span>
                  )}
                  {prop.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" /> {prop.bathrooms}
                    </span>
                  )}
                  {prop.square_feet && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {prop.square_feet}
                    </span>
                  )}
                  {prop.year_built && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {prop.year_built}
                    </span>
                  )}
                </div>

                {/* Upload date */}
                {prop.created_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Upload: {new Date(prop.created_at).toLocaleDateString('pt-BR')}
                  </p>
                )}

                {/* Badge */}
                <Badge className={cn('text-[11px] sm:text-xs', approvalColor(prop.approval_status))}>
                  {prop.approval_status === 'approved' ? 'Aprovado' : prop.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Base de Imóveis
            </DialogTitle>
            <DialogDescription>
              Faça upload de um CSV com os dados dos imóveis. Defina um nome para identificar esta base.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Batch Name */}
            <div className="space-y-2">
              <Label htmlFor="batch-name" className="font-semibold">
                Nome da Base *
              </Label>
              <Input
                id="batch-name"
                placeholder='Ex: "BASE PROBATE", "BASE 3 IPTU sem pagamento", "BASE DE SEPARADOS"'
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Este nome será associado a todos os imóveis importados neste upload
              </p>
            </div>

            {/* CSV Importer */}
            <CSVImporter
              batchName={batchName}
              onImportComplete={handleImportComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
