import { useState, useEffect } from "react";
import { ABTestDashboard } from "@/components/ABTestDashboard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, ExternalLink, Copy, QrCode, FileText, Settings, LayoutGrid, List, Rocket, BarChart3, FileDown } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
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
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedPropertyForOffer, setSelectedPropertyForOffer] = useState<Property | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isMarketingSettingsOpen, setIsMarketingSettingsOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProperties();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } else {
      setProperties((data || []) as Property[]);
    }
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
        })
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
    const selectedProps = properties.filter(p => selectedProperties.includes(p.id));
    
    // Generate QR code URLs for each property
    const qrCodeUrls = selectedProps.map(property => {
      const url = `${window.location.origin}/property/${property.slug}?src=letter`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=120&data=${encodeURIComponent(url)}`;
    });

    // Open a new page with all offer letters
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cash Offers - ${selectedProps.length} Properties</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: system-ui, -apple-system, sans-serif; padding: 0; background: white; }
              .offer-letter { 
                max-width: 800px; 
                margin: 0 auto 40px; 
                padding: 40px; 
                background: #fffef9; 
                border: 2px solid #ddd;
                page-break-after: always;
                page-break-inside: avoid;
                break-inside: avoid;
                position: relative;
              }
              .offer-letter:last-child { page-break-after: auto; }
              .header { text-align: center; margin-bottom: 25px; }
              .header h1 { font-size: 32px; font-weight: bold; color: #1a1a1a; margin-bottom: 8px; }
              .header p { font-size: 16px; color: #666; }
              .offer-box { 
                background: rgba(var(--primary-rgb, 59, 130, 246), 0.1); 
                border: 2px solid rgb(var(--primary-rgb, 59, 130, 246)); 
                border-radius: 8px; 
                padding: 25px; 
                text-align: center; 
                margin-bottom: 25px; 
              }
              .offer-amount { font-size: 52px; font-weight: bold; color: rgb(var(--primary-rgb, 59, 130, 246)); margin-bottom: 8px; }
              .offer-label { font-size: 16px; color: #666; margin-bottom: 4px; }
              .offer-subtitle { font-size: 13px; color: #666; }
              .offer-tagline { font-size: 20px; font-weight: 600; margin-top: 15px; color: #1a1a1a; }
              .benefits { margin-bottom: 25px; }
              .benefits h2 { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1a1a1a; }
              .benefits-grid { font-size: 12px; line-height: 1.4; }
              .benefits-grid p { margin-bottom: 0; }
              .cta { 
                background: rgba(var(--accent-rgb, 251, 191, 36), 0.2); 
                border: 2px solid rgb(var(--accent-rgb, 251, 191, 36)); 
                border-radius: 8px; 
                padding: 25px; 
                text-align: center; 
                margin-bottom: 25px; 
              }
              .cta h2 { font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #1a1a1a; }
              .cta .phone { font-size: 20px; margin-bottom: 8px; }
              .cta .phone strong { color: rgb(var(--primary-rgb, 59, 130, 246)); }
              .cta p { font-size: 14px; color: #666; margin-top: 8px; }
              .qr-section { margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd; }
              .qr-section p { font-size: 12px; color: #666; margin-bottom: 8px; }
              .qr-section img { max-width: 100px; height: auto; }
              .footer { text-align: center; padding-top: 15px; border-top: 2px solid #ddd; }
              .footer h3 { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #1a1a1a; }
              .footer p { font-size: 14px; color: #666; margin-bottom: 4px; }
              .footer .italic { font-style: italic; font-size: 12px; margin-top: 8px; }
              .no-print { display: block; text-align: center; margin: 20px; }
              @media print {
                @page { 
                  margin: 0.4in; 
                  size: letter;
                }
                body { 
                  padding: 0; 
                  margin: 0;
                  overflow: hidden;
                }
                .offer-letter { 
                  margin: 0 !important; 
                  padding: 30px !important;
                  border: none !important;
                  box-shadow: none !important;
                  page-break-after: always !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  position: relative;
                  overflow: hidden;
                  height: auto;
                  min-height: 0;
                }
                .offer-letter:last-child { page-break-after: auto !important; }
                .no-print { display: none !important; }
                .header { margin-bottom: 20px; }
                .offer-box { padding: 20px; margin-bottom: 20px; }
                .benefits { margin-bottom: 20px; }
                .cta { padding: 20px; margin-bottom: 20px; }
                .footer { padding-top: 15px; }
              }
            </style>
          </head>
          <body>
            <button class="no-print" onclick="window.print()" style="margin: 20px auto; display: block; padding: 10px 30px; font-size: 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Print All Offers</button>
            ${selectedProps.map((property, index) => `
              <div class="offer-letter">
                <div class="header">
                  <h1>CASH OFFER FOR Your Home!</h1>
                  <p>${property.address}, ${property.city}, ${property.state} ${property.zip_code}</p>
                </div>

                <div class="offer-box">
                  <div class="offer-amount">$${property.cash_offer_amount.toLocaleString()}</div>
                  <div class="offer-label">Cash Offer</div>
                  <div class="offer-subtitle">(Fair Market Value: $${property.estimated_value.toLocaleString()})</div>
                  <div class="offer-tagline">No repairs • No fees • Close in 7 days</div>
                </div>

                <div class="benefits">
                  <h2>We Help You:</h2>
                  <div class="benefits-grid">
                    <p style="white-space: nowrap;"><span style="color: rgb(var(--primary-rgb, 59, 130, 246));">✓</span> Stop tax foreclosure <span style="margin: 0 4px;">•</span> <span style="color: rgb(var(--primary-rgb, 59, 130, 246));">✓</span> Pay off your tax debt</p>
                    <p style="white-space: nowrap;"><span style="color: rgb(var(--primary-rgb, 59, 130, 246));">✓</span> Sell as-is (any condition) <span style="margin: 0 4px;">•</span> <span style="color: rgb(var(--primary-rgb, 59, 130, 246));">✓</span> You pick the date</p>
                  </div>
                </div>

                <div class="cta">
                  <h2>Just Reply "YES"</h2>
                  <div class="phone">Call: <strong>786 882 8251</strong></div>
                  <p>We'll send your official offer in writing — no pressure, no cost.</p>
                  
                  <div class="qr-section">
                    <p>Scan to view your offer online:</p>
                    <img src="${qrCodeUrls[index]}" alt="QR Code for ${property.address}" />
                    <p style="font-size: 12px; margin-top: 10px;">${window.location.origin}/property/${property.slug}</p>
                  </div>
                </div>

                <div class="footer">
                  <h3>MyLocalInvest</h3>
                  <p>Miami locals since 2015</p>
                  <p>info@mylocalinvest.com</p>
                  <p class="italic">Zero commissions. Zero closing costs. 100% confidential.</p>
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "Offers Ready to Print!",
      description: `Generated ${selectedProps.length} offer letters with QR codes`,
    });
  };

  const handleSendEmails = () => {
    setIsEmailDialogOpen(true);
  };

  const handleStartCampaign = () => {
    setIsCampaignDialogOpen(true);
  };

  const handleAISuggestions = () => {
    setIsSuggestionsDialogOpen(true);
  };

  const filteredProperties = filterStatus === 'all' 
    ? properties 
    : properties.filter(p => p.lead_status === filterStatus);

  const statusCounts = properties.reduce((acc, property) => {
    acc[property.lead_status] = (acc[property.lead_status] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus | 'all', number>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Property Management</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsMarketingSettingsOpen(true)} 
              variant="outline" 
              size="sm"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Marketing API
            </Button>
            <NotificationsPanel />
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* A/B Test Dashboard Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">A/B Test Results</h2>
          <div className="bg-card rounded-lg border border-border p-6">
            <ABTestDashboard />
          </div>
        </div>

        {/* Follow-Up Alerts */}
        <div className="mb-8">
          <FollowUpAlerts />
        </div>

        {/* Campaign Analytics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Campaign Analytics
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsTemplatesDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <CampaignExport />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <ResponseTimeAnalytics />
            <CampaignAnalytics />
          </div>
        </div>

        {/* Email Campaign Stats Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Email Campaigns</h2>
          <EmailCampaignStats />
        </div>

        <PropertyFilters 
          selectedStatus={filterStatus}
          onStatusChange={setFilterStatus}
          statusCounts={statusCounts}
        />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Your Properties</h2>
          <div className="flex gap-2">
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

          <TabsContent value="table">
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
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          </TabsContent>
        </Tabs>

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
                    <Label htmlFor="edit-cash">Cash Offer Amount</Label>
                    <Input
                      id="edit-cash"
                      type="number"
                      value={editFormData.cash_offer_amount || ""}
                      onChange={(e) => setEditFormData({...editFormData, cash_offer_amount: parseFloat(e.target.value)})}
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
                    <Input
                      id="edit-zillow"
                      value={editFormData.zillow_url || ""}
                      onChange={(e) => setEditFormData({...editFormData, zillow_url: e.target.value})}
                      placeholder="https://zillow.com/..."
                    />
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
      />
      
      <AdminChatBot />
    </div>
  );
};

export default Admin;
