# Property Offer Management System

A comprehensive React/TypeScript system for creating, managing, and tracking property cash offers. This system provides a complete solution for real estate investors to generate professional offers, send them via email/SMS campaigns, and track responses.

## 🚀 Features

- **Interactive Offer Display**: Professional offer presentation with accept/questions/download buttons
- **Email & SMS Campaigns**: Automated multi-channel communication
- **PDF Generation**: Downloadable offer documents with professional formatting
- **Offer Management Dashboard**: Complete interface for managing all offers
- **Offer Creation Form**: Comprehensive form for creating new offers
- **Analytics & Tracking**: Performance metrics and conversion tracking
- **Campaign Integration**: Full integration with existing campaign systems

## 📦 Components

### Core Components

#### `PropertyOffer`
Main interactive offer display component with responsive design and action buttons.

```tsx
import { PropertyOffer } from '@/components/PropertyOffer';

<PropertyOffer
  property={{
    address: "144 WASHINGTON AVE",
    city: "EATONVILLE",
    state: "FL",
    zipCode: "32751",
    propertyType: "Single Family Home",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200
  }}
  onAcceptOffer={(id, amount) => handleAccept(id, amount)}
  onContactQuestions={(id) => handleQuestions(id)}
  onDownloadPDF={(id) => handleDownload(id)}
/>
```

#### `OfferManagementDashboard`
Complete dashboard for managing offers with analytics, filtering, and bulk operations.

```tsx
import { OfferManagementDashboard } from '@/components/OfferManagementDashboard';

<OfferManagementDashboard />
```

#### `OfferCreationForm`
Comprehensive form for creating new property offers with validation and calculations.

```tsx
import { OfferCreationForm } from '@/components/OfferCreationForm';

<OfferCreationForm
  onSave={(offer) => handleSave(offer)}
  onSend={(offer) => handleSend(offer)}
/>
```

#### `PropertyOfferDemo`
Example implementation showing how to use the PropertyOffer component.

```tsx
import { PropertyOfferDemo } from '@/components/PropertyOfferDemo';

<PropertyOfferDemo />
```

## 🔧 Services

### `PropertyOfferService`
Comprehensive service for offer lifecycle management.

#### Key Methods:

```typescript
import { PropertyOfferService } from '@/services/propertyOfferService';

// Create a new offer
const result = await PropertyOfferService.createOffer({
  propertyId: 'prop_123',
  offerAmount: 70000,
  estimatedValue: 85000,
  closingDays: 14,
  recipientName: 'John Smith',
  recipientEmail: 'john@email.com',
  recipientPhone: '(555) 123-4567',
  agentName: 'Sarah Johnson',
  agentEmail: 'sarah@agent.com',
  agentPhone: '(555) 987-6543'
});

// Send offer campaign
const campaignResult = await PropertyOfferService.sendOfferCampaign({
  propertyId: 'prop_123',
  offerAmount: 70000,
  // ... other offer details
});

// Accept an offer
await PropertyOfferService.acceptOffer('offer_123', 'user');

// Download PDF
await PropertyOfferService.downloadOfferPDF('offer_123');

// Get analytics
const analytics = await PropertyOfferService.getOfferAnalytics();
```

## 📧 Email Templates

### `generatePropertyOfferEmail`
Generates professional HTML email templates for property offers.

```typescript
import { generatePropertyOfferEmail } from '@/utils/emailTemplates';

const emailHtml = generatePropertyOfferEmail({
  property: {
    address: "144 WASHINGTON AVE",
    city: "EATONVILLE",
    state: "FL"
  },
  offerAmount: 70000,
  agentName: "Sarah Johnson",
  agentEmail: "sarah@localcashbuyer.com",
  agentPhone: "(555) 987-6543"
});
```

## 📄 PDF Generation

### `generatePropertyOfferPDF` & `downloadPropertyOfferPDF`
Creates downloadable PDF versions of property offers.

```typescript
import { generatePropertyOfferPDF, downloadPropertyOfferPDF } from '@/utils/pdfGenerator';

// Generate PDF blob
const pdfBlob = await generatePropertyOfferPDF(offerData);

// Or download directly
await downloadPropertyOfferPDF('offer_123');
```

## 🏗️ Installation & Setup

### Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2"
  }
}
```

### Environment Variables

Ensure your Supabase configuration is set up for database operations:

```typescript
// In your Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

## 🎨 Styling

The system uses Tailwind CSS for styling. All components are fully responsive and follow modern design principles.

### Key Design Features:
- **Responsive Grid Layouts**: Works on all screen sizes
- **Professional Color Scheme**: Green/blue theme for trust and professionalism
- **Interactive Elements**: Hover states and smooth transitions
- **Accessible Design**: Proper contrast ratios and keyboard navigation

## 📊 Analytics & Tracking

### Offer Metrics Tracked:
- Total offers created
- Conversion rates
- Average response time
- Offer status breakdown
- Campaign performance

