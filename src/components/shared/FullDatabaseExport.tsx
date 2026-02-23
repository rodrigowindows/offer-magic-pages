import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Download, Loader2, FileSpreadsheet, Users, Phone, Home, ClipboardList } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";

// All columns from the properties table, organized by category
const ALL_PROPERTY_COLUMNS = {
  // Core / Identification
  core: [
    "id", "slug", "address", "city", "state", "zip_code", "county",
    "status", "lead_status", "lead_score", "property_type",
    "created_at", "updated_at",
  ],
  // Valuation & Offer
  valuation: [
    "estimated_value", "cash_offer_amount", "comparative_price",
    "evaluation",
  ],
  // Property Details
  details: [
    "bedrooms", "bathrooms", "square_feet", "lot_size", "year_built",
    "age", "neighborhood", "latitude", "longitude",
    "zillow_url", "property_image_url",
  ],
  // Owner / Person 1
  owner: [
    "owner_name", "owner_phone", "owner_address",
    "email1", "email2",
    "phone1", "phone1_type", "phone2", "phone2_type",
    "phone3", "phone3_type", "phone4", "phone4_type",
    "phone5", "phone5_type", "phone6", "phone6_type",
    "phone7", "phone7_type",
    "matched_first_name", "matched_last_name",
    "owner_fix_first_name", "owner_fix_last_name",
    "owner_fix_mailing_address", "owner_fix_mailing_city",
    "owner_fix_mailing_state", "owner_fix_mailing_zip",
    "deceased", "age",
    "confirmed_mailing_address", "confirmed_mailing_city",
    "confirmed_mailing_state", "confirmed_mailing_zip",
  ],
  // Person 1 Relatives
  relatives: [
    "relative1_name", "relative1_age",
    "relative1_phone1", "relative1_phone1_type", "relative1_phone2", "relative1_phone2_type",
    "relative1_phone3", "relative1_phone3_type", "relative1_phone4", "relative1_phone4_type",
    "relative1_phone5", "relative1_phone5_type",
    "relative2_name", "relative2_age",
    "relative2_phone1", "relative2_phone1_type", "relative2_phone2", "relative2_phone2_type",
    "relative2_phone3", "relative2_phone3_type", "relative2_phone4", "relative2_phone4_type",
    "relative2_phone5", "relative2_phone5_type",
    "relative3_name", "relative3_age",
    "relative3_phone1", "relative3_phone1_type", "relative3_phone2", "relative3_phone2_type",
    "relative3_phone3", "relative3_phone3_type", "relative3_phone4", "relative3_phone4_type",
    "relative3_phone5", "relative3_phone5_type",
    "relative4_name", "relative4_age",
    "relative4_phone1", "relative4_phone1_type", "relative4_phone2", "relative4_phone2_type",
    "relative4_phone3", "relative4_phone3_type", "relative4_phone4", "relative4_phone4_type",
    "relative4_phone5", "relative4_phone5_type",
    "relative5_name", "relative5_age",
    "relative5_phone1", "relative5_phone1_type", "relative5_phone2", "relative5_phone2_type",
    "relative5_phone3", "relative5_phone3_type", "relative5_phone4", "relative5_phone4_type",
    "relative5_phone5", "relative5_phone5_type",
  ],
  // Person 2
  person2: [
    "person2_first_name", "person2_last_name", "person2_age", "person2_deceased",
    "person2_email1", "person2_email2",
    "person2_phone1", "person2_phone1_type", "person2_phone2", "person2_phone2_type",
    "person2_phone3", "person2_phone3_type", "person2_phone4", "person2_phone4_type",
    "person2_phone5", "person2_phone5_type", "person2_phone6", "person2_phone6_type",
    "person2_phone7", "person2_phone7_type",
    "person2_confirmed_mailing_address", "person2_confirmed_mailing_city",
    "person2_confirmed_mailing_state", "person2_confirmed_mailing_zip",
    // Person 2 Relatives
    "person2_relative1_name", "person2_relative1_age",
    "person2_relative1_phone1", "person2_relative1_phone1_type",
    "person2_relative1_phone2", "person2_relative1_phone2_type",
    "person2_relative1_phone3", "person2_relative1_phone3_type",
    "person2_relative1_phone4", "person2_relative1_phone4_type",
    "person2_relative1_phone5", "person2_relative1_phone5_type",
    "person2_relative2_name", "person2_relative2_age",
    "person2_relative2_phone1", "person2_relative2_phone1_type",
    "person2_relative2_phone2", "person2_relative2_phone2_type",
    "person2_relative2_phone3", "person2_relative2_phone3_type",
    "person2_relative2_phone4", "person2_relative2_phone4_type",
    "person2_relative2_phone5", "person2_relative2_phone5_type",
    "person2_relative3_name", "person2_relative3_age",
    "person2_relative3_phone1", "person2_relative3_phone1_type",
    "person2_relative3_phone2", "person2_relative3_phone2_type",
    "person2_relative3_phone3", "person2_relative3_phone3_type",
    "person2_relative3_phone4", "person2_relative3_phone4_type",
    "person2_relative3_phone5", "person2_relative3_phone5_type",
    "person2_relative4_name", "person2_relative4_age",
    "person2_relative4_phone1", "person2_relative4_phone1_type",
    "person2_relative4_phone2", "person2_relative4_phone2_type",
    "person2_relative4_phone3", "person2_relative4_phone3_type",
    "person2_relative4_phone4", "person2_relative4_phone4_type",
    "person2_relative4_phone5", "person2_relative4_phone5_type",
    "person2_relative5_name", "person2_relative5_age",
    "person2_relative5_phone1", "person2_relative5_phone1_type",
    "person2_relative5_phone2", "person2_relative5_phone2_type",
    "person2_relative5_phone3", "person2_relative5_phone3_type",
    "person2_relative5_phone4", "person2_relative5_phone4_type",
    "person2_relative5_phone5", "person2_relative5_phone5_type",
  ],
  // Person 3
  person3: [
    "person3_first_name", "person3_last_name", "person3_age", "person3_deceased",
    "person3_email1", "person3_email2",
    "person3_phone1", "person3_phone1_type", "person3_phone2", "person3_phone2_type",
    "person3_phone3", "person3_phone3_type", "person3_phone4", "person3_phone4_type",
    "person3_phone5", "person3_phone5_type", "person3_phone6", "person3_phone6_type",
    "person3_phone7", "person3_phone7_type",
    "person3_confirmed_mailing_address", "person3_confirmed_mailing_city",
    "person3_confirmed_mailing_state", "person3_confirmed_mailing_zip",
    // Person 3 Relatives
    "person3_relative1_name", "person3_relative1_age",
    "person3_relative1_phone1", "person3_relative1_phone1_type",
    "person3_relative1_phone2", "person3_relative1_phone2_type",
    "person3_relative1_phone3", "person3_relative1_phone3_type",
    "person3_relative1_phone4", "person3_relative1_phone4_type",
    "person3_relative1_phone5", "person3_relative1_phone5_type",
    "person3_relative2_name", "person3_relative2_age",
    "person3_relative2_phone1", "person3_relative2_phone1_type",
    "person3_relative2_phone2", "person3_relative2_phone2_type",
    "person3_relative2_phone3", "person3_relative2_phone3_type",
    "person3_relative2_phone4", "person3_relative2_phone4_type",
    "person3_relative2_phone5", "person3_relative2_phone5_type",
    "person3_relative3_name", "person3_relative3_age",
    "person3_relative3_phone1", "person3_relative3_phone1_type",
    "person3_relative3_phone2", "person3_relative3_phone2_type",
    "person3_relative3_phone3", "person3_relative3_phone3_type",
    "person3_relative3_phone4", "person3_relative3_phone4_type",
    "person3_relative3_phone5", "person3_relative3_phone5_type",
    "person3_relative4_name", "person3_relative4_age",
    "person3_relative4_phone1", "person3_relative4_phone1_type",
    "person3_relative4_phone2", "person3_relative4_phone2_type",
    "person3_relative4_phone3", "person3_relative4_phone3_type",
    "person3_relative4_phone4", "person3_relative4_phone4_type",
    "person3_relative4_phone5", "person3_relative4_phone5_type",
    "person3_relative5_name", "person3_relative5_age",
    "person3_relative5_phone1", "person3_relative5_phone1_type",
    "person3_relative5_phone2", "person3_relative5_phone2_type",
    "person3_relative5_phone3", "person3_relative5_phone3_type",
    "person3_relative5_phone4", "person3_relative5_phone4_type",
    "person3_relative5_phone5", "person3_relative5_phone5_type",
  ],
  // Compliance & DNC
  compliance: [
    "dnc_flag", "dnc_litigator_scrub", "answer_flag", "resultcode",
  ],
  // Approval & Review
  approval: [
    "approval_status", "approved_at", "approved_by", "approved_by_name",
    "rejection_reason", "rejection_notes",
    "updated_by", "updated_by_name",
  ],
  // Campaign & Communication
  campaigns: [
    "email_sent", "sms_sent", "letter_sent", "card_sent",
    "phone_call_made", "meeting_scheduled",
    "lead_captured", "lead_captured_at",
    "last_contact_date", "next_followup_date",
  ],
  // Import & Input Data
  importData: [
    "import_batch", "import_date",
    "input_first_name", "input_last_name",
    "input_mailing_address", "input_mailing_city",
    "input_mailing_state", "input_mailing_zip",
    "input_property_address", "input_property_city",
    "input_property_state", "input_property_zip",
    "input_custom_field_1", "input_custom_field_2", "input_custom_field_3",
  ],
  // Airbnb
  airbnb: [
    "airbnb_eligible", "airbnb_check_date", "airbnb_notes", "airbnb_regulations",
  ],
  // Other
  other: [
    "tags", "carta", "focar", "origem",
  ],
};

