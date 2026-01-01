import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, CheckCircle } from "lucide-react";
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

interface ApprovedPropertiesExportProps {
  filters?: {
    userId?: string;
    tags?: string[];
    searchQuery?: string;
  };
}

export function ApprovedPropertiesExport({ filters }: ApprovedPropertiesExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchApprovedProperties = async () => {
    let query = supabase
      .from("properties")
      .select("*")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
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

  const exportToCSV = async (includeExtendedData: boolean = false) => {
    setExporting(true);

    try {
      const properties = await fetchApprovedProperties();

      if (properties.length === 0) {
        toast({
          title: "No Data",
          description: "No approved properties to export",
        });
        return;
      }

      // Basic headers
      const basicHeaders = [
        "Address",
        "City",
        "State",
        "ZIP Code",
        "Owner Name",
        "Owner Phone",
        "Owner Email",
        "Estimated Value",
        "Offer Amount",
        "Lead Status",
        "Lead Score",
        "Approval Status",
        "Approved At",
        "Approved By",
      ];

      // Extended headers
      const extendedHeaders = [
        ...basicHeaders,
        "Property Type",
        "Bedrooms",
        "Bathrooms",
        "Square Feet",
        "Lot Size",
        "Year Built",
        "Last Sale Date",
        "Last Sale Price",
        "Tax Amount",
        "Tax Year",
        "Delinquent Amount",
        "Notes",
        "Tags",
        "Created At",
        "Updated At",
      ];

      const headers = includeExtendedData ? extendedHeaders : basicHeaders;

      const rows = properties.map((prop) => {
        const basicData = [
          prop.address || "",
          prop.city || "",
          prop.state || "",
          prop.zip_code || "",
          prop.owner_name || "",
          prop.owner_phone || "",
          prop.owner_email || "",
          prop.estimated_value?.toString() || "",
          prop.offer_amount?.toString() || "",
          prop.lead_status || "",
          prop.lead_score?.toString() || "",
          prop.approval_status || "",
          prop.approved_at ? format(new Date(prop.approved_at), "yyyy-MM-dd HH:mm:ss") : "",
          prop.approved_by || "",
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
            prop.last_sale_date || "",
            prop.last_sale_price?.toString() || "",
            prop.tax_amount?.toString() || "",
            prop.tax_year?.toString() || "",
            prop.delinquent_amount?.toString() || "",
            prop.notes || "",
            Array.isArray(prop.tags) ? prop.tags.join("; ") : "",
            prop.created_at ? format(new Date(prop.created_at), "yyyy-MM-dd HH:mm:ss") : "",
            prop.updated_at ? format(new Date(prop.updated_at), "yyyy-MM-dd HH:mm:ss") : "",
          ];
        }

        return basicData;
      });

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => {
            // Escape quotes and wrap in quotes
            const escaped = String(cell).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `approved-properties-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${properties.length} approved properties`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export properties",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportBasicContactList = async () => {
    setExporting(true);

    try {
      const properties = await fetchApprovedProperties();

      if (properties.length === 0) {
        toast({
          title: "No Data",
          description: "No approved properties to export",
        });
        return;
      }

      // Minimal headers for contact list
      const headers = [
        "Name",
        "Phone",
        "Email",
        "Address",
        "City, State ZIP",
      ];

      const rows = properties.map((prop) => [
        prop.owner_name || "",
        prop.owner_phone || "",
        prop.owner_email || "",
        prop.address || "",
        `${prop.city || ""}, ${prop.state || ""} ${prop.zip_code || ""}`.trim(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => {
            const escaped = String(cell).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `approved-contacts-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${properties.length} contacts`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export contacts",
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={exportBasicContactList} disabled={exporting}>
          <FileText className="h-4 w-4 mr-2" />
          Contact List (Basic)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => exportToCSV(false)} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          Standard Export
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => exportToCSV(true)} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          Full Export (All Fields)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
