import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CheckCircle, XCircle, AlertCircle, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PropertyApprovalDialogProps {
  propertyId: string;
  propertyAddress: string;
  currentStatus?: string;
  rejectionReason?: string | null;
  rejectionNotes?: string | null;
  onStatusChange?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Razões predefinidas para rejeição
const REJECTION_REASONS = [
  { value: "too-good-condition", label: "Casa muito boa - não está distressed" },
  { value: "llc-owned", label: "Propriedade de LLC" },
  { value: "commercial", label: "Propriedade comercial" },
  { value: "duplicate", label: "Duplicado" },
  { value: "wrong-location", label: "Localização errada" },
  { value: "no-equity", label: "Sem equity suficiente" },
  { value: "already-contacted", label: "Já foi contatado anteriormente" },
  { value: "occupied-rented", label: "Ocupado/Alugado - não distressed" },
  { value: "recent-sale", label: "Venda recente" },
  { value: "hoa-restrictions", label: "Restrições de HOA" },
  { value: "title-issues", label: "Problemas no título" },
  { value: "other", label: "Outro motivo" },
];

export const PropertyApprovalDialog = ({
  propertyId,
  propertyAddress,
  currentStatus = "pending",
  rejectionReason,
  rejectionNotes,
  onStatusChange,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PropertyApprovalDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [selectedReason, setSelectedReason] = useState(rejectionReason || "");
  const [notes, setNotes] = useState(rejectionNotes || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { userId, userName } = useCurrentUser();

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = ['a', 'r', 'Escape', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      if (shortcuts.includes(e.key.toLowerCase()) || shortcuts.includes(e.key)) {
        e.preventDefault();
      }

      // A = Approve
      if (e.key.toLowerCase() === 'a' && !actionType && !isProcessing) {
        setActionType("approve");
        toast({
          title: "⌨️ Atalho: Aprovar",
          description: "Pressione Enter para confirmar",
        });
      }

      // R = Reject
      if (e.key.toLowerCase() === 'r' && !actionType && !isProcessing) {
        setActionType("reject");
        toast({
          title: "⌨️ Atalho: Rejeitar",
          description: "Selecione um motivo e pressione Enter",
        });
      }

      // Escape = Close or go back
      if (e.key === 'Escape') {
        if (actionType) {
          setActionType(null);
          setSelectedReason("");
          setNotes("");
        } else {
          setIsOpen(false);
        }
      }

      // Enter = Confirm action
      if (e.key === 'Enter' && actionType && !isProcessing) {
        if (actionType === 'approve') {
          handleApprove();
        } else if (actionType === 'reject' && selectedReason) {
          handleReject();
        }
      }

      // Number keys 1-9 for quick rejection reason selection
      if (actionType === 'reject' && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < REJECTION_REASONS.length) {
          setSelectedReason(REJECTION_REASONS[index].value);
          toast({
            title: `⌨️ Motivo ${e.key}`,
            description: REJECTION_REASONS[index].label,
          });
        }
      }

      // B = Back (voltar)
      if (e.key.toLowerCase() === 'b' && actionType && !isProcessing) {
        setActionType(null);
        setSelectedReason("");
        setNotes("");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, actionType, selectedReason, isProcessing]);

  const handleApprove = async () => {
    if (!userId || !userName) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          approval_status: "approved",
          approved_by: userId,
          approved_by_name: userName,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          rejection_notes: null,
          updated_by: userId,
          updated_by_name: userName,
        } as any)
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "✅ Propriedade Aprovada",
        description: `${propertyAddress} foi aprovada para próxima etapa`,
      });

      setIsOpen(false);
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      console.error("Erro ao aprovar:", error);
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!userId || !userName) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!selectedReason) {
      toast({
        title: "Selecione uma razão",
        description: "Por favor, selecione uma razão para rejeição",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          approval_status: "rejected",
          approved_by: userId,
          approved_by_name: userName,
          approved_at: new Date().toISOString(),
          rejection_reason: selectedReason,
          rejection_notes: notes.trim() || null,
          updated_by: userId,
          updated_by_name: userName,
        } as any)
        .eq("id", propertyId);

      if (error) throw error;

      const reasonLabel = REJECTION_REASONS.find((r) => r.value === selectedReason)?.label;

      toast({
        title: "❌ Propriedade Rejeitada",
        description: `${propertyAddress} foi rejeitada: ${reasonLabel}`,
      });

      setIsOpen(false);
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      console.error("Erro ao rejeitar:", error);
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {getStatusBadge()}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Aprovar/Rejeitar Propriedade</DialogTitle>
          <DialogDescription>{propertyAddress}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div>
            <Label>Status Atual:</Label>
            <div className="mt-2">{getStatusBadge()}</div>
          </div>

          {/* Show rejection info if rejected */}
          {currentStatus === "rejected" && rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Label className="text-red-800">Motivo da Rejeição:</Label>
              <p className="text-sm text-red-700 mt-1">
                {REJECTION_REASONS.find((r) => r.value === rejectionReason)?.label}
              </p>
              {rejectionNotes && (
                <>
                  <Label className="text-red-800 mt-2">Notas:</Label>
                  <p className="text-sm text-red-700 mt-1">{rejectionNotes}</p>
                </>
              )}
            </div>
          )}

          {/* Action Selection */}
          {!actionType && (
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                onClick={() => setActionType("approve")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-500 text-red-700 hover:bg-red-50"
                onClick={() => setActionType("reject")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {/* Approve Confirmation */}
          {actionType === "approve" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Ao aprovar, esta propriedade passará para a próxima etapa do pipeline.
              </p>
            </div>
          )}

          {/* Reject Form */}
          {actionType === "reject" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Razão da Rejeição *</Label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione uma razão..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_REASONS.map((reason, index) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">
                            {index + 1}
                          </kbd>
                          {reason.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rejection-notes">Notas Adicionais (Opcional)</Label>
                <Textarea
                  id="rejection-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione detalhes sobre a rejeição..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Legend */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Keyboard className="h-3 w-3" />
            <span className="font-medium">Atalhos:</span>
            {!actionType ? (
              <>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">A</kbd>
                <span>Aprovar</span>
                <span className="text-gray-300">|</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">R</kbd>
                <span>Rejeitar</span>
                <span className="text-gray-300">|</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd>
                <span>Fechar</span>
              </>
            ) : actionType === "reject" ? (
              <>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">1-9</kbd>
                <span>Selecionar motivo</span>
                <span className="text-gray-300">|</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd>
                <span>Confirmar</span>
                <span className="text-gray-300">|</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">B</kbd>
                <span>Voltar</span>
              </>
            ) : (
              <>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd>
                <span>Confirmar aprovação</span>
                <span className="text-gray-300">|</span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">B</kbd>
                <span>Voltar</span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          {actionType && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setActionType(null);
                  setSelectedReason("");
                  setNotes("");
                }}
                disabled={isProcessing}
              >
                Voltar <span className="ml-1 text-xs opacity-50">(B)</span>
              </Button>
              {actionType === "approve" ? (
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Aprovando..." : "Confirmar Aprovação"}
                  <span className="ml-1 text-xs opacity-75">(Enter)</span>
                </Button>
              ) : (
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !selectedReason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? "Rejeitando..." : "Confirmar Rejeição"}
                  <span className="ml-1 text-xs opacity-75">(Enter)</span>
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
