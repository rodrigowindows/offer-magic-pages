import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Users, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportType = "user_productivity" | "rejection_reasons" | "timeline_activity" | "detailed_audit";

export const TeamReportExporter = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("user_productivity");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Exportado com sucesso",
      description: `${filename} foi baixado`,
    });
  };

  const exportUserProductivity = async () => {
    try {
      setIsExporting(true);

      const { data, error } = await supabase
        .from("properties")
        .select("approved_by, approved_by_name, approval_status, approved_at")
        .not("approved_by", "is", null);

      if (error) throw error;

      // Aggregate by user
      const userMap = new Map();

      data?.forEach((prop) => {
        const userId = prop.approved_by;
        const userName = prop.approved_by_name || "Unknown User";

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            "ID do Usuário": userId,
            "Nome do Usuário": userName,
            "Total Processado": 0,
            "Aprovações": 0,
            "Rejeições": 0,
            "Taxa de Aprovação (%)": 0,
            "Primeira Atividade": null,
            "Última Atividade": null,
          });
        }

        const user = userMap.get(userId);
        user["Total Processado"]++;

        if (prop.approval_status === "approved") {
          user["Aprovações"]++;
        } else if (prop.approval_status === "rejected") {
          user["Rejeições"]++;
        }

        // Track first and last activity
        const activityDate = new Date(prop.approved_at);
        if (!user["Primeira Atividade"] || activityDate < new Date(user["Primeira Atividade"])) {
          user["Primeira Atividade"] = prop.approved_at;
        }
        if (!user["Última Atividade"] || activityDate > new Date(user["Última Atividade"])) {
          user["Última Atividade"] = prop.approved_at;
        }
      });

      // Calculate approval rate and format dates
      const reportData = Array.from(userMap.values()).map((user) => {
        user["Taxa de Aprovação (%)"] = (
          (user["Aprovações"] / user["Total Processado"]) *
          100
        ).toFixed(1);
        user["Primeira Atividade"] = user["Primeira Atividade"]
          ? new Date(user["Primeira Atividade"]).toLocaleDateString("pt-BR")
          : "N/A";
        user["Última Atividade"] = user["Última Atividade"]
          ? new Date(user["Última Atividade"]).toLocaleDateString("pt-BR")
          : "N/A";
        return user;
      });

      // Sort by total processed
      reportData.sort((a, b) => b["Total Processado"] - a["Total Processado"]);

      const filename = `relatorio_produtividade_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(reportData, filename);
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportRejectionReasons = async () => {
    try {
      setIsExporting(true);

      const { data, error } = await supabase
        .from("properties")
        .select("rejection_reason, rejection_notes, approved_by_name, approved_at, property_address")
        .eq("approval_status", "rejected")
        .not("rejection_reason", "is", null);

      if (error) throw error;

      // Aggregate by rejection reason
      const reasonMap = new Map();

      data?.forEach((prop) => {
        const reason = prop.rejection_reason;

        if (!reasonMap.has(reason)) {
          reasonMap.set(reason, {
            "Motivo da Rejeição": reason,
            "Quantidade": 0,
            "Exemplos de Propriedades": [],
            "Usuários que Rejeitaram": new Set(),
          });
        }

        const reasonData = reasonMap.get(reason);
        reasonData["Quantidade"]++;

        if (reasonData["Exemplos de Propriedades"].length < 3) {
          reasonData["Exemplos de Propriedades"].push(prop.property_address);
        }

        if (prop.approved_by_name) {
          reasonData["Usuários que Rejeitaram"].add(prop.approved_by_name);
        }
      });

      const totalRejections = data?.length || 0;

      const reportData = Array.from(reasonMap.values()).map((reason) => ({
        "Motivo da Rejeição": reason["Motivo da Rejeição"],
        "Quantidade": reason["Quantidade"],
        "Porcentagem (%)": ((reason["Quantidade"] / totalRejections) * 100).toFixed(1),
        "Exemplos": reason["Exemplos de Propriedades"].join("; "),
        "Usuários": Array.from(reason["Usuários que Rejeitaram"]).join(", "),
      }));

      // Sort by quantity
      reportData.sort((a, b) => b["Quantidade"] - a["Quantidade"]);

      const filename = `relatorio_motivos_rejeicao_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(reportData, filename);
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportTimelineActivity = async () => {
    try {
      setIsExporting(true);

      const { data, error } = await supabase
        .from("properties")
        .select("approved_by_name, approval_status, approved_at")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyMap = new Map();

      data?.forEach((prop) => {
        const date = new Date(prop.approved_at).toLocaleDateString("pt-BR");

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            "Data": date,
            "Total": 0,
            "Aprovações": 0,
            "Rejeições": 0,
            "Usuários Ativos": new Set(),
          });
        }

        const day = dailyMap.get(date);
        day["Total"]++;

        if (prop.approval_status === "approved") {
          day["Aprovações"]++;
        } else if (prop.approval_status === "rejected") {
          day["Rejeições"]++;
        }

        if (prop.approved_by_name) {
          day["Usuários Ativos"].add(prop.approved_by_name);
        }
      });

      const reportData = Array.from(dailyMap.values()).map((day) => ({
        "Data": day["Data"],
        "Total Processado": day["Total"],
        "Aprovações": day["Aprovações"],
        "Rejeições": day["Rejeições"],
        "Taxa de Aprovação (%)": ((day["Aprovações"] / day["Total"]) * 100).toFixed(1),
        "Usuários Ativos": day["Usuários Ativos"].size,
        "Nomes dos Usuários": Array.from(day["Usuários Ativos"]).join(", "),
      }));

      const filename = `relatorio_timeline_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(reportData, filename);
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportDetailedAudit = async () => {
    try {
      setIsExporting(true);

      const { data, error } = await supabase
        .from("properties")
        .select("property_address, owner_name, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: false });

      if (error) throw error;

      const reportData = data?.map((prop) => ({
        "Endereço da Propriedade": prop.property_address || "N/A",
        "Nome do Owner": prop.owner_name || "N/A",
        "Status": prop.approval_status === "approved" ? "Aprovado" : "Rejeitado",
        "Aprovado/Rejeitado por": prop.approved_by_name || "N/A",
        "Data e Hora": new Date(prop.approved_at).toLocaleString("pt-BR"),
        "Motivo da Rejeição": prop.rejection_reason || "N/A",
        "Notas": prop.rejection_notes || "N/A",
      })) || [];

      const filename = `relatorio_auditoria_completa_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(reportData, filename);
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    switch (selectedReport) {
      case "user_productivity":
        exportUserProductivity();
        break;
      case "rejection_reasons":
        exportRejectionReasons();
        break;
      case "timeline_activity":
        exportTimelineActivity();
        break;
      case "detailed_audit":
        exportDetailedAudit();
        break;
    }
  };

  const reportDescriptions = {
    user_productivity: "Produtividade de cada usuário com total de aprovações, rejeições e taxa de aprovação",
    rejection_reasons: "Análise dos motivos de rejeição mais comuns com exemplos e estatísticas",
    timeline_activity: "Atividade diária do time com métricas de aprovações e rejeições ao longo do tempo",
    detailed_audit: "Log completo de auditoria com todas as ações de aprovação/rejeição",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatórios
        </CardTitle>
        <CardDescription>
          Exporte dados em formato CSV para análise externa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
          <Select value={selectedReport} onValueChange={(value: ReportType) => setSelectedReport(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user_productivity">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Produtividade por Usuário
                </div>
              </SelectItem>
              <SelectItem value="rejection_reasons">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Motivos de Rejeição
                </div>
              </SelectItem>
              <SelectItem value="timeline_activity">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Atividade Timeline
                </div>
              </SelectItem>
              <SelectItem value="detailed_audit">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Auditoria Completa
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            {reportDescriptions[selectedReport]}
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-bounce" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </>
          )}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-blue-900 mb-1">💡 Dica:</p>
          <p className="text-blue-700">
            Os arquivos CSV podem ser abertos no Excel, Google Sheets ou qualquer software de planilhas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
