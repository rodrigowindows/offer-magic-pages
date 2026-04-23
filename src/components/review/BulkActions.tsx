import { useState, useCallback } from 'react';
import { CheckSquare, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { REJECTION_REASONS } from './constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { QueueProperty } from './types';

interface BulkActionsProps {
  properties: QueueProperty[];
  onComplete: () => void;
}

export const BulkActions = ({ properties, onComplete }: BulkActionsProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { userId, userName } = useCurrentUser();
  const { toast } = useToast();

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === properties.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(properties.map(p => p.id)));
    }
  };

  const handleBulkAction = useCallback(async () => {
    if (!userId || !userName || selected.size === 0 || !action) return;
    if (action === 'reject' && !rejectReason) return;

    setProcessing(true);
    try {
      const ids = Array.from(selected);
      const updateData: any = {
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString(),
        updated_by: userId,
        updated_by_name: userName,
      };

      if (action === 'approve') {
        updateData.approval_status = 'approved';
        updateData.rejection_reason = null;
        updateData.rejection_notes = null;
      } else {
        updateData.approval_status = 'rejected';
        updateData.rejection_reason = rejectReason;
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .in('id', ids);

      if (error) throw error;

      toast({
        title: action === 'approve' ? 'Aprovadas em lote!' : 'Rejeitadas em lote!',
        description: `${ids.length} propriedades ${action === 'approve' ? 'aprovadas' : 'rejeitadas'}.`,
      });

      setOpen(false);
      setSelected(new Set());
      setAction(null);
      setRejectReason('');
      onComplete();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [userId, userName, selected, action, rejectReason, toast, onComplete]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-5 px-1.5 text-[10px] gap-1"
      >
        <CheckSquare className="h-2.5 w-2.5" />
        Lote
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Ações em Lote
              <Badge variant="secondary" className="text-xs">{selected.size} selecionadas</Badge>
            </DialogTitle>
          </DialogHeader>

          {!action ? (
            <>
              <div className="flex items-center gap-2 border-b pb-2">
                <Checkbox
                  checked={selected.size === properties.length && properties.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs text-muted-foreground">Selecionar todas ({properties.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0 max-h-60">
                {properties.slice(0, 100).map(p => (
                  <label key={p.id} className="flex items-center gap-2 px-1 py-1 hover:bg-muted rounded cursor-pointer text-xs">
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                    <span className="truncate flex-1">{p.address}</span>
                    <span className="text-muted-foreground shrink-0">{formatCurrency(p.estimated_value)}</span>
                  </label>
                ))}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  onClick={() => setAction('approve')}
                  disabled={selected.size === 0}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  size="sm"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Aprovar ({selected.size})
                </Button>
                <Button
                  onClick={() => setAction('reject')}
                  disabled={selected.size === 0}
                  variant="outline"
                  className="border-red-300 text-red-700 gap-1"
                  size="sm"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Rejeitar ({selected.size})
                </Button>
              </DialogFooter>
            </>
          ) : action === 'reject' ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Motivo para rejeitar {selected.size} propriedades:</p>
              <TooltipProvider delayDuration={200}>
                <div className="grid grid-cols-2 gap-1">
                  {REJECTION_REASONS.map(r => (
                    <Tooltip key={r.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setRejectReason(r.value)}
                          className={`text-left px-2 py-1.5 rounded text-xs border ${
                            rejectReason === r.value ? 'bg-red-600 text-white border-red-600' : 'hover:bg-red-50 border-red-200'
                          }`}
                        >
                          {r.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                        <p className="font-bold mb-1">{r.label}</p>
                        <p className="opacity-90">{r.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
              <DialogFooter className="gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAction(null)}>Voltar</Button>
                <Button
                  onClick={handleBulkAction}
                  disabled={!rejectReason || processing}
                  className="bg-red-600 hover:bg-red-700 text-white gap-1"
                  size="sm"
                >
                  {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
                  Confirmar Rejeição
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs">Confirmar aprovação de <strong>{selected.size}</strong> propriedades?</p>
              <DialogFooter className="gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAction(null)}>Voltar</Button>
                <Button
                  onClick={handleBulkAction}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  size="sm"
                >
                  {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                  Confirmar Aprovação
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
