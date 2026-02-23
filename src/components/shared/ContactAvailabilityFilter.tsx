/**
 * Contact Availability Filter
 * Filtro para mostrar propriedades com/sem telefones e emails
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Mail, Filter, X } from "lucide-react";

export interface ContactFilters {
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasPreferredContacts?: boolean;
  noSkiptraceData?: boolean;
  hasSkiptracePhones?: boolean;
  hasSkiptraceEmails?: boolean;
}

interface ContactAvailabilityFilterProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  phonesCount?: number;
  emailsCount?: number;
  preferredCount?: number;
  noSkiptraceCount?: number;
  skiptracephonesCount?: number;
  skiptraceEmailsCount?: number;
}

export const ContactAvailabilityFilter = ({
  filters,
  onFiltersChange,
  phonesCount = 0,
  emailsCount = 0,
  preferredCount = 0,
  noSkiptraceCount = 0,
  skiptracephonesCount = 0,
  skiptraceEmailsCount = 0,
}: ContactAvailabilityFilterProps) => {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const toggleFilter = (key: keyof ContactFilters) => {
    const newFilters = { ...filters };
    if (newFilters[key] === true) {
      delete newFilters[key];
    } else {
      newFilters[key] = true;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Contact Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Filter by Contact Availability</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={filters.hasPhone === true}
            onCheckedChange={() => toggleFilter('hasPhone')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Has Phone Numbers
            {phonesCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {phonesCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={filters.hasEmail === true}
            onCheckedChange={() => toggleFilter('hasEmail')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Has Email Addresses
            {emailsCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {emailsCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={filters.hasPreferredContacts === true}
            onCheckedChange={() => toggleFilter('hasPreferredContacts')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Has Preferred Contacts Selected
            {preferredCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {preferredCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={filters.hasSkiptracePhones === true}
            onCheckedChange={() => toggleFilter('hasSkiptracePhones')}
          >
            <Phone className="h-4 w-4 mr-2 text-blue-600" />
            Has Skip Trace Phones (phone1-7)
            {skiptracephonesCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {skiptracephonesCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={filters.hasSkiptraceEmails === true}
            onCheckedChange={() => toggleFilter('hasSkiptraceEmails')}
          >
            <Mail className="h-4 w-4 mr-2 text-purple-600" />
            Has Skip Trace Emails (email1-5)
            {skiptraceEmailsCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {skiptraceEmailsCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={filters.noSkiptraceData === true}
            onCheckedChange={() => toggleFilter('noSkiptraceData')}
          >
            <X className="h-4 w-4 mr-2" />
            No Skiptrace Data
            {noSkiptraceCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {noSkiptraceCount}
              </Badge>
            )}
          </DropdownMenuCheckboxItem>

          {activeFiltersCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-1 flex-wrap">
          {filters.hasPhone && (
            <Badge variant="secondary" className="gap-1">
              <Phone className="h-3 w-3" />
              Has Phone
            </Badge>
          )}
          {filters.hasEmail && (
            <Badge variant="secondary" className="gap-1">
              <Mail className="h-3 w-3" />
              Has Email
            </Badge>
          )}
          {filters.hasPreferredContacts && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              Preferred Set
            </Badge>
          )}
          {filters.noSkiptraceData && (
            <Badge variant="secondary" className="gap-1">
              <X className="h-3 w-3" />
              No Skiptrace
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
