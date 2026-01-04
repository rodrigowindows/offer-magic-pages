# 🔌 Como Integrar o Visual Column Mapper

## 📋 Passo a Passo para Integração

### 1. Import do Componente

No seu arquivo de importação CSV (ex: `ImportProperties.tsx`):

```tsx
import VisualColumnMapper from "@/components/VisualColumnMapper";
```

### 2. Adicionar Estados

```tsx
const [showVisualMapper, setShowVisualMapper] = useState(false);
const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
const [columnMappings, setColumnMappings] = useState([]);
```

### 3. Modificar o Parse do CSV

```tsx
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      // Extrai headers
      const headers = Object.keys(results.data[0] || {});
      setCsvHeaders(headers);

      // Salva dados completos
      setCsvData(results.data as Array<Record<string, string>>);

      // Mostra o Visual Mapper
      setShowVisualMapper(true);

      toast({
        title: "CSV Uploaded! 📊",
        description: `Found ${results.data.length} rows and ${headers.length} columns`,
      });
    },
    error: (error) => {
      toast({
        title: "Error parsing CSV",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
```

### 4. Renderizar o Visual Mapper

```tsx
return (
  <div className="space-y-6">
    {/* Upload Section */}
    {!showVisualMapper && (
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload your property data CSV file to begin import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>
    )}

    {/* Visual Column Mapper */}
    {showVisualMapper && (
      <VisualColumnMapper
        csvHeaders={csvHeaders}
        csvData={csvData.slice(0, 10)} // Preview first 10 rows
        onMappingComplete={(mappings) => {
          setColumnMappings(mappings);
          setShowVisualMapper(false);
          // Proceed to final import step
          proceedToImport(mappings);
        }}
        initialMappings={columnMappings}
      />
    )}
  </div>
);
```

### 5. Processar os Mapeamentos para Import

```tsx
const proceedToImport = async (mappings: ColumnMapping[]) => {
  // Filter out unmapped and skipped columns
  const validMappings = mappings.filter(
    m => m.dbField && m.dbField !== 'skip' && m.dbField !== ''
  );

  // Transform CSV data based on mappings
  const transformedData = csvData.map(row => {
    const transformed: any = {};

    validMappings.forEach(mapping => {
      const csvValue = row[mapping.csvColumn];
      const dbField = mapping.dbField;

      // Apply transformations if needed
      if (dbField === 'estimated_value' || dbField === 'cash_offer_amount') {
        // Convert to number
        transformed[dbField] = parseFloat(csvValue?.replace(/[^0-9.-]/g, '') || '0');
      } else if (dbField === 'bedrooms' || dbField === 'bathrooms') {
        // Convert to integer
        transformed[dbField] = parseInt(csvValue || '0');
      } else {
        // Keep as string
        transformed[dbField] = csvValue || null;
      }
    });

    // Generate slug from address
    if (transformed.address) {
      transformed.slug = transformed.address
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set defaults
    transformed.status = 'active';
    transformed.lead_status = 'new';

    return transformed;
  });

  // Batch insert to Supabase
  await batchInsertProperties(transformedData);
};
```

### 6. Batch Insert para Supabase

```tsx
const batchInsertProperties = async (properties: any[]) => {
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < properties.length; i += BATCH_SIZE) {
    const batch = properties.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('properties')
      .insert(batch);

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }

    // Update progress
    toast({
      title: `Importing... ${Math.min(i + BATCH_SIZE, properties.length)} / ${properties.length}`,
      description: `${successCount} successful, ${errorCount} errors`,
    });
  }

  // Final result
  toast({
    title: successCount > 0 ? "Import Complete! 🎉" : "Import Failed",
    description: `Imported ${successCount} properties. ${errorCount} errors.`,
    variant: errorCount > 0 ? "destructive" : "default",
  });
};
```

## 🎨 Exemplo Completo de Fluxo

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import VisualColumnMapper, { type ColumnMapping } from "@/components/VisualColumnMapper";

export default function CSVImportPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importProgress, setImportProgress] = useState({ total: 0, current: 0 });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = Object.keys(results.data[0] || {});
        setCsvHeaders(headers);
        setCsvData(results.data as Array<Record<string, string>>);
        setStep('mapping');

        toast({
          title: "CSV Loaded! 📊",
          description: `${results.data.length} rows, ${headers.length} columns`,
        });
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleMappingComplete = async (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
    setStep('importing');

    // Transform and import
    const validMappings = mappings.filter(m => m.dbField && m.dbField !== 'skip' && m.dbField !== '');

    const transformedData = csvData.map(row => {
      const transformed: any = {};

      validMappings.forEach(mapping => {
        const value = row[mapping.csvColumn];
        const field = mapping.dbField;

        if (field === 'estimated_value' || field === 'cash_offer_amount') {
          transformed[field] = parseFloat(value?.replace(/[^0-9.-]/g, '') || '0');
        } else if (field === 'bedrooms' || field === 'bathrooms') {
          transformed[field] = parseInt(value || '0');
        } else {
          transformed[field] = value || null;
        }
      });

      if (transformed.address) {
        transformed.slug = transformed.address.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      transformed.status = 'active';
      transformed.lead_status = 'new';

      return transformed;
    });

    // Batch insert
    const BATCH_SIZE = 100;
    let successCount = 0;

    setImportProgress({ total: transformedData.length, current: 0 });

    for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
      const batch = transformedData.slice(i, i + BATCH_SIZE);

      const { error } = await supabase.from('properties').insert(batch);

      if (!error) {
        successCount += batch.length;
      }

      setImportProgress({
        total: transformedData.length,
        current: Math.min(i + BATCH_SIZE, transformedData.length)
      });
    }

    setStep('complete');

    toast({
      title: "Import Complete! 🎉",
      description: `Successfully imported ${successCount} properties`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>Select your property data CSV file</CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="file" accept=".csv" onChange={handleFileUpload} />
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <VisualColumnMapper
          csvHeaders={csvHeaders}
          csvData={csvData.slice(0, 10)}
          onMappingComplete={handleMappingComplete}
          initialMappings={columnMappings}
        />
      )}

      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing...</CardTitle>
            <CardDescription>
              Progress: {importProgress.current} / {importProgress.total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete! 🎉</CardTitle>
            <CardDescription>Your properties have been imported</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/admin'}>
              Go to Properties
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## 🚀 Pronto para Usar!

Agora você tem:
- ✅ Upload de CSV
- ✅ Visual Column Mapper interativo
- ✅ Preview de dados
- ✅ Auto-detect com IA
- ✅ Validação de campos obrigatórios
- ✅ Import em batch para Supabase
- ✅ Progress tracking

**Tudo pela interface visual!** 🎨
