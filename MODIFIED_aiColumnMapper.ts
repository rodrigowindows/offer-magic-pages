// AI-Powered Column Mapping using Lovable AI
// VERSÃO MODIFICADA COM SMART MATCHER INTEGRADO
import { supabase } from "@/integrations/supabase/client";
import { DATABASE_FIELDS } from "@/components/ColumnMappingDialog";
import type { DatabaseFieldKey } from "@/components/ColumnMappingDialog";
import { findBestMatch } from "./smartMatcher";

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
Se o CSV tem "Random Notes", mapeie para "skip" with confidence "medium".

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

// Main AI mapping function using Lovable AI with batch processing
export async function mapColumnsWithAI(
  csvHeaders: string[],
  csvData?: Array<{ [key: string]: string }>,
  onProgress?: (status: string) => void
): Promise<AIMapperResult> {
  const BATCH_SIZE = 50; // Process 50 columns at a time to avoid token limits

  try {
    onProgress?.('Conectando com IA...');

    const allMappings: AIColumnMapping[] = [];
    const totalBatches = Math.ceil(csvHeaders.length / BATCH_SIZE);

    // Process columns in batches
    for (let i = 0; i < csvHeaders.length; i += BATCH_SIZE) {
      const batch = csvHeaders.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      onProgress?.(`Mapeando lote ${batchNum}/${totalBatches} (${batch.length} colunas)...`);

      try {
        // Generate prompt for this batch
        const prompt = generateMappingPrompt(batch);

        // Call Lovable AI via edge function
        const { data, error } = await supabase.functions.invoke('ai-column-mapper', {
          body: { prompt, csvHeaders: batch },
        });

        if (error) {
          console.error(`AI mapping error for batch ${batchNum}:`, error);
          // Fallback to smart matching for this batch
          const fallbackBatch = fallbackToStringMatching(batch, csvData);
          allMappings.push(...fallbackBatch);
          continue;
        }

        // Parse response for this batch
        const batchMappings = parseAIResponse(data.content || data.text || JSON.stringify(data));

        // Validate batch columns are mapped
        const mappedColumns = new Set(batchMappings.map(m => m.csvColumn));
        const missingColumns = batch.filter(h => !mappedColumns.has(h));

        if (missingColumns.length > 0) {
          console.warn(`Batch ${batchNum}: AI did not map all columns:`, missingColumns);
          // Add skip mappings for missing columns
          missingColumns.forEach(col => {
            batchMappings.push({
              csvColumn: col,
              suggestedField: 'skip',
              confidence: 'low',
              reason: 'Não foi possível mapear automaticamente',
            });
          });
        }

        allMappings.push(...batchMappings);
      } catch (batchError: any) {
        console.error(`Error processing batch ${batchNum}:`, batchError);
        // Fallback to smart matching for failed batches
        const fallbackBatch = fallbackToStringMatching(batch, csvData);
        allMappings.push(...fallbackBatch);
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < csvHeaders.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    onProgress?.(`Mapeamento concluído: ${allMappings.length} colunas processadas`);

    return {
      success: true,
      mappings: allMappings,
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

// Fallback to smart string matching if AI fails
export function fallbackToStringMatching(
  csvHeaders: string[],
  csvData?: Array<{ [key: string]: string }>
): AIColumnMapping[] {
  return csvHeaders.map(header => {
    // Get values for this column
    const values = csvData
      ? csvData.slice(0, 20).map(row => row[header]).filter(v => v && v.trim())
      : [];

    // Use smart matcher if we have data
    if (values.length > 0) {
      try {
        const match = findBestMatch(
          header,
          values,
          DATABASE_FIELDS.map(f => ({
            key: f.key,
            label: f.label,
            required: f.required
          }))
        );

        return {
          csvColumn: header,
          suggestedField: match.field,
          confidence: match.confidence,
          reason: `${match.reason} (${(match.score * 100).toFixed(0)}%)`
        };
      } catch (error) {
        console.error('Smart matcher error for', header, error);
        // Continue to fallback below
      }
    }

    // Fallback to simple matching
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Partial matching with keywords
    const containsAddress = h.includes('address') || h.includes('endereco');
    const containsMailing = h.includes('mailing') || h.includes('correspondencia');
    const containsOwner = h.includes('owner') || h.includes('proprietario');
    const containsName = h.includes('name') || h.includes('nome');

    if (containsOwner && containsName && !containsAddress) {
      return {
        csvColumn: header,
        suggestedField: 'owner_name',
        confidence: 'medium',
        reason: 'Contém "owner" e "name"'
      };
    }

    if (containsAddress && !containsMailing && !containsOwner) {
      return {
        csvColumn: header,
        suggestedField: 'address',
        confidence: 'medium',
        reason: 'Contém "address"'
      };
    }

    if (containsMailing || (containsOwner && containsAddress)) {
      return {
        csvColumn: header,
        suggestedField: 'owner_address',
        confidence: 'medium',
        reason: 'Endereço do proprietário detectado'
      };
    }

    const mappings: Record<string, DatabaseFieldKey> = {
      'address': 'address', 'propertyaddress': 'address', 'situsaddress': 'address',
      'fulladdress': 'address', 'streetaddress': 'address',
      'city': 'city', 'propertycity': 'city',
      'state': 'state', 'propertystate': 'state',
      'zip': 'zip_code', 'zipcode': 'zip_code',
      'county': 'county',
      'ownername': 'owner_name', 'fullname': 'owner_name', 'ownerfullname': 'owner_name',
      'ownerphone': 'owner_phone', 'phone': 'owner_phone',
      'owneraddress': 'owner_address', 'mailingaddress': 'owner_address',
      'ownerfulladdress': 'owner_address', 'ownermailingaddress': 'owner_address',
      'beds': 'bedrooms', 'bedrooms': 'bedrooms',
      'baths': 'bathrooms', 'bathrooms': 'bathrooms',
      'sqft': 'square_feet', 'squarefeet': 'square_feet',
      'lotsize': 'lot_size',
      'yearbuilt': 'year_built',
      'propertytype': 'property_type',
      'justvalue': 'estimated_value', 'estimatedvalue': 'estimated_value',
      'marketvalue': 'estimated_value', 'assessedvalue': 'estimated_value',
      'accountnumber': 'origem', 'parcelid': 'origem', 'folio': 'origem',
    };

    const detected = mappings[h] || 'skip';

    return {
      csvColumn: header,
      suggestedField: detected,
      confidence: detected !== 'skip' ? 'medium' : 'low',
      reason: detected !== 'skip' ? 'Auto-detectado por nome' : 'Nenhuma correspondência encontrada',
    };
  });
}
