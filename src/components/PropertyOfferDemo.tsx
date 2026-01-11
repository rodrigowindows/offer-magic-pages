/**
 * Property Offer Demo
 * Example usage of the PropertyOffer component
 */

import { PropertyOffer } from './PropertyOffer';

export const PropertyOfferDemo = () => {
  // Example property data based on the user's offer
  const sampleProperty = {
    id: '144-washington-ave',
    address: '144 WASHINGTON AVE',
    city: 'EATONVILLE',
    state: 'FL',
    zipCode: '32751',
    offerAmount: 70000,
    estimatedValue: 85000, // Assuming some market value for savings calculation
    closingDays: 14,
    propertyType: 'Single Family Home',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200
  };

  const handleAcceptOffer = (propertyId: string, offerAmount: number) => {
    console.log('Offer accepted:', { propertyId, offerAmount });
    // Here you would typically:
    // 1. Update the database
    // 2. Send confirmation email
    // 3. Create a lead/follow-up record
    // 4. Track the conversion
  };

  const handleContactQuestions = (propertyId: string) => {
    console.log('Contact for questions:', propertyId);
    // Here you would typically:
    // 1. Open a contact modal
    // 2. Send to a CRM
    // 3. Schedule a call
  };

  const handleDownloadPDF = async (propertyId: string) => {
    console.log('Downloading PDF for:', propertyId);
    // Here you would typically:
    // 1. Generate a PDF with the offer details
    // 2. Include terms and conditions
    // 3. Add property photos if available
    // 4. Track the download event
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Property Cash Offer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Professional offer presentation for property owners
          </p>
        </div>

        <PropertyOffer
          property={sampleProperty}
          onAcceptOffer={handleAcceptOffer}
          onContactQuestions={handleContactQuestions}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* Additional demo information */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Demo Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Interactive Elements:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Accept Offer button</li>
                  <li>• Contact for Questions</li>
                  <li>• Download PDF option</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Integration:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Property details</li>
                  <li>• Savings calculation</li>
                  <li>• Closing timeline</li>
                  <li>• Market value comparison</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};