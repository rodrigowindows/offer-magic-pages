/**
 * Hook to manage all dialog/modal states in Admin page.
 * Extracted from Admin.tsx for cleaner separation.
 */
import { useState } from 'react';
import type { AdminProperty } from '@/hooks/useAdminProperties';

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  created_at: string;
}

export const useAdminDialogs = () => {
  // Dialog open states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isMarketingSettingsOpen, setIsMarketingSettingsOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isBatchPrintDialogOpen, setIsBatchPrintDialogOpen] = useState(false);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  // GeminiAPIKeyDialog removed - using Lovable AI gateway
  const [isBatchReviewOpen, setIsBatchReviewOpen] = useState(false);

  // Selected property states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertyForOffer, setSelectedPropertyForOffer] = useState<AdminProperty | null>(null);
  const [selectedPropertyForImage, setSelectedPropertyForImage] = useState<string | null>(null);
  const [selectedPropertyForTags, setSelectedPropertyForTags] = useState<string | null>(null);
  const [selectedPropertyForApproval, setSelectedPropertyForApproval] = useState<string | null>(null);
  const [selectedPropertyForAirbnb, setSelectedPropertyForAirbnb] = useState<string | null>(null);
  const [selectedPropertyForComparison, setSelectedPropertyForComparison] = useState<string | null>(null);

  // Form data
  const [editFormData, setEditFormData] = useState<Partial<AdminProperty>>({});
  const [propertyNotes, setPropertyNotes] = useState<PropertyNote[]>([]);
  const [formData, setFormData] = useState({ address: "", city: "Miami", state: "FL", zipCode: "", estimatedValue: "", cashOfferAmount: "", propertyImageUrl: "" });
  const [noteFormData, setNoteFormData] = useState({ noteText: "", followUpDate: "" });

  return {
    // Dialog states
    isAddDialogOpen, setIsAddDialogOpen,
    isEditDialogOpen, setIsEditDialogOpen,
    isNotesDialogOpen, setIsNotesDialogOpen,
    isOfferDialogOpen, setIsOfferDialogOpen,
    isEmailDialogOpen, setIsEmailDialogOpen,
    isSuggestionsDialogOpen, setIsSuggestionsDialogOpen,
    isMarketingSettingsOpen, setIsMarketingSettingsOpen,
    isCampaignDialogOpen, setIsCampaignDialogOpen,
    isTemplatesDialogOpen, setIsTemplatesDialogOpen,
    isPreviewDialogOpen, setIsPreviewDialogOpen,
    isBatchPrintDialogOpen, setIsBatchPrintDialogOpen,
    isSequenceDialogOpen, setIsSequenceDialogOpen,
    isBulkImportDialogOpen, setIsBulkImportDialogOpen,
    
    isBatchReviewOpen, setIsBatchReviewOpen,
    // Selected properties
    selectedPropertyId, setSelectedPropertyId,
    selectedPropertyForOffer, setSelectedPropertyForOffer,
    selectedPropertyForImage, setSelectedPropertyForImage,
    selectedPropertyForTags, setSelectedPropertyForTags,
    selectedPropertyForApproval, setSelectedPropertyForApproval,
    selectedPropertyForAirbnb, setSelectedPropertyForAirbnb,
    selectedPropertyForComparison, setSelectedPropertyForComparison,
    // Form data
    editFormData, setEditFormData,
    propertyNotes, setPropertyNotes,
    formData, setFormData,
    noteFormData, setNoteFormData,
  };
};