### Analytics Dashboard Features:
- Real-time metrics updates
- Conversion funnel visualization
- Performance comparisons
- Export capabilities

## 🔄 Integration Points

### Campaign System Integration
The offer system integrates with existing campaign infrastructure:

```typescript
// Campaign logging
await PropertyOfferService.logCampaignEvent({
  offerId: 'offer_123',
  eventType: 'offer_sent',
  channel: 'email',
  recipient: 'john@email.com'
});
```

### Database Schema
Offers are stored with the following structure:

```typescript
interface PropertyOfferData {
  id: string;
  propertyId: string;
  offerAmount: number;
  estimatedValue: number;
  closingDays: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  property: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
}
```

## 🚀 Usage Examples

### Complete Offer Flow

```tsx
import React, { useState } from 'react';
import { OfferCreationForm } from '@/components/OfferCreationForm';
import { PropertyOffer } from '@/components/PropertyOffer';
import { PropertyOfferService } from '@/services/propertyOfferService';

export const OfferWorkflow = () => {
  const [currentStep, setCurrentStep] = useState<'create' | 'preview' | 'sent'>('create');
  const [currentOffer, setCurrentOffer] = useState(null);

  const handleOfferCreated = async (offerData) => {
    setCurrentOffer(offerData);
    setCurrentStep('preview');
  };

  const handleOfferSent = async (offerData) => {
    const result = await PropertyOfferService.sendOfferCampaign(offerData);
    if (result.success) {
      setCurrentStep('sent');
    }
  };

  return (
    <div>
      {currentStep === 'create' && (
        <OfferCreationForm
          onSave={handleOfferCreated}
          onSend={handleOfferSent}
        />
      )}

      {currentStep === 'preview' && currentOffer && (
        <div>
          <h2>Preview Your Offer</h2>
          <PropertyOffer
            property={currentOffer.property}
            onAcceptOffer={(id, amount) => {
              PropertyOfferService.acceptOffer(id, 'preview');
            }}
            onContactQuestions={(id) => {
              PropertyOfferService.handleOfferQuestions(id, 'email');
            }}
            onDownloadPDF={(id) => {
              PropertyOfferService.downloadOfferPDF(id);
            }}
          />
          <button onClick={() => handleOfferSent(currentOffer)}>
            Send This Offer
          </button>
        </div>
      )}

      {currentStep === 'sent' && (
        <div>
          <h2>Offer Sent Successfully!</h2>
          <p>Your offer has been sent and is being tracked.</p>
        </div>
      )}
    </div>
  );
};
```

## 🔧 Customization

### Custom Offer Templates
Create custom offer templates by extending the base components:

```tsx
// Custom offer template
export const PremiumOffer = ({ property, ...props }) => (
  <PropertyOffer
    property={property}
    customStyling={{
      backgroundColor: 'premium-gradient',
      fontFamily: 'serif'
    }}
    additionalBenefits={[
      'Premium closing services',
      'Home inspection included',
      'Extended due diligence period'
    ]}
    {...props}
  />
);
```

### Custom Email Templates
Extend the email template system:

```typescript
export const customEmailTemplate = (offerData: any) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #2563eb;">Custom Premium Offer</h1>
    ${generatePropertyOfferEmail(offerData)}
    <div style="background: #f8fafc; padding: 20px; margin-top: 20px;">
      <h3>Premium Benefits Include:</h3>
      <ul>
        <li>Priority processing</li>
        <li>Dedicated agent support</li>
        <li>Flexible closing dates</li>
      </ul>
    </div>
  </div>
`;
```

## 🐛 Troubleshooting

### Common Issues:

1. **PDF Generation Fails**
   - Ensure `jspdf` and `jspdf-autotable` are installed
   - Check browser compatibility for downloads

2. **Email Templates Not Rendering**
   - Verify HTML structure is valid
   - Check email client CSS support

3. **Database Connection Issues**
   - Verify Supabase configuration
   - Check network connectivity

4. **Component Not Rendering**
   - Ensure all required props are passed
   - Check for TypeScript compilation errors

## 📈 Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const OfferManagementDashboard = lazy(() => import('@/components/OfferManagementDashboard'));
const OfferCreationForm = lazy(() => import('@/components/OfferCreationForm'));
```

### Memoization
```typescript
// Memoize expensive calculations
const offerMetrics = useMemo(() => calculateOfferMetrics(offerData), [offerData]);
```

### Database Optimization
- Use proper indexing on offer queries
- Implement pagination for large offer lists
- Cache frequently accessed analytics data

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **Email Security**: No sensitive data in email templates
- **Database Security**: Proper access controls and encryption
- **File Security**: PDF generation doesn't execute user code

## 📝 License

This project is part of the Orlando property management system. See project license for details.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Update documentation for new features
5. Test components across different scenarios

## 📞 Support

For support or questions about the property offer system:
- Check the component documentation
- Review the service method signatures
- Test with the demo components
- Check existing campaign integration patterns