import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Users, Target, Search, X, Phone, Mail, DollarSign, Filter } from 'lucide-react';
import { BatchSelector } from '@/components/process/BatchSelector';
import { PHONE_COLUMNS, type CampaignProperty, getAllEmails } from '@/hooks/useCampaignContacts';
import type { CampaignFiltersReturn } from '@/hooks/useCampaignFilters';
import type { Channel } from '@/types/marketing.types';

interface Props {
  loading: boolean;
  properties: CampaignProperty[];
  filters: CampaignFiltersReturn;
  selectedChannel: Channel;
}

export function CampaignStep2Properties({ loading, properties, filters, selectedChannel }: Props) {
  const {
    selectedIds, setSelectedIds, searchTerm, setSearchTerm,
    filterStatus, setFilterStatus, selectedBatch, setSelectedBatch,
    hasSkiptracePhoneFilter, setHasSkiptracePhoneFilter,
    hasSkiptraceEmailFilter, setHasSkiptraceEmailFilter,
    phoneFieldFilter, setPhoneFieldFilter, setSelectedPhoneColumn,
    showAdvancedFilters, setShowAdvancedFilters,
    activeFilters, setActiveFilters,
    countWithSkiptracePhones, countWithSkiptraceEmails,
    phoneFieldCounts, selectedProps, filteredProperties,
    getAllPhones, toggleSelection,
  } = filters;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">🎯 Select Properties</h2>
        <p className="text-sm text-muted-foreground">Choose the properties you want to target</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
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

        {/* Status Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {['approved', 'pending', 'all'].map(status => (
            <Button key={status} variant={filterStatus === status ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFilterStatus(status)}>
              {status === 'approved' ? '✅ Approved' : status === 'pending' ? '⏳ Pending' : '📋 All'}
            </Button>
          ))}
        </div>

        {/* Skiptrace Filters */}
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={hasSkiptracePhoneFilter ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => { setHasSkiptracePhoneFilter(!hasSkiptracePhoneFilter); if (!hasSkiptracePhoneFilter) setPhoneFieldFilter([]); }}>
            📱 Has Phone ({countWithSkiptracePhones})
          </Button>
          <Button variant={hasSkiptraceEmailFilter ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setHasSkiptraceEmailFilter(!hasSkiptraceEmailFilter)}>
            ✉️ Has Email ({countWithSkiptraceEmails})
          </Button>
        </div>

        {/* Phone Field Multi-Select - Always visible */}
        <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg border">
          <span className="text-[10px] font-semibold text-muted-foreground mr-1 self-center">📞 Filter by Phone:</span>
          {PHONE_COLUMNS.map(({ value: key, label }) => {
            const isSelected = phoneFieldFilter.includes(key);
            return (
              <Button key={key} variant={isSelected ? 'default' : 'outline'} size="sm"
                className={`text-[10px] h-6 px-1.5 ${isSelected ? 'bg-secondary hover:bg-secondary/90' : ''}`}
                onClick={() => {
                  const newFilter = isSelected ? phoneFieldFilter.filter(f => f !== key) : [...phoneFieldFilter, key];
                  setPhoneFieldFilter(newFilter);
                  if (newFilter.length > 0) { setHasSkiptracePhoneFilter(false); setSelectedPhoneColumn(newFilter[0]); }
                }}>
                {label} ({(phoneFieldCounts as Record<string, number>)[key] || 0})
              </Button>
            );
          })}
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

      {/* Properties List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="pt-4"><div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center space-x-3 p-2 border rounded-lg"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div></div>))}</div></CardContent></Card>
          <Card><CardContent className="pt-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3"><Target className="w-8 h-8 text-muted-foreground" /></div>
          <h3 className="text-base font-semibold mb-1">{searchTerm ? 'No properties found' : 'No properties available'}</h3>
          <p className="text-sm text-muted-foreground mb-3">{searchTerm ? `No results for "${searchTerm}".` : `No properties with status "${filterStatus}".`}</p>
          <div className="flex gap-2 justify-center">
            {searchTerm && <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>Clear search</Button>}
            <Button size="sm" onClick={() => setFilterStatus('all')}>View all</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">📋 Available ({filteredProperties.length})</CardTitle>
                </div>
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
                  {filteredProperties.map((property) => {
                    const phones = getAllPhones(property);
                    const emails = getAllEmails(property);
                    return (
                      <div key={property.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => toggleSelection(property.id)}>
                        <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{property.owner_name?.charAt(0) || property.address.charAt(0) || 'P'}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{property.address}</p>
                            <Badge variant={property.approval_status === 'approved' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1 flex-shrink-0">{property.approval_status}</Badge>
                          </div>
                          {property.cash_offer_amount && (
                            <div className="flex items-center gap-1 text-xs font-medium text-primary">
                              <DollarSign className="w-3 h-3" />
                              {property.cash_offer_amount.toLocaleString()}
                            </div>
                          )}
                          {phones.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {phones.map((ph, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 font-mono bg-accent text-accent-foreground border-border">
                                  <Phone className="w-2.5 h-2.5 mr-0.5" />{ph}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {emails.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {emails.map((em, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 font-mono bg-secondary text-secondary-foreground border-border">
                                  <Mail className="w-2.5 h-2.5 mr-0.5" />{em}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Checkbox checked={selectedIds.includes(property.id)} onChange={() => {}} className="flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Selected ({selectedIds.length})</CardTitle>
              <CardDescription className="text-xs">Properties that will receive your campaign</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedIds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No properties selected</div>
              ) : (
                <ScrollArea className="h-[320px] pr-2">
                  <div className="space-y-1.5">
                    {selectedProps.map((property) => (
                      <div key={property.id} className="p-2 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{property.address}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{property.city}, {property.state} {property.zip_code}</p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                            {selectedChannel === 'email' ? `${getAllEmails(property).length} email` : `${getAllPhones(property).length} ph`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}