// Get all columns as a flat array
function getAllColumns(): string[] {
  const allCols: string[] = [];
  const seen = new Set<string>();
  for (const category of Object.values(ALL_PROPERTY_COLUMNS)) {
    for (const col of category) {
      if (!seen.has(col)) {
        seen.add(col);
        allCols.push(col);
      }
    }
  }
  return allCols;
}

// Get columns for a specific export mode
function getColumnsForMode(mode: "all" | "essential" | "contacts" | "skip-trace"): string[] {
  switch (mode) {
    case "all":
      return getAllColumns();
    case "essential":
      return [
        ...ALL_PROPERTY_COLUMNS.core,
        ...ALL_PROPERTY_COLUMNS.valuation,
        ...ALL_PROPERTY_COLUMNS.details,
        ...ALL_PROPERTY_COLUMNS.owner.slice(0, 5), // owner_name, phone, address, emails
        ...ALL_PROPERTY_COLUMNS.approval,
        ...ALL_PROPERTY_COLUMNS.campaigns,
        ...ALL_PROPERTY_COLUMNS.other,
      ];
    case "contacts":
      return [
        "id", "address", "city", "state", "zip_code",
        ...ALL_PROPERTY_COLUMNS.owner,
        ...ALL_PROPERTY_COLUMNS.relatives,
        ...ALL_PROPERTY_COLUMNS.person2,
        ...ALL_PROPERTY_COLUMNS.person3,
        ...ALL_PROPERTY_COLUMNS.compliance,
      ];
    case "skip-trace":
      return [
        "id", "address", "city", "state", "zip_code",
        "owner_name", "owner_phone", "owner_address",
        "email1", "email2",
        "phone1", "phone1_type", "phone2", "phone2_type",
        "phone3", "phone3_type", "phone4", "phone4_type",
        "phone5", "phone5_type", "phone6", "phone6_type",
        "phone7", "phone7_type",
        "matched_first_name", "matched_last_name",
        "confirmed_mailing_address", "confirmed_mailing_city",
        "confirmed_mailing_state", "confirmed_mailing_zip",
        "dnc_flag", "dnc_litigator_scrub", "answer_flag", "deceased",
        "person2_first_name", "person2_last_name",
        "person2_phone1", "person2_phone1_type",
        "person2_email1",
        "person3_first_name", "person3_last_name",
        "person3_phone1", "person3_phone1_type",
        "person3_email1",
      ];
    default:
      return getAllColumns();
  }
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function FullDatabaseExport() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchAllProperties = async () => {
    // Supabase has a default limit of 1000 rows, so we paginate
    const allData: Record<string, unknown>[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData.push(...data);
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  };

  const exportCSV = async (mode: "all" | "essential" | "contacts" | "skip-trace") => {
    setExporting(true);

    try {
      const properties = await fetchAllProperties();

      if (properties.length === 0) {
        toast({
          title: "Sem Dados",
          description: "Nenhuma propriedade encontrada para exportar",
        });
        return;
      }

      const columns = getColumnsForMode(mode);

      // Build CSV with BOM for Excel compatibility
      const BOM = "\uFEFF";
      const csvRows: string[] = [];

      // Header row
      csvRows.push(columns.map(col => `"${col}"`).join(","));

      // Data rows
      for (const prop of properties) {
        const row = columns.map(col => {
          const value = formatCellValue(prop[col]);
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(row.join(","));
      }

      const csvContent = BOM + csvRows.join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const modeLabels: Record<string, string> = {
        all: "completo",
        essential: "essencial",
        contacts: "contatos",
        "skip-trace": "skip-trace",
      };

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `properties-${modeLabels[mode]}-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportado com Sucesso",
        description: `${properties.length} propriedades exportadas (${columns.length} colunas - ${modeLabels[mode]})`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erro na Exportacao",
        description: error instanceof Error ? error.message : "Falha ao exportar propriedades",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const totalColumns = getAllColumns().length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2 text-blue-600" />
          )}
          Exportar BD
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Exportar Propriedades do Banco</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => exportCSV("all")} disabled={exporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
          <div>
            <div className="font-medium">Completo ({totalColumns} colunas)</div>
            <div className="text-xs text-muted-foreground">Todos os campos do banco de dados</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => exportCSV("essential")} disabled={exporting}>
          <Home className="h-4 w-4 mr-2 text-green-600" />
          <div>
            <div className="font-medium">Essencial</div>
            <div className="text-xs text-muted-foreground">Propriedade + valor + status + aprovacao</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => exportCSV("contacts")} disabled={exporting}>
          <Users className="h-4 w-4 mr-2 text-purple-600" />
          <div>
            <div className="font-medium">Contatos Completos</div>
            <div className="text-xs text-muted-foreground">Todas as pessoas, telefones e parentes</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => exportCSV("skip-trace")} disabled={exporting}>
          <Phone className="h-4 w-4 mr-2 text-orange-600" />
          <div>
            <div className="font-medium">Skip Trace</div>
            <div className="text-xs text-muted-foreground">Dados de skip trace + DNC + compliance</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <ClipboardList className="h-3 w-3 inline mr-1" />
          Exporta TODAS as propriedades (sem filtro)
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
