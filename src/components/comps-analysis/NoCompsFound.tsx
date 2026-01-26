/**
 * Component to display when no comparables are found
 * Shows different messages based on the reason (address not found, no results, etc.)
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Search, MapPin, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NoCompsFoundProps {
  addressNotFound?: boolean;
  noResultsFound?: boolean;
  apiError?: boolean;
  message?: string;
  address?: string;
  city?: string;
}

export const NoCompsFound = ({
  addressNotFound = false,
  noResultsFound = false,
  apiError = false,
  message,
  address,
  city,
}: NoCompsFoundProps) => {
  const getTitle = () => {
    if (addressNotFound) {
      return 'Address Not Found';
    }
    if (apiError) {
      return 'Error Fetching Comparables';
    }
    if (noResultsFound) {
      return 'No Comparables Found';
    }
    return 'No Comparables Available';
  };

  const getDescription = () => {
    if (message) {
      return message;
    }
    
    if (addressNotFound) {
      return `The address "${address || ''}, ${city || ''}" was not found in our property databases. Please verify the address and try again.`;
    }
    
    if (apiError) {
      return 'There was an error connecting to the property data services. Please try again later or contact support.';
    }
    
    if (noResultsFound) {
      return `No comparable properties were found in this area. This may indicate:
- No recent sales in the specified radius
- Address not in property database
- API configuration issues`;
    }
    
    return 'No comparable properties are available for this address at this time.';
  };

  const getIcon = () => {
    if (addressNotFound) {
      return <MapPin className="h-5 w-5" />;
    }
    if (apiError) {
      return <AlertCircle className="h-5 w-5" />;
    }
    return <Search className="h-5 w-5" />;
  };

  const getVariant = (): "default" | "destructive" => {
    if (apiError) {
      return 'destructive';
    }
    return 'default';
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <Alert variant={getVariant()}>
          {getIcon()}
          <AlertTitle className="flex items-center gap-2">
            {getTitle()}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {getDescription()}
          </AlertDescription>
        </Alert>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            What can you do?
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {addressNotFound && (
              <>
                <li>Verify the address spelling and format</li>
                <li>Try using the full street name (e.g., "Street" instead of "St")</li>
                <li>Check if the ZIP code is correct</li>
                <li>Try a nearby address if this is a new construction</li>
              </>
            )}
            {noResultsFound && (
              <>
                <li>Try increasing the search radius</li>
                <li>Check if there are recent sales in this area</li>
                <li>Verify the property exists in public records</li>
              </>
            )}
            {apiError && (
              <>
                <li>Check your internet connection</li>
                <li>Try again in a few moments</li>
                <li>Contact support if the issue persists</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
