import { Button } from "@/components/ui/button";
import { Settings, FileDown, Rocket } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderActionsMenuProps {
  onBulkImport: () => void;
  onGeminiSettings: () => void;
  onMarketingSettings: () => void;
}

export const HeaderActionsMenu = ({
  onBulkImport,
  onGeminiSettings,
  onMarketingSettings,
}: HeaderActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onBulkImport} className="gap-2">
          <FileDown className="h-4 w-4" />
          Importação em Massa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onGeminiSettings} className="gap-2">
          <Settings className="h-4 w-4" />
          Gemini AI Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMarketingSettings} className="gap-2">
          <Rocket className="h-4 w-4" />
          Marketing API Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
