import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, CheckCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface ApprovedPropertiesExportProps {
  filters?: {
    userId?: string;
    tags?: string[];
    searchQuery?: string;
    batch?: string;
  };
}

export function ApprovedPropertiesExport({ filters }: ApprovedPropertiesExportProps) {
  const [exporting, setExporting] = useState(false);
  const [batches, setBatches] = useState<{ name: string; count: number }[]>([]);
  const { toast } = useToast();

  // Fetch available batches with approved count
  useEffect(() => {
    const fetchBatches = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("import_batch")
        .eq("approval_status", "approved")
        .not("import_batch", "is", null);

      if (error || !data) return;

      const counts: Record<string, number> = {};
      for (const row of data) {
        const b = row.import_batch;
        if (b) counts[b] = (counts[b] || 0) + 1;
      }

      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.name.localeCompare(a.name));

      setBatches(sorted);
    };
    fetchBatches();
  }, []);

  const fetchApprovedProperties = async (batchOverride?: string) => {
    let query = supabase
      .from("properties")
      .select("*")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    const batch = batchOverride || filters?.batch;
    if (batch) {
      query = query.eq("import_batch", batch);
    }

    if (filters?.userId) {
      query = query.eq("approved_by", filters.userId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains("tags", filters.tags);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `address.ilike.%${filters.searchQuery}%,` +
        `city.ilike.%${filters.searchQuery}%,` +
        `owner_name.ilike.%${filters.searchQuery}%,` +
        `owner_phone.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeCsvRow = (row: string[]) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");

  const exportForSkipTrace = async (batch: string) => {
    setExporting(true);
    try {
      const properties = await fetchApprovedProperties(batch);

      if (properties.length === 0) {
        toast({ title: "Sem dados", description: "Nenhuma propriedade aprovada nesse batch" });
        return;
      }

      const headers = ["ID", "Address", "City", "State", "ZIP Code", "Owner Name"];
      const rows = properties.map((p) => [
        p.id || "",
        p.address || "",
        p.city || "",
        p.state || "",
        p.zip_code || "",
        p.owner_name || "",
      ]);

      const csv = [headers.join(","), ...rows.map(escapeCsvRow)].join("\n");
      const safeBatch = batch.replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadCSV(csv, `skip-trace-${safeBatch}-${format(new Date(), "yyyy-MM-dd")}.csv`);

      toast({
        title: "Export Completo",
        description: `${properties.length} propriedades exportadas para skip trace`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Falhou",
        description: error instanceof Error ? error.message : "Falha ao exportar",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async (includeExtendedData: boolean = false, batch?: string) => {
    setExporting(true);

    try {
      const properties = await fetchApprovedProperties(batch);

      if (properties.length === 0) {
        toast({ title: "Sem dados", description: "Nenhuma propriedade aprovada" });
        return;
      }

      const basicHeaders = [
        "ID", "Address", "City", "State", "ZIP Code", "Owner Name", "Owner Phone",
        "Estimated Value", "Cash Offer Amount", "Lead Status", "Lead Score",
        "Approval Status", "Approved At", "Approved By",
      ];

      const extendedHeaders = [
        ...basicHeaders, "Property Type", "Bedrooms", "Bathrooms", "Square Feet",
        "Lot Size", "Year Built", "Tags", "Created At", "Updated At",
      ];

      const headers = includeExtendedData ? extendedHeaders : basicHeaders;

      const rows = properties.map((prop) => {
        const basicData = [
          prop.id || "",
          prop.address || "",
          prop.city || "",
          prop.state || "",
          prop.zip_code || "",
          prop.owner_name || "",
          prop.owner_phone || "",
          prop.estimated_value?.toString() || "",
          prop.cash_offer_amount?.toString() || "",
          prop.lead_status || "",
          prop.lead_score?.toString() || "",
          prop.approval_status || "",
          prop.approved_at ? format(new Date(prop.approved_at), "yyyy-MM-dd HH:mm:ss") : "",
          prop.approved_by_name || prop.approved_by || "",
        ];

        if (includeExtendedData) {
          return [
            ...basicData,
            prop.property_type || "",
            prop.bedrooms?.toString() || "",
            prop.bathrooms?.toString() || "",
            prop.square_feet?.toString() || "",
            prop.lot_size?.toString() || "",
            prop.year_built?.toString() || "",
            Array.isArray(prop.tags) ? prop.tags.join("; ") : "",
            prop.created_at ? format(new Date(prop.created_at), "yyyy-MM-dd HH:mm:ss") : "",
            prop.updated_at ? format(new Date(prop.updated_at), "yyyy-MM-dd HH:mm:ss") : "",
          ];
        }

        return basicData;
      });

      const csv = [headers.join(","), ...rows.map(escapeCsvRow)].join("\n");
      const suffix = batch ? batch.replace(/[^a-zA-Z0-9_-]/g, "_") : format(new Date(), "yyyy-MM-dd-HHmm");
      downloadCSV(csv, `approved-properties-${suffix}.csv`);

      toast({
        title: "Export Completo",
        description: `${properties.length} propriedades aprovadas exportadas`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Falhou",
        description: error instanceof Error ? error.message : "Falha ao exportar",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          )}
          Export Approved
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Export por Batch</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Skip Trace export - per batch */}
        {batches.length > 0 ? (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={exporting}>
                <FileText className="h-4 w-4 mr-2" />
                Para Skip Trace
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                {batches.map((b) => (
                  <DropdownMenuItem key={b.name} onClick={() => exportForSkipTrace(b.name)} disabled={exporting}>
                    {b.name}
                    <span className="ml-auto text-xs text-muted-foreground">{b.count}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Export Completo
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                {batches.map((b) => (
                  <DropdownMenuItem key={b.name} onClick={() => exportToCSV(true, b.name)} disabled={exporting}>
                    {b.name}
                    <span className="ml-auto text-xs text-muted-foreground">{b.count}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportToCSV(true)} disabled={exporting}>
                  Todos os batches
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : (
          <DropdownMenuItem disabled>
            Nenhum batch com aprovados
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
