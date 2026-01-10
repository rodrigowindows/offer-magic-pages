import React, { useState } from 'react';
import { useSkipTraceData, SkipTraceProperty } from '@/hooks/useSkipTraceData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  Mail,
  Search,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SkipTraceDataViewerProps {
  initialLimit?: number;
}

export const SkipTraceDataViewer: React.FC<SkipTraceDataViewerProps> = ({
  initialLimit = 20
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentSearch, setCurrentSearch] = useState('');

  const {
    data: properties,
    loading,
    error,
    pagination,
    summary,
    refetch
  } = useSkipTraceData({
    limit: initialLimit,
    offset: currentOffset,
    search: currentSearch || undefined,
    hasSkipTraceData: true,
    autoLoad: true
  });

  const handleSearch = () => {
    setCurrentSearch(searchTerm);
    setCurrentOffset(0);
  };

  const handleNextPage = () => {
    if (pagination?.has_more) {
      setCurrentOffset(prev => prev + initialLimit);
    }
  };

  const handlePrevPage = () => {
    if (currentOffset > 0) {
      setCurrentOffset(prev => Math.max(0, prev - initialLimit));
    }
  };

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX if 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar dados: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Resumo dos Dados de Skip Trace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.total_properties}</div>
                <div className="text-sm text-gray-600">Total de Propriedades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.properties_with_phones}</div>
                <div className="text-sm text-gray-600">Com Telefones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.properties_with_emails}</div>
                <div className="text-sm text-gray-600">Com Emails</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.properties_with_owner_info}</div>
                <div className="text-sm text-gray-600">Com Info do Proprietário</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Buscar por endereço, cidade, nome ou CEP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {currentOffset + 1}-{Math.min(currentOffset + initialLimit, pagination.total)} de {pagination.total} propriedades
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentOffset === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.has_more || loading}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando dados de skip trace...</span>
              </div>
            </CardContent>
          </Card>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Nenhuma propriedade encontrada com dados de skip trace.
              </div>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => (
            <PropertySkipTraceCard key={property.id} property={property} />
          ))
        )}
      </div>
    </div>
  );
};

interface PropertySkipTraceCardProps {
  property: SkipTraceProperty;
}

const PropertySkipTraceCard: React.FC<PropertySkipTraceCardProps> = ({ property }) => {
  const { skip_trace_summary } = property;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {property.address}
            </CardTitle>
            <CardDescription>
              {property.city}, {property.state} {property.zip_code}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {skip_trace_summary.dnc_status === 'DNC' && (
              <Badge variant="destructive">DNC</Badge>
            )}
            {skip_trace_summary.deceased_status === 'Deceased' && (
              <Badge variant="secondary">Falecido</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Owner Info */}
          {property.owner_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{property.owner_name}</span>
            </div>
          )}

          {/* Phones */}
          {skip_trace_summary.phones.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="font-medium">Telefones ({skip_trace_summary.phones.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {skip_trace_summary.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <div className="font-mono text-sm">{phone.formatted}</div>
                      <div className="text-xs text-gray-600">{phone.type}</div>
                    </div>
                    {skip_trace_summary.preferred_phones.includes(phone.number) && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emails */}
          {skip_trace_summary.emails.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Emails ({skip_trace_summary.emails.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {skip_trace_summary.emails.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div>
                      <div className="font-mono text-sm break-all">{email.email}</div>
                      <div className="text-xs text-gray-600">{email.type}</div>
                    </div>
                    {skip_trace_summary.preferred_emails.includes(email.email) && (
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>ID: {property.id}</span>
            <span>Status: {skip_trace_summary.dnc_status === 'DNC' ? 'Bloqueado' : 'Liberado'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};