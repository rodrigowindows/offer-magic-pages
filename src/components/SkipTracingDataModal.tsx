import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  User, 
  MapPin, 
  AlertTriangle, 
  Copy, 
  CheckCircle,
  Loader2,
  PhoneCall,
  Database
} from "lucide-react";
import { toast } from "sonner";

interface SkipTracingDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
}

// Campos padrão que não devem aparecer na seção "outros campos"
const STANDARD_FIELDS = [
  'id', 'slug', 'address', 'city', 'state', 'zip_code', 'estimated_value', 
  'cash_offer_amount', 'created_at', 'updated_at', 'status', 'lead_status',
  'sms_sent', 'email_sent', 'letter_sent', 'card_sent', 'phone_call_made',
  'meeting_scheduled', 'property_image_url', 'neighborhood', 'origem', 'carta',
  'zillow_url', 'evaluation', 'focar', 'tags', 'approval_status', 'approved_by',
  'approved_at', 'approved_by_name', 'rejection_reason', 'rejection_notes',
  'updated_by', 'updated_by_name', 'answer_flag', 'dnc_flag', 'comparative_price',
  'lead_score', 'airbnb_eligible', 'airbnb_check_date', 'airbnb_regulations',
  'airbnb_notes', 'import_date', 'import_batch', 'last_contact_date', 
  'next_followup_date', 'bedrooms', 'bathrooms', 'square_feet', 'lot_size',
  'year_built', 'lead_captured', 'lead_captured_at', 'county', 'property_type',
  // Campos de skip tracing que já são exibidos em seções próprias
  'owner_name', 'owner_phone', 'owner_address', 'owner_first_name', 'owner_last_name',
  'owner_age', 'owner_deceased', 'dnc_litigator',
  'mail_address', 'mail_city', 'mail_state', 'mail_zip_code',
  'phone1', 'phone1_type', 'phone2', 'phone2_type', 'phone3', 'phone3_type',
  'phone4', 'phone4_type', 'phone5', 'phone5_type'
];

// Labels amigáveis para campos conhecidos
const FIELD_LABELS: Record<string, string> = {
  input_last_name: 'Input - Sobrenome',
  input_first_name: 'Input - Nome',
  input_mailing_address: 'Input - End. Correspondência',
  input_mailing_city: 'Input - Cidade Corresp.',
  input_mailing_state: 'Input - Estado Corresp.',
  input_mailing_zip: 'Input - CEP Corresp.',
  input_property_address: 'Input - End. Propriedade',
  input_property_city: 'Input - Cidade Prop.',
  input_property_state: 'Input - Estado Prop.',
  input_property_zip: 'Input - CEP Prop.',
  custom_field_1: 'Campo Personalizado 1',
  custom_field_2: 'Campo Personalizado 2',
  custom_field_3: 'Campo Personalizado 3',
  owner_fix_last_name: 'Proprietário Fix - Sobrenome',
  owner_fix_first_name: 'Proprietário Fix - Nome',
  owner_fix_mailing_address: 'Proprietário Fix - Endereço',
  owner_fix_mailing_city: 'Proprietário Fix - Cidade',
  owner_fix_mailing_state: 'Proprietário Fix - Estado',
  owner_fix_mailing_zip: 'Proprietário Fix - CEP',
  result_code: 'Código Resultado',
  matched_first_name: 'Nome Encontrado',
  matched_last_name: 'Sobrenome Encontrado',
};

