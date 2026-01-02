import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Check, X, Settings2, Wand2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { mapColumnsWithAI, fallbackToStringMatching } from "@/utils/aiColumnMapper";
import { DATABASE_FIELDS } from "./ColumnMappingDialog";
import type { DatabaseFieldKey, ColumnMapping } from "./ColumnMappingDialog";

interface ColumnMappingDialogWithAIProps {
  csvHeaders: string[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  initialMappings?: ColumnMapping[];
}

// Auto-detect field based on CSV header name (string matching fallback)
const autoDetectField = (csvHeader: string): DatabaseFieldKey | '' => {
  const header = csvHeader.toLowerCase().replace(/[_\s-]/g, '');

  const mappings: Record<string, DatabaseFieldKey> = {
    // Address
    'address': 'address',
    'propertyaddress': 'address',
    'situsaddress': 'address',
    'streetaddress': 'address',
    'inputpropertyaddress': 'address',
    'inputaddress': 'address',

    // City
    'city': 'city',
    'propertycity': 'city',
    'situscity': 'city',
    'inputpropertycity': 'city',
    'inputcity': 'city',

    // State
    'state': 'state',
    'propertystate': 'state',
    'situsstate': 'state',
    'inputpropertystate': 'state',
    'inputstate': 'state',

    // Zip
    'zip': 'zip_code',
    'zipcode': 'zip_code',
    'postalcode': 'zip_code',
    'situszip': 'zip_code',
    'inputpropertyzip': 'zip_code',
    'inputzip': 'zip_code',

    // County
    'county': 'county',

    // Neighborhood
    'neighborhood': 'neighborhood',
    'subdivision': 'neighborhood',

    // Owner
    'ownername': 'owner_name',
    'owner': 'owner_name',
    'name': 'owner_name',
    'inputlastname': 'owner_name',
    'inputfirstname': 'owner_name',
    'ownerfirstname': 'owner_name',
    'ownerlastname': 'owner_name',
    'firstname': 'owner_name',
    'lastname': 'owner_name',

    'ownerphone': 'owner_phone',
    'phone': 'owner_phone',
    'phonenumber': 'owner_phone',

    'owneraddress': 'owner_address',
    'mailingaddress': 'owner_address',
    'inputmailingaddress1': 'owner_address',
    'inputmailingaddress': 'owner_address',

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

const ColumnMappingDialogWithAI = ({
  csvHeaders,
  onMappingChange,
  initialMappings = []
}: ColumnMappingDialogWithAIProps) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showOnlyMapped, setShowOnlyMapped] = useState(false);
  const [isAIMapping, setIsAIMapping] = useState(false);
  const [aiStatus, setAIStatus] = useState<string>('');
  const [aiError, setAIError] = useState<string | null>(null);
  const { toast } = useToast();

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

    toast({
      title: "Auto-detectado",
      description: `${newMappings.filter(m => m.dbField && m.dbField !== 'skip').length} colunas mapeadas`,
    });
  };

  const autoDetectWithAI = async () => {
    setIsAIMapping(true);
    setAIError(null);
    setAIStatus('Iniciando...');

    try {
      const result = await mapColumnsWithAI(csvHeaders, (status) => {
        setAIStatus(status);
      });

      if (!result.success) {
        setAIError(result.error || 'Erro desconhecido');
        toast({
          title: "Erro na IA",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Apply AI mappings
      const newMappings = mappings.map(m => {
        const aiMapping = result.mappings.find(ai => ai.csvColumn === m.csvColumn);
        if (aiMapping) {
          return {
            ...m,
            dbField: aiMapping.suggestedField,
          };
        }
        return m;
      });

      setMappings(newMappings);
      onMappingChange(newMappings);

      const mappedCount = newMappings.filter(m => m.dbField && m.dbField !== 'skip').length;
      toast({
        title: "✨ IA concluída!",
        description: `${mappedCount} colunas mapeadas com inteligência artificial`,
      });

    } catch (error: any) {
      setAIError(error.message);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAIMapping(false);
      setAIStatus('');
    }
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
        {/* AI Status */}
        {isAIMapping && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="flex items-center gap-2">
              <span>{aiStatus}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Error */}
        {aiError && !isAIMapping && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={autoDetectWithAI}
              disabled={isAIMapping}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isAIMapping ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Auto-Detectar com IA
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={autoDetectAll}
              disabled={isAIMapping}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Detectar (Simples)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isAIMapping}
            >
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
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-3 text-sm space-y-1">
          <p><strong>✨ IA:</strong> Use "Auto-Detectar com IA" para mapeamento inteligente com Gemini</p>
          <p><strong>💡 Simples:</strong> Use "Auto-Detectar (Simples)" para mapeamento por similaridade</p>
          <p><strong>⏭️ Ignorar:</strong> Colunas ignoradas não serão importadas</p>
          <p><strong className="text-red-500">*</strong> = Campo obrigatório</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnMappingDialogWithAI;
