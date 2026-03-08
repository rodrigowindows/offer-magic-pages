import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, CheckCircle, AlertCircle, Activity, BarChart3 } from 'lucide-react';
import type { SimulationResult, SystemHealthStatus } from '@/types/campaign.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationResults: SimulationResult | null;
  healthStatus: SystemHealthStatus | null;
}

export function CampaignSimulationDialog({ open, onOpenChange, simulationResults, healthStatus }: Props) {
  if (!simulationResults || !healthStatus) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Simulação de Envio - Resultados</DialogTitle>
          <DialogDescription>Análise completa do que seria enviado nesta campanha</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5" /> Status do Sistema</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {healthStatus.api ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                  <span className="text-sm">API de Comunicação</span>
                </div>
                <div className="flex items-center gap-2">
                  {healthStatus.database ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                  <span className="text-sm">Banco de Dados</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Resultados da Simulação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg"><div className="text-2xl font-bold text-primary">{simulationResults.total}</div><div className="text-sm text-primary/80">Total</div></div>
                <div className="text-center p-4 bg-success/5 rounded-lg"><div className="text-2xl font-bold text-success">{simulationResults.wouldSend}</div><div className="text-sm text-success/80">Seriam Enviados</div></div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg"><div className="text-2xl font-bold text-destructive">{simulationResults.wouldFail}</div><div className="text-sm text-destructive/80">Sem Contato</div></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Estimado:</span>
                <span className="font-semibold">${simulationResults.estimatedCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tempo Estimado:</span>
                <span className="font-semibold">~{simulationResults.estimatedTime}s</span>
              </div>
            </CardContent>
          </Card>

          {simulationResults.contactBreakdown.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Detalhamento por Propriedade</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {simulationResults.contactBreakdown.slice(0, 20).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="truncate flex-1">{item.property}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline">{item.channel}</Badge>
                        <Badge variant="secondary">{item.contacts.length} contact(s)</Badge>
                      </div>
                    </div>
                  ))}
                  {simulationResults.contactBreakdown.length > 20 && (
                    <div className="text-center text-sm text-muted-foreground">... e mais {simulationResults.contactBreakdown.length - 20}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
