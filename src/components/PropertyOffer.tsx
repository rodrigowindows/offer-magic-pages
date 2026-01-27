/**
 * Property Offer Component
 * Displays a professional cash offer for property owners
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign,
  Clock,
  Shield,
  Home,
  CheckCircle,
  Download,
  Phone,
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';

interface PropertyOfferProps {
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    offerAmount: number;
    estimatedValue?: number;
    closingDays: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
  onAcceptOffer?: (propertyId: string, offerAmount: number) => void;
  onContactQuestions?: (propertyId: string) => void;
  onDownloadPDF?: (propertyId: string) => void;
  showContactButtons?: boolean;
  propertyUrl?: string;
}

export const PropertyOffer = ({
  property,
  onAcceptOffer,
  onContactQuestions,
  onDownloadPDF,
  showContactButtons = true,
  propertyUrl
}: PropertyOfferProps) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAcceptOffer = () => {
    setIsAccepted(true);
    onAcceptOffer?.(property.id, property.offerAmount);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await onDownloadPDF?.(property.id);
    } finally {
      setIsDownloading(false);
    }
  };

  const savings = property.estimatedValue
    ? property.estimatedValue - property.offerAmount
    : 0;

  // Create property slug for URL
  const createPropertySlug = (address: string, city: string) => {
    return `${address.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')}-${city.toLowerCase()}`;
  };

  const propertySlug = createPropertySlug(property.address, property.city);
  const offerUrl = propertyUrl || `${window.location.origin}/property/${propertySlug}?src=offer`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Offer Card - Simplified Format */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 text-white p-4 rounded-full">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
            Your Fair Cash Offer
          </CardTitle>
          <CardTitle className="text-4xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(property.offerAmount)}
          </CardTitle>
          <CardDescription className="text-xl mt-2">
            For {property.address} {property.city}, {property.state}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Benefits - Simplified */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Close in {property.closingDays} Days</p>
            <p className="text-base text-muted-foreground">Fast closing guaranteed</p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">No Repairs Needed</p>
            <p className="text-base text-muted-foreground">We buy as-is</p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">No Realtor Fees</p>
            <p className="text-base text-muted-foreground">Save thousands</p>
          </div>

          {/* Property Link */}
          {offerUrl && (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Your personalized offer link:
              </p>
              <a
                href={offerUrl}
                className="text-blue-600 dark:text-blue-400 underline break-all text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {offerUrl}
              </a>
            </div>
          )}

          {/* Action Buttons */}
          {showContactButtons && (
            <div className="space-y-3">
              {!isAccepted ? (
                <>
                  <Button
                    onClick={handleAcceptOffer}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Accept This Offer
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => onContactQuestions?.(property.id)}
                      variant="outline"
                      className="py-3"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      I Have Questions
                    </Button>

                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="py-3"
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </>
              ) : (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Offer Accepted!</strong> We'll be in touch within 24 hours to proceed with closing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Terms */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>This offer is valid for 30 days from the date shown above.</p>
            <p>All offers are subject to property inspection and title search.</p>
            <p>Contact us immediately if you have any questions.</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Accept the offer</p>
                <p className="text-sm text-gray-600">Click "Accept This Offer" above</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Property inspection</p>
                <p className="text-sm text-gray-600">We'll schedule a quick walkthrough</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Title search & closing</p>
                <p className="text-sm text-gray-600">Fast {property.closingDays}-day closing process</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Get paid</p>
                <p className="text-sm text-gray-600">Cash payment at closing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

        <CardContent className="space-y-6">
          {/* Property Address */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
              <MapPin className="h-5 w-5" />
              <span className="font-semibold text-lg">
                {property.address}
              </span>
            </div>
            <p className="text-gray-500">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>

          <Separator />

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Close in {property.closingDays} Days
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Fast closing guaranteed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  No Repairs Needed
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  We buy as-is
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Home className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  No Realtor Fees
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Save thousands
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <CheckCircle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Cash Buyer
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  No financing contingencies
                </p>
              </div>
            </div>
          </div>

          {/* Savings Highlight */}
          {savings > 0 && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Save {formatCurrency(savings)}</strong> compared to traditional selling!
              </AlertDescription>
            </Alert>
          )}

          {/* Property Details */}
          {(property.propertyType || property.bedrooms || property.bathrooms || property.squareFeet) && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Property Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {property.propertyType && (
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                )}
                {property.bedrooms && (
                  <div>
                    <p className="text-gray-500">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div>
                    <p className="text-gray-500">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                )}
                {property.squareFeet && (
                  <div>
                    <p className="text-gray-500">Sq Ft</p>
                    <p className="font-medium">{property.squareFeet.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showContactButtons && (
            <div className="space-y-3">
              {!isAccepted ? (
                <>
                  <Button
                    onClick={handleAcceptOffer}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Accept This Offer
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => onContactQuestions?.(property.id)}
                      variant="outline"
                      className="py-3"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      I Have Questions
                    </Button>

                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="py-3"
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Offer Accepted!</strong> We'll be in touch within 24 hours to proceed with closing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Terms */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>This offer is valid for 30 days from the date shown above.</p>
            <p>All offers are subject to property inspection and title search.</p>
            <p>Contact us immediately if you have any questions.</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Accept the offer</p>
                <p className="text-sm text-gray-600">Click "Accept This Offer" above</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Property inspection</p>
                <p className="text-sm text-gray-600">We'll schedule a quick walkthrough</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Title search & closing</p>
                <p className="text-sm text-gray-600">Fast {property.closingDays}-day closing process</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Get paid</p>
                <p className="text-sm text-gray-600">Cash payment at closing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};