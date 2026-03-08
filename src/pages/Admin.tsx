import { useMemo } from "react";
import "@/styles/admin-overrides.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDesignMode } from "@/hooks/useDesignMode";
import { BarChart3, Target, List, Rocket, Zap, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { BulkActionsBar } from "@/components/shared/BulkActionsBar";
import { FeatureTogglePanel } from "@/components/ab-testing/FeatureTogglePanel";
import { MainNavigation } from "@/components/shared/MainNavigation";
import { ReviewQueue } from "@/components/shared/ReviewQueue";
import { formatCurrency } from "@/lib/utils";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDialogsContainer } from "@/components/admin/AdminDialogsContainer";
import { useAdminProperties, type AdminProperty } from "@/hooks/useAdminProperties";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { AdminDashboardTab } from "@/components/admin/tabs/AdminDashboardTab";
import { AdminCampaignsTab } from "@/components/admin/tabs/AdminCampaignsTab";
import { AdminAnalyticsTab } from "@/components/admin/tabs/AdminAnalyticsTab";
import { AdminPropertiesTab } from "@/components/admin/tabs/AdminPropertiesTab";

import { useState } from "react";

const propertySchema = z.object({
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(5).max(10),
  estimatedValue: z.number().positive(),
  cashOfferAmount: z.number().positive(),
  propertyImageUrl: z.string().url().optional().or(z.literal("")),
});

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMinimal, toggleDesignMode } = useDesignMode();
  const admin = useAdminProperties();
  const dialogs = useAdminDialogs();

  useState(() => { supabase.auth.getSession().then(({ data: { session } }) => { if (!session) navigate("/auth"); }); });

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  const openEditDialog = (property: AdminProperty) => {
    dialogs.setSelectedPropertyId(property.id);
    dialogs.setEditFormData(property);
    dialogs.setIsEditDialogOpen(true);
  };

  const handleUpdateProperty = async () => {
    if (!dialogs.selectedPropertyId) return;
    admin.setIsLoading(true);
    try {
      const { error } = await supabase.from("properties").update({
        address: dialogs.editFormData.address, city: dialogs.editFormData.city, state: dialogs.editFormData.state, zip_code: dialogs.editFormData.zip_code,
        estimated_value: dialogs.editFormData.estimated_value, cash_offer_amount: dialogs.editFormData.cash_offer_amount,
        property_image_url: dialogs.editFormData.property_image_url, owner_address: dialogs.editFormData.owner_address,
        owner_name: dialogs.editFormData.owner_name, owner_phone: dialogs.editFormData.owner_phone, answer_flag: dialogs.editFormData.answer_flag,
        dnc_flag: dialogs.editFormData.dnc_flag, neighborhood: dialogs.editFormData.neighborhood, origem: dialogs.editFormData.origem,
        carta: dialogs.editFormData.carta, zillow_url: dialogs.editFormData.zillow_url, evaluation: dialogs.editFormData.evaluation,
        focar: dialogs.editFormData.focar, comparative_price: dialogs.editFormData.comparative_price,
      } as any).eq("id", dialogs.selectedPropertyId);
      if (error) throw error;
      toast({ title: "Success", description: "Property updated" });
      dialogs.setIsEditDialogOpen(false);
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
        address: dialogs.formData.address, city: dialogs.formData.city, state: dialogs.formData.state, zipCode: dialogs.formData.zipCode,
        estimatedValue: parseFloat(dialogs.formData.estimatedValue), cashOfferAmount: parseFloat(dialogs.formData.cashOfferAmount),
        propertyImageUrl: dialogs.formData.propertyImageUrl,
      });
      const { error } = await supabase.from("properties").insert({
        slug: generateSlug(validated.address), address: validated.address, city: validated.city, state: validated.state,
        zip_code: validated.zipCode, estimated_value: validated.estimatedValue, cash_offer_amount: validated.cashOfferAmount,
        property_image_url: validated.propertyImageUrl || null,
      });
      if (error) throw error;
      toast({ title: "Success!", description: "Property added" });
      dialogs.setIsAddDialogOpen(false);
      dialogs.setFormData({ address: "", city: "Miami", state: "FL", zipCode: "", estimatedValue: "", cashOfferAmount: "", propertyImageUrl: "" });
      admin.fetchProperties();
    } catch (error) {
      if (error instanceof z.ZodError) toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
    } finally { admin.setIsLoading(false); }
  };

  const copyPropertyLink = (slug: string) => { navigator.clipboard.writeText(`${window.location.origin}/property/${slug}`); toast({ title: "Copied!" }); };
  const openQRGenerator = (slug: string) => { window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/property/${slug}`)}`, '_blank'); };

  const openNotesDialog = async (propertyId: string) => {
    dialogs.setSelectedPropertyId(propertyId); dialogs.setIsNotesDialogOpen(true);
    const { data } = await supabase.from("property_notes").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    dialogs.setPropertyNotes(data || []);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogs.selectedPropertyId || !dialogs.noteFormData.noteText.trim()) return;
    admin.setIsLoading(true);
    const { error } = await supabase.from("property_notes").insert({ property_id: dialogs.selectedPropertyId, note_text: dialogs.noteFormData.noteText, follow_up_date: dialogs.noteFormData.followUpDate || null });
    if (!error) { toast({ title: "Note added" }); dialogs.setNoteFormData({ noteText: "", followUpDate: "" }); const { data } = await supabase.from("property_notes").select("*").eq("property_id", dialogs.selectedPropertyId!).order("created_at", { ascending: false }); dialogs.setPropertyNotes(data || []); }
    admin.setIsLoading(false);
  };

  const handleGenerateQRCodes = () => {
    const selectedProps = admin.properties.filter(p => admin.selectedProperties.includes(p.id));
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>QR Codes</title><style>body{font-family:Arial;padding:20px}.qr-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px}.qr-item{border:2px solid #ddd;padding:15px;text-align:center;break-inside:avoid}@media print{.qr-container{grid-template-columns:repeat(2,1fr)}}</style></head><body><h1>QR Codes</h1><button onclick="window.print()">Print</button><div class="qr-container">${selectedProps.map(p => `<div class="qr-item"><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/property/${p.slug}`)}"/><h3>${p.address}</h3><p>${p.city}, ${p.state} ${p.zip_code}</p><p><strong>Cash Offer:</strong> ${formatCurrency(p.cash_offer_amount)}</p></div>`).join('')}</div></body></html>`);
      printWindow.document.close();
    }
  };

  const handleStartApprovedCampaign = () => {
    const approvedIds = admin.properties.filter(p => p.approval_status === 'approved').map(p => p.id);
    if (approvedIds.length === 0) { toast({ title: "No Approved Properties", variant: "destructive" }); return; }
    admin.setSelectedProperties(approvedIds); dialogs.setIsCampaignDialogOpen(true);
  };

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
          title={headerTitle} totalCount={admin.properties.length} isMinimal={isMinimal}
          onToggleDesignMode={toggleDesignMode} onLogout={handleLogout}
          onBulkImport={() => dialogs.setIsBulkImportDialogOpen(true)} onGeminiSettings={() => dialogs.setIsGeminiAPIKeyDialogOpen(true)}
          onMarketingSettings={() => dialogs.setIsMarketingSettingsOpen(true)}
          exportFilters={{ userId: admin.filters.filterUserId || undefined, tags: admin.filters.selectedTags, searchQuery: admin.filters.searchQuery, batch: admin.filters.advancedFilters.importBatch?.length === 1 ? admin.filters.advancedFilters.importBatch[0] : undefined }}
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

            <TabsContent value="dashboard">
              <AdminDashboardTab
                properties={admin.properties} pendingCount={admin.statusCounts.pending}
                onStartReview={() => { (document.querySelector('[value="review"]') as HTMLElement)?.click(); }}
                onAddProperty={() => dialogs.setIsAddDialogOpen(true)}
                onStartCampaign={() => dialogs.setIsCampaignDialogOpen(true)}
                onStartApprovedCampaign={handleStartApprovedCampaign}
              />
            </TabsContent>

            <TabsContent value="review" className="space-y-6"><ReviewQueue /></TabsContent>

            <TabsContent value="properties">
              <AdminPropertiesTab
                admin={admin} isMinimal={isMinimal} activeFilters={activeFilters} searchSuggestions={searchSuggestions}
                onAddProperty={dialogs.setIsAddDialogOpen} isAddDialogOpen={dialogs.isAddDialogOpen}
                formData={dialogs.formData} setFormData={dialogs.setFormData} onSubmitAdd={handleSubmit}
                onEditProperty={openEditDialog}
                onOfferProperty={(p) => { dialogs.setSelectedPropertyForOffer(p); dialogs.setIsOfferDialogOpen(true); }}
                onCopyLink={copyPropertyLink} onQRCode={openQRGenerator} onOpenNotes={openNotesDialog}
                onSetSelectedForImage={dialogs.setSelectedPropertyForImage}
                onSetSelectedForTags={dialogs.setSelectedPropertyForTags}
                onSetSelectedForApproval={dialogs.setSelectedPropertyForApproval}
                onSetSelectedForAirbnb={dialogs.setSelectedPropertyForAirbnb}
                onSetSelectedForComparison={dialogs.setSelectedPropertyForComparison}
                onGenerateQRCodes={handleGenerateQRCodes}
                onBatchPrint={() => dialogs.setIsBatchPrintDialogOpen(true)}
                onStartCampaign={() => dialogs.setIsCampaignDialogOpen(true)}
                onAISuggestions={() => dialogs.setIsSuggestionsDialogOpen(true)}
                isBatchReviewOpen={dialogs.isBatchReviewOpen} setIsBatchReviewOpen={dialogs.setIsBatchReviewOpen}
                onBatchApprove={async (id: string) => { await supabase.from('properties').update({ approval_status: 'approved', approved_by: admin.userId, approved_by_name: admin.userName, approved_at: new Date().toISOString() } as any).eq('id', id); admin.fetchProperties(); }}
                onBatchReject={async (id: string, reason?: string) => { await supabase.from('properties').update({ approval_status: 'rejected', rejection_reason: reason || null, approved_by: admin.userId, approved_by_name: admin.userName, approved_at: new Date().toISOString() } as any).eq('id', id); admin.fetchProperties(); }}
                onViewAnalysis={id => dialogs.setSelectedPropertyForComparison(id)}
              />
            </TabsContent>

            <TabsContent value="campaigns">
              <AdminCampaignsTab onOpenTemplates={() => dialogs.setIsTemplatesDialogOpen(true)} />
            </TabsContent>

            <TabsContent value="analytics"><AdminAnalyticsTab /></TabsContent>
            <TabsContent value="features"><FeatureTogglePanel /></TabsContent>
          </Tabs>

          <AdminDialogsContainer
            properties={admin.properties} selectedProperties={admin.selectedProperties}
            setSelectedProperties={admin.setSelectedProperties} fetchProperties={admin.fetchProperties} isLoading={admin.isLoading}
            isNotesDialogOpen={dialogs.isNotesDialogOpen} setIsNotesDialogOpen={dialogs.setIsNotesDialogOpen}
            selectedPropertyId={dialogs.selectedPropertyId} propertyNotes={dialogs.propertyNotes}
            noteFormData={dialogs.noteFormData} setNoteFormData={dialogs.setNoteFormData} onNoteSubmit={handleNoteSubmit}
            isEditDialogOpen={dialogs.isEditDialogOpen} setIsEditDialogOpen={dialogs.setIsEditDialogOpen}
            editFormData={dialogs.editFormData} setEditFormData={dialogs.setEditFormData} onSaveEdit={handleUpdateProperty}
            isOfferDialogOpen={dialogs.isOfferDialogOpen} setIsOfferDialogOpen={dialogs.setIsOfferDialogOpen} selectedPropertyForOffer={dialogs.selectedPropertyForOffer}
            isEmailDialogOpen={dialogs.isEmailDialogOpen} setIsEmailDialogOpen={dialogs.setIsEmailDialogOpen}
            isSuggestionsDialogOpen={dialogs.isSuggestionsDialogOpen} setIsSuggestionsDialogOpen={dialogs.setIsSuggestionsDialogOpen}
            isMarketingSettingsOpen={dialogs.isMarketingSettingsOpen} setIsMarketingSettingsOpen={dialogs.setIsMarketingSettingsOpen}
            isCampaignDialogOpen={dialogs.isCampaignDialogOpen} setIsCampaignDialogOpen={dialogs.setIsCampaignDialogOpen}
            isTemplatesDialogOpen={dialogs.isTemplatesDialogOpen} setIsTemplatesDialogOpen={dialogs.setIsTemplatesDialogOpen}
            isPreviewDialogOpen={dialogs.isPreviewDialogOpen} setIsPreviewDialogOpen={dialogs.setIsPreviewDialogOpen}
            isBatchPrintDialogOpen={dialogs.isBatchPrintDialogOpen} setIsBatchPrintDialogOpen={dialogs.setIsBatchPrintDialogOpen}
            isSequenceDialogOpen={dialogs.isSequenceDialogOpen} setIsSequenceDialogOpen={dialogs.setIsSequenceDialogOpen}
            selectedPropertyForImage={dialogs.selectedPropertyForImage} setSelectedPropertyForImage={dialogs.setSelectedPropertyForImage}
            selectedPropertyForTags={dialogs.selectedPropertyForTags} setSelectedPropertyForTags={dialogs.setSelectedPropertyForTags}
            selectedPropertyForApproval={dialogs.selectedPropertyForApproval} setSelectedPropertyForApproval={dialogs.setSelectedPropertyForApproval}
            selectedPropertyForAirbnb={dialogs.selectedPropertyForAirbnb} setSelectedPropertyForAirbnb={dialogs.setSelectedPropertyForAirbnb}
            selectedPropertyForComparison={dialogs.selectedPropertyForComparison} setSelectedPropertyForComparison={dialogs.setSelectedPropertyForComparison}
          />

          <BulkImportDialog open={dialogs.isBulkImportDialogOpen} onOpenChange={dialogs.setIsBulkImportDialogOpen} onImportComplete={admin.fetchProperties} />
          <GeminiAPIKeyDialog open={dialogs.isGeminiAPIKeyDialogOpen} onOpenChange={dialogs.setIsGeminiAPIKeyDialogOpen} />
        </main>

        <BulkActionsBar
          selectedCount={admin.selectedProperties.length} onClearSelection={() => admin.setSelectedProperties([])}
          onBulkStatusChange={admin.handleBulkStatusChange} onBulkDelete={admin.handleBulkDelete} onGenerateQRCodes={handleGenerateQRCodes}
          onPrintOffers={() => dialogs.setIsBatchPrintDialogOpen(true)} onStartCampaign={() => dialogs.setIsCampaignDialogOpen(true)}
          onAISuggestions={() => dialogs.setIsSuggestionsDialogOpen(true)} onStartSequence={() => dialogs.setIsSequenceDialogOpen(true)}
          allApproved={admin.selectedProperties.every(id => admin.properties.find(p => p.id === id)?.approval_status === 'approved')}
          propertiesWithPreferredContacts={admin.selectedProperties.filter(id => { const p = admin.properties.find(x => x.id === id); return (p?.tags || []).some((t: string) => t.startsWith('pref_phone:') || t.startsWith('pref_email:')); }).length}
        />
      </div>
    </>
  );
};

export default Admin;
