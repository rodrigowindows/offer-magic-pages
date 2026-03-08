import { useState, useMemo } from "react";
import "@/styles/admin-overrides.css";
import { Badge } from "@/components/ui/badge";
import { ABTestAnalytics } from "@/components/ab-testing/ABTestAnalytics";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDesignMode } from "@/hooks/useDesignMode";
import { Plus, ExternalLink, Copy, QrCode, FileText, Settings, LayoutGrid, List, Rocket, BarChart3, Target, Search, MapPin, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { LeadStatusBadge } from "@/components/lead/LeadStatusBadge";
import { LeadStatusSelect } from "@/components/lead/LeadStatusSelect";
import { BulkActionsBar } from "@/components/shared/BulkActionsBar";
import { CashOfferDialog } from "@/components/offer/CashOfferDialog";
import { EmailCampaignDialog } from "@/components/campaign/EmailCampaignDialog";
import { EmailCampaignStats } from "@/components/campaign/EmailCampaignStats";
import { LeadSuggestionsDialog } from "@/components/lead/LeadSuggestionsDialog";
import { KanbanBoard } from "@/components/shared/KanbanBoard";
import { CampaignAnalytics } from "@/components/campaign/CampaignAnalytics";
import { CampaignExport } from "@/components/campaign/CampaignExport";
import { FollowUpManager } from "@/components/follow-up/FollowUpManager";
import { FeatureTogglePanel } from "@/components/ab-testing/FeatureTogglePanel";
import { ResponseTimeAnalytics } from "@/components/dashboard/ResponseTimeAnalytics";
import { CampaignTemplatesDialog } from "@/components/campaign/CampaignTemplatesDialog";
import { CampaignPreviewDialog } from "@/components/campaign/CampaignPreviewDialog";
import { AdminDashboardOverview } from "@/components/dashboard/AdminDashboardOverview";
import { BatchOfferPrintDialog } from "@/components/offer/BatchOfferPrintDialog";
import { ChannelAnalytics } from "@/components/dashboard/ChannelAnalytics";
import { SequenceManager } from "@/components/follow-up/SequenceManager";
import { StartSequenceDialog } from "@/components/follow-up/StartSequenceDialog";
import { PropertyImageUpload } from "@/components/property/PropertyImageUpload";
import { PropertyTagsManager } from "@/components/property/PropertyTagsManager";
import { PropertyApprovalDialog } from "@/components/property/PropertyApprovalDialog";
import { PropertyImageDisplay } from "@/components/property/PropertyImageDisplay";
import { AirbnbEligibilityChecker } from "@/components/shared/AirbnbEligibilityChecker";
import { PropertyComparison } from "@/components/property/PropertyComparison";
import { BulkImportDialog } from "@/components/import-data/BulkImportDialog";
import { GeminiAPIKeyDialog } from "@/components/shared/GeminiAPIKeyDialog";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { AdaptivePropertyCard } from "@/components/property/AdaptivePropertyCard";
import { AIPropertyImport } from "@/components/import-data/AIPropertyImport";
import { SmartPropertySearch } from "@/components/property/SmartPropertySearch";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { BatchReviewMode } from "@/components/shared/BatchReviewMode";
import { QuickFiltersSidebar } from "@/components/shared/QuickFiltersSidebar";
import { TeamActivityDashboard } from "@/components/dashboard/TeamActivityDashboard";
import { TeamReportExporter } from "@/components/dashboard/TeamReportExporter";
import { ReviewQueue } from "@/components/shared/ReviewQueue";
import { UnifiedPropertyFilters } from "@/components/property/UnifiedPropertyFilters";
import { InteractivePropertyMap } from "@/components/property/InteractivePropertyMap";
import { ActiveFilterChips } from "@/components/shared/ActiveFilterChips";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { formatCurrency } from "@/lib/utils";
import type { LeadStatus } from "@/components/lead/LeadStatusBadge";

// Extracted components
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PropertyEditDialog } from "@/components/admin/PropertyEditDialog";
import { PropertyNotesDialog } from "@/components/admin/PropertyNotesDialog";
import { useAdminProperties, type AdminProperty } from "@/hooks/useAdminProperties";