export const SkipTracingDataModal = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
}: SkipTracingDataModalProps) => {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (open && propertyId) {
      fetchSkipTracingData();
    }
  }, [open, propertyId]);

  const fetchSkipTracingData = async () => {
    setLoading(true);
    try {
      const { data: property, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      setData(property);
    } catch (error) {
      console.error("Error fetching skip tracing data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    toast.success("Copiado!");
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    // Handle scientific notation (4.08E+09)
    if (String(phone).includes('E') || String(phone).includes('e')) {
      const num = parseFloat(String(phone));
      if (!isNaN(num)) {
        phone = Math.round(num).toString();
      }
    }
    // Format as phone number
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getPhones = () => {
    if (!data) return [];
    const phones: { number: string; type: string; formatted: string }[] = [];
    
    // Add phone1-5
    for (let i = 1; i <= 5; i++) {
      const phone = data[`phone${i}`];
      const type = data[`phone${i}_type`] || 'Unknown';
      
      if (phone) {
        const formatted = formatPhone(phone);
        if (formatted) {
          phones.push({ number: String(phone), type, formatted });
        }
      }
    }

    // Add legacy owner_phone if no other phones
    if (phones.length === 0 && data.owner_phone) {
      const formatted = formatPhone(data.owner_phone);
      if (formatted) {
        phones.push({ number: data.owner_phone, type: 'Primary', formatted });
      }
    }

    return phones;
  };

  // Obter campos extras (dinâmicos)
  const getExtraFields = () => {
    if (!data) return [];
    
    return Object.entries(data)
      .filter(([key, value]) => {
        // Ignorar campos padrão
        if (STANDARD_FIELDS.includes(key)) return false;
        // Ignorar valores nulos/vazios
        if (value === null || value === undefined || value === '') return false;
        // Ignorar campos de telefone (já exibidos acima)
        if (key.match(/^phone\d+(_type)?$/)) return false;
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] || formatFieldName(key),
        value: formatFieldValue(value)
      }));
  };

  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatFieldValue = (value: any): string => {
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const isDNC = data?.dnc_litigator?.toLowerCase?.()?.includes('dnc');
  const isDeceased = data?.owner_deceased === true || 
                     data?.owner_deceased === 'Y' || 
                     data?.owner_deceased === 'Yes' ||
                     data?.owner_deceased === 'y';

  const phones = getPhones();
  const extraFields = getExtraFields();
  const ownerName = data?.owner_name || 
    `${data?.owner_first_name || ''} ${data?.owner_last_name || ''}`.trim() ||
    'Não informado';

  const hasMailingAddress = data?.mail_address || data?.mail_city;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados de Skip Tracing
          </DialogTitle>
          <DialogDescription>{propertyAddress}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Alerts */}
              {(isDNC || isDeceased) && (
                <div className="flex gap-2">
                  {isDNC && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      DNC - Não Ligar
                    </Badge>
                  )}
                  {isDeceased && (
                    <Badge variant="secondary" className="gap-1 bg-gray-500 text-white">
                      Falecido
                    </Badge>
                  )}
                </div>
              )}

              {/* Owner Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">PROPRIETÁRIO</h4>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{ownerName}</span>
                    {data.owner_age && (
                      <Badge variant="outline">{data.owner_age} anos</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Mailing Address */}
              {hasMailingAddress && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    ENDEREÇO DE CORRESPONDÊNCIA
                  </h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <p>{data.mail_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {[data.mail_city, data.mail_state, data.mail_zip_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Phones */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  TELEFONES ({phones.length})
                </h4>
                
                {phones.length > 0 ? (
                  <div className="space-y-2">
                    {phones.map((phone, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isDNC ? 'bg-red-50 border-red-200' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            phone.type.toLowerCase().includes('mobile') 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium font-mono">{phone.formatted}</p>
                            <p className="text-xs text-muted-foreground">{phone.type}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(phone.formatted)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedPhone === phone.formatted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`tel:${phone.formatted.replace(/\D/g, '')}`)}
                            className="h-8 w-8 p-0"
                            disabled={isDNC}
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum telefone encontrado</p>
                    <p className="text-xs">Importe dados de skip tracing para ver telefones</p>
                  </div>
                )}
              </div>

              {/* DNC Warning */}
              {isDNC && phones.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800">
                  <strong>⚠️ Atenção:</strong> Este contato está na lista DNC (Do Not Call). 
                  Ligar pode resultar em penalidades legais.
                </div>
              )}

              {/* Extra Dynamic Fields */}
              {extraFields.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      OUTROS CAMPOS IMPORTADOS ({extraFields.length})
                    </h4>
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      {extraFields.map((field, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-2 py-1 border-b border-border/50 last:border-0">
                          <span className="text-sm text-muted-foreground">{field.label}:</span>
                          <span className="text-sm font-medium text-right max-w-[60%] break-words">
                            {field.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum dado de skip tracing encontrado</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SkipTracingDataModal;
