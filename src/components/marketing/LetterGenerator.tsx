/**
 * Letter Generator - Generate personalized cash offer letters
 * Integrates with CashOfferLetter component and property data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  cash_offer_amount?: number;
  min_offer_amount?: number;
  max_offer_amount?: number;
  estimated_value?: number;
  skip_trace_data?: any;
}

export const LetterGenerator = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [loading, setLoading] = useState(false);
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
  const { toast } = useToast();

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

  const getFilteredProperties = () => {
    if (!searchTerm) return properties;

    const term = searchTerm.toLowerCase();
    return properties.filter(p =>
      p.address?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.owner_name?.toLowerCase().includes(term) ||
      p.owner_phone?.includes(term)
    );
  };

  const getOwnerName = (property: Property): string => {
    // Try skip_trace_data first
    if (property.skip_trace_data) {
      const skipTrace = property.skip_trace_data;
      if (skipTrace.owner_name) return skipTrace.owner_name;
      if (skipTrace.first_name && skipTrace.last_name) {
        return `${skipTrace.first_name} ${skipTrace.last_name}`;
      }
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
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All ({filteredProperties.length})
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
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
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            Select properties to generate letters ({filteredProperties.length} found)
          </CardDescription>
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
              const hasOffer = property.cash_offer_amount || property.min_offer_amount;

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
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {ownerName}
                            </Badge>
                            {hasOffer ? (
                              <Badge variant="default" className="text-xs">
                                Offer: ${(property.cash_offer_amount || property.min_offer_amount)?.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No offer yet
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
              email={previewProperty.owner_email}
              source="letter"
              language={language}
              offerConfig={{
                type: previewProperty.min_offer_amount ? 'range' : 'fixed',
                fixedAmount: previewProperty.cash_offer_amount,
                rangeMin: previewProperty.min_offer_amount,
                rangeMax: previewProperty.max_offer_amount,
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
                email={property.owner_email}
                source="letter"
                language={language}
                offerConfig={{
                  type: property.min_offer_amount ? 'range' : 'fixed',
                  fixedAmount: property.cash_offer_amount,
                  rangeMin: property.min_offer_amount,
                  rangeMax: property.max_offer_amount,
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
