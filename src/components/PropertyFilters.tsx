import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "./LeadStatusBadge";
import { Filter } from "lucide-react";

interface PropertyFiltersProps {
  selectedStatus: LeadStatus | 'all';
  onStatusChange: (status: LeadStatus | 'all') => void;
  statusCounts: Record<LeadStatus | 'all', number>;
}

export const PropertyFilters = ({ 
  selectedStatus, 
  onStatusChange, 
  statusCounts 
}: PropertyFiltersProps) => {
  const filters: Array<{ value: LeadStatus | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'All Properties', color: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { value: 'new', label: 'New Leads', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800' },
    { value: 'following_up', label: 'Following Up', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-orange-100 hover:bg-orange-200 text-orange-800' },
    { value: 'offer_made', label: 'Offer Made', color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800' },
    { value: 'closed', label: 'Closed', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
    { value: 'not_interested', label: 'Not Interested', color: 'bg-gray-100 hover:bg-gray-200 text-gray-600' },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Filter by Status</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedStatus === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(filter.value)}
            className={`${
              selectedStatus === filter.value 
                ? filter.color 
                : 'hover:bg-accent'
            } transition-colors`}
          >
            {filter.label}
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/80 text-foreground"
            >
              {statusCounts[filter.value] || 0}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
};
