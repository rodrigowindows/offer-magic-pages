import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CampaignExportProps {
  propertyId?: string;
}

export function CampaignExport({ propertyId }: CampaignExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    
    try {
      let query = supabase
        .from("campaign_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No campaign data to export",
        });
        return;
      }

      // Convert to CSV
      const headers = [
        "Sent At",
        "Campaign Type",
        "Recipient Name",
        "Recipient Phone",
        "Recipient Email",
        "Property Address",
        "API Status",
        "Link Clicked",
        "Clicked At",
        "Click Count",
      ];

      const rows = data.map((campaign) => [
        format(new Date(campaign.sent_at), "yyyy-MM-dd HH:mm:ss"),
        campaign.campaign_type,
        campaign.recipient_name || "",
        campaign.recipient_phone || "",
        campaign.recipient_email || "",
        campaign.property_address || "",
        campaign.api_status?.toString() || "",
        campaign.link_clicked ? "Yes" : "No",
        campaign.clicked_at ? format(new Date(campaign.clicked_at), "yyyy-MM-dd HH:mm:ss") : "",
        campaign.click_count?.toString() || "0",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `campaign-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${data.length} campaign records`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export campaign data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
}
