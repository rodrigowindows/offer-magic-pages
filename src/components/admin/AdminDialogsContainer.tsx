import { PropertyNotesDialog } from './PropertyNotesDialog';
import { PropertyEditDialog } from './PropertyEditDialog';
import { CashOfferDialog } from '@/components/offer/CashOfferDialog';
import { EmailCampaignDialog } from '@/components/campaign/EmailCampaignDialog';
import { LeadSuggestionsDialog } from '@/components/lead/LeadSuggestionsDialog';
import { CampaignTemplatesDialog } from '@/components/campaign/CampaignTemplatesDialog';
import { CampaignPreviewDialog } from '@/components/campaign/CampaignPreviewDialog';
import { BatchOfferPrintDialog } from '@/components/offer/BatchOfferPrintDialog';
import { StartSequenceDialog } from '@/components/follow-up/StartSequenceDialog';
import { PropertyImageUpload } from '@/components/property/PropertyImageUpload';
import { PropertyTagsManager } from '@/components/property/PropertyTagsManager';
import { PropertyApprovalDialog } from '@/components/property/PropertyApprovalDialog';
import { AirbnbEligibilityChecker } from '@/components/shared/AirbnbEligibilityChecker';
import { PropertyComparison } from '@/components/property/PropertyComparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AdminProperty } from '@/hooks/useAdminProperties';

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  created_at: string;
}

interface AdminDialogsContainerProps {
  properties: AdminProperty[];
  selectedProperties: string[];
  setSelectedProperties: (ids: string[]) => void;
  fetchProperties: () => void;
  isLoading: boolean;

  // Notes dialog
  isNotesDialogOpen: boolean;
  setIsNotesDialogOpen: (v: boolean) => void;
  selectedPropertyId: string | null;
  propertyNotes: PropertyNote[];
  noteFormData: { noteText: string; followUpDate: string };
  setNoteFormData: (v: { noteText: string; followUpDate: string }) => void;
  onNoteSubmit: (e: React.FormEvent) => void;

  // Edit dialog
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (v: boolean) => void;
  editFormData: Partial<AdminProperty>;
  setEditFormData: (v: Partial<AdminProperty>) => void;
  onSaveEdit: () => void;

  // Other dialogs
  isOfferDialogOpen: boolean; setIsOfferDialogOpen: (v: boolean) => void; selectedPropertyForOffer: AdminProperty | null;
  isEmailDialogOpen: boolean; setIsEmailDialogOpen: (v: boolean) => void;
  isSuggestionsDialogOpen: boolean; setIsSuggestionsDialogOpen: (v: boolean) => void;
  isMarketingSettingsOpen: boolean; setIsMarketingSettingsOpen: (v: boolean) => void;
  isCampaignDialogOpen: boolean; setIsCampaignDialogOpen: (v: boolean) => void;
  isTemplatesDialogOpen: boolean; setIsTemplatesDialogOpen: (v: boolean) => void;
  isPreviewDialogOpen: boolean; setIsPreviewDialogOpen: (v: boolean) => void;
  isBatchPrintDialogOpen: boolean; setIsBatchPrintDialogOpen: (v: boolean) => void;
  isSequenceDialogOpen: boolean; setIsSequenceDialogOpen: (v: boolean) => void;

  // Property-specific
  selectedPropertyForImage: string | null; setSelectedPropertyForImage: (v: string | null) => void;
  selectedPropertyForTags: string | null; setSelectedPropertyForTags: (v: string | null) => void;
  selectedPropertyForApproval: string | null; setSelectedPropertyForApproval: (v: string | null) => void;
  selectedPropertyForAirbnb: string | null; setSelectedPropertyForAirbnb: (v: string | null) => void;
  selectedPropertyForComparison: string | null; setSelectedPropertyForComparison: (v: string | null) => void;
}

