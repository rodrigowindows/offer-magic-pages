/**
 * ApiInfoPanel - Documentação completa da `process-api` Edge Function.
 * Exposta no header de /process via botão "API".
 *
 * Endpoint: POST {SUPABASE_URL}/functions/v1/process-api
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code, ChevronDown, ChevronUp, Copy, Check, Zap, List, ThumbsUp, ThumbsDown,
  RotateCcw, BarChart3, Layers, Shield, AlertTriangle, KeyRound, Terminal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const API_URL = `${SUPABASE_URL}/functions/v1/process-api`;

// ── Reusable code block with copy button ─────────────────────────────
const CodeBlock = ({ title, code }: { title: string; code: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copiado!' });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-md border bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <span className="text-[11px] text-zinc-400 font-mono">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="p-3 text-[11px] leading-relaxed text-green-400 overflow-x-auto font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
};

// ── Endpoint card with request + response example ───────────────────
interface EndpointCardProps {
  action: string;
  description: string;
  icon: React.ElementType;
  type: 'read' | 'write' | 'bulk' | 'comps';
  body: string;
  responseExample?: string;
  notes?: string;
}

const TYPE_COLORS: Record<EndpointCardProps['type'], string> = {
  read: 'text-blue-500',
  write: 'text-amber-500',
  bulk: 'text-emerald-500',
  comps: 'text-teal-500',
};

const EndpointCard = ({ action, description, icon: Icon, type, body, responseExample, notes }: EndpointCardProps) => {
  const [open, setOpen] = useState(false);
  const isWrite = type === 'write' || type === 'bulk' || (type === 'comps' && !action.endsWith('.list') && !action.endsWith('.pricing'));

  const curlCmd = isWrite
    ? `curl -X POST '${API_URL}' \\
  -H 'apikey: ${ANON_KEY}' \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '${body}'`
    : `curl -X POST '${API_URL}' \\
  -H 'apikey: ${ANON_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '${body}'`;

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        <Icon className={`h-3.5 w-3.5 ${TYPE_COLORS[type]} shrink-0`} />
        <Badge variant="outline" className="text-[9px] font-mono shrink-0">{action}</Badge>
        {isWrite && (
          <Badge variant="secondary" className="text-[9px] shrink-0 gap-0.5">
            <KeyRound className="h-2.5 w-2.5" /> JWT
          </Badge>
        )}
        <span className="text-xs text-muted-foreground truncate flex-1">{description}</span>
        {open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t space-y-2 pt-2">
          {notes && (
            <p className="text-[11px] text-muted-foreground italic">{notes}</p>
          )}
          <CodeBlock title={`Request - ${action}`} code={curlCmd} />
          {responseExample && (
            <CodeBlock title="Resposta (200 OK)" code={responseExample} />
          )}
        </div>
      )}
    </div>
  );
};

// ── Main panel ───────────────────────────────────────────────────────
export const ApiInfoPanel = ({ embedded = false }: { embedded?: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  const content = (
    <div className={embedded ? "space-y-4" : "px-3 pb-4 space-y-4 border-t"}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="overview" className="text-[11px]">Visão Geral</TabsTrigger>
          <TabsTrigger value="endpoints" className="text-[11px]">Endpoints</TabsTrigger>
          <TabsTrigger value="schema" className="text-[11px]">Schema</TabsTrigger>
          <TabsTrigger value="examples" className="text-[11px]">Exemplos</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              process-api v2.0
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              API REST para automação completa do fluxo de revisão de propriedades.
              Todas as chamadas são <code className="bg-muted px-1 rounded text-[10px]">POST</code> com body JSON.
              A ação é definida pelo campo <code className="bg-muted px-1 rounded text-[10px]">action</code>.
            </p>
            <div className="text-[11px] bg-muted/40 rounded p-2 font-mono break-all">
              {API_URL}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              Autenticação
            </h3>
            <div className="text-[11px] space-y-1.5 text-muted-foreground">
              <p>
                <Badge variant="outline" className="text-[9px] mr-1">Leitura</Badge>
                Apenas <code className="bg-muted px-1 rounded text-[10px]">apikey</code> (anon key) no header.
              </p>
              <p>
                <Badge variant="secondary" className="text-[9px] mr-1 gap-0.5"><KeyRound className="h-2.5 w-2.5" />JWT</Badge>
                Escrita exige também <code className="bg-muted px-1 rounded text-[10px]">Authorization: Bearer &lt;JWT&gt;</code> de usuário autenticado.
              </p>
            </div>
            <CodeBlock
              title="Headers padrão"
              code={`apikey: ${ANON_KEY.slice(0, 24)}...
Content-Type: application/json
# Apenas para escrita:
Authorization: Bearer <USER_JWT>`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Limites & Regras
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-muted/40 rounded p-2">
                <div className="font-semibold">Rate limit</div>
                <div className="text-muted-foreground">60 req/min por IP</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="font-semibold">Limit por list</div>
                <div className="text-muted-foreground">Máx 500 (default 500)</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="font-semibold">Bulk size</div>
                <div className="text-muted-foreground">Máx 100 IDs por chamada</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="font-semibold">Oferta máx</div>
                <div className="text-muted-foreground">$50.000.000</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-violet-500" />
              Fluxo recomendado para Web Agent
            </h3>
            <ol className="text-[11px] space-y-1 text-muted-foreground list-decimal list-inside pl-1">
              <li><code className="bg-muted px-1 rounded">batch.list</code> — descobrir batches disponíveis</li>
              <li><code className="bg-muted px-1 rounded">counts</code> — quantas pendentes restam</li>
              <li><code className="bg-muted px-1 rounded">list</code> — paginar pendentes (limit + offset)</li>
              <li><code className="bg-muted px-1 rounded">get</code> — detalhes + comps + pricing por propriedade</li>
              <li><code className="bg-muted px-1 rounded">approve</code>/<code className="bg-muted px-1 rounded">reject</code> — decisão individual <strong>ou</strong> <code className="bg-muted px-1 rounded">bulk.*</code></li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Formato de Resposta</h3>
            <CodeBlock
              title="Sucesso"
              code={`{ "success": true, "data": { ... } }`}
            />
            <CodeBlock
              title="Erro"
              code={`{ "success": false, "error": "Mensagem legível" }
// Status: 400 (validação) | 401 (auth) | 429 (rate limit) | 500 (server)`}
            />
          </div>
        </TabsContent>

        {/* ── ENDPOINTS ────────────────────────────────────────── */}
        <TabsContent value="endpoints" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Leitura (apikey)</p>
            <EndpointCard
              action="info"
              description="Documentação machine-readable da API"
              icon={Code}
              type="read"
              body='{"action":"info"}'
              responseExample={`{
  "success": true,
  "data": {
    "name": "Process API",
    "version": "2.0",
    "actions": { ... }
  }
}`}
            />
            <EndpointCard
              action="counts"
              description="Contagem por status (pending/approved/rejected/total)"
              icon={BarChart3}
              type="read"
              body='{"action":"counts","batch":"miami-2026-04-13-1k"}'
              notes="Omita 'batch' para contar todas as propriedades."
              responseExample={`{
  "success": true,
  "data": {
    "total": 1000,
    "pending": 50,
    "approved": 488,
    "rejected": 462
  }
}`}
            />
            <EndpointCard
              action="batch.list"
              description="Listar nomes de batches de importação"
              icon={Layers}
              type="read"
              body='{"action":"batch.list"}'
              responseExample={`{
  "success": true,
  "data": {
    "batches": [
      "miami-2026-04-13-1k",
      "Orlando_2026-02-20"
    ]
  }
}`}
            />
            <EndpointCard
              action="list"
              description="Paginar propriedades com filtros"
              icon={List}
              type="read"
              body='{"action":"list","status":"pending","batch":"miami-2026-04-13-1k","limit":50,"offset":0}'
              notes="Filtros: status (pending|approved|rejected), batch, search (endereço), visual_filter (HOT|WARM|COLD), limit (≤500), offset."
              responseExample={`{
  "success": true,
  "data": {
    "count": 50,
    "filters": { "status": "pending", "batch": "..." },
    "properties": [
      { "id": "uuid", "address": "...", "ai_score": 87, ... }
    ]
  }
}`}
            />
            <EndpointCard
              action="get"
              description="Detalhe completo + comps + pricing"
              icon={BarChart3}
              type="read"
              body='{"action":"get","property_id":"UUID_AQUI"}'
              responseExample={`{
  "success": true,
  "data": {
    "property": { "id": "...", "address": "...", ... },
    "comps": [ { "url": "...", "comp_data": { ... } } ],
    "pricing": {
      "validCount": 8,
      "avgPricePerSqft": 245,
      "estimatedARV": 367500,
      "defaultOffer": 257250
    }
  }
}`}
            />
            <EndpointCard
              action="comps.list"
              description="Listar comps de uma propriedade"
              icon={List}
              type="comps"
              body='{"action":"comps.list","property_id":"UUID"}'
            />
            <EndpointCard
              action="comps.pricing"
              description="ARV calculado (IQR outlier removal) + oferta sugerida 70%"
              icon={BarChart3}
              type="comps"
              body='{"action":"comps.pricing","property_id":"UUID"}'
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Escrita (apikey + JWT)</p>
            <EndpointCard
              action="approve"
              description="Aprovar com oferta (auto-calcula ARV×0.7 se omitir)"
              icon={ThumbsUp}
              type="write"
              body='{"action":"approve","property_id":"UUID","cash_offer_amount":150000,"agent_name":"WebAgent","notes":"Boa margem"}'
              responseExample={`{
  "success": true,
  "data": {
    "property_id": "uuid",
    "approval_status": "approved",
    "cash_offer_amount": 150000,
    "approved_by_name": "WebAgent",
    "approved_at": "2026-04-17T..."
  }
}`}
            />
            <EndpointCard
              action="reject"
              description="Rejeitar com motivo enum (ver lista abaixo)"
              icon={ThumbsDown}
              type="write"
              body='{"action":"reject","property_id":"UUID","reason":"new-construction","notes":"Construída em 2024","agent_name":"WebAgent"}'
            />
            <EndpointCard
              action="reset"
              description="Voltar status para pendente (limpa decisão)"
              icon={RotateCcw}
              type="write"
              body='{"action":"reset","property_id":"UUID"}'
            />
            <EndpointCard
              action="comps.add"
              description="Adicionar comparável manual"
              icon={ThumbsUp}
              type="comps"
              body='{"action":"comps.add","property_id":"UUID","url":"https://zillow.com/...","comp_data":{"sale_price":250000,"square_feet":1500,"address":"...","sale_date":"2025-12-01","bedrooms":3,"bathrooms":2}}'
            />
            <EndpointCard
              action="comps.delete"
              description="Remover comp por ID"
              icon={ThumbsDown}
              type="comps"
              body='{"action":"comps.delete","comp_id":"UUID"}'
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bulk (apikey + JWT, máx 100)</p>
            <EndpointCard
              action="bulk.approve"
              description="Aprovar até 100 propriedades em uma chamada"
              icon={ThumbsUp}
              type="bulk"
              body='{"action":"bulk.approve","property_ids":["UUID1","UUID2"],"agent_name":"WebAgent"}'
              responseExample={`{
  "success": true,
  "data": {
    "total": 2,
    "approved": 2,
    "errors": 0,
    "results": [
      { "property_id": "UUID1", "status": "approved" },
      { "property_id": "UUID2", "status": "approved" }
    ]
  }
}`}
            />
            <EndpointCard
              action="bulk.reject"
              description="Rejeitar até 100 com motivo único"
              icon={ThumbsDown}
              type="bulk"
              body='{"action":"bulk.reject","property_ids":["UUID1","UUID2"],"reason":"duplicate","agent_name":"WebAgent"}'
            />
          </div>
        </TabsContent>

        {/* ── SCHEMA ───────────────────────────────────────────── */}
        <TabsContent value="schema" className="space-y-3 mt-3">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Campos retornados (objeto property)</h3>
            <div className="text-[11px] bg-muted/40 rounded p-2 font-mono space-y-0.5 max-h-64 overflow-y-auto">
              {[
                ['id', 'uuid'],
                ['address, city, state, zip_code, neighborhood', 'string'],
                ['owner_name, owner_phone, owner_address', 'string | null'],
                ['property_image_url, zillow_url', 'string | null'],
                ['estimated_value, cash_offer_amount', 'number'],
                ['property_type, year_built', 'string | number | null'],
                ['square_feet, bedrooms, bathrooms, lot_size', 'number | null'],
                ['approval_status', "'pending' | 'approved' | 'rejected' | null"],
                ['approved_by_name, approved_at', 'string | null'],
                ['rejection_reason, rejection_notes', 'string | null'],
                ['decision_photos', 'string[] | null'],
                ['lead_score, ai_score', 'number | null (0–100)'],
                ['ai_reasoning, focar, evaluation', 'string | null'],
                ['tags', 'string[] | null'],
                ['origem, import_batch', 'string | null'],
                ['created_at', 'ISO timestamp'],
              ].map(([k, t]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-blue-400 shrink-0">{k}:</span>
                  <span className="text-zinc-400">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Motivos de Rejeição (enum)</h3>
            <div className="flex flex-wrap gap-1">
              {[
                'new-construction', 'recent-sale', 'too-good-condition', 'multi-family',
                'hoa-restrictions', 'condominium', 'land', 'no-equity', 'agent-listed',
                'commercial', 'photo-unavailable', 'bad-neighborhood', 'llc-owned',
                'no-address-number', 'no-wholesale-margin', 'duplicate', 'wrong-location', 'other',
              ].map(r => (
                <Badge key={r} variant="outline" className="text-[9px] font-mono">{r}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Códigos HTTP</h3>
            <div className="text-[11px] space-y-1">
              <div><Badge className="bg-green-600 text-[9px] mr-1">200</Badge> Sucesso — body com <code className="bg-muted px-1 rounded text-[10px]">success: true</code></div>
              <div><Badge variant="destructive" className="text-[9px] mr-1">400</Badge> Validação falhou (UUID inválido, enum errado, body malformado)</div>
              <div><Badge variant="destructive" className="text-[9px] mr-1">401</Badge> apikey ausente/inválida ou JWT requerido</div>
              <div><Badge variant="destructive" className="text-[9px] mr-1">429</Badge> Rate limit excedido (60 req/min)</div>
              <div><Badge variant="destructive" className="text-[9px] mr-1">500</Badge> Erro interno (mensagem sanitizada)</div>
            </div>
          </div>
        </TabsContent>

        {/* ── EXAMPLES ─────────────────────────────────────────── */}
        <TabsContent value="examples" className="space-y-3 mt-3">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              cURL — listar pendentes
            </h3>
            <CodeBlock
              title="bash"
              code={`curl -X POST '${API_URL}' \\
  -H 'apikey: ${ANON_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '{"action":"list","status":"pending","limit":10}'`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">JavaScript / Node — fluxo completo</h3>
            <CodeBlock
              title="javascript"
              code={`const API = '${API_URL}';
const APIKEY = '${ANON_KEY.slice(0, 32)}...';

async function call(action, payload = {}, jwt = null) {
  const headers = { apikey: APIKEY, 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = 'Bearer ' + jwt;
  const r = await fetch(API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await r.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// 1. Pegar pendentes
const { properties } = await call('list', { status: 'pending', limit: 20 });

// 2. Aprovar uma (precisa JWT)
await call('approve', {
  property_id: properties[0].id,
  cash_offer_amount: 150000,
  agent_name: 'MeuBot',
}, USER_JWT);

// 3. Rejeitar em lote
await call('bulk.reject', {
  property_ids: properties.slice(1, 5).map(p => p.id),
  reason: 'duplicate',
}, USER_JWT);`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Python — paginação completa</h3>
            <CodeBlock
              title="python"
              code={`import requests

API = '${API_URL}'
APIKEY = '${ANON_KEY.slice(0, 32)}...'

def call(action, **payload):
    r = requests.post(API,
        headers={'apikey': APIKEY, 'Content-Type': 'application/json'},
        json={'action': action, **payload})
    j = r.json()
    if not j.get('success'):
        raise Exception(j.get('error'))
    return j['data']

# Paginar todas as pendentes
offset, all_props = 0, []
while True:
    page = call('list', status='pending', limit=500, offset=offset)
    props = page['properties']
    if not props: break
    all_props.extend(props)
    offset += len(props)

print(f'Total: {len(all_props)}')`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Como obter o JWT de usuário</h3>
            <CodeBlock
              title="javascript - via Supabase client"
              code={`import { supabase } from '@/integrations/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const jwt = session?.access_token;
// Usar como Authorization: Bearer <jwt>`}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <Code className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold">API para Web Agent</span>
        <Badge variant="secondary" className="text-[9px] ml-1">v2.0</Badge>
        <div className="flex-1" />
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && content}
    </div>
  );
};
