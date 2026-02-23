import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PropertyApprovalFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  counts?: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export const PropertyApprovalFilter = ({
  selectedStatus,
  onStatusChange,
  counts,
}: PropertyApprovalFilterProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedStatus === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onStatusChange("all")}
      >
        Todos
        {counts && (
          <Badge variant="secondary" className="ml-2">
            {counts.pending + counts.approved + counts.rejected}
          </Badge>
        )}
      </Button>

      <Button
        variant={selectedStatus === "pending" ? "default" : "outline"}
        size="sm"
        onClick={() => onStatusChange("pending")}
        className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
      >
        <AlertCircle className="h-4 w-4 mr-1" />
        Pendentes
        {counts && (
          <Badge variant="secondary" className="ml-2">
            {counts.pending}
          </Badge>
        )}
      </Button>

      <Button
        variant={selectedStatus === "approved" ? "default" : "outline"}
        size="sm"
        onClick={() => onStatusChange("approved")}
        className="border-green-500 text-green-700 hover:bg-green-50"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Aprovados
        {counts && (
          <Badge variant="secondary" className="ml-2">
            {counts.approved}
          </Badge>
        )}
      </Button>

      <Button
        variant={selectedStatus === "rejected" ? "default" : "outline"}
        size="sm"
        onClick={() => onStatusChange("rejected")}
        className="border-red-500 text-red-700 hover:bg-red-50"
      >
        <XCircle className="h-4 w-4 mr-1" />
        Rejeitados
        {counts && (
          <Badge variant="secondary" className="ml-2">
            {counts.rejected}
          </Badge>
        )}
      </Button>
    </div>
  );
};
