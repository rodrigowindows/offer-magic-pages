import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Home, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { checkAndSaveAirbnbEligibility } from "@/utils/airbnbChecker";

interface AirbnbEligibilityCheckerProps {
  propertyId: string;
  propertyAddress: string;
  city: string;
  state: string;
  currentEligible?: boolean | null;
  currentRegulations?: any;
  currentNotes?: string | null;
  lastCheckDate?: string | null;
  onCheckComplete?: () => void;
}

export const AirbnbEligibilityChecker = ({
  propertyId,
  propertyAddress,
  city,
  state,
  currentEligible,
  currentRegulations,
  currentNotes,
  lastCheckDate,
  onCheckComplete,
}: AirbnbEligibilityCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    setIsChecking(true);

    try {
      const result = await checkAndSaveAirbnbEligibility(propertyId);

      toast({
        title: result.eligible ? "✅ Elegível para Airbnb" : "❌ Não Elegível",
        description: result.regulations.notes,
      });

      if (onCheckComplete) {
        onCheckComplete();
      }
    } catch (error: any) {
      console.error("Error checking Airbnb:", error);
      toast({
        title: "Erro ao verificar",
        description: error.message || "Não foi possível verificar elegibilidade",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (currentEligible === null || currentEligible === undefined) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Não Verificado
        </Badge>
      );
    }

    return currentEligible ? (
      <Badge className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Airbnb OK
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Não Permitido
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Home className="h-4 w-4 mr-2" />
          {getStatusBadge()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Elegibilidade Airbnb</DialogTitle>
          <DialogDescription>
            {propertyAddress}, {city}, {state}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div>
            <label className="text-sm font-medium">Status Atual:</label>
            <div className="mt-2">{getStatusBadge()}</div>
            {lastCheckDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Última verificação: {new Date(lastCheckDate).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          {/* Regulations Details */}
          {currentRegulations && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium">Cidade:</span>
                <span className="text-sm ml-2">{currentRegulations.city}</span>
              </div>

              <div>
                <span className="text-sm font-medium">Permite STR:</span>
                <span className="text-sm ml-2">
                  {currentRegulations.allowsShortTermRentals ? "✅ Sim" : "❌ Não"}
                </span>
              </div>

              {currentRegulations.requiresLicense && (
                <div>
                  <span className="text-sm font-medium">Requer Licença:</span>
                  <span className="text-sm ml-2">✅ Sim</span>
                </div>
              )}

              {currentRegulations.minNights && (
                <div>
                  <span className="text-sm font-medium">Mínimo de Noites:</span>
                  <span className="text-sm ml-2">{currentRegulations.minNights}</span>
                </div>
              )}

              {currentRegulations.maxNightsPerYear && (
                <div>
                  <span className="text-sm font-medium">Máximo de Noites/Ano:</span>
                  <span className="text-sm ml-2">{currentRegulations.maxNightsPerYear}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {currentNotes && (
            <div>
              <label className="text-sm font-medium">Notas:</label>
              <p className="text-sm text-muted-foreground mt-1">{currentNotes}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Como funciona:</strong>
              <br />
              Verificamos regulamentações locais de Short-Term Rental (STR) baseado na cidade.
              Algumas cidades como Miami Beach e Fort Lauderdale restringem Airbnb.
              Orlando e Kissimmee geralmente permitem com licenciamento apropriado.
            </p>
          </div>

          {/* Check/Recheck Button */}
          <Button
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {currentEligible !== null ? "Verificar Novamente" : "Verificar Elegibilidade"}
              </>
            )}
          </Button>

          {/* Upgrade Notice */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              💡 <strong>Dica Pro:</strong> Para dados de mercado detalhados (receita estimada,
              taxa de ocupação), integre com{" "}
              <a
                href="https://www.airdna.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                AirDNA API
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
