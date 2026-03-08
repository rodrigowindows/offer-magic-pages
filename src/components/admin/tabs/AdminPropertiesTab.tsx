import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ExternalLink, Copy, QrCode, FileText, Settings, LayoutGrid, List, Rocket, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusBadge } from "@/components/lead/LeadStatusBadge";
import { LeadStatusSelect } from "@/components/lead/LeadStatusSelect";
import { BulkActionsBar } from "@/components/shared/BulkActionsBar";
import { KanbanBoard } from "@/components/shared/KanbanBoard";
import { PropertyImageDisplay } from "@/components/property/PropertyImageDisplay";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { AdaptivePropertyCard } from "@/components/property/AdaptivePropertyCard";
import { AIPropertyImport } from "@/components/import-data/AIPropertyImport";
import { SmartPropertySearch } from "@/components/property/SmartPropertySearch";
import { QuickFiltersSidebar } from "@/components/shared/QuickFiltersSidebar";
import { ActiveFilterChips } from "@/components/shared/ActiveFilterChips";
import { UnifiedPropertyFilters } from "@/components/property/UnifiedPropertyFilters";
import { InteractivePropertyMap } from "@/components/property/InteractivePropertyMap";
import { BatchReviewMode } from "@/components/shared/BatchReviewMode";
import { formatCurrency } from "@/lib/utils";
import type { LeadStatus } from "@/components/lead/LeadStatusBadge";
import type { AdminProperty } from "@/hooks/useAdminProperties";
import { MapPin } from "lucide-react";

interface Props {
  admin: ReturnType<typeof import("@/hooks/useAdminProperties").useAdminProperties>;
  isMinimal: boolean;
  activeFilters: any[];
  searchSuggestions: any[];
  // Dialog triggers
  onAddProperty: (open: boolean) => void;
  isAddDialogOpen: boolean;
  formData: { address: string; city: string; state: string; zipCode: string; estimatedValue: string; cashOfferAmount: string; propertyImageUrl: string };
  setFormData: (d: any) => void;
  onSubmitAdd: (e: React.FormEvent) => void;
  onEditProperty: (p: AdminProperty) => void;
  onOfferProperty: (p: AdminProperty) => void;
  onCopyLink: (slug: string) => void;
  onQRCode: (slug: string) => void;
  onOpenNotes: (id: string) => void;
  onSetSelectedForImage: (id: string) => void;
  onSetSelectedForTags: (id: string) => void;
  onSetSelectedForApproval: (id: string) => void;
  onSetSelectedForAirbnb: (id: string) => void;
  onSetSelectedForComparison: (id: string) => void;
  onGenerateQRCodes: () => void;
  onBatchPrint: () => void;
  onStartCampaign: () => void;
  onAISuggestions: () => void;
  // Batch review
  isBatchReviewOpen: boolean;
  setIsBatchReviewOpen: (v: boolean) => void;
  onBatchApprove: (id: string) => Promise<void>;
  onBatchReject: (id: string, reason?: string) => Promise<void>;
  onViewAnalysis: (id: string) => void;
}

