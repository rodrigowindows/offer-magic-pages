import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, XCircle, AlertCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MailingRow {
  slug?: string;
  property_id?: string;
  owner_name?: string;
  confirmed_mailing_address?: string;
  confirmed_mailing_city?: string;
  confirmed_mailing_state?: string;
  confirmed_mailing_zip?: string;
  _error?: string;
}

interface ResultRow {
  ok: boolean;
  error?: string;
  property?: any;
  input?: any;
}

const REQUIRED_HEADERS = ['confirmed_mailing_address'];
const ID_HEADERS = ['slug', 'property_id'];

const SAMPLE_CSV = `slug,owner_name,confirmed_mailing_address,confirmed_mailing_city,confirmed_mailing_state,confirmed_mailing_zip
123-main-st-miami-fl,John Doe,456 Oak Ave,Orlando,FL,32801
`;

const MailingAddressUpload = () => {
  const [rows, setRows] = useState<MailingRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const validRows = useMemo(() => rows.filter(r => !r._error), [rows]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResults([]);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (res) => {
        const headers = res.meta.fields || [];
        const hasId = ID_HEADERS.some(h => headers.includes(h));
        const hasRequired = REQUIRED_HEADERS.every(h => headers.includes(h));

        if (!hasId) {
          toast.error('CSV precisa ter coluna "slug" ou "property_id"');
          return;
        }
        if (!hasRequired) {
          toast.error(`CSV precisa ter colunas: ${REQUIRED_HEADERS.join(', ')}`);
          return;
        }

        const parsed: MailingRow[] = res.data.map((r) => {
          const row: MailingRow = {
            slug: r.slug?.trim() || undefined,
            property_id: r.property_id?.trim() || undefined,
            owner_name: r.owner_name?.trim() || undefined,
            confirmed_mailing_address: r.confirmed_mailing_address?.trim() || undefined,
            confirmed_mailing_city: r.confirmed_mailing_city?.trim() || undefined,
            confirmed_mailing_state: r.confirmed_mailing_state?.trim() || undefined,
            confirmed_mailing_zip: r.confirmed_mailing_zip?.trim() || undefined,
          };
          if (!row.slug && !row.property_id) row._error = 'Sem slug/property_id';
          else if (!row.confirmed_mailing_address) row._error = 'Sem mailing_address';
          return row;
        });

        setRows(parsed);
        toast.success(`${parsed.length} linhas carregadas (${parsed.filter(r => !r._error).length} válidas)`);
      },
      error: (err) => toast.error(`Erro ao ler CSV: ${err.message}`),
    });
  };

  const handleUpload = async () => {
    if (!validRows.length) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-mailing-address`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apikey,
          'Authorization': `Bearer ${token || apikey}`,
        },
        body: JSON.stringify({
          updates: validRows.map(({ _error, ...u }) => u),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro no servidor');

      setResults(json.results || []);
      toast.success(`${json.updated} de ${json.total} endereços atualizados`);
    } catch (e: any) {
      toast.error(`Falha: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mailing-addresses-sample.csv';
    a.click();
  };

  const okCount = results.filter(r => r.ok).length;
  const errCount = results.filter(r => !r.ok).length;

  return (
    <div className="container mx-auto py-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Upload de Mailing Addresses</h1>
        <p className="text-sm text-muted-foreground">
          Atualiza <code>confirmed_mailing_address</code> em massa via CSV. Esses endereços têm prioridade sobre <code>owner_address</code> ao imprimir cartas e etiquetas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" /> 1. Selecionar CSV
          </CardTitle>
          <CardDescription>
            Colunas obrigatórias: <code>slug</code> (ou <code>property_id</code>) + <code>confirmed_mailing_address</code>.
            Opcionais: <code>owner_name</code>, <code>confirmed_mailing_city</code>, <code>confirmed_mailing_state</code>, <code>confirmed_mailing_zip</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <FileDown className="h-4 w-4 mr-1" /> Baixar modelo
            </Button>
          </div>
          {fileName && <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>2. Preview ({validRows.length} válidas / {rows.length} total)</span>
              <Button onClick={handleUpload} disabled={submitting || !validRows.length}>
                {submitting ? 'Enviando...' : `Confirmar ${validRows.length} atualizações`}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Slug / ID</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Mailing Address</TableHead>
                    <TableHead>City / State / Zip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {r._error ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" /> {r._error}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.slug || r.property_id}</TableCell>
                      <TableCell className="text-xs">{r.owner_name || '—'}</TableCell>
                      <TableCell className="text-xs">{r.confirmed_mailing_address || '—'}</TableCell>
                      <TableCell className="text-xs">
                        {[r.confirmed_mailing_city, r.confirmed_mailing_state, r.confirmed_mailing_zip].filter(Boolean).join(', ') || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 100 && (
                <p className="text-xs text-muted-foreground p-2">Mostrando 100 de {rows.length} linhas. Todas serão enviadas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Alert className="flex-1">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>{okCount}</strong> atualizados com sucesso
                </AlertDescription>
              </Alert>
              {errCount > 0 && (
                <Alert variant="destructive" className="flex-1">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{errCount}</strong> falharam
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {errCount > 0 && (
              <div className="max-h-64 overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slug / ID</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter(r => !r.ok).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.input?.slug || r.input?.property_id}</TableCell>
                        <TableCell className="text-xs text-destructive">{r.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MailingAddressUpload;
