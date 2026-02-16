import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyImageDisplay } from '@/components/PropertyImageDisplay';
import { Database, MapPin, Home, DollarSign, BedDouble, Bath, Ruler, Calendar, RefreshCw, Search } from 'lucide-react';
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

export const PropertiesStep = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('id, address, city, state, zip_code, property_image_url, estimated_value, cash_offer_amount, status, lead_status, approval_status, owner_name, property_type, bedrooms, bathrooms, square_feet, year_built')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('approval_status', filter);
    }

    if (searchTerm.trim()) {
      query = query.ilike('address', `%${searchTerm.trim()}%`);
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
    fetchProperties();
  }, [filter]);

  const handleSearch = () => {
    fetchProperties();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Passo 1: Base de Imóveis</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        {properties.length} propriedades carregadas do banco de dados
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'approved' ? 'Aprovados' : f === 'pending' ? 'Pendentes' : 'Rejeitados'}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-2 text-sm border rounded-md bg-background w-56"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchProperties} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Properties Grid */}
      {!loading && properties.length === 0 && (
        <Card className="p-8 text-center border-dashed border-2">
          <p className="text-muted-foreground">Nenhuma propriedade encontrada.</p>
        </Card>
      )}

      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <Card key={prop.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <PropertyImageDisplay
                imageUrl={prop.property_image_url}
                address={prop.address || 'Sem endereço'}
                className="h-48 w-full"
              />

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Address */}
                <div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="font-semibold text-sm leading-tight">{prop.address || 'Sem endereço'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5.5 mt-0.5">
                    {[prop.city, prop.state, prop.zip_code].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Owner */}
                {prop.owner_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    Proprietário: {prop.owner_name}
                  </p>
                )}

                {/* Values */}
                <div className="flex gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimado</p>
                    <p className="text-sm font-semibold">{formatCurrency(prop.estimated_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Oferta</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(prop.cash_offer_amount)}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {prop.property_type && (
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" /> {prop.property_type}
                    </span>
                  )}
                  {prop.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" /> {prop.bedrooms} quartos
                    </span>
                  )}
                  {prop.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" /> {prop.bathrooms} ban
                    </span>
                  )}
                  {prop.square_feet && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {prop.square_feet} sqft
                    </span>
                  )}
                  {prop.year_built && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {prop.year_built}
                    </span>
                  )}
                </div>

                {/* Badge */}
                <Badge className={cn('text-xs', approvalColor(prop.approval_status))}>
                  {prop.approval_status === 'approved' ? 'Aprovado' : prop.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
