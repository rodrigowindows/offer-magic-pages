import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Grid3x3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DesignModeToggleProps {
  isMinimal: boolean;
  onToggle: () => void;
}

export const DesignModeToggle = ({ isMinimal, onToggle }: DesignModeToggleProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="relative gap-2"
          >
            {isMinimal ? (
              <>
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="hidden sm:inline">Design Minimalista</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 border-purple-200">
                  Novo
                </Badge>
              </>
            ) : (
              <>
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Design Clássico</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar entre design clássico e minimalista</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isMinimal ? 'Clique para voltar ao design clássico' : 'Clique para ativar design minimalista'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
