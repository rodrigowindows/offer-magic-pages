import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';
import type { ImportPreviewState, MatchDetail } from '@/hooks/useImportProperties';
import type { ColumnMapping } from '@/components/import-data/ColumnMappingDialog';

interface ImportPreviewSectionProps {
  importPreview: ImportPreviewState;
  updateExisting: boolean;
  setUpdateExisting: (v: boolean) => void;
  approvedMatches: Set<string>;
  setApprovedMatches: (v: Set<string>) => void;
  columnMappings: ColumnMapping[];
  totalRows: number;
  onRecalculate: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  address: 'Endereço', city: 'Cidade', state: 'Estado', zip_code: 'CEP',
  owner_name: 'Nome Proprietário', owner_address: 'End. Proprietário', owner_phone: 'Telefone',
  estimated_value: 'Valor Estimado', bedrooms: 'Quartos', bathrooms: 'Banheiros',
  square_feet: 'Área m²', year_built: 'Ano Construção', lot_size: 'Tamanho Lote',
  property_type: 'Tipo Imóvel', origem: 'ID Único', tags: 'Tags', county: 'Condado', neighborhood: 'Bairro',
};

export const ImportPreviewSection = ({
  importPreview, updateExisting, setUpdateExisting,
  approvedMatches, setApprovedMatches, columnMappings,
  totalRows, onRecalculate,
}: ImportPreviewSectionProps) => {
  const activeMappings = columnMappings.filter(m => m.dbField && m.dbField !== 'skip');

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
          📊 Preview da Importação
          {importPreview.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </p>
        <button onClick={onRecalculate} className="text-sm text-blue-600 hover:underline flex items-center gap-1" disabled={importPreview.isLoading}>
          <RefreshCw className={`h-3 w-3 ${importPreview.isLoading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {importPreview.isLoading && (
        <div className="space-y-2">
          <Progress value={importPreview.progress} className="h-2" />
          <p className="text-xs text-center text-blue-600 dark:text-blue-400">Analisando correspondências... {importPreview.progress}%</p>
        </div>
      )}

      {!importPreview.isLoading && (
        <>
          {/* Summary boxes */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center border-2 border-green-300 dark:border-green-700">
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{importPreview.toInsert}</p>
              <p className="text-green-600 dark:text-green-400 font-medium">🆕 Novos</p>
            </div>
            <div className={`rounded-lg p-4 text-center border-2 ${updateExisting ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700' : 'bg-muted border-border'}`}>
              <p className={`text-3xl font-bold ${updateExisting ? 'text-yellow-700 dark:text-yellow-300' : 'text-muted-foreground'}`}>{importPreview.toUpdate}</p>
              <p className={`font-medium ${updateExisting ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>{updateExisting ? '✏️ Atualizar' : '⏭️ Ignorar'}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center border-2 border-blue-300 dark:border-blue-700">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalRows}</p>
              <p className="text-blue-600 dark:text-blue-400 font-medium">📄 Total CSV</p>
            </div>
          </div>

          {/* Mapped fields */}
          {activeMappings.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">🔄 Campos importados:</h4>
              <div className="flex flex-wrap gap-2">
                {activeMappings.map((m, idx) => (
                  <div key={idx} className="inline-flex items-center gap-1 bg-card rounded-full px-3 py-1 border text-xs">
                    <span className="text-muted-foreground">{m.csvColumn}</span>
                    <span className="text-purple-500">→</span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">{FIELD_LABELS[m.dbField] || m.dbField}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update toggle */}
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg border">
            <Checkbox id="updateExisting" checked={updateExisting} onCheckedChange={c => setUpdateExisting(c as boolean)} />
            <Label htmlFor="updateExisting" className="flex-1 cursor-pointer">
              <span className="font-medium">✅ Atualizar {importPreview.toUpdate} propriedades existentes</span>
              <p className="text-xs text-muted-foreground">Se desmarcado, {importPreview.toUpdate} registros serão ignorados</p>
            </Label>
          </div>

          {/* Match review table */}
          {updateExisting && importPreview.matchReview && importPreview.matchReview.length > 0 && (
            <MatchReviewTable matches={importPreview.matchReview} approvedMatches={approvedMatches} setApprovedMatches={setApprovedMatches} />
          )}
        </>
      )}
    </div>
  );
};

const MatchReviewTable = ({ matches, approvedMatches, setApprovedMatches }: {
  matches: MatchDetail[];
  approvedMatches: Set<string>;
  setApprovedMatches: (v: Set<string>) => void;
}) => (
  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">🔍 Revisão ({approvedMatches.size}/{matches.length} aprovados)</h4>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setApprovedMatches(new Set(matches.map(m => m.dbId)))}>Aprovar Todos</Button>
        <Button variant="outline" size="sm" onClick={() => setApprovedMatches(new Set())}>Rejeitar Todos</Button>
      </div>
    </div>
    <ScrollArea className="max-h-[350px] border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-10" /><TableHead>Linha</TableHead><TableHead>CSV</TableHead>
            <TableHead className="text-center">Match</TableHead><TableHead>Banco de Dados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, idx) => (
            <TableRow key={idx} className={`text-xs ${!approvedMatches.has(match.dbId) ? 'opacity-50 bg-red-50 dark:bg-red-950' : ''}`}>
              <TableCell>
                <Checkbox checked={approvedMatches.has(match.dbId)} onCheckedChange={checked => {
                  const next = new Set(approvedMatches);
                  checked ? next.add(match.dbId) : next.delete(match.dbId);
                  setApprovedMatches(next);
                }} />
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">#{match.csvRow}</TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {match.csvAddress && <p className="font-medium truncate max-w-[200px]">{match.csvAddress}</p>}
                  {match.csvOwnerName && <p className="text-muted-foreground truncate max-w-[200px]">{match.csvOwnerName}</p>}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={`text-[10px] ${match.matchedBy === 'origem' ? 'border-green-500 text-green-700' : match.matchedBy === 'address' ? 'border-blue-500 text-blue-700' : 'border-orange-500 text-orange-700'}`}>
                  {match.matchedBy}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {match.dbAddress && <p className="font-medium truncate max-w-[200px]">{match.dbAddress}</p>}
                  {match.dbOwnerName && <p className="text-muted-foreground truncate max-w-[200px]">{match.dbOwnerName}</p>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  </div>
);
