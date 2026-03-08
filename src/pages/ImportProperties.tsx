import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ColumnMappingDialog from "@/components/import-data/ColumnMappingDialog";
import { FieldCombiner } from "@/components/import-data/FieldCombiner";
import { SkipTracingImporter } from "@/components/skip-trace/SkipTracingImporter";
import { ImportPreviewSection } from "@/components/import/ImportPreviewSection";
import { useImportProperties } from "@/hooks/useImportProperties";
import {
  Upload, Image, FileSpreadsheet, CheckCircle, XCircle, Loader2,
  ArrowLeft, Download, Eye, Database, Tag,
} from "lucide-react";

const ImportProperties = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ip = useImportProperties();

  // Detect if inside /process flow to navigate back correctly
  const isInsideProcess = location.pathname.startsWith('/process');
  const backPath = isInsideProcess ? '/process' : '/admin';
  const backLabel = isInsideProcess ? 'Processo' : 'Voltar';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(backPath)}><ArrowLeft className="h-4 w-4 mr-2" />{backLabel}</Button>
            <div>
              <h1 className="text-2xl font-bold">Import Properties</h1>
              <p className="text-muted-foreground">Importe propriedades com imagens do seu computador</p>
            </div>
          </div>
          <Button variant="outline" onClick={ip.downloadSampleCSV}><Download className="h-4 w-4 mr-2" />Sample CSV</Button>
        </div>

        <SkipTracingImporter />

        {/* Batch config */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Configurações do Import</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome do Lote</Label>
                <Input value={ip.batchName} onChange={e => ip.setBatchName(e.target.value)} placeholder="Import-2025-01-15" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Tags</Label>
                <Input value={ip.importTags} onChange={e => ip.setImportTags(e.target.value)} placeholder="tax-lien, miami-dade" />
                <p className="text-xs text-muted-foreground">Separar por vírgula.</p>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="update-existing" checked={ip.updateExisting} onCheckedChange={c => {
                  ip.setUpdateExisting(c as boolean);
                  if (ip.importPreview) ip.setImportPreview(prev => prev ? { ...prev, toSkip: !(c as boolean) ? prev.toUpdate : 0 } : null);
                }} />
                <Label htmlFor="update-existing">Atualizar propriedades existentes</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />1. Upload de Imagens</CardTitle>
              <CardDescription>Selecione as fotos (nomeie como account_number.jpg)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept="image/*" multiple onChange={ip.handleImageSelect} disabled={ip.isUploadingImages} />
              {ip.imageFiles.length > 0 && <p className="text-sm text-muted-foreground">{ip.imageFiles.length} imagens selecionadas</p>}
              {ip.isUploadingImages && <div className="space-y-2"><Progress value={ip.imageUploadProgress} /><p className="text-sm text-center">{ip.imageUploadProgress}%</p></div>}
              <Button onClick={ip.handleUploadImages} disabled={ip.imageFiles.length === 0 || ip.isUploadingImages} className="w-full">
                {ip.isUploadingImages ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Carregando...</> : <><Upload className="h-4 w-4 mr-2" />Upload {ip.imageFiles.length} Imagens</>}
              </Button>
              {ip.uploadedImages.length > 0 && (
                <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                  <p className="text-sm font-medium mb-2">{ip.uploadedImages.filter(i => i.status === 'success').length}/{ip.uploadedImages.length} carregadas</p>
                  {ip.uploadedImages.slice(0, 5).map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {img.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="truncate">{img.name}</span>
                    </div>
                  ))}
                  {ip.uploadedImages.length > 5 && <p className="text-xs text-muted-foreground mt-1">... e mais {ip.uploadedImages.length - 5}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />2. Upload CSV</CardTitle>
              <CardDescription>Selecione o arquivo CSV com os dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept=".csv" onChange={ip.handleCSVSelect} disabled={ip.isImporting} />
              {ip.csvFile && <p className="text-sm text-muted-foreground">{ip.csvFile.name} ({(ip.csvFile.size / 1024).toFixed(0)} KB)</p>}
              {ip.totalRows > 0 && <div className="text-sm space-y-1"><p><strong>Total:</strong> {ip.totalRows}</p><p><strong>Colunas:</strong> {ip.csvHeaders.length}</p></div>}
              {ip.csvErrors.length > 0 && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">{ip.csvErrors.map((err, idx) => <p key={idx} className="text-sm text-destructive">{err}</p>)}</div>}
            </CardContent>
          </Card>
        </div>

        {/* Field combiner */}
        {ip.csvHeaders.length > 0 && ip.csvPreview.length > 0 && (
          <FieldCombiner availableColumns={ip.csvHeaders} sampleData={ip.csvPreview[0]} onFieldsChange={ip.setCombinedFields} />
        )}

        {/* Column mapping */}
        {ip.showMappingDialog && ip.csvHeaders.length > 0 && (
          <ColumnMappingDialog csvHeaders={[...ip.csvHeaders, ...ip.combinedFields.map(f => f.name)]} onMappingChange={ip.handleMappingChange} initialMappings={ip.columnMappings} />
        )}

        {/* CSV Preview table */}
        {ip.csvPreview.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Preview (primeiras 5 linhas)</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader><TableRow>{ip.csvHeaders.slice(0, 8).map((h, i) => <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>)}{ip.csvHeaders.length > 8 && <TableHead>...</TableHead>}</TableRow></TableHeader>
                  <TableBody>{ip.csvPreview.map((row, idx) => (
                    <TableRow key={idx}>{ip.csvHeaders.slice(0, 8).map((h, ci) => <TableCell key={ci} className="max-w-[150px] truncate">{row[h] || '-'}</TableCell>)}{ip.csvHeaders.length > 8 && <TableCell>...</TableCell>}</TableRow>
                  ))}</TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Import section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />3. Importar para o Database</CardTitle>
            <CardDescription>Clique para salvar as propriedades no banco de dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ip.importPreview && !ip.importResult && !ip.isImporting && (
              <ImportPreviewSection
                importPreview={ip.importPreview}
                updateExisting={ip.updateExisting}
                setUpdateExisting={ip.setUpdateExisting}
                approvedMatches={ip.approvedMatches}
                setApprovedMatches={ip.setApprovedMatches}
                columnMappings={ip.columnMappings}
                totalRows={ip.totalRows}
                onRecalculate={() => ip.calculateImportPreview(ip.columnMappings)}
              />
            )}
            {ip.isImporting && <div className="space-y-2"><Progress value={ip.importProgress} /><p className="text-sm text-center">{ip.importStatus}</p></div>}
            {ip.importResult && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-green-800 dark:text-green-200">✅ Importação Completa!</p>
                <div className="text-sm space-y-1">
                  <p>{ip.importResult.imported} novas importadas</p>
                  <p>{ip.importResult.updated} atualizadas</p>
                  {ip.importResult.errors > 0 && <p className="text-destructive">{ip.importResult.errors} erros</p>}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={ip.handleImport} disabled={!ip.csvFile || ip.isImporting || ip.csvErrors.length > 0} className="flex-1" size="lg">
                {ip.isImporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><Database className="h-4 w-4 mr-2" />Importar {ip.totalRows} Propriedades</>}
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin')} disabled={ip.isImporting}><Eye className="h-4 w-4 mr-2" />Ver Propriedades</Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="pt-4 space-y-2 text-sm">
            <p><strong>💡 Dica:</strong> Nomeie as imagens com o account_number (ex: 28-22-29-1234.jpg)</p>
            <p><strong>📄 CSV:</strong> Deve ter pelo menos uma coluna: account_number ou property_address</p>
            <p><strong>🔄 Duplicatas:</strong> Se "Atualizar existentes" estiver marcado, propriedades existentes serão atualizadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportProperties;