export const AdminPropertiesTab = ({
  admin, isMinimal, activeFilters, searchSuggestions,
  onAddProperty, isAddDialogOpen, formData, setFormData, onSubmitAdd,
  onEditProperty, onOfferProperty, onCopyLink, onQRCode, onOpenNotes,
  onSetSelectedForImage, onSetSelectedForTags, onSetSelectedForApproval,
  onSetSelectedForAirbnb, onSetSelectedForComparison,
  onGenerateQRCodes, onBatchPrint, onStartCampaign, onAISuggestions,
  isBatchReviewOpen, setIsBatchReviewOpen, onBatchApprove, onBatchReject, onViewAnalysis,
}: Props) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(true);

  return (
    <div className="space-y-6">
      <UnifiedPropertyFilters
        selectedStatus={admin.filters.filterStatus} onStatusChange={s => admin.updateFilter('filterStatus', s as LeadStatus | 'all')}
        statusCounts={admin.leadStatusCounts} approvalStatus={admin.filters.approvalStatus}
        onApprovalStatusChange={s => admin.updateFilter('approvalStatus', s)}
        approvalCounts={admin.statusCounts}
        onUserFilter={(uid, uname) => { admin.updateFilter('filterUserId', uid); admin.updateFilter('filterUserName', uname); }}
        currentUserId={admin.filters.filterUserId} currentUserName={admin.filters.filterUserName}
        selectedTags={admin.filters.selectedTags} onTagsChange={t => admin.updateFilter('selectedTags', t)}
        advancedFilters={admin.filters.advancedFilters} onAdvancedFiltersChange={f => admin.updateFilter('advancedFilters', f)}
        onClearAll={() => { admin.updateFilter('filterStatus', 'all'); admin.updateFilter('approvalStatus', 'all'); admin.updateFilter('filterUserId', null); admin.updateFilter('filterUserName', null); admin.updateFilter('selectedTags', []); admin.updateFilter('advancedFilters', {}); }}
      />
      <div className="max-w-2xl">
        <SmartPropertySearch value={admin.filters.searchQuery} onChange={q => admin.updateFilter('searchQuery', q)} onSearch={() => {}} suggestions={searchSuggestions} placeholder="Buscar por endereço, cidade, dono ou CEP..." />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Your Properties</h2>
          <Badge variant="secondary">{admin.filteredProperties.length} de {admin.properties.length}</Badge>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="h-8"><LayoutGrid className="w-4 h-4 mr-1" />Cards</Button>
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-8"><List className="w-4 h-4 mr-1" />Table</Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsBatchReviewOpen(true)} disabled={admin.filteredProperties.length === 0} className="h-8"><Rocket className="w-4 h-4 mr-1" />Batch Review</Button>
          <Button variant="outline" size="sm" onClick={() => setShowFiltersSidebar(!showFiltersSidebar)} className="h-8"><Settings className="w-4 h-4" /></Button>
          <AIPropertyImport onImportComplete={admin.fetchProperties} />
          <Dialog open={isAddDialogOpen} onOpenChange={onAddProperty}>
            <DialogTrigger asChild><Button className="bg-secondary hover:bg-secondary/90"><Plus className="w-4 h-4 mr-2" />Add Property</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Add New Property</DialogTitle><DialogDescription>Enter property details</DialogDescription></DialogHeader>
              <form onSubmit={onSubmitAdd} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Street Address *</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required /></div>
                  <div><Label>City *</Label><Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required /></div>
                  <div><Label>State *</Label><Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} maxLength={2} required /></div>
                  <div><Label>ZIP Code *</Label><Input value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} required /></div>
                  <div><Label>Estimated Value *</Label><Input type="number" value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: e.target.value})} required /></div>
                  <div><Label>Cash Offer *</Label><Input type="number" value={formData.cashOfferAmount} onChange={e => setFormData({...formData, cashOfferAmount: e.target.value})} required /></div>
                </div>
                <div><Label>Image URL (optional)</Label><Input type="url" value={formData.propertyImageUrl} onChange={e => setFormData({...formData, propertyImageUrl: e.target.value})} /></div>
                <Button type="submit" disabled={admin.isLoading} className="w-full">{admin.isLoading ? "Adding..." : "Add Property"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table" className="flex items-center gap-2"><List className="h-4 w-4" />Table</TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" />Kanban</TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2"><MapPin className="h-4 w-4" />Map</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          {admin.selectedProperties.length > 0 && (
            <BulkActionsBar selectedCount={admin.selectedProperties.length} selectedPropertyIds={admin.selectedProperties} onClearSelection={() => admin.setSelectedProperties([])} onBulkStatusChange={admin.handleBulkStatusChange} onBulkDelete={admin.handleBulkDelete} onGenerateQRCodes={onGenerateQRCodes} onPrintOffers={onBatchPrint} onStartCampaign={onStartCampaign} onAISuggestions={onAISuggestions} allApproved={admin.selectedProperties.every(id => admin.properties.find(p => p.id === id)?.approval_status === 'approved')} propertiesWithPreferredContacts={admin.selectedProperties.filter(id => { const p = admin.properties.find(x => x.id === id); return (p?.tags || []).some((t: string) => t.startsWith('pref_phone:') || t.startsWith('pref_email:')); }).length} />
          )}
          <KanbanBoard properties={admin.filteredProperties} onStatusChange={admin.updateLeadStatus} onPropertyClick={p => onEditProperty(p as AdminProperty)} selectedProperties={admin.selectedProperties} onSelectionChange={admin.togglePropertySelection} />
        </TabsContent>

        <TabsContent value="map">
          <InteractivePropertyMap properties={admin.filteredProperties} onPropertyClick={p => onEditProperty(p as AdminProperty)} onApprove={admin.handleMapApprove} onReject={admin.handleMapReject} />
        </TabsContent>

        <TabsContent value="table">
          <div className="flex gap-4">
            {showFiltersSidebar && (
              <QuickFiltersSidebar
                approvalStatus={admin.filters.approvalStatus} onApprovalStatusChange={s => admin.updateFilter('approvalStatus', s)}
                selectedTags={admin.filters.selectedTags} onTagsChange={t => admin.updateFilter('selectedTags', t)}
                priceRange={admin.filters.priceRange} onPriceRangeChange={r => admin.updateFilter('priceRange', r)}
                selectedCities={admin.filters.selectedCities} onCitiesChange={c => admin.updateFilter('selectedCities', c)}
                dateFilter={admin.filters.dateFilter} onDateFilterChange={d => admin.updateFilter('dateFilter', d)}
                statusCounts={admin.statusCounts}
                onUserFilter={(uid, uname) => { admin.updateFilter('filterUserId', uid); admin.updateFilter('filterUserName', uname); }}
                currentUserId={admin.filters.filterUserId} currentUserName={admin.filters.filterUserName}
                advancedFilters={admin.filters.advancedFilters} onAdvancedFiltersChange={f => admin.updateFilter('advancedFilters', f)}
                contactFilters={admin.filters.contactFilters} onContactFiltersChange={c => admin.updateFilter('contactFilters', c)}
                onClearAll={admin.clearAllFilters}
              />
            )}
            <div className="flex-1">
              <ActiveFilterChips filters={activeFilters} onClearAll={admin.clearAllFilters} />
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {admin.isLoadingProperties ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />) :
                   admin.filteredProperties.length === 0 ? <div className="col-span-full text-center text-muted-foreground py-8">No properties found</div> :
                   admin.filteredProperties.map(property => (
                    <AdaptivePropertyCard key={property.id} property={property} isSelected={admin.selectedProperties.includes(property.id)} onToggleSelect={() => admin.togglePropertySelection(property.id)} isMinimalDesign={isMinimal}
                      onAnalyze={() => onSetSelectedForComparison(property.id)} onApprove={() => onSetSelectedForApproval(property.id)} onReject={() => onSetSelectedForApproval(property.id)}
                      onUploadImage={() => onSetSelectedForImage(property.id)} onManageTags={() => onSetSelectedForTags(property.id)} onCheckAirbnb={() => onSetSelectedForAirbnb(property.id)}
                      onGenerateOffer={() => onOfferProperty(property)} onEdit={() => onEditProperty(property)}
                      onViewPage={() => window.open(`/property/${property.slug}`, '_blank')} onCopyLink={() => onCopyLink(property.slug)} onGenerateQR={() => onQRCode(property.slug)} onAddNotes={() => onOpenNotes(property.id)} />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"><Checkbox checked={admin.selectedProperties.length === admin.filteredProperties.length && admin.filteredProperties.length > 0} onCheckedChange={admin.toggleSelectAll} /></TableHead>
                        <TableHead>Image</TableHead><TableHead>Address</TableHead><TableHead>Owner</TableHead><TableHead>Phone</TableHead>
                        <TableHead>Cash Offer</TableHead><TableHead>Est. Value</TableHead><TableHead>Lead Status</TableHead>
                        <TableHead>Communication</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admin.filteredProperties.length === 0 ? (
                        <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No properties found</TableCell></TableRow>
                      ) : admin.filteredProperties.map(property => (
                        <TableRow key={property.id}>
                          <TableCell><Checkbox checked={admin.selectedProperties.includes(property.id)} onCheckedChange={() => admin.togglePropertySelection(property.id)} /></TableCell>
                          <TableCell><PropertyImageDisplay imageUrl={property.property_image_url || ""} address={property.address} className="w-20 h-20" /></TableCell>
                          <TableCell className="font-medium">{property.address}, {property.city}, {property.state}</TableCell>
                          <TableCell>{property.owner_name || '-'}</TableCell>
                          <TableCell>{property.owner_phone || '-'}</TableCell>
                          <TableCell>{formatCurrency(property.cash_offer_amount)}</TableCell>
                          <TableCell>{formatCurrency(property.estimated_value)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <LeadStatusBadge status={property.lead_status} />
                              <LeadStatusSelect value={property.lead_status} onValueChange={s => admin.updateLeadStatus(property.id, s)} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {['sms_sent','email_sent','letter_sent','card_sent','phone_call_made','meeting_scheduled'].map(field => (
                                <div key={field} className="flex items-center space-x-1">
                                  <Checkbox checked={(property as any)[field]} onCheckedChange={c => admin.updatePropertyCommunication(property.id, field, c as boolean)} />
                                  <Label className="text-xs cursor-pointer">{field.replace('_sent','').replace('_made','').replace('_scheduled','').replace('_',' ')}</Label>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">{property.status}</span></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="default" size="sm" onClick={() => onOfferProperty(property)}>Offer</Button>
                              <Button variant="outline" size="sm" onClick={() => onEditProperty(property)}>Edit</Button>
                              <Button variant="outline" size="sm" onClick={() => window.open(`/property/${property.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => onCopyLink(property.slug)}><Copy className="w-4 h-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => onQRCode(property.slug)}><QrCode className="w-4 h-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => onOpenNotes(property.id)}><FileText className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BatchReviewMode open={isBatchReviewOpen} onOpenChange={setIsBatchReviewOpen} properties={admin.filteredProperties}
        onApprove={onBatchApprove} onReject={onBatchReject} onViewAnalysis={onViewAnalysis}
      />
    </div>
  );
};
