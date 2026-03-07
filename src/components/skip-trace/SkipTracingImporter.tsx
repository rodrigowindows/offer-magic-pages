import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, XCircle, AlertTriangle, Loader2, Download } from "lucide-react";
import Papa from "papaparse";

interface SkipTracingRow {
  [key: string]: string;
}

export function SkipTracingImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    matched: number;
    updated: number;
    skipped: number;
    errors: number;
    details: string[];
  } | null>(null);
  const { toast } = useToast();

  const getBestPhone = (phones: Array<{ number: string; type: string }>) => {
    const mobile = phones.find(p => p.type === "Mobile" && p.number);
    if (mobile) return mobile.number;
    const residential = phones.find(p => p.type === "Residential" && p.number);
    if (residential) return residential.number;
    const other = phones.find(p => p.number);
    return other?.number || null;
  };

  const val = (row: SkipTracingRow, key: string) => row[key]?.trim() || null;
  const valInt = (row: SkipTracingRow, key: string) => {
    const v = row[key]?.trim();
    return v ? parseInt(v) || null : null;
  };

  const extractPersonPhones = (row: SkipTracingRow, prefix: string) => {
    const data: Record<string, string | null> = {};
    for (let i = 1; i <= 7; i++) {
      const phone = val(row, `${prefix}Phone${i}`);
      const type = val(row, `${prefix}Phone${i} Type`);
      const dbPrefix = prefix.toLowerCase().replace(/ /g, "_").replace("person2 ", "person2_").replace("person3 ", "person3_");
      data[`${dbPrefix}phone${i}`] = phone;
      data[`${dbPrefix}phone${i}_type`] = type;
    }
    return data;
  };

  const extractRelativeColumns = (row: SkipTracingRow, prefix: string, dbPrefix: string) => {
    const data: Record<string, string | number | null> = {};
    for (let i = 1; i <= 5; i++) {
      data[`${dbPrefix}relative${i}_name`] = val(row, `${prefix}Relative${i} Name`);
      data[`${dbPrefix}relative${i}_age`] = valInt(row, `${prefix}Relative${i} Age`);
      for (let j = 1; j <= 5; j++) {
        data[`${dbPrefix}relative${i}_phone${j}`] = val(row, `${prefix}Relative${i} Phone${j}`);
        data[`${dbPrefix}relative${i}_phone${j}_type`] = val(row, `${prefix}Relative${i} Phone${j} Type`);
      }
    }
    return data;
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setResults(null);

    try {
      const text = await file.text();

      Papa.parse<SkipTracingRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (parsedData) => {
          const stats = {
            total: parsedData.data.length,
            matched: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            details: [] as string[],
          };

          for (const row of parsedData.data) {
            try {
              // Match by Custom Field 1 (UUID) first, then ID, then address
              const customField1 = val(row, "Input Custom Field 1");
              const rowId = val(row, "ID");
              const address = val(row, "Input Property Address");
              const city = val(row, "Input Property City");
              const state = val(row, "Input Property State");

              const matchId = customField1 || rowId;

              if (!matchId && !address) {
                stats.skipped++;
                continue;
              }

              // Check ResultCode - skip if no result
              const resultCode = val(row, "ResultCode");

              let property: any = null;

              // Match by ID (UUID)
              if (matchId) {
                const { data, error: idError } = await supabase
                  .from("properties")
                  .select("id, address, city, state, zip_code, owner_name, owner_phone, tags")
                  .eq("id", matchId)
                  .single();
                if (!idError && data) property = data;
              }

              // Fallback to address matching
              if (!property && address) {
                const cleanAddr = address.replace(/\bUNINCORPORATED\b/gi, "").replace(/\b\d{5}(-\d{4})?\s*$/, "").replace(/\s{2,}/g, " ").trim();
                const { data: properties, error: searchError } = await supabase
                  .from("properties")
                  .select("id, address, city, state, zip_code, owner_name, owner_phone, tags")
                  .ilike("address", `%${cleanAddr}%`)
                  .ilike("city", `%${city || ""}%`)
                  .eq("state", state || "FL")
                  .limit(5);

                if (searchError) throw searchError;

                if (properties && properties.length > 0) {
                  property = properties[0];
                  if (properties.length > 1) {
                    const exactMatch = properties.find(p =>
                      p.address.toLowerCase().trim() === cleanAddr.toLowerCase()
                    );
                    if (exactMatch) property = exactMatch;
                  }
                }
              }

              if (!property) {
                stats.skipped++;
                stats.details.push(`Skip: ${matchId || address} - not found`);
                continue;
              }

              stats.matched++;

              // If no result from skip trace, mark as skipped but log
              if (!resultCode || resultCode === "NR") {
                stats.details.push(`No result: ${address || matchId}`);
                // Still update to mark that skip trace was attempted
              }

              // === PRIMARY PERSON (Person 1) ===
              const firstName = val(row, "Matched First Name");
              const lastName = val(row, "Matched Last Name");
              const isDNC = val(row, "DNC/Litigator Scrub") === "DNC" || val(row, "DNC/Litigator Scrub") === "Yes";
              const isDeceased = val(row, "Deceased") === "Y";
              const age = valInt(row, "Age");

              const phones = [];
              for (let i = 1; i <= 7; i++) {
                const phone = val(row, `Phone${i}`);
                const type = val(row, `Phone${i} Type`);
                if (phone) phones.push({ number: phone, type: type || "Unknown" });
              }

              const bestPhone = getBestPhone(phones);
              const email1 = val(row, "Email1");
              const email2 = val(row, "Email2");

              // Build update with ALL individual columns
              const updateData: Record<string, any> = {};

              // Owner name & phone
              if (updateExisting || !property.owner_name) {
                if (firstName && lastName) {
                  updateData.owner_name = `${firstName} ${lastName}`;
                }
              }
              if (updateExisting || !property.owner_phone) {
                if (bestPhone) updateData.owner_phone = bestPhone;
              }

              // Matched name (individual columns)
              updateData.matched_first_name = firstName;
              updateData.matched_last_name = lastName;

              // ResultCode
              updateData.resultcode = resultCode;

              // Input fields (original data sent to skip trace)
              updateData.input_first_name = val(row, "Input First Name");
              updateData.input_last_name = val(row, "Input Last Name");
              updateData.input_mailing_address = val(row, "Input Mailing Address");
              updateData.input_mailing_city = val(row, "Input Mailing City");
              updateData.input_mailing_state = val(row, "Input Mailing State");
              updateData.input_mailing_zip = val(row, "Input Mailing Zip");
              updateData.input_property_address = val(row, "Input Property Address");
              updateData.input_property_city = val(row, "Input Property City");
              updateData.input_property_state = val(row, "Input Property State");
              updateData.input_property_zip = val(row, "Input Property Zip");

              // Owner Fix fields (corrected owner info from skip trace)
              updateData.owner_fix_first_name = val(row, "Owner Fix - First Name");
              updateData.owner_fix_last_name = val(row, "Owner Fix - Last Name");
              updateData.owner_fix_mailing_address = val(row, "Owner Fix - Mailing Address");
              updateData.owner_fix_mailing_city = val(row, "Owner Fix - Mailing City");
              updateData.owner_fix_mailing_state = val(row, "Owner Fix - Mailing State");
              updateData.owner_fix_mailing_zip = val(row, "Owner Fix - Mailing Zip");

              // Primary person fields
              updateData.age = age;
              updateData.deceased = isDeceased;
              updateData.dnc_flag = isDNC;
              updateData.dnc_litigator_scrub = val(row, "DNC/Litigator Scrub");
              updateData.email1 = email1;
              updateData.email2 = email2;

              // Primary phones 1-7
              for (let i = 1; i <= 7; i++) {
                updateData[`phone${i}`] = val(row, `Phone${i}`);
                updateData[`phone${i}_type`] = val(row, `Phone${i} Type`);
              }

              // Primary confirmed mailing address
              updateData.confirmed_mailing_address = val(row, "Confirmed Mailing Address");
              updateData.confirmed_mailing_city = val(row, "Confirmed Mailing City");
              updateData.confirmed_mailing_state = val(row, "Confirmed Mailing State");
              updateData.confirmed_mailing_zip = val(row, "Confirmed Mailing Zip");

              // Primary relatives 1-5
              Object.assign(updateData, extractRelativeColumns(row, "", ""));

              // === PERSON 2 ===
              const p2First = val(row, "Person2 First Name");
              const p2Last = val(row, "Person2 Last Name");
              if (p2First || p2Last) {
                updateData.person2_first_name = p2First;
                updateData.person2_last_name = p2Last;
                updateData.person2_age = valInt(row, "Person2 Age");
                updateData.person2_deceased = val(row, "Person2 Deceased") === "Y";
                updateData.person2_email1 = val(row, "Person2 Email1");
                updateData.person2_email2 = val(row, "Person2 Email2");
                updateData.person2_confirmed_mailing_address = val(row, "Person2 Confirmed Mailing Address");
                updateData.person2_confirmed_mailing_city = val(row, "Person2 Confirmed Mailing City");
                updateData.person2_confirmed_mailing_state = val(row, "Person2 Confirmed Mailing State");
                updateData.person2_confirmed_mailing_zip = val(row, "Person2 Confirmed Mailing Zip");

                // Person2 phones 1-7
                for (let i = 1; i <= 7; i++) {
                  updateData[`person2_phone${i}`] = val(row, `Person2 Phone${i}`);
                  updateData[`person2_phone${i}_type`] = val(row, `Person2 Phone${i} Type`);
                }

                // Person2 relatives
                Object.assign(updateData, extractRelativeColumns(row, "Person2 ", "person2_"));
              }

              // === PERSON 3 ===
              const p3First = val(row, "Person3 First Name");
              const p3Last = val(row, "Person3 Last Name");
              if (p3First || p3Last) {
                updateData.person3_first_name = p3First;
                updateData.person3_last_name = p3Last;
                updateData.person3_age = valInt(row, "Person3 Age");
                updateData.person3_deceased = val(row, "Person3 Deceased") === "Y";
                updateData.person3_email1 = val(row, "Person3 Email1");
                updateData.person3_email2 = val(row, "Person3 Email2");
                updateData.person3_confirmed_mailing_address = val(row, "Person3 Confirmed Mailing Address");
                updateData.person3_confirmed_mailing_city = val(row, "Person3 Confirmed Mailing City");
                updateData.person3_confirmed_mailing_state = val(row, "Person3 Confirmed Mailing State");
                updateData.person3_confirmed_mailing_zip = val(row, "Person3 Confirmed Mailing Zip");

                for (let i = 1; i <= 7; i++) {
                  updateData[`person3_phone${i}`] = val(row, `Person3 Phone${i}`);
                  updateData[`person3_phone${i}_type`] = val(row, `Person3 Phone${i} Type`);
                }

                Object.assign(updateData, extractRelativeColumns(row, "Person3 ", "person3_"));
              }

              // Tags: DNC / Deceased
              const currentTags = Array.isArray(property.tags) ? property.tags : [];
              const newTags = [...currentTags];
              if (isDNC && !newTags.includes("DNC")) newTags.push("DNC");
              if (isDeceased && !newTags.includes("Deceased")) newTags.push("Deceased");
              if (newTags.length > currentTags.length) updateData.tags = newTags;

              // Skip tracing metadata (JSON backup)
              updateData.skip_tracing_data = {
                firstName, lastName, age, isDNC, isDeceased, resultCode,
                phones: phones.map(p => ({ number: p.number, type: p.type })),
                emails: [email1, email2].filter(Boolean),
                updatedAt: new Date().toISOString(),
              };

              // Remove null/undefined values to avoid overwriting with empty
              const cleanUpdate: Record<string, any> = {};
              for (const [key, value] of Object.entries(updateData)) {
                if (value !== null && value !== undefined) {
                  cleanUpdate[key] = value;
                }
              }

              const { error: updateError } = await supabase
                .from("properties")
                .update(cleanUpdate)
                .eq("id", property.id);

              if (updateError) throw updateError;

              stats.updated++;
              const flags = [];
              if (isDNC) flags.push("DNC");
              if (isDeceased) flags.push("DEC");
              stats.details.push(
                `OK: ${address || matchId} -> ${firstName} ${lastName} | ${phones.length}ph ${flags.join(" ")}`
              );

            } catch (error: any) {
              stats.errors++;
              stats.details.push(`ERR: ${val(row, "Input Property Address") || val(row, "Input Custom Field 1")} - ${error.message}`);
            }
          }

          setResults(stats);
          toast({
            title: "Import Completo",
            description: `${stats.updated} de ${stats.total} propriedades atualizadas`,
          });
          setProcessing(false);
        },
        error: (error) => {
          toast({ title: "Erro de Parse", description: error.message, variant: "destructive" });
          setProcessing(false);
        },
      });
    } catch (error: any) {
      toast({ title: "Import Falhou", description: error.message, variant: "destructive" });
      setProcessing(false);
    }
  };

  const exportResults = () => {
    if (!results) return;
    const csvContent = [
      "Status,Details",
      ...results.details.map(detail => {
        const status = detail.startsWith("OK") ? "Success" : detail.startsWith("Skip") ? "Skipped" : "Error";
        return `"${status}","${detail.replace(/"/g, '""')}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skip-trace-results-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Skip Trace Importer
        </CardTitle>
        <CardDescription>
          Importar dados de skip trace (BatchSkipTracing) - match por UUID no Custom Field 1
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skiptracing-file">Arquivo CSV</Label>
          <Input
            id="skiptracing-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={processing}
          />
          <p className="text-xs text-muted-foreground">
            Format: BatchSkipTracing export com "Input Custom Field 1" = property UUID
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="update-existing"
            checked={updateExisting}
            onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
            disabled={processing}
          />
          <label htmlFor="update-existing" className="text-sm font-medium leading-none">
            Sobrescrever owner_name e owner_phone existentes
          </label>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>O que salva:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Match por UUID (Custom Field 1) ou por endereco</li>
              <li>Phone1-7 + tipos, Email1-2, Mailing Address confirmado</li>
              <li>Person2 e Person3 completos (phones, emails, relatives)</li>
              <li>5 relatives por pessoa com phones e tipos</li>
              <li>Matched First/Last Name, Owner Fix, Input fields, ResultCode</li>
              <li>Tags automaticas: DNC, Deceased</li>
              <li>{updateExisting ? "SOBRESCREVE owner existente" : "Nao sobrescreve owner existente"}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button onClick={processFile} disabled={!file || processing} className="w-full">
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importar Skip Trace
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Badge variant="outline" className="justify-center">Total: {results.total}</Badge>
              <Badge variant="default" className="bg-blue-600 justify-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Match: {results.matched}
              </Badge>
              <Badge variant="default" className="bg-green-600 justify-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Atualizado: {results.updated}
              </Badge>
              <Badge variant="secondary" className="justify-center">Skip: {results.skipped}</Badge>
              <Badge variant="destructive" className="justify-center">
                <XCircle className="w-3 h-3 mr-1" /> Erros: {results.errors}
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={exportResults} className="w-full">
              <Download className="w-4 h-4 mr-2" /> Exportar Resultados
            </Button>

            <details className="text-xs">
              <summary className="cursor-pointer font-semibold">
                Detalhes ({results.details.length} entradas)
              </summary>
              <div className="mt-2 max-h-96 overflow-y-auto bg-muted p-3 rounded space-y-1 font-mono">
                {results.details.map((detail, i) => (
                  <div key={i}>{detail}</div>
                ))}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
