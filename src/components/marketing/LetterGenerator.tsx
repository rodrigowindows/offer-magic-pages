/**
 * Letter Generator - Generate personalized cash offer letters
 * Integrates with CashOfferLetter component and property data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CashOfferLetter } from '@/components/CashOfferLetter';
import {
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Mail,
  RefreshCw,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string | null;
  owner_phone?: string | null;
  email1?: string | null;
  cash_offer_amount?: number | null;
  estimated_value?: number | null;
  matched_first_name?: string | null;
  matched_last_name?: string | null;
  approval_status?: string | null;
}

export const LetterGenerator = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [loading, setLoading] = useState(false);
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [minOffer, setMinOffer] = useState<string>('');
  const [maxOffer, setMaxOffer] = useState<string>('');
  const { toast} = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredProperties();
    const allIds = new Set(filtered.map(p => p.id));
    setSelectedProperties(allIds);
  };

  const deselectAll = () => {
    setSelectedProperties(new Set());
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCityFilter('all');
    setMinOffer('');
    setMaxOffer('');
    setSearchTerm('');
  };

  const hasActiveFilters = statusFilter !== 'all' || cityFilter !== 'all' || minOffer || maxOffer || searchTerm;

  const getFilteredProperties = () => {
    let filtered = properties;

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.address?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.owner_name?.toLowerCase().includes(term) ||
        p.owner_phone?.includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.approval_status === statusFilter);
    }

    // Apply city filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(p => p.city === cityFilter);
    }

    // Apply offer range filters
    if (minOffer) {
      const minValue = Number(minOffer);
      filtered = filtered.filter(p =>
        (p.cash_offer_amount || 0) >= minValue
      );
    }
    if (maxOffer) {
      const maxValue = Number(maxOffer);
      filtered = filtered.filter(p =>
        (p.cash_offer_amount || 0) <= maxValue
      );
    }

    return filtered;
  };

  const getOwnerName = (property: Property): string => {
    // Try matched names first
    if (property.matched_first_name && property.matched_last_name) {
      return `${property.matched_first_name} ${property.matched_last_name}`;
    }
    // Fallback to property.owner_name
    return property.owner_name || 'Homeowner';
  };

  const handlePrint = (property?: Property) => {
    if (property) {
      setPreviewProperty(property);
      // Wait for render then print
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      // Print all selected
      toast({
        title: 'Printing Letters',
        description: `Preparing ${selectedProperties.size} letters for printing...`,
      });
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  const handleDownloadPDF = async () => {
    toast({
      title: 'PDF Generation',
      description: 'Use your browser\'s Print → Save as PDF to download',
    });
    window.print();
  };

  const filteredProperties = getFilteredProperties();
  const selectedCount = selectedProperties.size;

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(properties.map(p => p.city).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Letter Generator</h2>
          <p className="text-muted-foreground">
            Generate personalized cash offer letters for your properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(v: 'en' | 'es') => setLanguage(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchProperties} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and Selection Row */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by address, city, owner name, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="default" onClick={selectAll}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Select All ({filteredProperties.length})
                </Button>
                <Button variant="outline" size="default" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">City</Label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {uniqueCities.map(city => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Offer Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min Offer</Label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={minOffer}
                    onChange={(e) => setMinOffer(e.target.value)}
                  />
                </div>

                {/* Max Offer Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Offer</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxOffer}
                    onChange={(e) => setMaxOffer(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Badge variant="default" className="text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {selectedCount} {selectedCount === 1 ? 'letter' : 'letters'} selected
              </Badge>
              <div className="flex items-center gap-2">
                <Button onClick={() => handlePrint()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Selected
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={filteredProperties.length > 0 && selectedProperties.size === filteredProperties.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAll();
                  } else {
                    deselectAll();
                  }
                }}
                className="mt-1"
              />
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  Select properties to generate letters ({filteredProperties.length} found)
                </CardDescription>
              </div>
            </div>
            {selectedCount > 0 && (
              <Badge variant="default" className="text-sm">
                {selectedCount} selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProperties.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No properties found matching your search' : 'No properties available'}
              </div>
            )}

            {filteredProperties.map((property) => {
              const isSelected = selectedProperties.has(property.id);
              const ownerName = getOwnerName(property);
              const hasOffer = property.cash_offer_amount;

              return (
                <div
                  key={property.id}
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProperty(property.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{property.address}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zip_code}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {ownerName}
                            </Badge>
                            {hasOffer ? (
                              <Badge variant="default" className="text-xs">
                                Offer: ${property.cash_offer_amount?.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No offer yet
                              </Badge>
                            )}
                            {property.approval_status === 'approved' && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                ✓ Approved
                              </Badge>
                            )}
                            {property.approval_status === 'pending' && (
                              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                                ⏳ Pending
                              </Badge>
                            )}
                            {property.approval_status === 'rejected' && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                ✗ Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewProperty(property)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePrint(property)}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal/Section */}
      {previewProperty && (
        <div className="fixed inset-0 bg-background/95 z-50 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Letter Preview</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handlePrint(previewProperty)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print This Letter
                </Button>
                <Button variant="outline" onClick={() => setPreviewProperty(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
            <CashOfferLetter
              address={previewProperty.address}
              city={previewProperty.city}
              state={previewProperty.state}
              zipCode={previewProperty.zip_code}
              estimatedValue={previewProperty.estimated_value || 0}
              propertySlug={previewProperty.slug}
              ownerName={getOwnerName(previewProperty)}
              phone={previewProperty.owner_phone}
              email={previewProperty.email1}
              source="letter"
              language={language}
              offerConfig={{
                type: 'fixed',
                fixedAmount: previewProperty.cash_offer_amount,
                estimatedValue: previewProperty.estimated_value || 0,
              }}
            />
          </div>
        </div>
      )}

      {/* Print View - Hidden on screen, shown when printing */}
      <div className="hidden print:block">
        {Array.from(selectedProperties).map((propertyId, index) => {
          const property = properties.find(p => p.id === propertyId);
          if (!property) return null;

          return (
            <div key={property.id} className={index > 0 ? 'page-break-before' : ''}>
              <CashOfferLetter
                address={property.address}
                city={property.city}
                state={property.state}
                zipCode={property.zip_code}
                estimatedValue={property.estimated_value || 0}
                propertySlug={property.slug}
                ownerName={getOwnerName(property)}
                phone={property.owner_phone}
                email={property.email1}
                source="letter"
                language={language}
                offerConfig={{
                  type: 'fixed',
                  fixedAmount: property.cash_offer_amount,
                  estimatedValue: property.estimated_value || 0,
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
};
