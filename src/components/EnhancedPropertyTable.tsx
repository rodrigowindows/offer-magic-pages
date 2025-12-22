import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Mail,
  Phone,
} from "lucide-react";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  owner_name?: string;
  owner_phone?: string;
  lead_status?: string;
}

interface EnhancedPropertyTableProps {
  properties: Property[];
  selectedProperties: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onViewDetails: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onGenerateOffer: (property: Property) => void;
}

type SortField = 'address' | 'owner_name' | 'estimated_value' | 'cash_offer_amount' | 'approval_status';
type SortDirection = 'asc' | 'desc' | null;

const SortableHeader = ({
  field,
  label,
  currentField,
  direction,
  onSort,
}: {
  field: SortField;
  label: string;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) => {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-2 hover:text-gray-900 transition-colors font-medium"
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
};

const ApprovalStatusBadge = ({ status }: { status?: string }) => {
  if (!status || status === 'pending') {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Pending
      </Badge>
    );
  }
  if (status === 'approved') {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        Approved
      </Badge>
    );
  }
  if (status === 'rejected') {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
        Rejected
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
};

export const EnhancedPropertyTable = ({
  properties,
  selectedProperties,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  onEdit,
  onDelete,
  onGenerateOffer,
}: EnhancedPropertyTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProperties = [...properties].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const allSelected = properties.length > 0 && selectedProperties.length === properties.length;
  const someSelected = selectedProperties.length > 0 && !allSelected;

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const getOfferPercentage = (offer: number, value: number) => {
    if (!value) return 0;
    return ((offer / value) * 100).toFixed(0);
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || (someSelected ? "indeterminate" : false)}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="address"
                label="Property"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="owner_name"
                label="Owner"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="estimated_value"
                label="Value"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="cash_offer_amount"
                label="Offer"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="approval_status"
                label="Status"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead className="text-right w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProperties.map((property) => (
            <TableRow
              key={property.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onViewDetails(property)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedProperties.includes(property.id)}
                  onCheckedChange={() => onToggleSelect(property.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={property.property_image_url || '/placeholder.jpg'}
                    alt={property.address}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{property.address}</div>
                    <div className="text-sm text-gray-500">
                      {property.city}, {property.state} {property.zip_code}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {property.owner_name ? (
                  <div>
                    <div className="font-medium text-gray-900">{property.owner_name}</div>
                    {property.owner_phone && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {property.owner_phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium text-gray-900">
                  {formatCurrency(property.estimated_value)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="font-semibold text-green-600">
                  {formatCurrency(property.cash_offer_amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {getOfferPercentage(property.cash_offer_amount, property.estimated_value)}% of value
                </div>
              </TableCell>
              <TableCell>
                <ApprovalStatusBadge status={property.approval_status} />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewDetails(property)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(property)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateOffer(property)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Offer
                    </DropdownMenuItem>
                    {property.owner_phone && (
                      <DropdownMenuItem onClick={() => window.open(`tel:${property.owner_phone}`, '_self')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Owner
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(property)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
