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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  Filter,
  Send,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';

// Colunas de telefone disponíveis na tabela properties
const PHONE_COLUMNS = [
  { value: 'phone1', label: 'Phone 1 (Principal)' },
  { value: 'phone2', label: 'Phone 2' },
  { value: 'phone3', label: 'Phone 3' },
  { value: 'phone4', label: 'Phone 4' },
  { value: 'phone5', label: 'Phone 5' },
  { value: 'phone6', label: 'Phone 6' },
  { value: 'phone7', label: 'Phone 7' },
  { value: 'owner_phone', label: 'Owner Phone' },
  { value: 'person2_phone1', label: 'Person 2 - Phone 1' },
  { value: 'person2_phone2', label: 'Person 2 - Phone 2' },
  { value: 'person3_phone1', label: 'Person 3 - Phone 1' },
];

// Colunas de email disponíveis na tabela properties
const EMAIL_COLUMNS = [
  { value: 'email1', label: 'Email 1 (Principal)' },
  { value: 'email2', label: 'Email 2' },
  { value: 'person2_email1', label: 'Person 2 - Email 1' },
  { value: 'person2_email2', label: 'Person 2 - Email 2' },
  { value: 'person3_email1', label: 'Person 3 - Email 1' },
  { value: 'person3_email2', label: 'Person 3 - Email 2' },
];

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  skip_tracing_data?: {
    preferred_phones?: string[];
    preferred_emails?: string[];
  };
  preferred_phones?: string[];
  preferred_emails?: string[];
  // Dynamic columns
  [key: string]: string | number | boolean | null | undefined | object;
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
  
  // Column selection state
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState('phone1');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('email1');
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Build select columns based on selected phone/email columns
  const getSelectColumns = () => {
    const baseColumns = ['id', 'address', 'city', 'state', 'zip_code', 'owner_name', 'cash_offer_amount', 'approval_status', 'preferred_phones', 'preferred_emails'];
    const phoneCol = selectedPhoneColumn;
    const emailCol = selectedEmailColumn;
    
    // Add unique columns
    const allColumns = [...baseColumns];
    if (!allColumns.includes(phoneCol)) allColumns.push(phoneCol);
    if (!allColumns.includes(emailCol)) allColumns.push(emailCol);
    
    return allColumns.join(', ');
  };

  // Fetch properties on mount and when columns change
  useEffect(() => {
    fetchProperties();
  }, [filterStatus, selectedPhoneColumn, selectedEmailColumn]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const selectColumns = getSelectColumns();
      
      let query = supabase
        .from('properties')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('approval_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Cast data to unknown first, then to Property[] to satisfy TypeScript
      setProperties((data as unknown as Property[]) || []);
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

  // Get phone/email from property based on selected column
  const getPhone = (prop: Property): string | undefined => {
    // First try direct preferred_phones field
    if (prop.preferred_phones && prop.preferred_phones.length > 0) {
      return prop.preferred_phones[0]; // Use first preferred phone
    }
    // Then try skip_tracing_data
    if (prop.skip_tracing_data?.preferred_phones && prop.skip_tracing_data.preferred_phones.length > 0) {
      return prop.skip_tracing_data.preferred_phones[0]; // Use first preferred phone
    }
    // Fall back to selected column
    return prop[selectedPhoneColumn] as string | undefined;
  };

  const getEmail = (prop: Property): string | undefined => {
    // First try direct preferred_emails field
    if (prop.preferred_emails && prop.preferred_emails.length > 0) {
      return prop.preferred_emails[0]; // Use first preferred email
    }
    // Then try skip_tracing_data
    if (prop.skip_tracing_data?.preferred_emails && prop.skip_tracing_data.preferred_emails.length > 0) {
      return prop.skip_tracing_data.preferred_emails[0]; // Use first preferred email
    }
    // Fall back to selected column
    return prop[selectedEmailColumn] as string | undefined;
  };

  const getAllPhones = (prop: Property): string[] => {
    // Return all preferred phones if available (direct field first)
    if (prop.preferred_phones && prop.preferred_phones.length > 0) {
      return prop.preferred_phones;
    }
    // Then try skip_tracing_data
    if (prop.skip_tracing_data?.preferred_phones && prop.skip_tracing_data.preferred_phones.length > 0) {
      return prop.skip_tracing_data.preferred_phones;
    }
    // Fall back to selected column
    const phone = prop[selectedPhoneColumn] as string | undefined;
    return phone ? [phone] : [];
  };

  const getAllEmails = (prop: Property): string[] => {
    // Return all preferred emails if available (direct field first)
    if (prop.preferred_emails && prop.preferred_emails.length > 0) {
      return prop.preferred_emails;
    }
    // Then try skip_tracing_data
    if (prop.skip_tracing_data?.preferred_emails && prop.skip_tracing_data.preferred_emails.length > 0) {
      return prop.skip_tracing_data.preferred_emails;
    }
    // Fall back to selected column
    const email = prop[selectedEmailColumn] as string | undefined;
    return email ? [email] : [];
  };  const handleSendCampaign = async () => {
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
        const allPhones = getAllPhones(prop);
        const allEmails = getAllEmails(prop);

        let sent = false;
        let lastError: any = null;

        // Enviar baseado no canal selecionado
        if (selectedChannel === 'sms') {
          if (allPhones.length === 0) {
            console.warn(`Property ${prop.id} has no phones available`);
            failCount++;
            continue;
          }

          // Try all phones until one succeeds
          for (const phone of allPhones) {
            try {
              await sendSMS({
                phone_number: phone,
                body: `Hi ${prop.owner_name || 'Owner'}, we have a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for ${fullAddress}. Interested? Reply YES.`,
              });
              sent = true;
              break; // Success, stop trying other phones
            } catch (error) {
              console.warn(`Failed to send SMS to ${phone} for property ${prop.id}:`, error);
              lastError = error;
            }
          }

          if (!sent) {
            console.error(`All SMS attempts failed for property ${prop.id}:`, lastError);
            failCount++;
            continue;
          }

        } else if (selectedChannel === 'email') {
          if (allEmails.length === 0) {
            console.warn(`Property ${prop.id} has no emails available`);
            failCount++;
            continue;
          }

          // Try all emails until one succeeds
          for (const email of allEmails) {
            try {
              await sendEmail({
                receiver_email: email,
                subject: `Cash Offer for ${prop.address}`,
                message_body: `Dear ${prop.owner_name || 'Owner'},\n\nWe would like to make a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for your property at ${fullAddress}.\n\nBest regards,\n${settings.company.company_name}`,
              });
              sent = true;
              break; // Success, stop trying other emails
            } catch (error) {
              console.warn(`Failed to send email to ${email} for property ${prop.id}:`, error);
              lastError = error;
            }
          }

          if (!sent) {
            console.error(`All email attempts failed for property ${prop.id}:`, lastError);
            failCount++;
            continue;
          }

        } else if (selectedChannel === 'call') {
          if (allPhones.length === 0) {
            console.warn(`Property ${prop.id} has no phones available`);
            failCount++;
            continue;
          }

          // Try all phones until one succeeds
          for (const phone of allPhones) {
            try {
              await initiateCall({
                name: prop.owner_name || 'Owner',
                address: fullAddress,
                from_number: settings.company.contact_phone,
                to_number: phone,
                voicemail_drop: `Hi, this is ${settings.company.company_name}. We have a cash offer for your property.`,
                seller_name: settings.company.company_name,
              });
              sent = true;
              break; // Success, stop trying other phones
            } catch (error) {
              console.warn(`Failed to call ${phone} for property ${prop.id}:`, error);
              lastError = error;
            }
          }

          if (!sent) {
            console.error(`All call attempts failed for property ${prop.id}:`, lastError);
            failCount++;
            continue;
          }
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

  // Count properties with/without contact info
  const propsWithPhone = selectedProps.filter((p) => getAllPhones(p).length > 0).length;
  const propsWithEmail = selectedProps.filter((p) => getAllEmails(p).length > 0).length;

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
              {/* Show/Hide Contact Info Toggle */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="gap-2"
                >
                  {showContactInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showContactInfo ? 'Ocultar Contatos' : 'Mostrar Contatos'}
                </Button>
              </div>

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
                      checked={selectedIds.length === properties.length && properties.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Selecionar Todas ({properties.length})
                    </span>
                  </div>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {properties.map((property) => {
                        const phone = getPhone(property);
                        const email = getEmail(property);
                        return (
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
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {property.owner_name || 'No Owner'}
                                </Badge>
                                {(() => {
                                  const phones = getAllPhones(property);
                                  const emails = getAllEmails(property);

                                  return (
                                    <>
                                      {phones.length > 0 && phones.map((phone, index) => (
                                        <Badge key={`phone-${index}`} variant="secondary" className="text-xs gap-1">
                                          <Phone className="w-3 h-3" />
                                          {showContactInfo ? phone : '•••••••'}
                                          {phones.length > 1 && <span className="ml-1 text-xs opacity-70">#{index + 1}</span>}
                                        </Badge>
                                      ))}
                                      {phones.length === 0 && (
                                        <Badge variant="destructive" className="text-xs gap-1">
                                          <Phone className="w-3 h-3" />
                                          Sem telefone
                                        </Badge>
                                      )}
                                      {emails.length > 0 && emails.map((email, index) => (
                                        <Badge key={`email-${index}`} variant="secondary" className="text-xs gap-1">
                                          <Mail className="w-3 h-3" />
                                          {showContactInfo ? email : '•••@•••'}
                                          {emails.length > 1 && <span className="ml-1 text-xs opacity-70">#{index + 1}</span>}
                                        </Badge>
                                      ))}
                                      {emails.length === 0 && (
                                        <Badge variant="destructive" className="text-xs gap-1">
                                          <Mail className="w-3 h-3" />
                                          Sem email
                                        </Badge>
                                      )}
                                    </>
                                  );
                                })()}
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
                        );
                      })}
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
                <Label className="text-sm font-medium mb-2 block">Canal</Label>
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

              {/* Column Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Colunas de Contato</Label>
                
                {/* Phone Column */}
                {(selectedChannel === 'sms' || selectedChannel === 'call') && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Coluna de Telefone
                    </Label>
                    <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHONE_COLUMNS.map((col) => (
                          <SelectItem key={col.value} value={col.value}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Email Column */}
                {selectedChannel === 'email' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Coluna de Email
                    </Label>
                    <Select value={selectedEmailColumn} onValueChange={setSelectedEmailColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_COLUMNS.map((col) => (
                          <SelectItem key={col.value} value={col.value}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Template Preview */}
              {selectedCount > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preview do Template</Label>
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    {selectedChannel === 'sms' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          SMS Preview
                        </div>
                        <div className="text-sm bg-white p-2 rounded border text-gray-800">
                          {selectedProps.length > 0 ? (
                            (() => {
                              const prop = selectedProps[0];
                              const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
                              return `Hi ${prop.owner_name || 'Owner'}, we have a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for ${fullAddress}. Interested? Reply YES.`;
                            })()
                          ) : (
                            'Selecione uma propriedade para ver o preview'
                          )}
                        </div>
                      </div>
                    )}

                    {selectedChannel === 'email' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          Email Preview
                        </div>
                        <div className="text-sm bg-white p-3 rounded border space-y-2">
                          <div className="font-medium text-gray-900">
                            Subject: {selectedProps.length > 0 ? `Cash Offer for ${selectedProps[0].address}` : 'Subject'}
                          </div>
                          <div className="text-gray-800 whitespace-pre-line">
                            {selectedProps.length > 0 ? (
                              (() => {
                                const prop = selectedProps[0];
                                const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
                                return `Dear ${prop.owner_name || 'Owner'},\n\nWe would like to make a cash offer of $${prop.cash_offer_amount?.toLocaleString()} for your property at ${fullAddress}.\n\nBest regards,\n${settings.company.company_name}`;
                              })()
                            ) : (
                              'Selecione uma propriedade para ver o preview do email'
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedChannel === 'call' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          Voicemail Preview
                        </div>
                        <div className="text-sm bg-white p-2 rounded border text-gray-800">
                          {selectedProps.length > 0 ? (
                            `Hi, this is ${settings.company.company_name}. We have a cash offer for your property.`
                          ) : (
                            'Selecione uma propriedade para ver o preview do voicemail'
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Propriedades:</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canal:</span>
                  <span className="font-medium capitalize">{selectedChannel}</span>
                </div>
                {(selectedChannel === 'sms' || selectedChannel === 'call') && selectedCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Com telefone:</span>
                    <span className={`font-medium ${propsWithPhone === selectedCount ? 'text-green-600' : 'text-orange-600'}`}>
                      {propsWithPhone}/{selectedCount}
                    </span>
                  </div>
                )}
                {selectedChannel === 'email' && selectedCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Com email:</span>
                    <span className={`font-medium ${propsWithEmail === selectedCount ? 'text-green-600' : 'text-orange-600'}`}>
                      {propsWithEmail}/{selectedCount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modo:</span>
                  <span className="font-medium">{testMode ? '🧪 Test' : '🚀 Live'}</span>
                </div>
              </div>

              <Separator />

              {/* Validation Warnings */}
              {selectedCount > 0 && (
                <div className="space-y-2">
                  {(selectedChannel === 'sms' || selectedChannel === 'call') &&
                    propsWithPhone < selectedCount && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedCount - propsWithPhone} propriedade(s) sem telefone disponível
                        </AlertDescription>
                      </Alert>
                    )}
                  {selectedChannel === 'email' &&
                    propsWithEmail < selectedCount && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedCount - propsWithEmail} propriedade(s) sem email disponível
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
