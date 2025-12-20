import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Check, X, Settings2, Wand2 } from "lucide-react";

// Database fields available for mapping
export const DATABASE_FIELDS = [
  { key: 'address', label: 'Endereço', required: true, group: 'basic' },
  { key: 'city', label: 'Cidade', required: false, group: 'basic' },
  { key: 'state', label: 'Estado', required: false, group: 'basic' },
  { key: 'zip_code', label: 'CEP', required: false, group: 'basic' },
  { key: 'county', label: 'Condado', required: false, group: 'basic' },
  { key: 'neighborhood', label: 'Bairro', required: false, group: 'basic' },
  
  { key: 'owner_name', label: 'Nome do Proprietário', required: false, group: 'owner' },
  { key: 'owner_phone', label: 'Telefone', required: false, group: 'owner' },
  { key: 'owner_address', label: 'Endereço do Proprietário', required: false, group: 'owner' },
  
  { key: 'bedrooms', label: 'Quartos', required: false, group: 'property' },
  { key: 'bathrooms', label: 'Banheiros', required: false, group: 'property' },
  { key: 'square_feet', label: 'Área (sqft)', required: false, group: 'property' },
  { key: 'lot_size', label: 'Tamanho do Lote', required: false, group: 'property' },
  { key: 'year_built', label: 'Ano de Construção', required: false, group: 'property' },
  { key: 'property_type', label: 'Tipo de Imóvel', required: false, group: 'property' },
  
  { key: 'estimated_value', label: 'Valor Estimado', required: true, group: 'financial' },
  { key: 'cash_offer_amount', label: 'Oferta Cash', required: false, group: 'financial' },
  { key: 'lead_score', label: 'Lead Score', required: false, group: 'financial' },
  { key: 'comparative_price', label: 'Preço Comparativo', required: false, group: 'financial' },
  
  { key: 'origem', label: 'ID Único (Account Number)', required: false, group: 'system' },
  { key: 'property_image_url', label: 'URL da Imagem', required: false, group: 'system' },
  { key: 'zillow_url', label: 'URL Zillow', required: false, group: 'system' },
  { key: 'evaluation', label: 'Avaliação', required: false, group: 'system' },
  { key: 'focar', label: 'Focar', required: false, group: 'system' },
  { key: 'carta', label: 'Carta', required: false, group: 'system' },
  { key: 'tags', label: 'Tags (separadas por vírgula)', required: false, group: 'system' },
] as const;

export type DatabaseFieldKey = typeof DATABASE_FIELDS[number]['key'];

export interface ColumnMapping {
  csvColumn: string;
  dbField: DatabaseFieldKey | 'skip' | '';
  isCustom?: boolean;
}

