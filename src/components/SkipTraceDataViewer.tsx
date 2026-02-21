import React, { useState } from 'react';
import { formatPhone } from '@/utils/formatters';
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
    <div className="w-full space-y-3 sm:space-y-4 px-1 sm:px-0">
      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Resumo Skip Trace
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{summary.total_properties}</div>
                <div className="text-[11px] sm:text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{summary.properties_with_phones}</div>
                <div className="text-[11px] sm:text-sm text-gray-600">Telefones</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{summary.properties_with_emails}</div>
                <div className="text-[11px] sm:text-sm text-gray-600">Emails</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{summary.properties_with_owner_info}</div>
                <div className="text-[11px] sm:text-sm text-gray-600">Proprietário</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 mb-3 sm:mb-4">
            <Input
              placeholder="Buscar endereço, cidade, nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-sm"
            />
            <Button onClick={handleSearch} disabled={loading} size="sm" className="shrink-0">
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="text-xs sm:text-sm text-gray-600">
                {currentOffset + 1}-{Math.min(currentOffset + initialLimit, pagination.total)} de {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentOffset === 0 || loading}
                  className="text-xs sm:text-sm h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.has_more || loading}
                  className="text-xs sm:text-sm h-8"
                >
                  <span className="hidden sm:inline mr-1">Próximo</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">{property.address}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate">
              {property.city}, {property.state} {property.zip_code}
            </CardDescription>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            {skip_trace_summary.dnc_status === 'DNC' && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs">DNC</Badge>
            )}
            {skip_trace_summary.deceased_status === 'Deceased' && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">Falecido</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Owner Info */}
          {property.owner_name && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">{property.owner_name}</span>
            </div>
          )}

          {/* Phones */}
          {skip_trace_summary.phones.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                <span className="font-medium text-sm">Telefones ({skip_trace_summary.phones.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skip_trace_summary.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded">
                    <div className="min-w-0">
                      <div className="font-mono text-xs sm:text-sm">{phone.formatted}</div>
                      <div className="text-[11px] sm:text-xs text-gray-600">{phone.type}</div>
                    </div>
                    {Array.isArray(skip_trace_summary.preferred_phones) && skip_trace_summary.preferred_phones.includes(phone.number) && (
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0 ml-2" />
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
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                <span className="font-medium text-sm">Emails ({skip_trace_summary.emails.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skip_trace_summary.emails.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded">
                    <div className="min-w-0">
                      <div className="font-mono text-xs sm:text-sm break-all">{email.email}</div>
                      <div className="text-[11px] sm:text-xs text-gray-600">{email.type}</div>
                    </div>
                    {Array.isArray(skip_trace_summary.preferred_emails) && skip_trace_summary.preferred_emails.includes(email.email) && (
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-1 text-xs sm:text-sm text-gray-600">
            <span className="truncate">ID: {property.id}</span>
            <span>Status: {skip_trace_summary.dnc_status === 'DNC' ? 'Bloqueado' : 'Liberado'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};