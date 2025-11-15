import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, ExternalLink, Copy, QrCode, FileText } from "lucide-react";
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
import { z } from "zod";

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
  created_at: string;
  sms_sent: boolean;
  email_sent: boolean;
  letter_sent: boolean;
  card_sent: boolean;
  phone_call_made: boolean;
  meeting_scheduled: boolean;
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
  const [noteFormData, setNoteFormData] = useState({
    noteText: "",
    followUpDate: "",
  });

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
      setProperties(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Property Management</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Your Properties</h2>
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

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Cash Offer</TableHead>
                <TableHead>Estimated Value</TableHead>
                <TableHead>Communication</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No properties yet. Add your first property to get started!
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.address}, {property.city}, {property.state}
                    </TableCell>
                    <TableCell>${property.cash_offer_amount.toLocaleString()}</TableCell>
                    <TableCell>${property.estimated_value.toLocaleString()}</TableCell>
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

        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Property Notes</DialogTitle>
              <DialogDescription>
                Track communication and follow-ups for this property
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleNoteSubmit} className="space-y-4 border-b pb-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="noteText">Add Note *</Label>
                <Textarea
                  id="noteText"
                  value={noteFormData.noteText}
                  onChange={(e) => setNoteFormData({ ...noteFormData, noteText: e.target.value })}
                  placeholder="Enter your note here..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date (optional)</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={noteFormData.followUpDate}
                  onChange={(e) => setNoteFormData({ ...noteFormData, followUpDate: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding..." : "Add Note"}
              </Button>
            </form>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Previous Notes</h3>
              {propertyNotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No notes yet. Add your first note above.
                </p>
              ) : (
                propertyNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                    <p className="text-foreground">{note.note_text}</p>
                    {note.follow_up_date && (
                      <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded inline-block">
                        Follow-up: {new Date(note.follow_up_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
