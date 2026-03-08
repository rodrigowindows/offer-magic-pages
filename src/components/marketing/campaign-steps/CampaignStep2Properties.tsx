import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Target } from 'lucide-react';
import { getAllEmails, type CampaignProperty } from '@/hooks/useCampaignContacts';
import type { CampaignFiltersReturn } from '@/hooks/useCampaignFilters';
import type { Channel } from '@/types/marketing.types';
import { PropertyFilters } from './step2/PropertyFilters';
import { PropertyCard } from './step2/PropertyCard';
import { SelectedPanel } from './step2/SelectedPanel';

interface Props {
  loading: boolean;
  properties: CampaignProperty[];
  filters: CampaignFiltersReturn;
  selectedChannel: Channel;
}

export function CampaignStep2Properties({ loading, properties, filters, selectedChannel }: Props) {
  const {
    selectedIds, setSelectedIds, searchTerm, setSearchTerm,
    filterStatus, setFilterStatus, filteredProperties,
    selectedProps, getAllPhones, toggleSelection,
  } = filters;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">🎯 Select Properties</h2>
        <p className="text-sm text-muted-foreground">Choose the properties you want to target</p>
      </div>

      <PropertyFilters filters={filters} />

      {loading ? (
        <LoadingSkeleton />
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onClearSearch={() => setSearchTerm('')}
          onViewAll={() => setFilterStatus('all')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">📋 Available ({filteredProperties.length})</CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(filteredProperties.map(p => p.id))}>
                    <CheckCircle className="w-3 h-3 mr-1" /> All
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>Clear</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-1.5">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      phones={getAllPhones(property)}
                      emails={getAllEmails(property)}
                      isSelected={selectedIds.includes(property.id)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <SelectedPanel selectedProps={selectedProps} selectedChannel={selectedChannel} getAllPhones={getAllPhones} />
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><CardContent className="pt-4"><div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center space-x-3 p-2 border rounded-lg"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div></div>))}</div></CardContent></Card>
      <Card><CardContent className="pt-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

function EmptyState({ searchTerm, filterStatus, onClearSearch, onViewAll }: { searchTerm: string; filterStatus: string; onClearSearch: () => void; onViewAll: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3"><Target className="w-8 h-8 text-muted-foreground" /></div>
      <h3 className="text-base font-semibold mb-1">{searchTerm ? 'No properties found' : 'No properties available'}</h3>
      <p className="text-sm text-muted-foreground mb-3">{searchTerm ? `No results for "${searchTerm}".` : `No properties with status "${filterStatus}".`}</p>
      <div className="flex gap-2 justify-center">
        {searchTerm && <Button variant="outline" size="sm" onClick={onClearSearch}>Clear search</Button>}
        <Button size="sm" onClick={onViewAll}>View all</Button>
      </div>
    </div>
  );
}
