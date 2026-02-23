/**
 * SimpleCampaignDashboard - Dashboard simplificado focado em campanhas rápidas
 * Mostra apenas o essencial: propriedades aprovadas + botão mágico
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OneClickCampaign } from './OneClickCampaign';
import { QuickCampaignDialog } from './QuickCampaignDialog';
import { CampaignScheduler } from './CampaignScheduler';
import { CampaignInsightsDashboard } from './CampaignInsightsDashboard';
import {
  CheckCircle2,
  Home,
  Search,
  Filter,
  Zap,
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  Clock
} from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  owner_phone?: string;
  owner_email?: string;
  sms_sent?: boolean;
  email_sent?: boolean;
  call_sent?: boolean;
}

export const SimpleCampaignDashboard = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickDialog, setShowQuickDialog] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // Load approved properties
  useEffect(() => {
    loadApprovedProperties();
  }, []);

  const loadApprovedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: 'Erro ao carregar propriedades',
        description: 'Não foi possível carregar as propriedades aprovadas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (property.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProperties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProperties.map(p => p.id));
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

  // Handle campaign success
  const handleCampaignSuccess = () => {
    loadApprovedProperties(); // Refresh data
    setSelectedIds([]); // Clear selection
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="w-8 h-8 text-primary" />
            Campanhas Rápidas
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie campanhas automáticas para propriedades aprovadas
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {properties.length} aprovadas
        </Badge>
      </div>

      {/* Campaign Insights */}
      <CampaignInsightsDashboard />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Selecione propriedades e envie campanhas com 1 clique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {selectedIds.length === filteredProperties.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>

            {selectedIds.length > 0 && (
              <>
                <div className="h-6 w-px bg-border" />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
                </span>

                <OneClickCampaign
                  selectedProperties={selectedProperties}
                  onSuccess={handleCampaignSuccess}
                />

                <Button
                  variant="outline"
                  onClick={() => setShowQuickDialog(true)}
                  className="gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Campanha Avançada
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowScheduler(true)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Agendar Campanha
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por endereço, cidade ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredProperties.length} de {properties.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Propriedades Aprovadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma propriedade encontrada</p>
              {searchTerm && (
                <p className="text-sm">Tente ajustar sua busca</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProperties.map((property) => {
                const isSelected = selectedIds.includes(property.id);
                const hasContact = property.owner_phone || property.owner_email;

                return (
                  <div
                    key={property.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleSelectProperty(property.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectProperty(property.id)}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{property.address}</h3>
                        <Badge variant="secondary">
                          ${property.cash_offer_amount?.toLocaleString() || 'XXX,XXX'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state} • {property.owner_name || 'Proprietário não identificado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Contact indicators */}
                      {property.owner_phone && (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="w-3 h-3" />
                          SMS
                        </Badge>
                      )}
                      {property.owner_email && (
                        <Badge variant="outline" className="gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </Badge>
                      )}
                      {property.owner_phone && (
                        <Badge variant="outline" className="gap-1">
                          <Phone className="w-3 h-3" />
                          Call
                        </Badge>
                      )}

                      {/* Communication status */}
                      <div className="flex gap-1">
                        {property.sms_sent && <div className="w-2 h-2 bg-blue-500 rounded-full" title="SMS enviado" />}
                        {property.email_sent && <div className="w-2 h-2 bg-green-500 rounded-full" title="Email enviado" />}
                        {property.call_sent && <div className="w-2 h-2 bg-purple-500 rounded-full" title="Ligação feita" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Campaign Dialog */}
      <QuickCampaignDialog
        properties={selectedProperties}
        open={showQuickDialog}
        onOpenChange={setShowQuickDialog}
        onSuccess={handleCampaignSuccess}
      />

      {/* Campaign Scheduler */}
      <CampaignScheduler
        properties={selectedProperties}
        open={showScheduler}
        onOpenChange={setShowScheduler}
        onSuccess={handleCampaignSuccess}
      />
    </div>
  );
};
