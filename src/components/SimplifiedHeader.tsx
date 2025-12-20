import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  Settings,
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SimplifiedHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  onAddProperty: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
  filterCount?: number;
  userName?: string;
}

export const SimplifiedHeader = ({
  searchQuery,
  onSearchChange,
  onToggleFilters,
  onAddProperty,
  onExport,
  onSettings,
  onLogout,
  filterCount = 0,
  userName = "User",
}: SimplifiedHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                RE
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Property CRM</h1>
                <p className="text-xs text-gray-500">Gestão Inteligente</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar propriedade por endereço, cidade, dono..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-base"
              />
            </div>
          </div>

          {/* Actions - Right */}
          <div className="flex items-center gap-3">
            {/* Filters */}
            <Button
              variant="outline"
              size="default"
              onClick={onToggleFilters}
              className="relative h-11 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filtros
              {filterCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-blue-500 text-white text-xs">
                  {filterCount}
                </Badge>
              )}
            </Button>

            {/* Add Property */}
            <Button
              onClick={onAddProperty}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Propriedade
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border-2 border-gray-200 hover:border-gray-300"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <DropdownMenuSeparator />
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </DropdownMenuItem>
                )}
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
