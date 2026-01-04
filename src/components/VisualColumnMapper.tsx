import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, AlertCircle, Check, X, ArrowRight, Wand2, Save, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { autoDetectDatabaseField } from "@/utils/csvColumnMappings";
import { DATABASE_FIELDS, type DatabaseFieldKey } from "./ColumnMappingDialog";

export interface ColumnMapping {
  csvColumn: string;
  dbField: DatabaseFieldKey | 'skip' | '';
  confidence?: 'high' | 'medium' | 'low';
  previewData?: string[];
}

interface VisualColumnMapperProps {
  csvHeaders: string[];
  csvData: Array<Record<string, string>>; // First 5-10 rows for preview
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  initialMappings?: ColumnMapping[];
}

export default function VisualColumnMapper({
  csvHeaders,
  csvData,
  onMappingComplete,
  initialMappings = []
}: VisualColumnMapperProps) {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Initialize mappings on mount
  useEffect(() => {
    if (initialMappings.length > 0) {
      setMappings(initialMappings);
    } else {
      // Create initial empty mappings with preview data
      const initialMaps = csvHeaders.map(header => ({
        csvColumn: header,
        dbField: '' as const,
        confidence: undefined,
        previewData: csvData.slice(0, 3).map(row => row[header] || '')
      }));
      setMappings(initialMaps);
    }
  }, [csvHeaders, csvData]);

  // Auto-detect all columns
  const handleAutoDetect = () => {
    const detected = mappings.map(mapping => {
      const suggestedField = autoDetectDatabaseField(mapping.csvColumn);

      // Calculate confidence based on string similarity
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (suggestedField) {
        const normalized = mapping.csvColumn.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fieldNormalized = suggestedField.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normalized === fieldNormalized) confidence = 'high';
        else if (normalized.includes(fieldNormalized) || fieldNormalized.includes(normalized)) confidence = 'high';
        else confidence = 'medium';
      }

      return {
        ...mapping,
        dbField: suggestedField || mapping.dbField,
        confidence: suggestedField ? confidence : undefined
      };
    });

    setMappings(detected);

    const mappedCount = detected.filter(m => m.dbField && m.dbField !== 'skip').length;
    toast({
      title: "Auto-Detect Complete! ✨",
      description: `Mapped ${mappedCount} of ${csvHeaders.length} columns`,
    });
  };

  // Update a single mapping
  const updateMapping = (csvColumn: string, dbField: DatabaseFieldKey | 'skip' | '') => {
    setMappings(prev => prev.map(m =>
      m.csvColumn === csvColumn
        ? { ...m, dbField, confidence: undefined } // Clear AI confidence when manually set
        : m
    ));
  };

  // Clear all mappings
  const handleClearAll = () => {
    setMappings(prev => prev.map(m => ({ ...m, dbField: '' as const, confidence: undefined })));
    toast({
      title: "Mappings Cleared",
      description: "All column mappings have been reset",
    });
  };

  // Get mapped count and required fields status
  const getMappingStats = () => {
    const mapped = mappings.filter(m => m.dbField && m.dbField !== 'skip');
    const requiredFields = DATABASE_FIELDS.filter(f => f.required);
    const mappedRequired = requiredFields.filter(rf =>
      mapped.some(m => m.dbField === rf.key)
    );
    const missingRequired = requiredFields.filter(rf =>
      !mapped.some(m => m.dbField === rf.key)
    );

    return {
      totalMapped: mapped.length,
      totalColumns: csvHeaders.length,
      requiredMapped: mappedRequired.length,
      requiredTotal: requiredFields.length,
      missingRequired: missingRequired.map(f => f.label),
      canImport: missingRequired.length === 0
    };
  };

  const stats = getMappingStats();

  // Get confidence badge color
  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    if (!confidence) return null;

    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-orange-100 text-orange-800 border-orange-300'
    };

    const icons = {
      high: '99%',
      medium: '75%',
      low: '50%'
    };

    return (
      <Badge variant="outline" className={`${colors[confidence]} text-xs`}>
        <Sparkles className="w-3 h-3 mr-1" />
        {icons[confidence]}
      </Badge>
    );
  };

  // Get DB field label
  const getDbFieldLabel = (key: DatabaseFieldKey | 'skip' | '') => {
    if (key === 'skip') return 'Skip (Ignore)';
    if (!key) return 'Not Mapped';
    const field = DATABASE_FIELDS.find(f => f.key === key);
    return field ? field.label : key;
  };

  // Get field info (required, group)
  const getFieldInfo = (key: DatabaseFieldKey | 'skip' | '') => {
    if (key === 'skip' || !key) return null;
    const field = DATABASE_FIELDS.find(f => f.key === key);
    return field;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Visual Column Mapper
            </CardTitle>
            <CardDescription>
              Map CSV columns to database fields with visual preview
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetect}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Auto-Detect All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                📊 Mapped: {stats.totalMapped} / {stats.totalColumns} columns
              </p>
              <p className="text-sm">
                {stats.canImport ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    All required fields mapped! Ready to import.
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Missing required: {stats.missingRequired.join(', ')}
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={() => onMappingComplete(mappings)}
              disabled={!stats.canImport}
              size="lg"
            >
              Continue to Import
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">CSV Column</TableHead>
                {showPreview && <TableHead className="w-[250px]">Preview Data (first 3 rows)</TableHead>}
                <TableHead className="w-[150px]">AI Suggestion</TableHead>
                <TableHead className="w-[250px]">Map To Database Field</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => {
                const fieldInfo = getFieldInfo(mapping.dbField);
                const isRequired = fieldInfo?.required;
                const isMapped = mapping.dbField && mapping.dbField !== '';

                return (
                  <TableRow key={index} className={isRequired && !isMapped ? 'bg-red-50' : ''}>
                    {/* CSV Column Name */}
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm">{mapping.csvColumn}</p>
                        <p className="text-xs text-muted-foreground">
                          Column {index + 1}
                        </p>
                      </div>
                    </TableCell>

                    {/* Preview Data */}
                    {showPreview && (
                      <TableCell>
                        <div className="space-y-1">
                          {mapping.previewData?.map((value, i) => (
                            <p key={i} className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
                              {value || <span className="text-muted-foreground italic">empty</span>}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                    )}

                    {/* AI Suggestion */}
                    <TableCell>
                      {mapping.confidence && mapping.dbField ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{getDbFieldLabel(mapping.dbField)}</p>
                          {getConfidenceBadge(mapping.confidence)}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No suggestion</p>
                      )}
                    </TableCell>

                    {/* Mapping Dropdown */}
                    <TableCell>
                      <Select
                        value={mapping.dbField}
                        onValueChange={(value) => updateMapping(mapping.csvColumn, value as DatabaseFieldKey | 'skip' | '')}
                      >
                        <SelectTrigger className={isRequired && !isMapped ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Mapped</SelectItem>
                          <SelectItem value="skip">Skip (Ignore)</SelectItem>

                          {/* Group by category */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Basic Info</div>
                          {DATABASE_FIELDS.filter(f => f.group === 'basic').map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Owner Info</div>
                          {DATABASE_FIELDS.filter(f => f.group === 'owner').map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Property Details</div>
                          {DATABASE_FIELDS.filter(f => f.group === 'property').map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Financial</div>
                          {DATABASE_FIELDS.filter(f => f.group === 'financial').map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}

                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">System</div>
                          {DATABASE_FIELDS.filter(f => f.group === 'system').map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isRequired && !isMapped && (
                        <p className="text-xs text-red-500 mt-1">Required field</p>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {isMapped ? (
                        mapping.dbField === 'skip' ? (
                          <Badge variant="outline" className="bg-gray-100">
                            <X className="w-3 h-3 mr-1" />
                            Skip
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Mapped
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
