import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, X, Filter } from 'lucide-react';
import { BatchSelector } from '@/components/process/BatchSelector';
import { PHONE_COLUMNS } from '@/hooks/useCampaignContacts';
import type { CampaignFiltersReturn } from '@/hooks/useCampaignFilters';

interface Props {
  filters: CampaignFiltersReturn;
}

export function PropertyFilters({ filters }: Props) {
  const {
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    selectedBatch, setSelectedBatch,
    hasSkiptracePhoneFilter, setHasSkiptracePhoneFilter,
    hasSkiptraceEmailFilter, setHasSkiptraceEmailFilter,
    phoneFieldFilter, setPhoneFieldFilter, setSelectedPhoneColumn,
    showAdvancedFilters, setShowAdvancedFilters,
    activeFilters, setActiveFilters,
    countWithSkiptracePhones, countWithSkiptraceEmails,
    phoneFieldCounts,
  } = filters;

  const handlePhoneFieldToggle = (key: string) => {
    const isSelected = phoneFieldFilter.includes(key);
    const newFilter = isSelected ? phoneFieldFilter.filter(f => f !== key) : [...phoneFieldFilter, key];
    setPhoneFieldFilter(newFilter);
    if (newFilter.length > 0) {
      setHasSkiptracePhoneFilter(false);
      setSelectedPhoneColumn(newFilter[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Batch */}
      <div className="flex flex-wrap gap-2 items-center">
        <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search by address, name or city..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
          <Filter className="w-3 h-3 mr-1" /> Filters
        </Button>
      </div>

      {/* Status */}
      <div className="flex gap-1.5 flex-wrap">
        {['approved', 'pending', 'all'].map(status => (
          <Button key={status} variant={filterStatus === status ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFilterStatus(status)}>
            {status === 'approved' ? '✅ Approved' : status === 'pending' ? '⏳ Pending' : '📋 All'}
          </Button>
        ))}
      </div>

      {/* Skiptrace */}
      <div className="flex gap-1.5 flex-wrap">
        <Button variant={hasSkiptracePhoneFilter ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setHasSkiptracePhoneFilter(!hasSkiptracePhoneFilter); if (!hasSkiptracePhoneFilter) setPhoneFieldFilter([]); }}>
          📱 Has Phone ({countWithSkiptracePhones})
        </Button>
        <Button variant={hasSkiptraceEmailFilter ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setHasSkiptraceEmailFilter(!hasSkiptraceEmailFilter)}>
          ✉️ Has Email ({countWithSkiptraceEmails})
        </Button>
      </div>

      {/* Phone Field Multi-Select */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg border">
        <span className="text-[10px] font-semibold text-muted-foreground mr-1 self-center">📞 Filter by Phone:</span>
        {PHONE_COLUMNS.map(({ value: key, label }) => (
          <Button
            key={key}
            variant={phoneFieldFilter.includes(key) ? 'default' : 'outline'}
            size="sm"
            className={`text-[10px] h-6 px-1.5 ${phoneFieldFilter.includes(key) ? 'bg-secondary hover:bg-secondary/90' : ''}`}
            onClick={() => handlePhoneFieldToggle(key)}
          >
            {label} ({(phoneFieldCounts as Record<string, number>)[key] || 0})
          </Button>
        ))}
        {phoneFieldFilter.length > 0 && (
          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5 text-destructive hover:text-destructive" onClick={() => setPhoneFieldFilter([])}>Clear</Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(filter => (
            <Badge key={filter.id} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs" onClick={() => setActiveFilters(activeFilters.filter(f => f.id !== filter.id))}>
              {filter.label} ×
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setActiveFilters([])}><X className="w-3 h-3 mr-1" /> Clear</Button>
        </div>
      )}
    </div>
  );
}
