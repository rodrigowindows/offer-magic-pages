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
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  User, 
  MapPin, 
  AlertTriangle, 
  Copy, 
  CheckCircle,
  Loader2,
  PhoneCall
} from "lucide-react";
import { toast } from "sonner";

interface SkipTracingDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
}

interface SkipTracingData {
  // Owner info
  owner_first_name?: string;
  owner_last_name?: string;
  owner_name?: string;
  owner_age?: number;
  owner_deceased?: boolean | string;
  dnc_litigator?: string;
  // Mailing address
  mail_address?: string;
  mail_city?: string;
  mail_state?: string;
  mail_zip_code?: string;
  // Phones
  phone1?: string;
  phone1_type?: string;
  phone2?: string;
  phone2_type?: string;
  phone3?: string;
  phone3_type?: string;
  phone4?: string;
  phone4_type?: string;
  phone5?: string;
  phone5_type?: string;
  // Legacy field
  owner_phone?: string;
}

export const SkipTracingDataModal = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
}: SkipTracingDataModalProps) => {
  const [data, setData] = useState<SkipTracingData | null>(null);
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
      setData(property as SkipTracingData);
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
    if (phone.includes('E') || phone.includes('e')) {
      const num = parseFloat(phone);
      if (!isNaN(num)) {
        phone = Math.round(num).toString();
      }
    }
    // Format as phone number
    const cleaned = phone.replace(/\D/g, '');
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
      const phoneKey = `phone${i}` as keyof SkipTracingData;
      const typeKey = `phone${i}_type` as keyof SkipTracingData;
      const phone = data[phoneKey] as string | undefined;
      const type = (data[typeKey] as string | undefined) || 'Unknown';
      
      if (phone) {
        const formatted = formatPhone(phone);
        if (formatted) {
          phones.push({ number: phone, type, formatted });
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

  const isDNC = data?.dnc_litigator?.toLowerCase().includes('dnc');
  const isDeceased = data?.owner_deceased === true || 
                     data?.owner_deceased === 'Y' || 
                     data?.owner_deceased === 'Yes' ||
                     data?.owner_deceased === 'y';

  const phones = getPhones();
  const ownerName = data?.owner_name || 
    `${data?.owner_first_name || ''} ${data?.owner_last_name || ''}`.trim() ||
    'Não informado';

  const hasMailingAddress = data?.mail_address || data?.mail_city;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados de Skip Tracing
          </DialogTitle>
          <DialogDescription>{propertyAddress}</DialogDescription>
        </DialogHeader>

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
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum dado de skip tracing encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkipTracingDataModal;
