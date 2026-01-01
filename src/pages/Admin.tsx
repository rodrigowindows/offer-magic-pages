import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ABTestDashboard } from "@/components/ABTestDashboard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDesignMode } from "@/hooks/useDesignMode";
import { Plus, LogOut, ExternalLink, Copy, QrCode, FileText, Settings, LayoutGrid, List, Rocket, BarChart3, FileDown, Globe, Target, Search, X, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { PropertyAnalytics } from "@/components/PropertyAnalytics";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { AIPropertyImport } from "@/components/AIPropertyImport";
import { LeadStatusBadge, LeadStatus } from "@/components/LeadStatusBadge";
import { LeadStatusSelect } from "@/components/LeadStatusSelect";
import { PropertyFilters } from "@/components/PropertyFilters";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { CashOfferDialog } from "@/components/CashOfferDialog";
import { AdminChatBot } from "@/components/AdminChatBot";
import { EmailCampaignDialog } from "@/components/EmailCampaignDialog";
import { EmailCampaignStats } from "@/components/EmailCampaignStats";
import { LeadSuggestionsDialog } from "@/components/LeadSuggestionsDialog";
import { MarketingSettingsDialog } from "@/components/MarketingSettingsDialog";
import { StartCampaignDialog } from "@/components/StartCampaignDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { CampaignAnalytics } from "@/components/CampaignAnalytics";
import { CampaignExport } from "@/components/CampaignExport";
import { FollowUpAlerts } from "@/components/FollowUpAlerts";
import { ResponseTimeAnalytics } from "@/components/ResponseTimeAnalytics";
import { CampaignTemplatesDialog } from "@/components/CampaignTemplatesDialog";
import { CampaignPreviewDialog } from "@/components/CampaignPreviewDialog";
import { PropertyNotesPanel } from "@/components/PropertyNotesPanel";
import { AdminDashboardOverview } from "@/components/AdminDashboardOverview";
import { BatchOfferPrintDialog } from "@/components/BatchOfferPrintDialog";
import { ChannelAnalytics } from "@/components/ChannelAnalytics";
import { SequenceManager } from "@/components/SequenceManager";
import { FollowUpManager } from "@/components/FollowUpManager";
import { StartSequenceDialog } from "@/components/StartSequenceDialog";
// NEW COMPONENTS - Orlando Integration
import { PropertyImageUpload } from "@/components/PropertyImageUpload";
import { PropertyTagsManager } from "@/components/PropertyTagsManager";
import { PropertyTagsFilter } from "@/components/PropertyTagsFilter";
import { PropertyApprovalDialog } from "@/components/PropertyApprovalDialog";
import { PropertyApprovalFilter } from "@/components/PropertyApprovalFilter";
import { PropertyUserFilter } from "@/components/PropertyUserFilter";
import { AdvancedPropertyFilters, PropertyFilters as AdvancedFilters } from "@/components/AdvancedPropertyFilters";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { AirbnbEligibilityChecker } from "@/components/AirbnbEligibilityChecker";
import { PropertyComparison } from "@/components/PropertyComparison";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { GeminiAPIKeyDialog } from "@/components/GeminiAPIKeyDialog";
import { PropertyCardView } from "@/components/PropertyCardView";
import { PropertyCardSkeleton } from "@/components/PropertyCardSkeleton";
import { AdaptivePropertyCard } from "@/components/AdaptivePropertyCard";
import { DesignModeToggle } from "@/components/DesignModeToggle";
import { HeaderActionsMenu } from "@/components/HeaderActionsMenu";
import { ActiveFilterChips } from "@/components/ActiveFilterChips";
import { SmartPropertySearch } from "@/components/SmartPropertySearch";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { MainNavigation } from "@/components/MainNavigation";
import { BatchReviewMode } from "@/components/BatchReviewMode";
import { QuickFiltersSidebar } from "@/components/QuickFiltersSidebar";
import { TeamActivityDashboard } from "@/components/TeamActivityDashboard";
import { TeamReportExporter } from "@/components/TeamReportExporter";
import { ReviewQueue } from "@/components/ReviewQueue";
import { UnifiedPropertyFilters } from "@/components/UnifiedPropertyFilters";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { PropertyMapView } from "@/components/PropertyMapView";
import { InteractivePropertyMap } from "@/components/InteractivePropertyMap";
import { ApprovedPropertiesExport } from "@/components/ApprovedPropertiesExport";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { batchAnalyzeProperties } from "@/utils/aiPropertyAnalyzer";
import { checkAndSaveAirbnbEligibility } from "@/utils/airbnbChecker";

const propertySchema = z.object({
  address: z.string().min(1, "Address is required").max(200, "Address too long"),
  city: z.string().min(1, "City is required").max(100, "City too long"),
  state: z.string().min(2, "State is required").max(2, "State must be 2 characters"),
  zipCode: z.string().min(5, "Invalid ZIP code").max(10, "Invalid ZIP code"),
  estimatedValue: z.number().positive("Must be positive"),
  cashOfferAmount: z.number().positive("Must be positive"),
  propertyImageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  status: string;
  lead_status: LeadStatus;
  created_at: string;
  sms_sent: boolean;
  email_sent: boolean;
  letter_sent: boolean;
  card_sent: boolean;
  phone_call_made: boolean;
  meeting_scheduled: boolean;
  owner_address?: string;
  owner_name?: string;
  owner_phone?: string;
  answer_flag?: boolean;
  dnc_flag?: boolean;
  neighborhood?: string;
  origem?: string;
  carta?: string;
  zillow_url?: string;
  evaluation?: string;
  focar?: string;
  comparative_price?: number;
  // Approval system fields
  approval_status?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  rejection_notes?: string;
  updated_by?: string;
  updated_by_name?: string;
  // Airbnb fields
  airbnb_eligible?: boolean;
  airbnb_regulations?: any;
  airbnb_notes?: string;
  airbnb_check_date?: string;
  // Advanced filter fields
  tags?: string[];
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  county?: string;
  property_type?: string;
  import_batch?: string;
  import_date?: string;
  last_contact_date?: string;
  next_followup_date?: string;
  lead_score?: number;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyNotes, setPropertyNotes] = useState<PropertyNote[]>([]);
  const [formData, setFormData] = useState({
    address: "",
    city: "Miami",
    state: "FL",
    zipCode: "",
    estimatedValue: "",
    cashOfferAmount: "",
    propertyImageUrl: "",
  });
  const [editFormData, setEditFormData] = useState<Partial<Property>>({});
  const [noteFormData, setNoteFormData] = useState({
    noteText: "",
    followUpDate: "",
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedPropertyForOffer, setSelectedPropertyForOffer] = useState<Property | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isMarketingSettingsOpen, setIsMarketingSettingsOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isBatchPrintDialogOpen, setIsBatchPrintDialogOpen] = useState(false);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);

  // NEW - Orlando Integration Dialog States
  const [selectedPropertyForImage, setSelectedPropertyForImage] = useState<string | null>(null);
  const [selectedPropertyForTags, setSelectedPropertyForTags] = useState<string | null>(null);
  const [selectedPropertyForApproval, setSelectedPropertyForApproval] = useState<string | null>(null);
  const [selectedPropertyForAirbnb, setSelectedPropertyForAirbnb] = useState<string | null>(null);
  const [selectedPropertyForComparison, setSelectedPropertyForComparison] = useState<string | null>(null);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isGeminiAPIKeyDialogOpen, setIsGeminiAPIKeyDialogOpen] = useState(false);

  // NEW - Orlando Integration States
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string>("all");
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [filterUserName, setFilterUserName] = useState<string | null>(null);
  const { userId, userName } = useCurrentUser();

  // NEW - UI Enhancement States
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isBatchReviewOpen, setIsBatchReviewOpen] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchProperties();
  }, [advancedFilters, selectedTags, approvalStatus, priceRange, selectedCities, dateFilter, filterUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProperties = async () => {
    setIsLoadingProperties(true);
    let query = supabase.from("properties").select("*");

    // Apply advanced filters
    if (advancedFilters.city?.length) {
      query = query.in("city", advancedFilters.city);
    }
    if (advancedFilters.county?.length) {
      query = query.in("county", advancedFilters.county);
    }
    if (advancedFilters.propertyType?.length) {
      query = query.in("property_type", advancedFilters.propertyType);
    }
    if (advancedFilters.importBatch?.length) {
      query = query.in("import_batch", advancedFilters.importBatch);
    }
    if (advancedFilters.importDateFrom) {
      query = query.gte("import_date", advancedFilters.importDateFrom.toISOString().split('T')[0]);
    }
    if (advancedFilters.importDateTo) {
      query = query.lte("import_date", advancedFilters.importDateTo.toISOString().split('T')[0]);
    }
    if (advancedFilters.priceMin) {
      query = query.gte("estimated_value", advancedFilters.priceMin);
    }
    if (advancedFilters.priceMax) {
      query = query.lte("estimated_value", advancedFilters.priceMax);
    }
    if (advancedFilters.bedrooms) {
      query = query.gte("bedrooms", advancedFilters.bedrooms);
    }
    if (advancedFilters.bathrooms) {
      query = query.gte("bathrooms", advancedFilters.bathrooms);
    }
    if (advancedFilters.airbnbEligible !== undefined) {
      query = query.eq("airbnb_eligible", advancedFilters.airbnbEligible);
    }
    if (advancedFilters.hasImage !== undefined) {
      if (advancedFilters.hasImage) {
        query = query.not("property_image_url", "is", null);
      } else {
        query = query.is("property_image_url", null);
      }
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      query = query.contains("tags", selectedTags);
    }

    // Apply approval filter
    if (approvalStatus !== "all") {
      query = query.eq("approval_status", approvalStatus);
    }

    // Apply user filter (filter by who approved)
    if (filterUserId) {
      query = query.eq("approved_by", filterUserId);
    }

    // Apply price range filter (from QuickFiltersSidebar)
    if (priceRange[0] > 0) {
      query = query.gte("estimated_value", priceRange[0]);
    }
    if (priceRange[1] < 1000000) {
      query = query.lte("estimated_value", priceRange[1]);
    }

    // Apply cities filter (from QuickFiltersSidebar)
    if (selectedCities.length > 0) {
      query = query.in("city", selectedCities);
    }

    // Apply date filter (from QuickFiltersSidebar)
    if (dateFilter !== 'all') {
      const today = new Date();
      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        query = query.gte("created_at", sevenDaysAgo.toISOString());
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        query = query.gte("created_at", thirtyDaysAgo.toISOString());
      } else if (dateFilter === '90days') {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        query = query.gte("created_at", ninetyDaysAgo.toISOString());
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } else {
      setProperties((data || []) as Property[]);

      // Update status counts
      if (data) {
        const counts = {
          pending: data.filter((p: any) => p.approval_status === 'pending' || !p.approval_status).length,
          approved: data.filter((p: any) => p.approval_status === 'approved').length,
          rejected: data.filter((p: any) => p.approval_status === 'rejected').length,
        };
        setStatusCounts(counts);
      }
    }
    setIsLoadingProperties(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const openEditDialog = (property: Property) => {
    setSelectedPropertyId(property.id);
    setEditFormData(property);
    setIsEditDialogOpen(true);
  };

  const openOfferDialog = (property: Property) => {
    setSelectedPropertyForOffer(property);
    setIsOfferDialogOpen(true);
  };

  const handleUpdateProperty = async () => {
    if (!selectedPropertyId) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("properties")
        .update({
          address: editFormData.address,
          city: editFormData.city,
          state: editFormData.state,
          zip_code: editFormData.zip_code,
          estimated_value: editFormData.estimated_value,
          cash_offer_amount: editFormData.cash_offer_amount,
          min_offer_amount: (editFormData as any).min_offer_amount || null,
          max_offer_amount: (editFormData as any).max_offer_amount || null,
          property_image_url: editFormData.property_image_url,
          owner_address: editFormData.owner_address,
          owner_name: editFormData.owner_name,
          owner_phone: editFormData.owner_phone,
          answer_flag: editFormData.answer_flag,
          dnc_flag: editFormData.dnc_flag,
          neighborhood: editFormData.neighborhood,
          origem: editFormData.origem,
          carta: editFormData.carta,
          zillow_url: editFormData.zillow_url,
          evaluation: editFormData.evaluation,
          focar: editFormData.focar,
          comparative_price: editFormData.comparative_price,
        } as any)
        .eq("id", selectedPropertyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });
      setIsEditDialogOpen(false);
      fetchProperties();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (address: string): string => {
    return address
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = propertySchema.parse({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        estimatedValue: parseFloat(formData.estimatedValue),
        cashOfferAmount: parseFloat(formData.cashOfferAmount),
        propertyImageUrl: formData.propertyImageUrl,
      });

      const slug = generateSlug(validated.address);

      const { error } = await supabase.from("properties").insert({
        slug,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zip_code: validated.zipCode,
        estimated_value: validated.estimatedValue,
        cash_offer_amount: validated.cashOfferAmount,
        property_image_url: validated.propertyImageUrl || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Property added successfully",
        });
        setIsAddDialogOpen(false);
        setFormData({
          address: "",
          city: "Miami",
          state: "FL",
          zipCode: "",
          estimatedValue: "",
          cashOfferAmount: "",
          propertyImageUrl: "",
        });
        fetchProperties();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyPropertyLink = (slug: string) => {
    const url = `${window.location.origin}/property/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Property link copied to clipboard",
    });
  };

  const openQRGenerator = (slug: string) => {
    const url = encodeURIComponent(`${window.location.origin}/property/${slug}`);
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`, '_blank');
  };

  const openNotesDialog = async (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsNotesDialogOpen(true);
    await fetchPropertyNotes(propertyId);
  };

  const fetchPropertyNotes = async (propertyId: string) => {
    const { data, error } = await supabase
      .from("property_notes")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } else {
      setPropertyNotes(data || []);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !noteFormData.noteText.trim()) return;
    
    setIsLoading(true);

    const { error } = await supabase.from("property_notes").insert({
      property_id: selectedPropertyId,
      note_text: noteFormData.noteText,
      follow_up_date: noteFormData.followUpDate || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Note added successfully",
      });
      setNoteFormData({
        noteText: "",
        followUpDate: "",
      });
      await fetchPropertyNotes(selectedPropertyId);
    }
    
    setIsLoading(false);
  };

  const updatePropertyCommunication = async (propertyId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from("properties")
      .update({ [field]: value })
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update communication status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Communication status updated",
      });
      fetchProperties();
    }
  };

  const updateLeadStatus = async (propertyId: string, newStatus: LeadStatus) => {
    const { error } = await supabase
      .from("properties")
      .update({ lead_status: newStatus })
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated!",
        description: `Lead status changed to ${newStatus.replace('_', ' ')}`,
      });
      fetchProperties();
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    const { error } = await supabase
      .from("properties")
      .update({ lead_status: newStatus })
      .in("id", selectedProperties);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update properties",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `Updated ${selectedProperties.length} properties to ${newStatus.replace('_', ' ')}`,
      });
      setSelectedProperties([]);
      fetchProperties();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProperties.length} ${selectedProperties.length === 1 ? 'property' : 'properties'}? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .in("id", selectedProperties);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete properties",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted!",
        description: `Successfully deleted ${selectedProperties.length} ${selectedProperties.length === 1 ? 'property' : 'properties'}`,
      });
      setSelectedProperties([]);
      fetchProperties();
    }
  };

  const handleGenerateQRCodes = () => {
    const selectedProps = properties.filter(p => selectedProperties.includes(p.id));
    const qrCodeUrls = selectedProps.map(property => {
      const url = encodeURIComponent(`${window.location.origin}/property/${property.slug}`);
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
    });

    // Open a new page with all QR codes
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Codes - ${selectedProps.length} Properties</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .qr-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
              .qr-item { border: 2px solid #ddd; padding: 15px; text-align: center; break-inside: avoid; }
              .qr-item img { max-width: 100%; height: auto; }
              .qr-item h3 { margin: 10px 0 5px; font-size: 14px; }
              .qr-item p { margin: 5px 0; font-size: 12px; color: #666; }
              @media print { 
                .qr-container { grid-template-columns: repeat(2, 1fr); }
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <h1>QR Codes for ${selectedProps.length} Properties</h1>
            <button onclick="window.print()" style="margin: 10px 0; padding: 10px 20px; font-size: 16px;">Print</button>
            <div class="qr-container">
              ${selectedProps.map((property, index) => `
                <div class="qr-item">
                  <img src="${qrCodeUrls[index]}" alt="QR Code for ${property.address}" />
                  <h3>${property.address}</h3>
                  <p>${property.city}, ${property.state} ${property.zip_code}</p>
                  <p><strong>Cash Offer:</strong> $${property.cash_offer_amount.toLocaleString()}</p>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "QR Codes Generated!",
      description: `Generated ${selectedProps.length} QR codes in new window`,
    });
  };

  const handleBulkPrintOffers = () => {
    setIsBatchPrintDialogOpen(true);
  };

  const handleSendEmails = () => {
    setIsEmailDialogOpen(true);
  };

  const handleStartCampaign = () => {
    setIsPreviewDialogOpen(true);
  };

  const handleConfirmCampaign = () => {
    setIsCampaignDialogOpen(true);
  };

  const handleAISuggestions = () => {
    setIsSuggestionsDialogOpen(true);
  };

  // Map approve/reject handlers
  const handleMapApprove = async (property: { id: string }) => {
    const { error } = await supabase
      .from('properties')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString()
      } as any)
      .eq('id', property.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar propriedade",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Aprovado",
        description: "Propriedade aprovada com sucesso",
      });
      fetchProperties();
    }
  };

  const handleMapReject = async (property: { id: string }) => {
    const { error } = await supabase
      .from('properties')
      .update({
        approval_status: 'rejected',
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString()
      } as any)
      .eq('id', property.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao recusar propriedade",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Recusado",
        description: "Propriedade recusada",
      });
      fetchProperties();
    }
  };

  const filteredProperties = properties
    .filter(p => {
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAddress = p.address?.toLowerCase().includes(query);
        const matchCity = p.city?.toLowerCase().includes(query);
        const matchOwner = p.owner_name?.toLowerCase().includes(query);
        const matchZip = p.zip_code?.toLowerCase().includes(query);
        if (!matchAddress && !matchCity && !matchOwner && !matchZip) {
          return false;
        }
      }

      // Filter by lead status
      if (filterStatus !== 'all' && p.lead_status !== filterStatus) {
        return false;
      }

      // Filter by approval status
      if (approvalStatus !== 'all' && p.approval_status !== approvalStatus) {
        return false;
      }

      // Filter by user who approved/rejected
      if (filterUserId && (p as any).approved_by !== filterUserId) {
        return false;
      }

      return true;
    });

  const leadStatusCounts = properties.reduce((acc, property) => {
    acc[property.lead_status] = (acc[property.lead_status] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus | 'all', number>);

  // Generate active filters for chips
  const activeFilters = [];

  if (searchQuery.trim()) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: searchQuery,
      onRemove: () => setSearchQuery(''),
    });
  }

  if (approvalStatus !== 'all') {
    activeFilters.push({
      id: 'approval',
      label: 'Approval',
      value: approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1),
      onRemove: () => setApprovalStatus('all'),
    });
  }

  if (filterStatus !== 'all') {
    activeFilters.push({
      id: 'status',
      label: 'Lead Status',
      value: filterStatus.replace('_', ' ').charAt(0).toUpperCase() + filterStatus.replace('_', ' ').slice(1),
      onRemove: () => setFilterStatus('all'),
    });
  }

  if (filterUserName) {
    activeFilters.push({
      id: 'user',
      label: 'Approved by',
      value: filterUserName,
      onRemove: () => {
        setFilterUserId(null);
        setFilterUserName(null);
      },
    });
  }

  selectedTags.forEach((tag, index) => {
    activeFilters.push({
      id: `tag-${index}`,
      label: 'Tag',
      value: tag,
      onRemove: () => setSelectedTags(selectedTags.filter(t => t !== tag)),
    });
  });

  selectedCities.forEach((city, index) => {
    activeFilters.push({
      id: `city-${index}`,
      label: 'City',
      value: city,
      onRemove: () => setSelectedCities(selectedCities.filter(c => c !== city)),
    });
  });

  if (priceRange[0] > 0 || priceRange[1] < 1000000) {
    activeFilters.push({
      id: 'price',
      label: 'Price',
      value: `$${(priceRange[0] / 1000).toFixed(0)}k - $${(priceRange[1] / 1000).toFixed(0)}k`,
      onRemove: () => setPriceRange([0, 1000000]),
    });
  }

  if (dateFilter !== 'all') {
    const dateLabels = {
      '7days': 'Last 7 days',
      '30days': 'Last 30 days',
      '90days': 'Last 90 days',
    };
    activeFilters.push({
      id: 'date',
      label: 'Date',
      value: dateLabels[dateFilter as keyof typeof dateLabels] || dateFilter,
      onRemove: () => setDateFilter('all'),
    });
  }

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setApprovalStatus('all');
    setFilterUserId(null);
    setFilterUserName(null);
    setSelectedTags([]);
    setSelectedCities([]);
    setPriceRange([0, 1000000]);
    setDateFilter('all');
    setAdvancedFilters({});
  };

  // Generate search suggestions from properties
  const searchSuggestions = Array.from(new Set([
    ...properties.map(p => ({ type: 'address' as const, value: p.address })),
    ...properties.map(p => ({ type: 'city' as const, value: p.city })),
    ...properties.filter(p => p.owner_name).map(p => ({ type: 'owner' as const, value: p.owner_name! })),
    ...properties.map(p => ({ type: 'zip' as const, value: p.zip_code })),
  ].filter(s => s.value))).map((s, i) => ({ ...s, icon: Search }));

  return (
    <>
      <MainNavigation />
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          {/* Top row: Title + Badge + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Orlando Properties
              </h1>
              <Badge variant="secondary" className="text-xs font-medium">
                {properties.length} total
              </Badge>
            </div>

            {/* Compact action menu */}
            <div className="flex items-center gap-2">
              <ApprovedPropertiesExport
                filters={{
                  userId: filters.assignedToUserId,
                  tags: filters.tags,
                  searchQuery: searchQuery,
                }}
              />
              <DesignModeToggle isMinimal={isMinimal} onToggle={toggleDesignMode} />
              <HeaderActionsMenu
                onBulkImport={() => setIsBulkImportDialogOpen(true)}
                onGeminiSettings={() => setIsGeminiAPIKeyDialogOpen(true)}
                onMarketingSettings={() => setIsMarketingSettingsOpen(true)}
              />
              <NotificationsPanel />
              <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Review Queue
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Metrics Dashboard - New Modern KPI Cards */}
            <MetricsDashboard properties={properties} />

            {/* Quick Actions */}
            <DashboardQuickActions
              onStartReview={() => {
                const tabs = document.querySelector('[value="review"]') as HTMLElement;
                tabs?.click();
              }}
              onAddProperty={() => setIsAddDialogOpen(true)}
              onExportData={() => {/* Export logic */}}
              onStartCampaign={() => setIsCampaignDialogOpen(true)}
              pendingCount={statusCounts.pending}
            />

            <AdminDashboardOverview />

            {/* NEW - Team Activity Dashboard */}
            <TeamActivityDashboard />

            {/* NEW - Report Exporter */}
            <div className="max-w-md">
              <TeamReportExporter />
            </div>

            <FollowUpManager />
          </TabsContent>

          {/* Review Queue Tab */}
          <TabsContent value="review" className="space-y-6">
            <ReviewQueue />
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            {/* Unified Filters */}
            <UnifiedPropertyFilters
              selectedStatus={filterStatus}
              onStatusChange={(status) => setFilterStatus(status as LeadStatus | 'all')}
              statusCounts={leadStatusCounts}
              approvalStatus={approvalStatus}
              onApprovalStatusChange={setApprovalStatus}
              approvalCounts={statusCounts}
              onUserFilter={(userId, userName) => {
                setFilterUserId(userId);
                setFilterUserName(userName);
              }}
              currentUserId={filterUserId}
              currentUserName={filterUserName}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              advancedFilters={advancedFilters}
              onAdvancedFiltersChange={setAdvancedFilters}
              onClearAll={() => {
                setFilterStatus("all");
                setApprovalStatus("all");
                setFilterUserId(null);
                setFilterUserName(null);
                setSelectedTags([]);
                setAdvancedFilters({});
              }}
            />

            {/* Smart Search Bar */}
            <div className="max-w-2xl">
              <SmartPropertySearch
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={() => {}}
                suggestions={searchSuggestions}
                placeholder="Buscar por endereço, cidade, dono ou CEP..."
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Your Properties</h2>
                <Badge variant="secondary" className="text-sm">
                  Exibindo {filteredProperties.length} de {properties.length}
                </Badge>
              </div>
              <div className="flex gap-2">
                {/* View Mode Toggle */}
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8"
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8"
                  >
                    <List className="w-4 h-4 mr-1" />
                    Table
                  </Button>
                </div>

                {/* Batch Review Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchReviewOpen(true)}
                  disabled={filteredProperties.length === 0}
                  className="h-8"
                >
                  <Rocket className="w-4 h-4 mr-1" />
                  Batch Review
                </Button>

                {/* Filters Sidebar Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
                  className="h-8"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <AIPropertyImport onImportComplete={fetchProperties} />
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary hover:bg-secondary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Property
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Property</DialogTitle>
                      <DialogDescription>
                        Enter the property details to create a new landing page
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address *</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Main Street"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            maxLength={2}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            placeholder="33101"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estimatedValue">Estimated Value *</Label>
                          <Input
                            id="estimatedValue"
                            type="number"
                            value={formData.estimatedValue}
                            onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                            placeholder="320000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cashOfferAmount">Cash Offer Amount *</Label>
                          <Input
                            id="cashOfferAmount"
                            type="number"
                            value={formData.cashOfferAmount}
                            onChange={(e) => setFormData({ ...formData, cashOfferAmount: e.target.value })}
                            placeholder="285000"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="propertyImageUrl">Property Image URL (optional)</Label>
                        <Input
                          id="propertyImageUrl"
                          type="url"
                          value={formData.propertyImageUrl}
                          onChange={(e) => setFormData({ ...formData, propertyImageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Adding..." : "Add Property"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue="table" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>

          <TabsContent value="kanban">
            {selectedProperties.length > 0 && (
              <BulkActionsBar
                selectedCount={selectedProperties.length}
                onClearSelection={() => setSelectedProperties([])}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkDelete={handleBulkDelete}
                onGenerateQRCodes={handleGenerateQRCodes}
                onPrintOffers={handleBulkPrintOffers}
                onStartCampaign={handleStartCampaign}
                onAISuggestions={handleAISuggestions}
              />
            )}
            <KanbanBoard
              properties={filteredProperties}
              onStatusChange={updateLeadStatus}
              onPropertyClick={(property) => openEditDialog(property as Property)}
              selectedProperties={selectedProperties}
              onSelectionChange={togglePropertySelection}
            />
          </TabsContent>

          <TabsContent value="map">
            <InteractivePropertyMap
              properties={filteredProperties}
              onPropertyClick={(property) => openEditDialog(property as Property)}
              onApprove={handleMapApprove}
              onReject={handleMapReject}
            />
          </TabsContent>

          <TabsContent value="table">
            {/* Properties Display with Sidebar */}
            <div className="flex gap-4">
              {/* Quick Filters Sidebar */}
              {showFiltersSidebar && (
                <QuickFiltersSidebar
                  approvalStatus={approvalStatus}
                  onApprovalStatusChange={setApprovalStatus}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  selectedCities={selectedCities}
                  onCitiesChange={setSelectedCities}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                  statusCounts={statusCounts}
                  onUserFilter={(userId, userName) => {
                    setFilterUserId(userId);
                    setFilterUserName(userName);
                  }}
                  currentUserId={filterUserId}
                  currentUserName={filterUserName}
                  advancedFilters={advancedFilters}
                  onAdvancedFiltersChange={setAdvancedFilters}
                  onClearAll={() => {
                    setFilterStatus("all");
                    setApprovalStatus("all");
                    setFilterUserId(null);
                    setFilterUserName(null);
                    setSelectedTags([]);
                    setAdvancedFilters({});
                    setPriceRange([0, 1000000]);
                    setSelectedCities([]);
                    setDateFilter("all");
                  }}
                />
              )}

              {/* Main Content Area */}
              <div className="flex-1">
                {/* Active Filter Chips */}
                <ActiveFilterChips
                  filters={activeFilters}
                  onClearAll={clearAllFilters}
                />

                {viewMode === 'cards' ? (
                  /* Card View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoadingProperties ? (
                      /* Loading Skeletons */
                      Array.from({ length: 6 }).map((_, index) => (
                        <PropertyCardSkeleton key={index} />
                      ))
                    ) : filteredProperties.length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-8">
                        {filterStatus === 'all'
                          ? 'No properties yet. Add your first property to get started!'
                          : `No properties with status "${filterStatus.replace('_', ' ')}"`
                        }
                      </div>
                    ) : (
                      filteredProperties.map((property) => (
                        <AdaptivePropertyCard
                          key={property.id}
                          property={property}
                          isSelected={selectedProperties.includes(property.id)}
                          onToggleSelect={() => togglePropertySelection(property.id)}
                          isMinimalDesign={isMinimal}
                          onAnalyze={() => {
                            setSelectedPropertyForComparison(property.id);
                          }}
                          onApprove={() => {
                            setSelectedPropertyForApproval(property.id);
                          }}
                          onReject={() => {
                            setSelectedPropertyForApproval(property.id);
                          }}
                          onUploadImage={() => {
                            setSelectedPropertyForImage(property.id);
                          }}
                          onManageTags={() => {
                            setSelectedPropertyForTags(property.id);
                          }}
                          onCheckAirbnb={() => {
                            setSelectedPropertyForAirbnb(property.id);
                          }}
                          onGenerateOffer={() => openOfferDialog(property)}
                          onEdit={() => openEditDialog(property)}
                          onViewPage={() => window.open(`/property/${property.slug}`, '_blank')}
                          onCopyLink={() => copyPropertyLink(property.slug)}
                          onGenerateQR={() => openQRGenerator(property.slug)}
                          onAddNotes={() => openNotesDialog(property.id)}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all properties"
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Cash Offer</TableHead>
                <TableHead>Estimated Value</TableHead>
                <TableHead>Lead Status</TableHead>
                <TableHead>Communication</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    {filterStatus === 'all' 
                      ? 'No properties yet. Add your first property to get started!'
                      : `No properties with status "${filterStatus.replace('_', ' ')}"`
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => togglePropertySelection(property.id)}
                        aria-label={`Select ${property.address}`}
                      />
                    </TableCell>
                    <TableCell>
                      <PropertyImageDisplay
                        imageUrl={property.property_image_url || ""}
                        address={property.address}
                        className="w-20 h-20"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {property.address}, {property.city}, {property.state}
                    </TableCell>
                    <TableCell>{property.owner_name || '-'}</TableCell>
                    <TableCell>{property.owner_phone || '-'}</TableCell>
                    <TableCell>${property.cash_offer_amount.toLocaleString()}</TableCell>
                    <TableCell>${property.estimated_value.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <LeadStatusBadge status={property.lead_status} />
                        <LeadStatusSelect 
                          value={property.lead_status}
                          onValueChange={(newStatus) => updateLeadStatus(property.id, newStatus)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`sms-${property.id}`}
                            checked={property.sms_sent}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'sms_sent', checked as boolean)
                            }
                          />
                          <Label htmlFor={`sms-${property.id}`} className="text-xs cursor-pointer">
                            SMS
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`email-${property.id}`}
                            checked={property.email_sent}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'email_sent', checked as boolean)
                            }
                          />
                          <Label htmlFor={`email-${property.id}`} className="text-xs cursor-pointer">
                            Email
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`letter-${property.id}`}
                            checked={property.letter_sent}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'letter_sent', checked as boolean)
                            }
                          />
                          <Label htmlFor={`letter-${property.id}`} className="text-xs cursor-pointer">
                            Letter
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`card-${property.id}`}
                            checked={property.card_sent}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'card_sent', checked as boolean)
                            }
                          />
                          <Label htmlFor={`card-${property.id}`} className="text-xs cursor-pointer">
                            Card
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`phone-${property.id}`}
                            checked={property.phone_call_made}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'phone_call_made', checked as boolean)
                            }
                          />
                          <Label htmlFor={`phone-${property.id}`} className="text-xs cursor-pointer">
                            Phone
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`meeting-${property.id}`}
                            checked={property.meeting_scheduled}
                            onCheckedChange={(checked) => 
                              updatePropertyCommunication(property.id, 'meeting_scheduled', checked as boolean)
                            }
                          />
                          <Label htmlFor={`meeting-${property.id}`} className="text-xs cursor-pointer">
                            Meeting
                          </Label>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                        {property.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openOfferDialog(property)}
                          title="Generate cash offer letter"
                          className="bg-primary"
                        >
                          Offer Letter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(property)}
                          title="Edit property"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/property/${property.slug}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPropertyLink(property.slug)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQRGenerator(property.slug)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNotesDialog(property.id)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPropertyForImage(property.id)}
                          title="Upload Image"
                        >
                          📷
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPropertyForTags(property.id)}
                          title="Manage Tags"
                        >
                          🏷️
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPropertyForApproval(property.id)}
                          title="Approve/Reject"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPropertyForAirbnb(property.id)}
                          title="Check Airbnb"
                        >
                          🏠
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPropertyForComparison(property.id)}
                          title="AI Price Comparison"
                        >
                          📊
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
                <Button variant="outline" size="sm" onClick={() => setIsTemplatesDialogOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <CampaignExport />
              </div>
            </div>
            
            <SequenceManager />
            
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <ResponseTimeAnalytics />
              <CampaignAnalytics />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Email Campaigns</h3>
              <EmailCampaignStats />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <ChannelAnalytics />
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">A/B Test Results</h2>
              <div className="bg-card rounded-lg border border-border p-6">
                <ABTestDashboard />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs - outside tabs */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Property Analytics & Notes</DialogTitle>
              <DialogDescription>
                Track analytics, communication and follow-ups for this property
              </DialogDescription>
            </DialogHeader>
            
            {selectedPropertyId && (
              <div className="mb-6">
                <PropertyAnalytics propertyId={selectedPropertyId} />
              </div>
            )}

            <div className="space-y-4">
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="noteText">Note</Label>
                  <Textarea
                    id="noteText"
                    value={noteFormData.noteText}
                    onChange={(e) => setNoteFormData({...noteFormData, noteText: e.target.value})}
                    placeholder="Add a note..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={noteFormData.followUpDate}
                    onChange={(e) => setNoteFormData({...noteFormData, followUpDate: e.target.value})}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Note"}
                </Button>
              </form>

              <div className="space-y-2">
                <h3 className="font-semibold">Previous Notes</h3>
                {propertyNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg">
                    <p>{note.note_text}</p>
                    {note.follow_up_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Follow up: {new Date(note.follow_up_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update property information and internal tracking details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-address">Property Address</Label>
                    <Input
                      id="edit-address"
                      value={editFormData.address || ""}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editFormData.city || ""}
                      onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={editFormData.state || ""}
                      onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-zip">ZIP Code</Label>
                    <Input
                      id="edit-zip"
                      value={editFormData.zip_code || ""}
                      onChange={(e) => setEditFormData({...editFormData, zip_code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-estimated">Estimated Value</Label>
                    <Input
                      id="edit-estimated"
                      type="number"
                      value={editFormData.estimated_value || ""}
                      onChange={(e) => setEditFormData({...editFormData, estimated_value: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cash" className="text-sm font-semibold text-green-700">💰 Cash Offer (Main Amount)</Label>
                    <Input
                      id="edit-cash"
                      type="number"
                      value={editFormData.cash_offer_amount || ""}
                      onChange={(e) => setEditFormData({...editFormData, cash_offer_amount: parseFloat(e.target.value)})}
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-min-offer" className="text-sm">Min Offer (Optional)</Label>
                    <Input
                      id="edit-min-offer"
                      type="number"
                      value={(editFormData as any).min_offer_amount || ""}
                      onChange={(e) => setEditFormData({...editFormData, min_offer_amount: parseFloat(e.target.value)} as any)}
                      placeholder="Lower range"
                      className="border-blue-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-max-offer" className="text-sm">Max Offer (Optional)</Label>
                    <Input
                      id="edit-max-offer"
                      type="number"
                      value={(editFormData as any).max_offer_amount || ""}
                      onChange={(e) => setEditFormData({...editFormData, max_offer_amount: parseFloat(e.target.value)} as any)}
                      placeholder="Upper range"
                      className="border-blue-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-image">Property Image URL</Label>
                    <Input
                      id="edit-image"
                      value={editFormData.property_image_url || ""}
                      onChange={(e) => setEditFormData({...editFormData, property_image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Owner Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-owner-name">Owner Name</Label>
                    <Input
                      id="edit-owner-name"
                      value={editFormData.owner_name || ""}
                      onChange={(e) => setEditFormData({...editFormData, owner_name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-owner-address">Owner Address</Label>
                    <Input
                      id="edit-owner-address"
                      value={editFormData.owner_address || ""}
                      onChange={(e) => setEditFormData({...editFormData, owner_address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-owner-phone">Owner Phone</Label>
                    <Input
                      id="edit-owner-phone"
                      value={editFormData.owner_phone || ""}
                      onChange={(e) => setEditFormData({...editFormData, owner_phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-neighborhood">Neighborhood</Label>
                    <Input
                      id="edit-neighborhood"
                      value={editFormData.neighborhood || ""}
                      onChange={(e) => setEditFormData({...editFormData, neighborhood: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Tracking & Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-origem">Origem (Origin)</Label>
                    <Input
                      id="edit-origem"
                      value={editFormData.origem || ""}
                      onChange={(e) => setEditFormData({...editFormData, origem: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-carta">Carta (Letter)</Label>
                    <Input
                      id="edit-carta"
                      value={editFormData.carta || ""}
                      onChange={(e) => setEditFormData({...editFormData, carta: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-evaluation">Evaluation</Label>
                    <Input
                      id="edit-evaluation"
                      value={editFormData.evaluation || ""}
                      onChange={(e) => setEditFormData({...editFormData, evaluation: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-focar">FOCAR</Label>
                    <Input
                      id="edit-focar"
                      value={editFormData.focar || ""}
                      onChange={(e) => setEditFormData({...editFormData, focar: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-comparative">Comparative Price</Label>
                    <Input
                      id="edit-comparative"
                      type="number"
                      value={editFormData.comparative_price || ""}
                      onChange={(e) => setEditFormData({...editFormData, comparative_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-zillow">Zillow URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-zillow"
                        value={editFormData.zillow_url || ""}
                        onChange={(e) => setEditFormData({...editFormData, zillow_url: e.target.value})}
                        placeholder="https://zillow.com/..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editFormData.zillow_url && window.open(editFormData.zillow_url, '_blank')}
                        disabled={!editFormData.zillow_url}
                        className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-300"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Open Zillow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Flags</h3>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-answer-flag"
                      checked={editFormData.answer_flag || false}
                      onCheckedChange={(checked) => setEditFormData({...editFormData, answer_flag: checked as boolean})}
                    />
                    <Label htmlFor="edit-answer-flag" className="cursor-pointer">
                      Answer Flag
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-dnc-flag"
                      checked={editFormData.dnc_flag || false}
                      onCheckedChange={(checked) => setEditFormData({...editFormData, dnc_flag: checked as boolean})}
                    />
                    <Label htmlFor="edit-dnc-flag" className="cursor-pointer">
                      DNC Flag (Do Not Call)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProperty} disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Property"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <CashOfferDialog
          property={selectedPropertyForOffer}
          open={isOfferDialogOpen}
          onOpenChange={setIsOfferDialogOpen}
        />

        <EmailCampaignDialog
          properties={properties.filter(p => selectedProperties.includes(p.id))}
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          onOpenSettings={() => setIsMarketingSettingsOpen(true)}
          onSuccess={() => {
            fetchProperties();
            setSelectedProperties([]);
          }}
        />

        <MarketingSettingsDialog
          open={isMarketingSettingsOpen}
          onOpenChange={setIsMarketingSettingsOpen}
        />

        <LeadSuggestionsDialog
          open={isSuggestionsDialogOpen}
          onOpenChange={setIsSuggestionsDialogOpen}
          propertyIds={selectedProperties}
          onRefresh={fetchProperties}
        />

        <StartCampaignDialog
          open={isCampaignDialogOpen}
          onOpenChange={setIsCampaignDialogOpen}
          propertyIds={selectedProperties}
          onCampaignSent={() => {
            fetchProperties();
            setSelectedProperties([]);
          }}
          onOpenSettings={() => {
            setIsCampaignDialogOpen(false);
            setIsMarketingSettingsOpen(true);
          }}
        />
        
        <CampaignTemplatesDialog
          open={isTemplatesDialogOpen}
          onOpenChange={setIsTemplatesDialogOpen}
        />

        <CampaignPreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
          propertyIds={selectedProperties}
          onConfirm={handleConfirmCampaign}
        />

        <BatchOfferPrintDialog
          properties={properties.filter(p => selectedProperties.includes(p.id))}
          open={isBatchPrintDialogOpen}
          onOpenChange={setIsBatchPrintDialogOpen}
        />
        <StartSequenceDialog
          open={isSequenceDialogOpen}
          onOpenChange={setIsSequenceDialogOpen}
          selectedProperties={properties.filter(p => selectedProperties.includes(p.id)).map(p => ({ id: p.id, address: p.address, city: p.city }))}
        />

        {/* NEW - Orlando Integration Dialogs */}
        {selectedPropertyForImage && (() => {
          const prop = properties.find(p => p.id === selectedPropertyForImage);
          return prop ? (
            <Dialog open={!!selectedPropertyForImage} onOpenChange={(open) => !open && setSelectedPropertyForImage(null)}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Property Image</DialogTitle>
                  <DialogDescription>Upload a photo for {prop.address}</DialogDescription>
                </DialogHeader>
                <PropertyImageUpload
                  propertyId={selectedPropertyForImage}
                  propertySlug={prop.slug}
                  currentImageUrl={prop.property_image_url}
                  onImageUploaded={() => {
                    fetchProperties();
                    setSelectedPropertyForImage(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : null;
        })()}

        {selectedPropertyForTags && (() => {
          const prop = properties.find(p => p.id === selectedPropertyForTags);
          return prop ? (
            <Dialog open={!!selectedPropertyForTags} onOpenChange={(open) => !open && setSelectedPropertyForTags(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Manage Property Tags</DialogTitle>
                  <DialogDescription>Add tags to categorize {prop.address}</DialogDescription>
                </DialogHeader>
                <PropertyTagsManager
                  propertyId={selectedPropertyForTags}
                  currentTags={(prop as any).tags || []}
                  onTagsUpdated={() => {
                    fetchProperties();
                    setSelectedPropertyForTags(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : null;
        })()}

        {(() => {
          const prop = selectedPropertyForApproval ? properties.find(p => p.id === selectedPropertyForApproval) : null;
          return (
            <PropertyApprovalDialog
              propertyId={selectedPropertyForApproval || ""}
              propertyAddress={prop?.address || ""}
              currentStatus={prop?.approval_status || "pending"}
              open={!!selectedPropertyForApproval}
              onOpenChange={(open) => {
                if (!open) setSelectedPropertyForApproval(null);
              }}
              onStatusChange={() => {
                fetchProperties();
                setSelectedPropertyForApproval(null);
              }}
            />
          );
        })()}

        {(() => {
          const prop = selectedPropertyForAirbnb ? properties.find(p => p.id === selectedPropertyForAirbnb) : null;
          return (
            <AirbnbEligibilityChecker
              propertyId={selectedPropertyForAirbnb || ""}
              propertyAddress={prop?.address || ""}
              city={prop?.city || ""}
              state={prop?.state || ""}
              currentEligible={prop?.airbnb_eligible}
              currentRegulations={prop?.airbnb_regulations}
              currentNotes={prop?.airbnb_notes}
              lastCheckDate={prop?.airbnb_check_date}
              open={!!selectedPropertyForAirbnb}
              onOpenChange={(open) => {
                if (!open) setSelectedPropertyForAirbnb(null);
              }}
              onCheckComplete={() => {
                fetchProperties();
                setSelectedPropertyForAirbnb(null);
              }}
            />
          );
        })()}

        {selectedPropertyForComparison && (() => {
          const property = properties.find(p => p.id === selectedPropertyForComparison);
          return property ? (
            <PropertyComparison
              propertyId={selectedPropertyForComparison}
              address={property.address}
              city={property.city}
              state={property.state}
              zipCode={property.zip_code}
              estimatedValue={property.estimated_value}
              cashOfferAmount={property.cash_offer_amount}
              onClose={() => setSelectedPropertyForComparison(null)}
            />
          ) : null;
        })()}

        {/* NEW - Bulk Import Dialog */}
        <BulkImportDialog
          open={isBulkImportDialogOpen}
          onOpenChange={setIsBulkImportDialogOpen}
          onImportComplete={fetchProperties}
        />

        {/* NEW - Gemini API Key Dialog */}
        <GeminiAPIKeyDialog
          open={isGeminiAPIKeyDialogOpen}
          onOpenChange={setIsGeminiAPIKeyDialogOpen}
        />

        {/* Batch Review Mode Dialog */}
        <BatchReviewMode
          open={isBatchReviewOpen}
          onOpenChange={setIsBatchReviewOpen}
          properties={filteredProperties}
          onApprove={async (propertyId: string) => {
            // Update approval status to approved
            const { error } = await supabase
              .from('properties')
              .update({
                approval_status: 'approved',
                approved_by: userId,
                approved_by_name: userName,
                approved_at: new Date().toISOString()
              } as any)
              .eq('id', propertyId);

            if (error) {
              toast({
                title: "Error",
                description: "Failed to approve property",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Property approved",
              });
              fetchProperties();
            }
          }}
          onReject={async (propertyId: string, reason?: string) => {
            // Update approval status to rejected
            const { error } = await supabase
              .from('properties')
              .update({
                approval_status: 'rejected',
                rejection_reason: reason || null,
                approved_by: userId,
                approved_by_name: userName,
                approved_at: new Date().toISOString()
              } as any)
              .eq('id', propertyId);

            if (error) {
              toast({
                title: "Error",
                description: "Failed to reject property",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Property rejected",
              });
              fetchProperties();
            }
          }}
          onViewAnalysis={(propertyId: string) => {
            setSelectedPropertyForComparison(propertyId);
          }}
        />
      </main>
      
      <BulkActionsBar
        selectedCount={selectedProperties.length}
        onClearSelection={() => setSelectedProperties([])}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
        onGenerateQRCodes={handleGenerateQRCodes}
        onPrintOffers={handleBulkPrintOffers}
        onStartCampaign={handleStartCampaign}
        onAISuggestions={handleAISuggestions}
        onStartSequence={() => setIsSequenceDialogOpen(true)}
      />
      
      <AdminChatBot />
      </div>
    </>
  );
};

export default Admin;