const propertySchema = z.object({
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(5).max(10),
  estimatedValue: z.number().positive(),
  cashOfferAmount: z.number().positive(),
  propertyImageUrl: z.string().url().optional().or(z.literal("")),
});

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMinimal, toggleDesignMode } = useDesignMode();

  // Use extracted hook for property management
  const admin = useAdminProperties();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyNotes, setPropertyNotes] = useState<PropertyNote[]>([]);
  const [editFormData, setEditFormData] = useState<Partial<AdminProperty>>({});
  const [formData, setFormData] = useState({ address: "", city: "Miami", state: "FL", zipCode: "", estimatedValue: "", cashOfferAmount: "", propertyImageUrl: "" });
  const [noteFormData, setNoteFormData] = useState({ noteText: "", followUpDate: "" });

  // More dialog states
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedPropertyForOffer, setSelectedPropertyForOffer] = useState<AdminProperty | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isMarketingSettingsOpen, setIsMarketingSettingsOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isBatchPrintDialogOpen, setIsBatchPrintDialogOpen] = useState(false);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isGeminiAPIKeyDialogOpen, setIsGeminiAPIKeyDialogOpen] = useState(false);

  // Property-specific dialog states
  const [selectedPropertyForImage, setSelectedPropertyForImage] = useState<string | null>(null);
  const [selectedPropertyForTags, setSelectedPropertyForTags] = useState<string | null>(null);
  const [selectedPropertyForApproval, setSelectedPropertyForApproval] = useState<string | null>(null);
  const [selectedPropertyForAirbnb, setSelectedPropertyForAirbnb] = useState<string | null>(null);
  const [selectedPropertyForComparison, setSelectedPropertyForComparison] = useState<string | null>(null);

  // UI states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isBatchReviewOpen, setIsBatchReviewOpen] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(true);

  // Auth check
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  useState(() => { checkAuth(); });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const openEditDialog = (property: AdminProperty) => {
    setSelectedPropertyId(property.id);
    setEditFormData(property);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProperty = async () => {
    if (!selectedPropertyId) return;
    admin.setIsLoading(true);
    try {
      const { error } = await supabase.from("properties").update({
        address: editFormData.address, city: editFormData.city, state: editFormData.state, zip_code: editFormData.zip_code,
        estimated_value: editFormData.estimated_value, cash_offer_amount: editFormData.cash_offer_amount,
        min_offer_amount: (editFormData as any).min_offer_amount || null, max_offer_amount: (editFormData as any).max_offer_amount || null,
        property_image_url: editFormData.property_image_url, owner_address: editFormData.owner_address,
        owner_name: editFormData.owner_name, owner_phone: editFormData.owner_phone, answer_flag: editFormData.answer_flag,
        dnc_flag: editFormData.dnc_flag, neighborhood: editFormData.neighborhood, origem: editFormData.origem,
        carta: editFormData.carta, zillow_url: editFormData.zillow_url, evaluation: editFormData.evaluation,
        focar: editFormData.focar, comparative_price: editFormData.comparative_price,
      } as any).eq("id", selectedPropertyId);
      if (error) throw error;
      toast({ title: "Success", description: "Property updated" });
      setIsEditDialogOpen(false);
      admin.fetchProperties();
    } catch { toast({ title: "Error", description: "Failed to update", variant: "destructive" }); }
    finally { admin.setIsLoading(false); }
  };

  const generateSlug = (addr: string) => addr.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    admin.setIsLoading(true);
    try {
      const validated = propertySchema.parse({
        address: formData.address, city: formData.city, state: formData.state, zipCode: formData.zipCode,
        estimatedValue: parseFloat(formData.estimatedValue), cashOfferAmount: parseFloat(formData.cashOfferAmount),
        propertyImageUrl: formData.propertyImageUrl,
      });
      const { error } = await supabase.from("properties").insert({
        slug: generateSlug(validated.address), address: validated.address, city: validated.city, state: validated.state,
        zip_code: validated.zipCode, estimated_value: validated.estimatedValue, cash_offer_amount: validated.cashOfferAmount,
        property_image_url: validated.propertyImageUrl || null,
      });
      if (error) throw error;
      toast({ title: "Success!", description: "Property added" });
      setIsAddDialogOpen(false);
      setFormData({ address: "", city: "Miami", state: "FL", zipCode: "", estimatedValue: "", cashOfferAmount: "", propertyImageUrl: "" });
      admin.fetchProperties();
    } catch (error) {
      if (error instanceof z.ZodError) toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
    } finally { admin.setIsLoading(false); }
  };

  const copyPropertyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/property/${slug}`);
    toast({ title: "Copied!" });
  };

  const openQRGenerator = (slug: string) => {
    const url = encodeURIComponent(`${window.location.origin}/property/${slug}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  const openNotesDialog = async (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsNotesDialogOpen(true);
    const { data } = await supabase.from("property_notes").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setPropertyNotes(data || []);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !noteFormData.noteText.trim()) return;
    admin.setIsLoading(true);
    const { error } = await supabase.from("property_notes").insert({
      property_id: selectedPropertyId, note_text: noteFormData.noteText, follow_up_date: noteFormData.followUpDate || null,
    });
    if (!error) {
      toast({ title: "Note added" });
      setNoteFormData({ noteText: "", followUpDate: "" });
      const { data } = await supabase.from("property_notes").select("*").eq("property_id", selectedPropertyId).order("created_at", { ascending: false });
      setPropertyNotes(data || []);
    }
    admin.setIsLoading(false);
  };

  const handleGenerateQRCodes = () => {
    const selectedProps = admin.properties.filter(p => admin.selectedProperties.includes(p.id));
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>QR Codes</title><style>body{font-family:Arial;padding:20px}.qr-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px}.qr-item{border:2px solid #ddd;padding:15px;text-align:center;break-inside:avoid}.qr-item img{max-width:100%}@media print{.qr-container{grid-template-columns:repeat(2,1fr)}}</style></head><body><h1>QR Codes for ${selectedProps.length} Properties</h1><button onclick="window.print()">Print</button><div class="qr-container">${selectedProps.map(p => {
        const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/property/${p.slug}`)}`;
        return `<div class="qr-item"><img src="${qr}"/><h3>${p.address}</h3><p>${p.city}, ${p.state} ${p.zip_code}</p><p><strong>Cash Offer:</strong> ${formatCurrency(p.cash_offer_amount)}</p></div>`;
      }).join('')}</div></body></html>`);
      printWindow.document.close();
    }
  };

  const handleStartApprovedCampaign = () => {
    const approvedIds = admin.properties.filter(p => p.approval_status === 'approved').map(p => p.id);
    if (approvedIds.length === 0) { toast({ title: "No Approved Properties", variant: "destructive" }); return; }
    admin.setSelectedProperties(approvedIds);
    setIsCampaignDialogOpen(true);
  };

  // Active filter chips
  const activeFilters = useMemo(() => {
    const chips: any[] = [];
    const f = admin.filters;
    if (f.searchQuery.trim()) chips.push({ id: 'search', label: 'Search', value: f.searchQuery, onRemove: () => admin.updateFilter('searchQuery', '') });
    if (f.approvalStatus !== 'all') chips.push({ id: 'approval', label: 'Approval', value: f.approvalStatus, onRemove: () => admin.updateFilter('approvalStatus', 'all') });
    if (f.filterStatus !== 'all') chips.push({ id: 'status', label: 'Lead Status', value: f.filterStatus, onRemove: () => admin.updateFilter('filterStatus', 'all') });
    if (f.filterUserName) chips.push({ id: 'user', label: 'Approved by', value: f.filterUserName, onRemove: () => { admin.updateFilter('filterUserId', null); admin.updateFilter('filterUserName', null); } });
    f.selectedTags.forEach((tag, i) => chips.push({ id: `tag-${i}`, label: 'Tag', value: tag, onRemove: () => admin.updateFilter('selectedTags', f.selectedTags.filter(t => t !== tag)) }));
    f.selectedCities.forEach((city, i) => chips.push({ id: `city-${i}`, label: 'City', value: city, onRemove: () => admin.updateFilter('selectedCities', f.selectedCities.filter(c => c !== city)) }));
    if (f.priceRange[0] > 0 || f.priceRange[1] < 1000000) chips.push({ id: 'price', label: 'Price', value: `$${(f.priceRange[0]/1000).toFixed(0)}k - $${(f.priceRange[1]/1000).toFixed(0)}k`, onRemove: () => admin.updateFilter('priceRange', [0, 1000000] as [number, number]) });
    if (f.dateFilter !== 'all') chips.push({ id: 'date', label: 'Date', value: { '7days': 'Last 7 days', '30days': 'Last 30 days', '90days': 'Last 90 days' }[f.dateFilter] || f.dateFilter, onRemove: () => admin.updateFilter('dateFilter', 'all') });
    return chips;
  }, [admin.filters, admin.updateFilter]);

  const headerTitle = useMemo(() => {
    const batches = admin.filters.advancedFilters.importBatch;
    if (batches?.length) return batches.length === 1 ? batches[0] : `${batches.length} Batches`;
    const unique = [...new Set(admin.properties.map(p => p.import_batch).filter(Boolean))];
    if (unique.length === 1) return unique[0]!;
    if (unique.length > 1) return `${unique.length} Batches`;
    return "Properties";
  }, [admin.properties, admin.filters.advancedFilters.importBatch]);

  const searchSuggestions = useMemo(() =>
    Array.from(new Set([
      ...admin.properties.map(p => ({ type: 'address' as const, value: p.address })),
      ...admin.properties.map(p => ({ type: 'city' as const, value: p.city })),
      ...admin.properties.filter(p => p.owner_name).map(p => ({ type: 'owner' as const, value: p.owner_name! })),
      ...admin.properties.map(p => ({ type: 'zip' as const, value: p.zip_code })),
    ].filter(s => s.value))).map(s => ({ ...s, icon: Search })),
  [admin.properties]);

  return (
    <>
      <MainNavigation />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader
          title={headerTitle}
          totalCount={admin.properties.length}
          isMinimal={isMinimal}
          onToggleDesignMode={toggleDesignMode}
          onLogout={handleLogout}
          onBulkImport={() => setIsBulkImportDialogOpen(true)}
          onGeminiSettings={() => setIsGeminiAPIKeyDialogOpen(true)}
          onMarketingSettings={() => setIsMarketingSettingsOpen(true)}
          exportFilters={{
            userId: admin.filters.filterUserId || undefined,
            tags: admin.filters.selectedTags,
            searchQuery: admin.filters.searchQuery,
            batch: admin.filters.advancedFilters.importBatch?.length === 1 ? admin.filters.advancedFilters.importBatch[0] : undefined,
          }}
        />

        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-4 sm:mb-6 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs sm:text-sm"><BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Dash</span></TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-1 text-xs sm:text-sm"><Target className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Review Queue</span><span className="sm:hidden">Review</span></TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center gap-1 text-xs sm:text-sm"><List className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Properties</span><span className="sm:hidden">Props</span></TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-1 text-xs sm:text-sm"><Rocket className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Campaigns</span><span className="sm:hidden">Camp</span></TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs sm:text-sm"><BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Analytics</span><span className="sm:hidden">Stats</span></TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-1 text-xs sm:text-sm"><Zap className="h-3 w-3 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Feature Toggles</span><span className="sm:hidden">Toggles</span></TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <MetricsDashboard properties={admin.properties} />
              <DashboardQuickActions
                onStartReview={() => { const t = document.querySelector('[value="review"]') as HTMLElement; t?.click(); }}
                onAddProperty={() => setIsAddDialogOpen(true)}
                onExportData={() => {}}
                onStartCampaign={() => setIsCampaignDialogOpen(true)}
                onStartApprovedCampaign={handleStartApprovedCampaign}
                pendingCount={admin.statusCounts.pending}
              />
              <AdminDashboardOverview />
              <TeamActivityDashboard />
              <div className="max-w-md"><TeamReportExporter /></div>
              <FollowUpManager />
            </TabsContent>

            {/* Review Queue Tab */}
            <TabsContent value="review" className="space-y-6"><ReviewQueue /></TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-6">
              <UnifiedPropertyFilters
                selectedStatus={admin.filters.filterStatus}
                onStatusChange={s => admin.updateFilter('filterStatus', s as LeadStatus | 'all')}
                statusCounts={admin.leadStatusCounts}
                approvalStatus={admin.filters.approvalStatus}
                onApprovalStatusChange={s => admin.updateFilter('approvalStatus', s)}
                approvalCounts={admin.statusCounts}
                onUserFilter={(uid, uname) => { admin.updateFilter('filterUserId', uid); admin.updateFilter('filterUserName', uname); }}
                currentUserId={admin.filters.filterUserId}
                currentUserName={admin.filters.filterUserName}
                selectedTags={admin.filters.selectedTags}
                onTagsChange={t => admin.updateFilter('selectedTags', t)}
                advancedFilters={admin.filters.advancedFilters}
                onAdvancedFiltersChange={f => admin.updateFilter('advancedFilters', f)}
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
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-secondary hover:bg-secondary/90"><Plus className="w-4 h-4 mr-2" />Add Property</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>Add New Property</DialogTitle><DialogDescription>Enter property details</DialogDescription></DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
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
                    <BulkActionsBar selectedCount={admin.selectedProperties.length} onClearSelection={() => admin.setSelectedProperties([])} onBulkStatusChange={admin.handleBulkStatusChange} onBulkDelete={admin.handleBulkDelete} onGenerateQRCodes={handleGenerateQRCodes} onPrintOffers={() => setIsBatchPrintDialogOpen(true)} onStartCampaign={() => setIsCampaignDialogOpen(true)} onAISuggestions={() => setIsSuggestionsDialogOpen(true)} allApproved={admin.selectedProperties.every(id => admin.properties.find(p => p.id === id)?.approval_status === 'approved')} propertiesWithPreferredContacts={admin.selectedProperties.filter(id => { const p = admin.properties.find(x => x.id === id); return (p?.tags || []).some((t: string) => t.startsWith('pref_phone:') || t.startsWith('pref_email:')); }).length} />
                  )}
                  <KanbanBoard properties={admin.filteredProperties} onStatusChange={admin.updateLeadStatus} onPropertyClick={p => openEditDialog(p as AdminProperty)} selectedProperties={admin.selectedProperties} onSelectionChange={admin.togglePropertySelection} />
                </TabsContent>

                <TabsContent value="map">
                  <InteractivePropertyMap properties={admin.filteredProperties} onPropertyClick={p => openEditDialog(p as AdminProperty)} onApprove={admin.handleMapApprove} onReject={admin.handleMapReject} />
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
                              onAnalyze={() => setSelectedPropertyForComparison(property.id)} onApprove={() => setSelectedPropertyForApproval(property.id)} onReject={() => setSelectedPropertyForApproval(property.id)}
                              onUploadImage={() => setSelectedPropertyForImage(property.id)} onManageTags={() => setSelectedPropertyForTags(property.id)} onCheckAirbnb={() => setSelectedPropertyForAirbnb(property.id)}
                              onGenerateOffer={() => { setSelectedPropertyForOffer(property); setIsOfferDialogOpen(true); }} onEdit={() => openEditDialog(property)}
                              onViewPage={() => window.open(`/property/${property.slug}`, '_blank')} onCopyLink={() => copyPropertyLink(property.slug)} onGenerateQR={() => openQRGenerator(property.slug)} onAddNotes={() => openNotesDialog(property.id)} />
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
                                      {['sms_sent', 'email_sent', 'letter_sent', 'card_sent', 'phone_call_made', 'meeting_scheduled'].map(field => (
                                        <div key={field} className="flex items-center space-x-1">
                                          <Checkbox checked={(property as any)[field]} onCheckedChange={c => admin.updatePropertyCommunication(property.id, field, c as boolean)} />
                                          <Label className="text-xs cursor-pointer">{field.replace('_sent', '').replace('_made', '').replace('_scheduled', '').replace('_', ' ')}</Label>
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">{property.status}</span></TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="default" size="sm" onClick={() => { setSelectedPropertyForOffer(property); setIsOfferDialogOpen(true); }}>Offer</Button>
                                      <Button variant="outline" size="sm" onClick={() => openEditDialog(property)}>Edit</Button>
                                      <Button variant="outline" size="sm" onClick={() => window.open(`/property/${property.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="sm" onClick={() => copyPropertyLink(property.slug)}><Copy className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="sm" onClick={() => openQRGenerator(property.slug)}><QrCode className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="sm" onClick={() => openNotesDialog(property.id)}><FileText className="w-4 h-4" /></Button>
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
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Campaign Management</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsTemplatesDialogOpen(true)}><FileText className="h-4 w-4 mr-2" />Templates</Button>
                  <CampaignExport />
                </div>
              </div>
              <SequenceManager />
              <div className="bg-card rounded-lg border border-border p-6 space-y-6"><ResponseTimeAnalytics /><CampaignAnalytics /></div>
              <div><h3 className="text-xl font-semibold mb-4">Email Campaigns</h3><EmailCampaignStats /></div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div><h2 className="text-2xl font-semibold mb-4">Campaign Performance</h2><p className="text-muted-foreground">Campaign metrics dashboard is being updated.</p></div>
              <ChannelAnalytics />
              <div><h2 className="text-2xl font-semibold mb-4">A/B Test Results</h2><div className="bg-card rounded-lg border border-border p-6"><ABTestAnalytics /></div></div>
            </TabsContent>

            <TabsContent value="features"><FeatureTogglePanel /></TabsContent>
          </Tabs>

          {/* Dialogs */}
          <PropertyNotesDialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen} propertyId={selectedPropertyId} notes={propertyNotes} noteFormData={noteFormData} onNoteFormChange={setNoteFormData} onSubmit={handleNoteSubmit} isLoading={admin.isLoading} />
          <PropertyEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} editFormData={editFormData} onEditFormChange={setEditFormData} onSave={handleUpdateProperty} isLoading={admin.isLoading} />
          <CashOfferDialog property={selectedPropertyForOffer} open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen} />
          <EmailCampaignDialog properties={admin.properties.filter(p => admin.selectedProperties.includes(p.id))} open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} onOpenSettings={() => setIsMarketingSettingsOpen(true)} onSuccess={() => { admin.fetchProperties(); admin.setSelectedProperties([]); }} />
          <LeadSuggestionsDialog open={isSuggestionsDialogOpen} onOpenChange={setIsSuggestionsDialogOpen} propertyIds={admin.selectedProperties} onRefresh={admin.fetchProperties} />
          <CampaignTemplatesDialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen} />
          <CampaignPreviewDialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen} propertyIds={admin.selectedProperties} onConfirm={() => setIsCampaignDialogOpen(true)} />
          <BatchOfferPrintDialog properties={admin.properties.filter(p => admin.selectedProperties.includes(p.id))} open={isBatchPrintDialogOpen} onOpenChange={setIsBatchPrintDialogOpen} />
          <StartSequenceDialog open={isSequenceDialogOpen} onOpenChange={setIsSequenceDialogOpen} selectedProperties={admin.properties.filter(p => admin.selectedProperties.includes(p.id)).map(p => ({ id: p.id, address: p.address, city: p.city }))} />

          {/* Property-specific dialogs */}
          {selectedPropertyForImage && (() => { const p = admin.properties.find(x => x.id === selectedPropertyForImage); return p ? <Dialog open onOpenChange={o => !o && setSelectedPropertyForImage(null)}><DialogContent><DialogHeader><DialogTitle>Upload Image</DialogTitle></DialogHeader><PropertyImageUpload propertyId={p.id} propertySlug={p.slug} currentImageUrl={p.property_image_url} onImageUploaded={() => { admin.fetchProperties(); setSelectedPropertyForImage(null); }} /></DialogContent></Dialog> : null; })()}
          {selectedPropertyForTags && (() => { const p = admin.properties.find(x => x.id === selectedPropertyForTags); return p ? <Dialog open onOpenChange={o => !o && setSelectedPropertyForTags(null)}><DialogContent className="sm:max-w-[600px]"><DialogHeader><DialogTitle>Manage Tags</DialogTitle></DialogHeader><PropertyTagsManager propertyId={p.id} currentTags={(p as any).tags || []} onTagsUpdated={() => { admin.fetchProperties(); setSelectedPropertyForTags(null); }} /></DialogContent></Dialog> : null; })()}
          {(() => { const p = selectedPropertyForApproval ? admin.properties.find(x => x.id === selectedPropertyForApproval) : null; return <PropertyApprovalDialog propertyId={selectedPropertyForApproval || ""} propertyAddress={p?.address || ""} currentStatus={p?.approval_status || "pending"} open={!!selectedPropertyForApproval} onOpenChange={o => { if (!o) setSelectedPropertyForApproval(null); }} onStatusChange={() => { admin.fetchProperties(); setSelectedPropertyForApproval(null); }} />; })()}
          {(() => { const p = selectedPropertyForAirbnb ? admin.properties.find(x => x.id === selectedPropertyForAirbnb) : null; return <AirbnbEligibilityChecker propertyId={selectedPropertyForAirbnb || ""} propertyAddress={p?.address || ""} city={p?.city || ""} state={p?.state || ""} currentEligible={p?.airbnb_eligible} currentRegulations={p?.airbnb_regulations} currentNotes={p?.airbnb_notes} lastCheckDate={p?.airbnb_check_date} open={!!selectedPropertyForAirbnb} onOpenChange={o => { if (!o) setSelectedPropertyForAirbnb(null); }} onCheckComplete={() => { admin.fetchProperties(); setSelectedPropertyForAirbnb(null); }} />; })()}
          {selectedPropertyForComparison && (() => { const p = admin.properties.find(x => x.id === selectedPropertyForComparison); return p ? <PropertyComparison propertyId={p.id} address={p.address} city={p.city} state={p.state} zipCode={p.zip_code} estimatedValue={p.estimated_value} cashOfferAmount={p.cash_offer_amount} onClose={() => setSelectedPropertyForComparison(null)} /> : null; })()}

          <BulkImportDialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen} onImportComplete={admin.fetchProperties} />
          <GeminiAPIKeyDialog open={isGeminiAPIKeyDialogOpen} onOpenChange={setIsGeminiAPIKeyDialogOpen} />

          <BatchReviewMode open={isBatchReviewOpen} onOpenChange={setIsBatchReviewOpen} properties={admin.filteredProperties}
            onApprove={async (id: string) => { await supabase.from('properties').update({ approval_status: 'approved', approved_by: admin.userId, approved_by_name: admin.userName, approved_at: new Date().toISOString() } as any).eq('id', id); admin.fetchProperties(); }}
            onReject={async (id: string, reason?: string) => { await supabase.from('properties').update({ approval_status: 'rejected', rejection_reason: reason || null, approved_by: admin.userId, approved_by_name: admin.userName, approved_at: new Date().toISOString() } as any).eq('id', id); admin.fetchProperties(); }}
            onViewAnalysis={id => setSelectedPropertyForComparison(id)}
          />
        </main>

        <BulkActionsBar
          selectedCount={admin.selectedProperties.length} onClearSelection={() => admin.setSelectedProperties([])}
          onBulkStatusChange={admin.handleBulkStatusChange} onBulkDelete={admin.handleBulkDelete} onGenerateQRCodes={handleGenerateQRCodes}
          onPrintOffers={() => setIsBatchPrintDialogOpen(true)} onStartCampaign={() => setIsCampaignDialogOpen(true)}
          onAISuggestions={() => setIsSuggestionsDialogOpen(true)} onStartSequence={() => setIsSequenceDialogOpen(true)}
          allApproved={admin.selectedProperties.every(id => admin.properties.find(p => p.id === id)?.approval_status === 'approved')}
          propertiesWithPreferredContacts={admin.selectedProperties.filter(id => { const p = admin.properties.find(x => x.id === id); return (p?.tags || []).some((t: string) => t.startsWith('pref_phone:') || t.startsWith('pref_email:')); }).length}
        />
      </div>
    </>
  );
};

export default Admin;