interface ColumnMappingDialogProps {
  csvHeaders: string[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  initialMappings?: ColumnMapping[];
}

// Auto-detect field based on CSV header name
const autoDetectField = (csvHeader: string): DatabaseFieldKey | '' => {
  const header = csvHeader.toLowerCase().replace(/[_\s-]/g, '');
  
  const mappings: Record<string, DatabaseFieldKey> = {
    // Address
    'address': 'address',
    'propertyaddress': 'address',
    'situsaddress': 'address',
    'streetaddress': 'address',
    
    // City
    'city': 'city',
    'propertycity': 'city',
    'situscity': 'city',
    
    // State
    'state': 'state',
    'propertystate': 'state',
    'situsstate': 'state',
    
    // Zip
    'zip': 'zip_code',
    'zipcode': 'zip_code',
    'postalcode': 'zip_code',
    'situszip': 'zip_code',
    
    // County
    'county': 'county',
    
    // Neighborhood
    'neighborhood': 'neighborhood',
    'subdivision': 'neighborhood',
    
    // Owner
    'ownername': 'owner_name',
    'owner': 'owner_name',
    'name': 'owner_name',
    
    'ownerphone': 'owner_phone',
    'phone': 'owner_phone',
    'phonenumber': 'owner_phone',
    
    'owneraddress': 'owner_address',
    'mailingaddress': 'owner_address',
    
    // Property details
    'beds': 'bedrooms',
    'bedrooms': 'bedrooms',
    'bedroom': 'bedrooms',
    
    'baths': 'bathrooms',
    'bathrooms': 'bathrooms',
    'bathroom': 'bathrooms',
    
    'sqft': 'square_feet',
    'squarefeet': 'square_feet',
    'livingarea': 'square_feet',
    'area': 'square_feet',
    
    'lotsize': 'lot_size',
    'lot': 'lot_size',
    'landarea': 'lot_size',
    
    'yearbuilt': 'year_built',
    'year': 'year_built',
    'built': 'year_built',
    
    'propertytype': 'property_type',
    'type': 'property_type',
    'usecode': 'property_type',
    
    // Financial
    'justvalue': 'estimated_value',
    'estimatedvalue': 'estimated_value',
    'marketvalue': 'estimated_value',
    'value': 'estimated_value',
    'price': 'estimated_value',
    'assessedvalue': 'estimated_value',
    
    'cashoffer': 'cash_offer_amount',
    'cashofferamount': 'cash_offer_amount',
    'offer': 'cash_offer_amount',
    
    'leadscore': 'lead_score',
    'score': 'lead_score',
    
    'comparativeprice': 'comparative_price',
    'compprice': 'comparative_price',
    
    // System
    'accountnumber': 'origem',
    'account': 'origem',
    'pid': 'origem',
    'parcelid': 'origem',
    'folio': 'origem',
    'origem': 'origem',
    
    'imageurl': 'property_image_url',
    'photourl': 'property_image_url',
    'photo': 'property_image_url',
    'image': 'property_image_url',
    
    'zillowurl': 'zillow_url',
    'zillow': 'zillow_url',
    
    'evaluation': 'evaluation',
    'eval': 'evaluation',
    
    'focar': 'focar',
    'focus': 'focar',
    
    'carta': 'carta',
    'letter': 'carta',
    
    'tags': 'tags',
    'tag': 'tags',
  };
  
  return mappings[header] || '';
};

const ColumnMappingDialog = ({ 
  csvHeaders, 
  onMappingChange, 
  initialMappings = [] 
}: ColumnMappingDialogProps) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showOnlyMapped, setShowOnlyMapped] = useState(false);

  // Initialize mappings when CSV headers change
  useEffect(() => {
    if (csvHeaders.length === 0) return;

    const newMappings: ColumnMapping[] = csvHeaders.map(csvCol => {
      const existing = initialMappings.find(m => m.csvColumn === csvCol);
      if (existing) return existing;

      const autoField = autoDetectField(csvCol);
      return {
        csvColumn: csvCol,
        dbField: autoField,
      };
    });

    setMappings(newMappings);
    onMappingChange(newMappings);
  }, [csvHeaders]);

  const handleMappingChange = (csvColumn: string, dbField: DatabaseFieldKey | 'skip' | '') => {
    const newMappings = mappings.map(m => 
      m.csvColumn === csvColumn ? { ...m, dbField } : m
    );
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  const autoDetectAll = () => {
    const newMappings = mappings.map(m => ({
      ...m,
      dbField: autoDetectField(m.csvColumn) || m.dbField,
    }));
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  const clearAll = () => {
    const newMappings = mappings.map(m => ({ ...m, dbField: '' as const }));
    setMappings(newMappings);
    onMappingChange(newMappings);
  };

  const mappedCount = mappings.filter(m => m.dbField && m.dbField !== 'skip').length;
  const skippedCount = mappings.filter(m => m.dbField === 'skip').length;

  const groupedDbFields = {
    basic: DATABASE_FIELDS.filter(f => f.group === 'basic'),
    owner: DATABASE_FIELDS.filter(f => f.group === 'owner'),
    property: DATABASE_FIELDS.filter(f => f.group === 'property'),
    financial: DATABASE_FIELDS.filter(f => f.group === 'financial'),
    system: DATABASE_FIELDS.filter(f => f.group === 'system'),
  };

  const displayMappings = showOnlyMapped 
    ? mappings.filter(m => m.dbField && m.dbField !== 'skip')
    : mappings;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Mapeamento de Colunas
            </CardTitle>
            <CardDescription>
              Mapeie as colunas do CSV para os campos do banco de dados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-300">
              {mappedCount} mapeadas
            </Badge>
            {skippedCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                {skippedCount} ignoradas
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={autoDetectAll}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Detectar
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="show-mapped" 
              checked={showOnlyMapped}
              onCheckedChange={setShowOnlyMapped}
            />
            <Label htmlFor="show-mapped" className="text-sm">
              Mostrar apenas mapeadas
            </Label>
          </div>
        </div>

        {/* Mapping List */}
        <ScrollArea className="h-[400px] border rounded-lg p-4">
          <div className="space-y-3">
            {displayMappings.map((mapping, idx) => (
              <div 
                key={mapping.csvColumn} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* CSV Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs truncate max-w-[200px]">
                      {mapping.csvColumn}
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Database Field Select */}
                <div className="w-[220px]">
                  <Select
                    value={mapping.dbField}
                    onValueChange={(value) => handleMappingChange(
                      mapping.csvColumn, 
                      value as DatabaseFieldKey | 'skip' | ''
                    )}
                  >
                    <SelectTrigger className={
                      mapping.dbField && mapping.dbField !== 'skip' 
                        ? 'border-green-300 bg-green-50 dark:bg-green-950'
                        : mapping.dbField === 'skip'
                        ? 'border-muted bg-muted/50'
                        : ''
                    }>
                      <SelectValue placeholder="Selecionar campo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">
                        <span className="text-muted-foreground">⏭️ Ignorar esta coluna</span>
                      </SelectItem>

                      <SelectItem value="__header_basic" disabled className="font-semibold">
                        📍 Localização
                      </SelectItem>
                      {groupedDbFields.basic.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}

                      <SelectItem value="__header_owner" disabled className="font-semibold">
                        👤 Proprietário
                      </SelectItem>
                      {groupedDbFields.owner.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}

                      <SelectItem value="__header_property" disabled className="font-semibold">
                        🏠 Detalhes do Imóvel
                      </SelectItem>
                      {groupedDbFields.property.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}

                      <SelectItem value="__header_financial" disabled className="font-semibold">
                        💰 Financeiro
                      </SelectItem>
                      {groupedDbFields.financial.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}

                      <SelectItem value="__header_system" disabled className="font-semibold">
                        ⚙️ Sistema
                      </SelectItem>
                      {groupedDbFields.system.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Icon */}
                <div className="w-6 shrink-0">
                  {mapping.dbField && mapping.dbField !== 'skip' && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Help */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm space-y-1">
          <p><strong>💡 Dica:</strong> Clique em "Auto-Detectar" para mapear automaticamente baseado nos nomes das colunas</p>
          <p><strong>⏭️ Ignorar:</strong> Colunas ignoradas não serão importadas</p>
          <p><strong className="text-red-500">*</strong> = Campo obrigatório</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnMappingDialog;
