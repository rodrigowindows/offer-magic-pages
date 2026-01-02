// AI-Powered Column Mapping using Lovable AI
import { supabase } from "@/integrations/supabase/client";
import { DATABASE_FIELDS } from "@/components/ColumnMappingDialog";
import type { DatabaseFieldKey } from "@/components/ColumnMappingDialog";

interface AIColumnMapping {
  csvColumn: string;
  suggestedField: DatabaseFieldKey | 'skip';
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

interface AIMapperResult {
  mappings: AIColumnMapping[];
  success: boolean;
  error?: string;
}

// Generate prompt for AI column mapping
function generateMappingPrompt(csvHeaders: string[]): string {
  const availableFields = DATABASE_FIELDS.map(f => ({
    key: f.key,
    label: f.label,
    required: f.required,
    group: f.group,
  }));

  return `Você é um especialista em mapeamento de dados de imóveis. Analise as colunas do CSV abaixo e mapeie cada uma para o campo correto do banco de dados.

**Colunas do CSV:**
${csvHeaders.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

**Campos Disponíveis no Banco de Dados:**
${availableFields.map(f => `- ${f.key} (${f.label})${f.required ? ' [OBRIGATÓRIO]' : ''} - Grupo: ${f.group}`).join('\n')}

**Instruções:**
1. Para cada coluna do CSV, identifique o campo do banco de dados mais apropriado
2. Se uma coluna não corresponder a nenhum campo, sugira "skip"
3. Campos obrigatórios: address, estimated_value (pelo menos um deles deve ser mapeado)
4. Se houver múltiplos campos de nome (primeiro nome, último nome), mapeie para owner_name
5. Retorne APENAS um JSON válido, sem texto adicional

**Formato de Resposta (JSON válido):**
{
  "mappings": [
    {
      "csvColumn": "nome da coluna exata do CSV",
      "suggestedField": "nome_do_campo_db ou skip",
      "confidence": "high ou medium ou low",
      "reason": "breve explicação da escolha"
    }
  ]
}

**Exemplo:**
Se o CSV tem "Input Property Address", mapeie para "address" com confidence "high".
Se o CSV tem "Owner First Name", mapeie para "owner_name" com confidence "high".
Se o CSV tem "Random Notes", mapeie para "skip" com confidence "medium".

Retorne APENAS o JSON, sem markdown, sem explicações adicionais.`;
}

// Parse AI response
function parseAIResponse(responseText: string): AIColumnMapping[] {
  try {
    // Remove markdown code blocks if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    if (!parsed.mappings || !Array.isArray(parsed.mappings)) {
      throw new Error('Invalid response format: missing mappings array');
    }

    return parsed.mappings.map((m: any) => ({
      csvColumn: m.csvColumn,
      suggestedField: m.suggestedField as DatabaseFieldKey | 'skip',
      confidence: m.confidence || 'medium',
      reason: m.reason || '',
    }));
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw response:', responseText);
    throw new Error('Failed to parse AI response. Response may not be valid JSON.');
  }
}

// Main AI mapping function using Lovable AI
export async function mapColumnsWithAI(
  csvHeaders: string[],
  onProgress?: (status: string) => void
): Promise<AIMapperResult> {
  try {
    onProgress?.('Conectando com IA...');

    // Generate prompt
    const prompt = generateMappingPrompt(csvHeaders);

    onProgress?.('Analisando colunas do CSV...');

    // Call Lovable AI via edge function
    const { data, error } = await supabase.functions.invoke('ai-column-mapper', {
      body: { prompt, csvHeaders },
    });

    if (error) {
      console.error('AI mapping error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call AI service',
        mappings: [],
      };
    }

    onProgress?.('Processando sugestões da IA...');

    // Parse response
    const mappings = parseAIResponse(data.content || data.text || JSON.stringify(data));

    // Validate that all CSV columns are mapped
    const mappedColumns = new Set(mappings.map(m => m.csvColumn));
    const missingColumns = csvHeaders.filter(h => !mappedColumns.has(h));

    if (missingColumns.length > 0) {
      console.warn('AI did not map all columns:', missingColumns);
      // Add skip mappings for missing columns
      missingColumns.forEach(col => {
        mappings.push({
          csvColumn: col,
          suggestedField: 'skip',
          confidence: 'low',
          reason: 'Não foi possível mapear automaticamente',
        });
      });
    }

    onProgress?.('Mapeamento concluído!');

    return {
      success: true,
      mappings,
    };
  } catch (error: any) {
    console.error('AI mapping error:', error);
    return {
      success: false,
      error: error.message || 'Failed to map columns with AI',
      mappings: [],
    };
  }
}

// Fallback to string matching if AI fails
export function fallbackToStringMatching(csvHeaders: string[]): AIColumnMapping[] {
  // Simple string matching using inline logic (avoid circular import)
  const simpleMatch = (header: string): DatabaseFieldKey | 'skip' => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const mappings: Record<string, DatabaseFieldKey> = {
      'address': 'address', 'propertyaddress': 'address', 'situsaddress': 'address', 'inputpropertyaddress': 'address',
      'city': 'city', 'propertycity': 'city', 'situscity': 'city',
      'state': 'state', 'propertystate': 'state', 'situsstate': 'state',
      'zip': 'zip_code', 'zipcode': 'zip_code', 'postalcode': 'zip_code',
      'county': 'county',
      'neighborhood': 'neighborhood', 'subdivision': 'neighborhood',
      'ownername': 'owner_name', 'owner': 'owner_name', 'inputlastname': 'owner_name', 'inputfirstname': 'owner_name',
      'ownerphone': 'owner_phone', 'phone': 'owner_phone', 'phonenumber': 'owner_phone',
      'owneraddress': 'owner_address', 'mailingaddress': 'owner_address', 'inputmailingaddress': 'owner_address',
      'beds': 'bedrooms', 'bedrooms': 'bedrooms',
      'baths': 'bathrooms', 'bathrooms': 'bathrooms',
      'sqft': 'square_feet', 'squarefeet': 'square_feet', 'livingarea': 'square_feet',
      'lotsize': 'lot_size', 'lot': 'lot_size', 'landarea': 'lot_size',
      'yearbuilt': 'year_built', 'year': 'year_built',
      'propertytype': 'property_type', 'type': 'property_type', 'usecode': 'property_type',
      'justvalue': 'estimated_value', 'estimatedvalue': 'estimated_value', 'marketvalue': 'estimated_value', 'assessedvalue': 'estimated_value',
      'cashoffer': 'cash_offer_amount', 'offer': 'cash_offer_amount',
      'accountnumber': 'origem', 'account': 'origem', 'parcelid': 'origem', 'folio': 'origem', 'pid': 'origem',
    };
    
    return mappings[h] || 'skip';
  };

  return csvHeaders.map(header => {
    const detected = simpleMatch(header);
    return {
      csvColumn: header,
      suggestedField: detected,
      confidence: detected !== 'skip' ? 'medium' as const : 'low' as const,
      reason: detected !== 'skip' ? 'Auto-detectado por similaridade' : 'Nenhuma correspondência encontrada',
    };
  });
}
