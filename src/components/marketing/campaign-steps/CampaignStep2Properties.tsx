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
    phoneFieldCounts, selectedProps,
    getAllPhones, getFilteredProperties, toggleSelection,
  } = filters;

  const filteredProperties = getFilteredProperties();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">🎯 Select Properties</h2>
        <p className="text-muted-foreground">Choose the properties you want to target with your campaign</p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar propriedades por endereço, nome ou cidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filtros Avançados
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {['approved', 'pending', 'all'].map(status => (
            <Button key={status} variant={filterStatus === status ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus(status)}>
              {status === 'approved' ? '✅ Approved' : status === 'pending' ? '⏳ Pending' : '📋 All'} ({status === 'all' ? properties.length : properties.filter(p => p.approval_status === status).length})
            </Button>
          ))}
        </div>

        {/* Skiptrace Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={hasSkiptracePhoneFilter ? 'default' : 'outline'} size="sm" onClick={() => { setHasSkiptracePhoneFilter(!hasSkiptracePhoneFilter); if (!hasSkiptracePhoneFilter) setPhoneFieldFilter([]); }}>
            📱 Has Phone ({countWithSkiptracePhones})
          </Button>
          <Button variant={hasSkiptraceEmailFilter ? 'default' : 'outline'} size="sm" onClick={() => setHasSkiptraceEmailFilter(!hasSkiptraceEmailFilter)}>
            ✉️ Has Email ({countWithSkiptraceEmails})
          </Button>
        </div>

        {/* Phone Field Multi-Select */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg border">
            <span className="text-xs font-semibold text-muted-foreground mr-2 self-center">Phone Fields:</span>
            {PHONE_COLUMNS.map(({ value: key, label }) => {
              const isSelected = phoneFieldFilter.includes(key);
              return (
                <Button key={key} variant={isSelected ? 'default' : 'outline'} size="sm"
                  className={`text-xs h-7 px-2 ${isSelected ? 'bg-secondary hover:bg-secondary/90' : ''}`}
                  onClick={() => {
                    const newFilter = isSelected ? phoneFieldFilter.filter(f => f !== key) : [...phoneFieldFilter, key];
                    setPhoneFieldFilter(newFilter);
                    if (newFilter.length > 0) { setHasSkiptracePhoneFilter(false); setSelectedPhoneColumn(newFilter[0]); }
                  }}>
                  {label} ({(phoneFieldCounts as any)[key] || 0})
                </Button>
              );
            })}
            {phoneFieldFilter.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-destructive hover:text-destructive" onClick={() => setPhoneFieldFilter([])}>Clear</Button>
            )}
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <Badge key={filter.id} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => setActiveFilters(activeFilters.filter(f => f.id !== filter.id))}>
                {filter.label} ×
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}><X className="w-3 h-3 mr-1" /> Limpar filtros</Button>
          </div>
        )}
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></CardHeader><CardContent><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center space-x-3 p-3 border rounded-lg"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-5 w-5" /></div>))}</div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4"><Target className="w-12 h-12 text-muted-foreground" /></div>
          <h3 className="text-lg font-semibold mb-2">{searchTerm ? 'Nenhuma propriedade encontrada' : 'Nenhuma propriedade disponível'}</h3>
          <p className="text-muted-foreground mb-4">{searchTerm ? `Não encontramos propriedades para "${searchTerm}".` : `Não há propriedades com status "${filterStatus}".`}</p>
          <div className="flex gap-2 justify-center">
            {searchTerm && <Button variant="outline" onClick={() => setSearchTerm('')}>Limpar busca</Button>}
            <Button onClick={() => setFilterStatus('all')}>Ver todas</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">📋 Available Properties</CardTitle>
                  <CardDescription>{filteredProperties.length} propriedades{searchTerm && ` para "${searchTerm}"`}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds(filteredProperties.map(p => p.id))} className="hover:bg-primary/10 hover:border-primary">
                    <CheckCircle className="w-3 h-3 mr-1" /> Select All ({filteredProperties.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive" disabled={selectedIds.length === 0}>Clear</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredProperties.map((property) => {
                    const phones = getAllPhones(property);
                    const emails = getAllEmails(property);
                    return (
                      <div key={property.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => toggleSelection(property.id)}>
                        <Avatar className="h-10 w-10 flex-shrink-0"><AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{property.owner_name?.charAt(0) || property.address.charAt(0) || 'P'}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">{property.address}</p>
                            <Badge variant={property.approval_status === 'approved' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">{property.approval_status}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            {phones.length > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                {phoneFieldFilter.length > 0 && <span className="text-xs font-semibold text-primary">[{phoneFieldFilter.map(f => f.replace('_', ' ').replace('phone', 'Ph').replace('owner Ph', 'Owner')).join(', ')}]</span>}
                                <span className="truncate font-mono text-xs">{phones.slice(0, 2).join(', ')}{phones.length > 2 && ` +${phones.length - 2} more`}</span>
                              </div>
                            )}
                            {emails.length > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate font-mono text-xs">{emails.slice(0, 2).join(', ')}{emails.length > 2 && ` +${emails.length - 2} more`}</span>
                              </div>
                            )}
                            {property.cash_offer_amount && (
                              <div className="flex items-center gap-2 text-success font-semibold">
                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs">{property.cash_offer_amount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
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
            <CardHeader>
              <CardTitle className="text-lg">Selected Properties ({selectedIds.length})</CardTitle>
              <CardDescription>Properties that will receive your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIds.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No properties selected</div>
              ) : (
                <ScrollArea className="h-[320px] pr-3">
                  <div className="space-y-2">
                    {selectedProps.map((property) => (
                      <div key={property.id} className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{property.address}</p>
                            <p className="text-xs text-muted-foreground truncate">{property.city}, {property.state} {property.zip_code}</p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {selectedChannel === 'email' ? `${getAllEmails(property).length} email(s)` : `${getAllPhones(property).length} phone(s)`}
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
