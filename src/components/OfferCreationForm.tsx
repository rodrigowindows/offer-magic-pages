/**
 * Offer Creation Form
 * Comprehensive form for creating new property cash offers
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Send,
  Calculator,
  Home,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Bed,
  Bath,
  Square,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PropertyOfferService, type PropertyOfferData } from '@/services/propertyOfferService';
import { useToast } from '@/hooks/use-toast';

interface OfferCreationFormProps {
  onBack?: () => void;
  onSave?: (offer: PropertyOfferData) => void;
  onSend?: (offer: PropertyOfferData) => void;
  initialData?: Partial<PropertyOfferData>;
}

export const OfferCreationForm = ({
  onBack,
  onSave,
  onSend,
  initialData
}: OfferCreationFormProps) => {
  const [formData, setFormData] = useState({
    // Property Information
    address: initialData?.property?.address || '',
    city: initialData?.property?.city || '',
    state: initialData?.property?.state || '',
    zipCode: initialData?.property?.zipCode || '',
    propertyType: initialData?.property?.propertyType || '',
    bedrooms: initialData?.property?.bedrooms || '',
    bathrooms: initialData?.property?.bathrooms || '',
    squareFeet: initialData?.property?.squareFeet || '',

    // Offer Details
    offerAmount: initialData?.offerAmount?.toString() || '',
    estimatedValue: initialData?.estimatedValue?.toString() || '',
    closingDays: initialData?.closingDays?.toString() || '14',

    // Recipient Information
    recipientName: initialData?.recipientName || '',
    recipientEmail: initialData?.recipientEmail || '',
    recipientPhone: initialData?.recipientPhone || '',

    // Agent Information
    agentName: initialData?.agentName || '',
    agentEmail: initialData?.agentEmail || '',
    agentPhone: initialData?.agentPhone || '',

    // Additional Options
    includeInspection: true,
    includeAppraisal: false,
    includeHomeWarranty: false,
    customTerms: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedValues, setCalculatedValues] = useState({
    offerPercentage: 0,
    estimatedProfit: 0,
    monthlyPayment: 0
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Recalculate values when offer amount or estimated value changes
    if (field === 'offerAmount' || field === 'estimatedValue') {
      calculateOfferMetrics();
    }
  };

  const calculateOfferMetrics = () => {
    const offerAmount = parseFloat(formData.offerAmount) || 0;
    const estimatedValue = parseFloat(formData.estimatedValue) || 0;

    if (estimatedValue > 0) {
      const offerPercentage = (offerAmount / estimatedValue) * 100;
      const estimatedProfit = estimatedValue - offerAmount;

      setCalculatedValues({
        offerPercentage: Math.round(offerPercentage * 100) / 100,
        estimatedProfit,
        monthlyPayment: 0 // Could calculate based on financing if needed
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required property fields
    if (!formData.address.trim()) newErrors.address = 'Property address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    // Required offer fields
    if (!formData.offerAmount.trim()) newErrors.offerAmount = 'Offer amount is required';
    if (parseFloat(formData.offerAmount) <= 0) newErrors.offerAmount = 'Offer amount must be greater than 0';

    // Required recipient fields
    if (!formData.recipientName.trim()) newErrors.recipientName = 'Recipient name is required';
    if (!formData.recipientEmail.trim()) newErrors.recipientEmail = 'Recipient email is required';
    if (!formData.recipientPhone.trim()) newErrors.recipientPhone = 'Recipient phone is required';

    // Required agent fields
    if (!formData.agentName.trim()) newErrors.agentName = 'Agent name is required';
    if (!formData.agentEmail.trim()) newErrors.agentEmail = 'Agent email is required';
    if (!formData.agentPhone.trim()) newErrors.agentPhone = 'Agent phone is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.recipientEmail && !emailRegex.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    }
    if (formData.agentEmail && !emailRegex.test(formData.agentEmail)) {
      newErrors.agentEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const offerData: Omit<PropertyOfferData, 'id' | 'status' | 'createdAt' | 'expiresAt'> = {
        propertyId: `prop_${Date.now()}`, // Generate temporary ID
        offerAmount: parseFloat(formData.offerAmount),
        estimatedValue: parseFloat(formData.estimatedValue) || parseFloat(formData.offerAmount),
        closingDays: parseInt(formData.closingDays),
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientPhone: formData.recipientPhone,
        agentName: formData.agentName,
        agentEmail: formData.agentEmail,
        agentPhone: formData.agentPhone,
        property: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          propertyType: formData.propertyType,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
          squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : undefined
        }
      };

      const result = await PropertyOfferService.createOffer(offerData);

      if (result.success && result.data) {
        toast({
          title: "Offer Saved",
          description: "Offer has been saved as draft"
        });
        onSave?.(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save offer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: "Error",
        description: "Failed to save offer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await PropertyOfferService.sendOfferCampaign({
        propertyId: `prop_${Date.now()}`,
        offerAmount: parseFloat(formData.offerAmount),
        estimatedValue: parseFloat(formData.estimatedValue) || parseFloat(formData.offerAmount),
        closingDays: parseInt(formData.closingDays),
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        agentName: formData.agentName,
        agentEmail: formData.agentEmail,
        agentPhone: formData.agentPhone
      });

      if (result.success) {
        toast({
          title: "Offer Sent",
          description: "Offer campaign has been sent successfully"
        });
        onSend?.(result.data!);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send offer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">Create Property Offer</h1>
          <p className="text-muted-foreground">Fill in the details to create a cash offer for a property</p>
        </div>
      </div>

      {/* Offer Calculator Preview */}
      {formData.offerAmount && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calculator className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Offer Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Offer Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseFloat(formData.offerAmount))}
                    </p>
                  </div>
                  {calculatedValues.offerPercentage > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">% of Estimated Value</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {calculatedValues.offerPercentage}%
                      </p>
                    </div>
                  )}
                  {calculatedValues.estimatedProfit > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Profit</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(calculatedValues.estimatedProfit)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form className="space-y-6">
        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
            <CardDescription>Enter the property details for this offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Orlando"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="FL"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="32801"
                    className={errors.zipCode ? 'border-red-500' : ''}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Family Home">Single Family Home</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Duplex">Duplex</SelectItem>
                    <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="squareFeet">Sq Ft</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    value={formData.squareFeet}
                    onChange={(e) => handleInputChange('squareFeet', e.target.value)}
                    placeholder="1200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Offer Details
            </CardTitle>
            <CardDescription>Set the terms and amount for this cash offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="offerAmount">Offer Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="offerAmount"
                    type="number"
                    value={formData.offerAmount}
                    onChange={(e) => handleInputChange('offerAmount', e.target.value)}
                    placeholder="70000"
                    className={`pl-10 ${errors.offerAmount ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.offerAmount && (
                  <p className="text-sm text-red-500 mt-1">{errors.offerAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estimatedValue">Estimated Value</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                    placeholder="85000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="closingDays">Closing Days</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="closingDays"
                    type="number"
                    value={formData.closingDays}
                    onChange={(e) => handleInputChange('closingDays', e.target.value)}
                    placeholder="14"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Offer Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInspection"
                    checked={formData.includeInspection}
                    onCheckedChange={(checked) => handleInputChange('includeInspection', checked as boolean)}
                  />
                  <Label htmlFor="includeInspection" className="text-sm">Include Inspection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAppraisal"
                    checked={formData.includeAppraisal}
                    onCheckedChange={(checked) => handleInputChange('includeAppraisal', checked as boolean)}
                  />
                  <Label htmlFor="includeAppraisal" className="text-sm">Include Appraisal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeHomeWarranty"
                    checked={formData.includeHomeWarranty}
                    onCheckedChange={(checked) => handleInputChange('includeHomeWarranty', checked as boolean)}
                  />
                  <Label htmlFor="includeHomeWarranty" className="text-sm">Include Home Warranty</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="customTerms">Custom Terms</Label>
              <Textarea
                id="customTerms"
                value={formData.customTerms}
                onChange={(e) => handleInputChange('customTerms', e.target.value)}
                placeholder="Any special terms or conditions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recipient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Recipient Information
            </CardTitle>
            <CardDescription>Details about the property owner receiving this offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientName">Full Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  placeholder="John Smith"
                  className={errors.recipientName ? 'border-red-500' : ''}
                />
                {errors.recipientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="recipientEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    placeholder="john.smith@email.com"
                    className={`pl-10 ${errors.recipientEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.recipientEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientEmail}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="recipientPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`pl-10 ${errors.recipientPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.recipientPhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientPhone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Agent Information
            </CardTitle>
            <CardDescription>Your contact information for this offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentName">Agent Name *</Label>
                <Input
                  id="agentName"
                  value={formData.agentName}
                  onChange={(e) => handleInputChange('agentName', e.target.value)}
                  placeholder="Sarah Johnson"
                  className={errors.agentName ? 'border-red-500' : ''}
                />
                {errors.agentName && (
                  <p className="text-sm text-red-500 mt-1">{errors.agentName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="agentEmail">Agent Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agentEmail"
                    type="email"
                    value={formData.agentEmail}
                    onChange={(e) => handleInputChange('agentEmail', e.target.value)}
                    placeholder="sarah@localcashbuyer.com"
                    className={`pl-10 ${errors.agentEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.agentEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.agentEmail}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="agentPhone">Agent Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agentPhone"
                    value={formData.agentPhone}
                    onChange={(e) => handleInputChange('agentPhone', e.target.value)}
                    placeholder="(555) 987-6543"
                    className={`pl-10 ${errors.agentPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.agentPhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.agentPhone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any additional information or notes about this offer</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Internal notes about this property or offer..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Offer'}
          </Button>
        </div>
      </form>
    </div>
  );
};