/**
 * ApiInfoPanel - Collapsible panel showing process-api documentation
 * for web agents to automate the review workflow.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, ChevronDown, ChevronUp, Copy, Check, Zap, List, ThumbsUp, ThumbsDown, RotateCcw, BarChart3, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const API_URL = `${SUPABASE_URL}/functions/v1/process-api`;

interface CodeBlockProps {
  title: string;
  code: string;
  lang?: string;
}

const CodeBlock = ({ title, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-zinc-950 overflow-hidden">
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
      <pre className="p-3 text-[11px] leading-relaxed text-green-400 overflow-x-auto font-mono whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
};

interface EndpointCardProps {
  action: string;
  description: string;
  icon: React.ElementType;
  method?: string;
  body: string;
  color: string;
}

const EndpointCard = ({ action, description, icon: Icon, method = 'POST', body, color }: EndpointCardProps) => {
  const [open, setOpen] = useState(false);

  const curlCmd = `curl -X ${method} '${API_URL}' \\
  -H 'apikey: ${ANON_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '${body}'`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
        <Badge variant="outline" className="text-[9px] font-mono shrink-0">{action}</Badge>
        <span className="text-xs text-muted-foreground truncate flex-1">{description}</span>
        {open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t">
          <CodeBlock title={`curl - ${action}`} code={curlCmd} />
        </div>
      )}
    </div>
  );
};

export const ApiInfoPanel = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <Code className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold">API para Web Agent</span>
        <Badge variant="secondary" className="text-[9px] ml-1">v1.0</Badge>
        <div className="flex-1" />
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-3 pb-4 space-y-4 border-t">
          {/* Quick start */}
          <div className="pt-3 space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Quick Start
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Todas as chamadas usam <code className="bg-muted px-1 py-0.5 rounded text-[10px]">POST</code> para{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{API_URL}</code>{' '}
              com header <code className="bg-muted px-1 py-0.5 rounded text-[10px]">apikey</code>.
              Envie <code className="bg-muted px-1 py-0.5 rounded text-[10px]">GET</code> ou{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{`{"action":"info"}`}</code> para documentacao completa.
            </p>

            <CodeBlock
              title="Ver documentacao completa"
              code={`curl '${API_URL}' \\
  -H 'apikey: ${ANON_KEY}'`}
            />
          </div>

          {/* Workflow */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              Fluxo do Web Agent
            </h3>
            <div className="text-[11px] space-y-1 text-muted-foreground pl-1">
              <p><strong>1.</strong> <code className="bg-muted px-1 rounded">counts</code> - Ver quantas pendentes existem</p>
              <p><strong>2.</strong> <code className="bg-muted px-1 rounded">list</code> - Pegar lote de propriedades pendentes</p>
              <p><strong>3.</strong> Para cada: <code className="bg-muted px-1 rounded">get</code> - Ver detalhes + comps + pricing</p>
              <p><strong>4.</strong> Decidir: <code className="bg-muted px-1 rounded">approve</code> ou <code className="bg-muted px-1 rounded">reject</code></p>
              <p><strong>5.</strong> Ou: <code className="bg-muted px-1 rounded">bulk.approve</code> / <code className="bg-muted px-1 rounded">bulk.reject</code> para lote</p>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold">Endpoints</h3>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Leitura</p>
              <EndpointCard
                action="list"
                description="Listar propriedades com filtros"
                icon={List}
                color="text-blue-500"
                body='{"action":"list","status":"pending","limit":50}'
              />
              <EndpointCard
                action="get"
                description="Propriedade por ID + comps + pricing"
                icon={BarChart3}
                color="text-purple-500"
                body='{"action":"get","property_id":"UUID_AQUI"}'
              />
              <EndpointCard
                action="counts"
                description="Contagem por status"
                icon={BarChart3}
                color="text-indigo-500"
                body='{"action":"counts"}'
              />
              <EndpointCard
                action="batch.list"
                description="Listar batches de importacao"
                icon={Layers}
                color="text-cyan-500"
                body='{"action":"batch.list"}'
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Acoes</p>
              <EndpointCard
                action="approve"
                description="Aprovar com oferta (auto-calcula se omitir valor)"
                icon={ThumbsUp}
                color="text-green-500"
                body='{"action":"approve","property_id":"UUID","cash_offer_amount":150000}'
              />
              <EndpointCard
                action="reject"
                description="Rejeitar com motivo"
                icon={ThumbsDown}
                color="text-red-500"
                body='{"action":"reject","property_id":"UUID","reason":"new-construction"}'
              />
              <EndpointCard
                action="reset"
                description="Voltar para pendente"
                icon={RotateCcw}
                color="text-amber-500"
                body='{"action":"reset","property_id":"UUID"}'
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bulk</p>
              <EndpointCard
                action="bulk.approve"
                description="Aprovar multiplas de uma vez"
                icon={ThumbsUp}
                color="text-emerald-500"
                body='{"action":"bulk.approve","property_ids":["UUID1","UUID2"],"agent_name":"MeuBot"}'
              />
              <EndpointCard
                action="bulk.reject"
                description="Rejeitar multiplas de uma vez"
                icon={ThumbsDown}
                color="text-rose-500"
                body='{"action":"bulk.reject","property_ids":["UUID1","UUID2"],"reason":"duplicate"}'
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Comps</p>
              <EndpointCard
                action="comps.list"
                description="Listar comps + pricing de uma propriedade"
                icon={List}
                color="text-teal-500"
                body='{"action":"comps.list","property_id":"UUID"}'
              />
              <EndpointCard
                action="comps.add"
                description="Adicionar comp"
                icon={ThumbsUp}
                color="text-teal-500"
                body='{"action":"comps.add","property_id":"UUID","url":"https://zillow.com/...","comp_data":{"sale_price":250000,"square_feet":1500}}'
              />
              <EndpointCard
                action="comps.pricing"
                description="Calcular ARV e oferta sugerida"
                icon={BarChart3}
                color="text-teal-500"
                body='{"action":"comps.pricing","property_id":"UUID"}'
              />
            </div>
          </div>

          {/* Rejection reasons */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold">Motivos de Rejeicao</h3>
            <div className="flex flex-wrap gap-1">
              {[
                'new-construction', 'recent-sale', 'too-good-condition', 'multi-family',
                'hoa-restrictions', 'land', 'no-equity', 'agent-listed',
                'commercial', 'duplicate', 'wrong-location', 'other',
              ].map(r => (
                <Badge key={r} variant="outline" className="text-[9px] font-mono">{r}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
