import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import {
  bulkImportOrlandoLeads,
  parseOrlandoLeadsCSV,
  readCSVFile,
  type BulkImportOptions,
} from "@/utils/bulkImport";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const BulkImportDialog = ({
  open,
  onOpenChange,
  onImportComplete,
}: BulkImportDialogProps) => {
  const { toast } = useToast();
  const { userId, userName } = useCurrentUser();

  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");

  // Import options
  const [runAIAnalysis, setRunAIAnalysis] = useState(true);
  const [checkAirbnb, setCheckAirbnb] = useState(true);
  const [autoTag, setAutoTag] = useState(true);
  const [importBatchName, setImportBatchName] = useState(
    `Orlando-${new Date().toISOString().split('T')[0]}`
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo CSV",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo CSV primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!userId || !userName) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setStatus("Lendo arquivo CSV...");

    try {
      // 1. Read CSV file
      const csvContent = await readCSVFile(file);
      setProgress(10);

      // 2. Parse CSV to leads
      setStatus("Processando dados...");
      const leads = parseOrlandoLeadsCSV(csvContent);
      setProgress(20);

      if (leads.length === 0) {
        throw new Error("Nenhuma propriedade válida encontrada no arquivo CSV");
      }

      // 3. Import leads
      setStatus(`Importando ${leads.length} propriedades...`);

      const options: BulkImportOptions = {
        runAIAnalysis,
        checkAirbnb,
        autoTag,
        uploadImages: false, // Images handled separately via upload_images.py
        importBatchName,
      };

      const result = await bulkImportOrlandoLeads(leads, userId, userName, options);

      // Update progress
      setProgress(100);

      if (result.success) {
        // Show success message
        toast({
          title: "Importação Completa! 🎉",
          description: `
            Importadas: ${result.imported} propriedades
            Analisadas com AI: ${result.analyzed}
            Tags aplicadas: ${result.tagged}
            Airbnb verificado: ${result.airbnbChecked}
            ${result.errors.length > 0 ? `\nErros: ${result.errors.length}` : ''}
          `,
        });

        // Reset and close
        setFile(null);
        setProgress(0);
        setStatus("");
        onImportComplete();
        onOpenChange(false);
      } else {
        throw new Error("Falha na importação");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erro na Importação",
        description: error.message || "Falha ao importar propriedades",
        variant: "destructive",
      });
      setProgress(0);
      setStatus("");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importação em Massa - Orlando Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV (ULTIMATE_FINAL_LEADS.csv)</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batch-name">Nome do Lote</Label>
            <Input
              id="batch-name"
              value={importBatchName}
              onChange={(e) => setImportBatchName(e.target.value)}
              placeholder="Orlando-2025-01-15"
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Usado para filtrar propriedades deste lote depois
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <h3 className="font-semibold text-sm">Opções de Processamento</h3>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-tag"
                checked={autoTag}
                onCheckedChange={(checked) => setAutoTag(checked as boolean)}
                disabled={isImporting}
              />
              <Label htmlFor="auto-tag" className="cursor-pointer text-sm">
                🏷️ Auto-tag (tier-1, tier-2, vacant, etc.) baseado no score
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-analysis"
                checked={runAIAnalysis}
                onCheckedChange={(checked) => setRunAIAnalysis(checked as boolean)}
                disabled={isImporting}
              />
              <Label htmlFor="ai-analysis" className="cursor-pointer text-sm">
                📊 Análise AI (valor comparativo, Zillow URLs)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="airbnb-check"
                checked={checkAirbnb}
                onCheckedChange={(checked) => setCheckAirbnb(checked as boolean)}
                disabled={isImporting}
              />
              <Label htmlFor="airbnb-check" className="cursor-pointer text-sm">
                🏠 Verificar elegibilidade Airbnb
              </Label>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Análise AI e Airbnb check adicionam ~1.5 segundos por propriedade
            </p>
          </div>

          {/* Expected Fields */}
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold text-sm mb-2">Campos Esperados no CSV:</h3>
            <div className="text-xs space-y-1">
              <p><strong>Obrigatórios:</strong> PID, address, city, estimated_value</p>
              <p><strong>Recomendados:</strong> score, owner_name, owner_address, owner_phone</p>
              <p><strong>Opcionais:</strong> bedrooms, bathrooms, square_feet, year_built, vacant, deed_certified</p>
            </div>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{status}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns minutos dependendo das opções selecionadas...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
            <p><strong>💡 Dica:</strong> Use o arquivo ULTIMATE_FINAL_LEADS.csv do Step 4</p>
            <p><strong>⏱️ Tempo estimado:</strong> ~1-2 segundos por propriedade com todas as opções</p>
            <p><strong>📷 Imagens:</strong> Use o script upload_images.py depois para fazer upload das fotos</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
