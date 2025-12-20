import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Check } from "lucide-react";

interface CompactFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  approvalStatus: string;
  onApprovalChange: (status: string) => void;
  statusCounts: { pending: number; approved: number; rejected: number };
  onClearAll: () => void;
}

export const CompactFilterPanel = ({
  isOpen,
  onClose,
  approvalStatus,
  onApprovalChange,
  statusCounts,
  onClearAll,
}: CompactFilterPanelProps) => {
  if (!isOpen) return null;

  const filterOptions = [
    { value: "all", label: "Todas", count: statusCounts.pending + statusCounts.approved + statusCounts.rejected, color: "bg-gray-100 text-gray-700" },
    { value: "pending", label: "Pendentes", count: statusCounts.pending, color: "bg-yellow-100 text-yellow-700" },
    { value: "approved", label: "Aprovadas", count: statusCounts.approved, color: "bg-green-100 text-green-700" },
    { value: "rejected", label: "Rejeitadas", count: statusCounts.rejected, color: "bg-red-100 text-red-700" },
  ];

  const activeFiltersCount = approvalStatus !== "all" ? 1 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {activeFiltersCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-gray-600 hover:text-gray-900"
              >
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filters Content */}
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status de Aprovação</h4>
            <div className="space-y-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onApprovalChange(option.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    approvalStatus === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        approvalStatus === option.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {approvalStatus === option.value && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <Badge className={`${option.color} border-0`}>
                    {option.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* More filters can be added here */}
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Mais filtros em breve...
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <Button
            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onClose}
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  );
};