export const AdminDialogsContainer = (props: AdminDialogsContainerProps) => {
  const findProp = (id: string | null) => id ? props.properties.find(x => x.id === id) : null;
  const selectedProps = props.properties.filter(p => props.selectedProperties.includes(p.id));

  return (
    <>
      <PropertyNotesDialog open={props.isNotesDialogOpen} onOpenChange={props.setIsNotesDialogOpen} propertyId={props.selectedPropertyId} notes={props.propertyNotes} noteFormData={props.noteFormData} onNoteFormChange={props.setNoteFormData} onSubmit={props.onNoteSubmit} isLoading={props.isLoading} />
      <PropertyEditDialog open={props.isEditDialogOpen} onOpenChange={props.setIsEditDialogOpen} editFormData={props.editFormData} onEditFormChange={props.setEditFormData} onSave={props.onSaveEdit} isLoading={props.isLoading} />
      <CashOfferDialog property={props.selectedPropertyForOffer} open={props.isOfferDialogOpen} onOpenChange={props.setIsOfferDialogOpen} />
      <EmailCampaignDialog properties={selectedProps} open={props.isEmailDialogOpen} onOpenChange={props.setIsEmailDialogOpen} onOpenSettings={() => props.setIsMarketingSettingsOpen(true)} onSuccess={() => { props.fetchProperties(); props.setSelectedProperties([]); }} />
      <LeadSuggestionsDialog open={props.isSuggestionsDialogOpen} onOpenChange={props.setIsSuggestionsDialogOpen} propertyIds={props.selectedProperties} onRefresh={props.fetchProperties} />
      <CampaignTemplatesDialog open={props.isTemplatesDialogOpen} onOpenChange={props.setIsTemplatesDialogOpen} />
      <CampaignPreviewDialog open={props.isPreviewDialogOpen} onOpenChange={props.setIsPreviewDialogOpen} propertyIds={props.selectedProperties} onConfirm={() => props.setIsCampaignDialogOpen(true)} />
      <BatchOfferPrintDialog properties={selectedProps} open={props.isBatchPrintDialogOpen} onOpenChange={props.setIsBatchPrintDialogOpen} />
      <StartSequenceDialog open={props.isSequenceDialogOpen} onOpenChange={props.setIsSequenceDialogOpen} selectedProperties={selectedProps.map(p => ({ id: p.id, address: p.address, city: p.city }))} />

      {/* Property-specific dialogs */}
      {props.selectedPropertyForImage && (() => { const p = findProp(props.selectedPropertyForImage); return p ? <Dialog open onOpenChange={o => !o && props.setSelectedPropertyForImage(null)}><DialogContent><DialogHeader><DialogTitle>Upload Image</DialogTitle></DialogHeader><PropertyImageUpload propertyId={p.id} propertySlug={p.slug} currentImageUrl={p.property_image_url} onImageUploaded={() => { props.fetchProperties(); props.setSelectedPropertyForImage(null); }} /></DialogContent></Dialog> : null; })()}
      {props.selectedPropertyForTags && (() => { const p = findProp(props.selectedPropertyForTags); return p ? <Dialog open onOpenChange={o => !o && props.setSelectedPropertyForTags(null)}><DialogContent className="sm:max-w-[600px]"><DialogHeader><DialogTitle>Manage Tags</DialogTitle></DialogHeader><PropertyTagsManager propertyId={p.id} currentTags={(p as any).tags || []} onTagsUpdated={() => { props.fetchProperties(); props.setSelectedPropertyForTags(null); }} /></DialogContent></Dialog> : null; })()}
      {(() => { const p = findProp(props.selectedPropertyForApproval); return <PropertyApprovalDialog propertyId={props.selectedPropertyForApproval || ""} propertyAddress={p?.address || ""} currentStatus={p?.approval_status || "pending"} open={!!props.selectedPropertyForApproval} onOpenChange={o => !o && props.setSelectedPropertyForApproval(null)} onStatusChange={() => { props.fetchProperties(); props.setSelectedPropertyForApproval(null); }} />; })()}
      {(() => { const p = findProp(props.selectedPropertyForAirbnb); return <AirbnbEligibilityChecker propertyId={props.selectedPropertyForAirbnb || ""} propertyAddress={p?.address || ""} city={p?.city || ""} state={p?.state || ""} currentEligible={p?.airbnb_eligible} currentRegulations={p?.airbnb_regulations} currentNotes={p?.airbnb_notes} lastCheckDate={p?.airbnb_check_date} open={!!props.selectedPropertyForAirbnb} onOpenChange={o => !o && props.setSelectedPropertyForAirbnb(null)} onCheckComplete={() => { props.fetchProperties(); props.setSelectedPropertyForAirbnb(null); }} />; })()}
      {props.selectedPropertyForComparison && (() => { const p = findProp(props.selectedPropertyForComparison); return p ? <PropertyComparison propertyId={p.id} address={p.address} city={p.city} state={p.state} zipCode={p.zip_code} estimatedValue={p.estimated_value} cashOfferAmount={p.cash_offer_amount} onClose={() => props.setSelectedPropertyForComparison(null)} /> : null; })()}
    </>
  );
};
