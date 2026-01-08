/**
 * Campaign Manager - Tela dedicada para criar e gerenciar campanhas
 * Fluxo claro: Selecionar Propriedades → Escolher Canal → Configurar → Enviar
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Filter,
  Send,
  Loader2,
  Settings,
  Users,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  cash_offer_amount?: number;
  approval_status?: string;
}

type Channel = 'sms' | 'email' | 'call';

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const settings = useMarketingStore((state) => state.settings);

  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('sms');
  const [filterStatus, setFilterStatus] = useState<string>('approved');

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [filterStatus]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('id, address, city, state, zip_code, owner_name, owner_phone, owner_email, cash_offer_amount, approval_status')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('approval_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data || []) as Property[]);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Erro ao carregar propriedades',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  const getSelectedProperties = () => {
    return properties.filter((p) => selectedIds.includes(p.id));
  };

  const handleSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    if (selectedProps.length === 0) {
      toast({
        title: 'Nenhuma propriedade selecionada',
        description: 'Selecione pelo menos uma propriedade',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const prop of selectedProps) {
      try {
        const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;

        // Enviar baseado no canal selecionado
        if (selectedChannel === 'sms') {
          if (!prop.owner_phone) {
            console.warn(`Property ${prop.id} has no phone`);
            failCount++;
            continue;
          }
          await sendSMS({
            phone_number: prop.owner_phone,
            body: `Hi ${prop.owner_name || 'Owner'}, we have a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for ${fullAddress}. Interested? Reply YES.`,
          });
        } else if (selectedChannel === 'email') {
          if (!prop.owner_email) {
            console.warn(`Property ${prop.id} has no email`);
            failCount++;
            continue;
          }
          await sendEmail({
            receiver_email: prop.owner_email,
            subject: `Cash Offer for ${prop.address}`,
            message_body: `Dear ${prop.owner_name || 'Owner'},\n\nWe would like to make a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for your property at ${fullAddress}.\n\nBest regards,\n${settings.company.company_name}`,
          });
        } else if (selectedChannel === 'call') {
          if (!prop.owner_phone) {
            console.warn(`Property ${prop.id} has no phone`);
            failCount++;
            continue;
          }
          await initiateCall({
            name: prop.owner_name || 'Owner',
            address: fullAddress,
            from_number: settings.phone.from_number,
            to_number: prop.owner_phone,
            voicemail_drop: `Hi, this is ${settings.company.company_name}. We have a cash offer for your property.`,
            seller_name: settings.company.company_name,
          });
        }

        successCount++;
      } catch (error: any) {
        console.error(`Error sending to ${prop.id}:`, error);
        failCount++;
      }
    }

    setSending(false);

    toast({
      title: 'Campanha Finalizada',
      description: `✅ ${successCount} enviados com sucesso, ❌ ${failCount} falharam`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });

    // Clear selection
    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;
  const selectedProps = getSelectedProperties();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaign Manager</h1>
          <p className="text-muted-foreground">
            Selecione propriedades e crie campanhas de marketing
          </p>
        </div>
        <Button variant="outline" onClick={fetchProperties}>
          <Filter className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Test Mode Warning */}
      {testMode && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            🧪 <strong>Test Mode Ativo:</strong> As mensagens serão simuladas (não enviadas de verdade)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Property List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Propriedades Disponíveis</CardTitle>
                  <CardDescription>
                    {properties.length} propriedades encontradas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('approved')}
                  >
                    Aprovadas
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma propriedade encontrada
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <Checkbox
                      checked={selectedIds.length === properties.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Selecionar Todas ({properties.length})
                    </span>
                  </div>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {properties.map((property) => (
                        <div
                          key={property.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            selectedIds.includes(property.id)
                              ? 'bg-primary/5 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedIds.includes(property.id)}
                            onCheckedChange={() => toggleSelection(property.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {property.address}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.city}, {property.state} {property.zip_code}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {property.owner_name || 'No Owner'}
                              </Badge>
                              {property.owner_phone && (
                                <Badge variant="secondary" className="text-xs">
                                  <Phone className="w-3 h-3 mr-1" />
                                  Phone
                                </Badge>
                              )}
                              {property.owner_email && (
                                <Badge variant="secondary" className="text-xs">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                            </div>
                          </div>
                          {property.cash_offer_amount && (
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">
                                ${property.cash_offer_amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">Offer</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Campaign Config */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Configurar Campanha
              </CardTitle>
              <CardDescription>
                {selectedCount} propriedade{selectedCount !== 1 ? 's' : ''} selecionada
                {selectedCount !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Canal</label>
                <Tabs value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as Channel)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sms" className="gap-1">
                      <MessageSquare className="w-4 h-4" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="call" className="gap-1">
                      <Phone className="w-4 h-4" />
                      Call
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Propriedades:</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canal:</span>
                  <span className="font-medium capitalize">{selectedChannel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modo:</span>
                  <span className="font-medium">{testMode ? '🧪 Test' : '🚀 Live'}</span>
                </div>
              </div>

              <Separator />

              {/* Validation Warnings */}
              {selectedCount > 0 && (
                <div className="space-y-2">
                  {selectedChannel === 'sms' &&
                    selectedProps.some((p) => !p.owner_phone) && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedProps.filter((p) => !p.owner_phone).length} propriedades sem
                          telefone
                        </AlertDescription>
                      </Alert>
                    )}
                  {selectedChannel === 'email' &&
                    selectedProps.some((p) => !p.owner_email) && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedProps.filter((p) => !p.owner_email).length} propriedades sem
                          email
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}

              {/* Send Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSendCampaign}
                disabled={selectedCount === 0 || sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando... ({selectedCount})
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Campanha ({selectedCount})
                  </>
                )}
              </Button>

              {selectedCount === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Selecione propriedades à esquerda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;
