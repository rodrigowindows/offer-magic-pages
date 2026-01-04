import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import Papa from "papaparse";

interface SkipTracingRow {
  "Input Property Address": string;
  "Input Property City": string;
  "Input Property State": string;
  "Input Property Zip": string;
  "Matched First Name": string;
  "Matched Last Name": string;
  "DNC/Litigator Scrub": string;
  Age: string;
  Deceased: string;
  Phone1: string;
  "Phone1 Type": string;
  Phone2: string;
  "Phone2 Type": string;
  Phone3: string;
  "Phone3 Type": string;
  Phone4: string;
  "Phone4 Type": string;
  Phone5: string;
  "Phone5 Type": string;
  Phone6: string;
  "Phone6 Type": string;
  Phone7: string;
  "Phone7 Type": string;
  Email1: string;
  Email2: string;
  [key: string]: string;
}

export function SkipTracingImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
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
    // Priority: Mobile > Residential > OtherPhone
    const mobile = phones.find(p => p.type === "Mobile" && p.number);
    if (mobile) return mobile.number;

    const residential = phones.find(p => p.type === "Residential" && p.number);
    if (residential) return residential.number;

    const other = phones.find(p => p.number);
    return other?.number || null;
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
              const address = row["Input Property Address"]?.trim();
              const city = row["Input Property City"]?.trim();
              const state = row["Input Property State"]?.trim();
              const zipCode = row["Input Property Zip"]?.trim();

              if (!address) {
                stats.skipped++;
                continue;
              }

              // Find property by address
              const { data: properties, error: searchError } = await supabase
                .from("properties")
                .select("id, address, owner_name, owner_phone, owner_email")
                .ilike("address", `%${address}%`)
                .ilike("city", `%${city}%`)
                .eq("state", state)
                .limit(5);

              if (searchError) throw searchError;

              if (!properties || properties.length === 0) {
                stats.skipped++;
                stats.details.push(`❌ Not found: ${address}, ${city}, ${state}`);
                continue;
              }

              // If multiple matches, try exact match with zip
              let property = properties[0];
              if (properties.length > 1 && zipCode) {
                const exactMatch = properties.find(p =>
                  p.address.toLowerCase().includes(address.toLowerCase())
                );
                if (exactMatch) property = exactMatch;
              }

              stats.matched++;

              // Extract skip tracing data
              const firstName = row["Matched First Name"]?.trim();
              const lastName = row["Matched Last Name"]?.trim();
              const isDNC = row["DNC/Litigator Scrub"] === "DNC" || row["DNC/Litigator Scrub"] === "Yes";
              const isDeceased = row["Deceased"] === "Y";
              const age = row["Age"] ? parseInt(row["Age"]) : null;

              // Collect all phones
              const phones = [];
              for (let i = 1; i <= 7; i++) {
                const phone = row[`Phone${i}`]?.trim();
                const type = row[`Phone${i} Type`]?.trim();
                if (phone) {
                  phones.push({ number: phone, type: type || "Unknown" });
                }
              }

              const bestPhone = getBestPhone(phones);
              const email1 = row["Email1"]?.trim();
              const email2 = row["Email2"]?.trim();
              const bestEmail = email1 || email2 || null;

              // Build skip tracing metadata
              const skipTracingData = {
                firstName,
                lastName,
                age,
                isDNC,
                isDeceased,
                phones: phones.map(p => ({ number: p.number, type: p.type })),
                emails: [email1, email2].filter(Boolean),
                relatives: extractRelatives(row),
                updatedAt: new Date().toISOString(),
              };

              // Update property
              const updateData: any = {
                skip_tracing_data: skipTracingData,
              };

              // Only update if we have better data
              if (firstName && lastName && !property.owner_name) {
                updateData.owner_name = `${firstName} ${lastName}`;
              }

              if (bestPhone && !property.owner_phone) {
                updateData.owner_phone = bestPhone;
              }

              if (bestEmail && !property.owner_email) {
                updateData.owner_email = bestEmail;
              }

              // Add DNC tag if applicable
              if (isDNC) {
                const currentTags = property.tags || [];
                if (!currentTags.includes("DNC")) {
                  updateData.tags = [...currentTags, "DNC"];
                }
              }

              const { error: updateError } = await supabase
                .from("properties")
                .update(updateData)
                .eq("id", property.id);

              if (updateError) throw updateError;

              stats.updated++;
              stats.details.push(
                `✅ Updated: ${address} - ${firstName} ${lastName} ${isDNC ? "(DNC)" : ""}`
              );

            } catch (error: any) {
              stats.errors++;
              stats.details.push(`❌ Error: ${row["Input Property Address"]} - ${error.message}`);
            }
          }

          setResults(stats);
          toast({
            title: "Import Complete",
            description: `Updated ${stats.updated} of ${stats.total} properties`,
          });
          setProcessing(false);
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: error.message,
            variant: "destructive",
          });
          setProcessing(false);
        },
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const extractRelatives = (row: SkipTracingRow) => {
    const relatives = [];
    for (let i = 1; i <= 5; i++) {
      const name = row[`Relative${i} Name`]?.trim();
      const age = row[`Relative${i} Age`]?.trim();
      if (name) {
        const phones = [];
        for (let j = 1; j <= 5; j++) {
          const phone = row[`Relative${i} Phone${j}`]?.trim();
          const type = row[`Relative${i} Phone${j} Type`]?.trim();
          if (phone) phones.push({ number: phone, type });
        }
        relatives.push({ name, age: age ? parseInt(age) : null, phones });
      }
    }
    return relatives;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Skip Tracing Importer
        </CardTitle>
        <CardDescription>
          Import skip tracing data to update property owner information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skiptracing-file">CSV File</Label>
          <Input
            id="skiptracing-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={processing}
          />
          <p className="text-xs text-muted-foreground">
            Expected format: PropStream skip tracing export with property address matching
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Matches properties by address (fuzzy matching)</li>
              <li>Updates owner name, phone (mobile preferred), email</li>
              <li>Saves all phones, relatives, ages in skip_tracing_data</li>
              <li>Tags properties with "DNC" if flagged</li>
              <li>Won't overwrite existing owner data unless empty</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button
          onClick={processFile}
          disabled={!file || processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing {results?.matched || 0} / {results?.total || 0}...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Skip Tracing Data
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Badge variant="outline" className="justify-center">
                Total: {results.total}
              </Badge>
              <Badge variant="default" className="bg-blue-600 justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Matched: {results.matched}
              </Badge>
              <Badge variant="default" className="bg-green-600 justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Updated: {results.updated}
              </Badge>
              <Badge variant="secondary" className="justify-center">
                Skipped: {results.skipped}
              </Badge>
              <Badge variant="destructive" className="justify-center">
                <XCircle className="w-3 h-3 mr-1" />
                Errors: {results.errors}
              </Badge>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-semibold">
                View Details ({results.details.length} entries)
              </summary>
              <div className="mt-2 max-h-96 overflow-y-auto bg-muted p-3 rounded space-y-1">
                {results.details.map((detail, i) => (
                  <div key={i} className="font-mono">
                    {detail}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
