import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiInstance, getApiBaseURL } from '@/services/api';
import { TestTube2, Copy, Zap } from 'lucide-react';
import { TEST_CONTACTS, getTestPhone, getTestEmail, getTestName } from '@/config/testContacts';

const EXAMPLES: Record<string, any> = {
  echo: { test: 'conexao' },
  send_sms: { phone_number: getTestPhone(), body: 'Olá! Interessado na propriedade?' },
  send_email: { receiver_email: getTestEmail(), subject: 'Oferta Especial', message_body: 'Olá! Temos uma oportunidade.' },
  initiate_call: {
    name: getTestName(),
    address: 'Rua das Flores, 123',
    from_number: '7868828251',
    to_number: getTestPhone(),
    voicemail_drop: `Olá ${getTestName()}, temos uma oferta especial.`,
    seller_name: 'Carlos Vendedor',
  },
};

export const McpTester = () => {
  const [operation, setOperation] = useState<'echo' | 'send_sms' | 'send_email' | 'initiate_call'>('echo');
  const [payloadText, setPayloadText] = useState<string>(JSON.stringify(EXAMPLES.echo, null, 2));
  const [testMode, setTestMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  // Update example when operation changes
  const example = useMemo(() => EXAMPLES[operation], [operation]);
  const apiUrl = getApiBaseURL();

  const handleOperationChange = (value: string) => {
    setOperation(value as any);
    setPayloadText(JSON.stringify(EXAMPLES[value], null, 2));
    setResponse(null);
  };

  const handleSend = async () => {
    let parsed: any = {};
    try {
      parsed = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch (err: any) {
      toast({ title: 'JSON inválido', description: 'Corrija o JSON antes de enviar', variant: 'destructive' });
      return;
    }

    // Ensure test_mode is included if applicable
    if (testMode) parsed.test_mode = true;

    setLoading(true);
    setResponse(null);

    try {
      const api = getApiInstance();
      const res = await api.post('/mcp', { operation, data: parsed });
      setResponse(res.data);
      toast({ title: 'Resposta recebida', description: `status: ${res.data?.status || 'unknown'}` });
    } catch (error: any) {
      console.error('MCP Test error', error);
      setResponse({ error: error?.message || String(error) });
      toast({ title: 'Erro ao enviar', description: error?.message || 'Erro desconhecido', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurl = async () => {
    const body = JSON.stringify({ operation, data: (payloadText.trim() ? JSON.parse(payloadText) : {}) }, null, 0);
    const curl = `curl.exe -X POST '${apiUrl}/mcp' -H 'Content-Type: application/json' -d '${body.replace(/'/g, "\\'")}'`;
    try {
      await navigator.clipboard.writeText(curl);
      toast({ title: 'cURL copiado', description: 'Comando copiado para o clipboard' });
    } catch (err) {
      toast({ title: 'Falha ao copiar', description: 'Não foi possível copiar para o clipboard', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TestTube2 className="w-5 h-5 text-indigo-600"/> MCP Tester</CardTitle>
        <CardDescription>Envie operações arbitrárias para o endpoint /mcp</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="w-60">
            <Label>Operação</Label>
            <Select onValueChange={handleOperationChange} defaultValue={operation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="echo">echo</SelectItem>
                <SelectItem value="send_sms">send_sms</SelectItem>
                <SelectItem value="send_email">send_email</SelectItem>
                <SelectItem value="initiate_call">initiate_call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="mr-2">Test Mode</Label>
            <Switch checked={testMode} onCheckedChange={(v) => setTestMode(Boolean(v))} />
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setPayloadText(JSON.stringify(example, null, 2))}>Reset</Button>
            <Button onClick={handleCopyCurl} variant="secondary"><Copy className="w-4 h-4 mr-2"/> Copy cURL</Button>
            <Button onClick={handleSend} disabled={loading} size="sm">{loading ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </div>

        <div>
          <Label>Payload (JSON)</Label>
          <Textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} className="h-40 font-mono text-xs" />
        </div>

        <div>
          <Label>Resposta</Label>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto h-48">
            {response ? JSON.stringify(response, null, 2) : 'Nenhuma resposta ainda'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default McpTester;
