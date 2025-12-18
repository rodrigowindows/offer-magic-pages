import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
                    {REJECTION_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
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
                Voltar
              </Button>
              {actionType === "approve" ? (
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Aprovando..." : "Confirmar Aprovação"}
                </Button>
              ) : (
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !selectedReason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
