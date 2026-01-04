import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Check, X, RefreshCw, Eye } from "lucide-react";
import type { ColumnMapping, DatabaseFieldKey } from "./ColumnMappingDialog";
import { DATABASE_FIELDS } from "./ColumnMappingDialog";

interface VisualColumnMatcherProps {
  csvHeaders: string[];
  csvData: Array<{ [key: string]: string }>;
  currentMappings: ColumnMapping[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
}

const VisualColumnMatcher = ({
  csvHeaders,
  csvData,
  currentMappings,
  onMappingChange,
}: VisualColumnMatcherProps) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Agrupar campos do banco por categoria
  const groupedFields = useMemo(() => {
    const groups: Record<string, Array<{ key: DatabaseFieldKey; label: string; required: boolean; group: string }>> = {
      basic: [],
      owner: [],
      property: [],
      financial: [],
      system: [],
    };

    DATABASE_FIELDS.forEach((field) => {
      if (groups[field.group]) {
        groups[field.group].push(field);
      }
    });

    return groups;
  }, []);

  // Pegar exemplos de dados do CSV para cada coluna
  const getExamples = (csvColumn: string) => {
    return csvData
      .slice(0, 3)
      .map((row) => row[csvColumn])
      .filter((val) => val && val.trim() !== "");
  };

  // Pegar preview de como ficará no banco
  const getDbPreview = (mapping: ColumnMapping) => {
    if (!mapping.dbField || mapping.dbField === "skip") {
      return [];
    }

    const csvColumn = mapping.csvColumn;
    const examples = getExamples(csvColumn);

    return examples.map((example) => ({
      original: example,
      dbField: mapping.dbField,
      dbLabel: DATABASE_FIELDS.find((f) => f.key === mapping.dbField)?.label || mapping.dbField,
    }));
  };

  const handleMappingChange = (csvColumn: string, dbField: DatabaseFieldKey | "skip" | "") => {
    const newMappings = currentMappings.map((m) =>
      m.csvColumn === csvColumn
        ? { ...m, dbField, confidence: undefined, reason: "Manual" }
        : m
    );
    onMappingChange(newMappings);
  };

  const mappedCount = currentMappings.filter((m) => m.dbField && m.dbField !== "skip").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Visual de Mapeamento
            </CardTitle>
            <CardDescription>
              Veja como seus dados CSV serão mapeados para o banco de dados
            </CardDescription>
          </div>
          <Badge variant="secondary">{mappedCount} colunas mapeadas</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {currentMappings.map((mapping, idx) => {
              const examples = getExamples(mapping.csvColumn);
              const dbPreview = getDbPreview(mapping);
              const isExpanded = expandedRow === idx;
              const isMapped = mapping.dbField && mapping.dbField !== "skip";

              return (
                <Card
                  key={mapping.csvColumn}
                  className={`${
                    isMapped
                      ? "border-green-300 bg-green-50 dark:bg-green-950"
                      : "border-gray-200"
                  } transition-all`}
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                      {/* CSV Column - Left Side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            CSV
                          </Badge>
                          <span className="font-semibold text-sm">{mapping.csvColumn}</span>
                        </div>
                        <div className="space-y-1">
                          {examples.slice(0, isExpanded ? 5 : 2).map((example, i) => (
                            <div
                              key={i}
                              className="text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 border font-mono"
                            >
                              {example}
                            </div>
                          ))}
                          {examples.length > 2 && !isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => setExpandedRow(idx)}
                            >
                              + {examples.length - 2} mais exemplos
                            </Button>
                          )}
                          {isExpanded && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => setExpandedRow(null)}
                            >
                              Recolher
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="shrink-0">
                        <ArrowRight
                          className={`h-6 w-6 ${
                            isMapped ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </div>

                      {/* DB Field Selector - Right Side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            BANCO
                          </Badge>
                          {mapping.confidence && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                mapping.confidence === "high"
                                  ? "border-green-500 text-green-700"
                                  : mapping.confidence === "medium"
                                  ? "border-yellow-500 text-yellow-700"
                                  : "border-gray-500 text-gray-700"
                              }`}
                            >
                              {mapping.confidence === "high"
                                ? "Alta confiança"
                                : mapping.confidence === "medium"
                                ? "Média confiança"
                                : "Baixa confiança"}
                            </Badge>
                          )}
                        </div>

                        <Select
                          value={mapping.dbField || undefined}
                          onValueChange={(value) =>
                            handleMappingChange(
                              mapping.csvColumn,
                              value as DatabaseFieldKey | "skip" | ""
                            )
                          }
                        >
                          <SelectTrigger
                            className={
                              isMapped
                                ? "border-green-400 bg-white dark:bg-gray-900"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Selecionar campo do banco..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">
                              <span className="text-muted-foreground">⏭️ Ignorar esta coluna</span>
                            </SelectItem>

                            <SelectItem value="__header_basic" disabled className="font-semibold">
                              📍 Localização
                            </SelectItem>
                            {groupedFields.basic.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}{" "}
                                {field.required && <span className="text-red-500">*</span>}
                              </SelectItem>
                            ))}

                            <SelectItem value="__header_owner" disabled className="font-semibold">
                              👤 Proprietário
                            </SelectItem>
                            {groupedFields.owner.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                              </SelectItem>
                            ))}

                            <SelectItem value="__header_property" disabled className="font-semibold">
                              🏠 Detalhes do Imóvel
                            </SelectItem>
                            {groupedFields.property.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                              </SelectItem>
                            ))}

                            <SelectItem value="__header_financial" disabled className="font-semibold">
                              💰 Financeiro
                            </SelectItem>
                            {groupedFields.financial.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}{" "}
                                {field.required && <span className="text-red-500">*</span>}
                              </SelectItem>
                            ))}

                            <SelectItem value="__header_system" disabled className="font-semibold">
                              ⚙️ Sistema
                            </SelectItem>
                            {groupedFields.system.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Preview do Banco */}
                        {dbPreview.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {dbPreview.slice(0, isExpanded ? 5 : 2).map((preview, i) => (
                              <div
                                key={i}
                                className="text-xs bg-green-100 dark:bg-green-900 rounded px-2 py-1 border border-green-300 font-mono"
                              >
                                <span className="text-green-700 dark:text-green-300 font-semibold">
                                  {preview.dbLabel}:
                                </span>{" "}
                                {preview.original}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reason/Explanation */}
                        {mapping.reason && (
                          <p className="text-xs text-muted-foreground mt-2">{mapping.reason}</p>
                        )}
                      </div>

                      {/* Status Icon */}
                      <div className="shrink-0">
                        {isMapped ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary Footer */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            📊 Resumo do Mapeamento
          </p>
          <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
            <span>
              ✅ <strong>{mappedCount}</strong> colunas mapeadas
            </span>
            <span>
              ⏭️{" "}
              <strong>
                {currentMappings.filter((m) => m.dbField === "skip").length}
              </strong>{" "}
              ignoradas
            </span>
            <span>
              ❓{" "}
              <strong>
                {currentMappings.filter((m) => !m.dbField).length}
              </strong>{" "}
              sem mapear
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualColumnMatcher;
