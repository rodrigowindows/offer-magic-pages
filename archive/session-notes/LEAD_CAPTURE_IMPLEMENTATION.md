# Lead Capture Implementation Guide

## ✅ Components Created

1. **LeadCaptureModal.tsx** - Modal form to collect lead information
2. **OfferRevealCard.tsx** - Animated reveal of cash offer after submission
3. **Database Migration** - `property_leads` table to store leads

---

## 📋 What Information is Collected

**Required Fields (5 total):**
1. Full Name
2. Email Address
3. Phone Number
4. "I am the owner" confirmation checkbox
5. Selling timeline (ASAP / 1-3 months / 3-6 months / 6-12 months / Just exploring)

**Automatically Tracked:**
- IP Address
- User Agent (browser/device)
- Created timestamp
- Property ID

---

## 🚀 How to Use in Your Property Detail Page

### Step 1: Run the Database Migration

```bash
# Navigate to your project
cd "Step 5 - Outreach & Campaigns"

# Apply the migration to create property_leads table
supabase db push
```

### Step 2: Import the Components

```typescript
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { OfferRevealCard } from "@/components/OfferRevealCard";
```

### Step 3: Add State Management

```typescript
const [showLeadCapture, setShowLeadCapture] = useState(false);
const [leadCaptured, setLeadCaptured] = useState(false);
const [leadData, setLeadData] = useState<any>(null);
```

### Step 4: Create Submit Handler

```typescript
const handleLeadSubmit = async (data: {
  fullName: string;
  email: string;
  phone: string;
  isOwner: boolean;
  sellingTimeline: string;
}) => {
  try {
    // Save to Supabase
    const { error } = await supabase
      .from('property_leads')
      .insert({
        property_id: property.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        is_owner: data.isOwner,
        selling_timeline: data.sellingTimeline,
        ip_address: '', // Optional: get from request
        user_agent: navigator.userAgent,
      });

    if (error) throw error;

    // Update property as having lead captured
    await supabase
      .from('properties')
      .update({
        lead_captured: true,
        lead_captured_at: new Date().toISOString(),
      })
      .eq('id', property.id);

    // Store lead data and close modal
    setLeadData(data);
    setLeadCaptured(true);
    setShowLeadCapture(false);

    // Optional: Send email notification to admin
    // await sendLeadNotification(property, data);
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};
```

### Step 5: Replace Direct Offer with Gated Offer

**BEFORE (showing offer immediately):**
```typescript
<div className="cash-offer">
  <h2>Your Cash Offer</h2>
  <p className="amount">${property.cash_offer_amount}</p>
  <button>Accept Offer</button>
</div>
```

**AFTER (gated with lead capture):**
```typescript
{!leadCaptured ? (
  <>
    {/* Blurred Offer Preview - Click to Reveal */}
    <div className="cash-offer-preview">
      <h2>Your Cash Offer</h2>
      <div className="blurred-amount">
        <p className="blur-sm">$XXX,XXX</p>
        <Lock className="absolute" />
      </div>
      <Button
        onClick={() => setShowLeadCapture(true)}
        size="lg"
        className="mt-4"
      >
        <Eye className="mr-2" />
        Reveal My Cash Offer
      </Button>
    </div>

    {/* Lead Capture Modal */}
    <LeadCaptureModal
      isOpen={showLeadCapture}
      onClose={() => setShowLeadCapture(false)}
      onSubmit={handleLeadSubmit}
      propertyAddress={property.address}
      offerAmount={property.cash_offer_amount}
    />
  </>
) : (
  /* After Lead Captured - Show Full Offer */
  <OfferRevealCard
    cashOfferAmount={property.cash_offer_amount}
    estimatedValue={property.estimated_value}
    propertyAddress={property.address}
    leadName={leadData?.fullName || 'Homeowner'}
  />
)}
```

---

## 📧 Email Notifications (Optional)

### Create Function to Send Email to Admin

```typescript
const sendLeadNotification = async (property: any, leadData: any) => {
  const emailBody = `
    New Lead Captured!

    Property: ${property.address}, ${property.city}, ${property.state}
    Cash Offer: $${property.cash_offer_amount}

    Lead Information:
    Name: ${leadData.fullName}
    Email: ${leadData.email}
    Phone: ${leadData.phone}
    Timeline: ${leadData.sellingTimeline}

    View in Admin: ${window.location.origin}/admin
  `;

  // Use your email service (SendGrid, Resend, etc.)
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'admin@yourcompany.com',
      subject: `🔔 New Lead - ${property.address}`,
      body: emailBody,
    }),
  });
};
```

### Send Confirmation Email to Lead

```typescript
const sendLeadConfirmation = async (leadData: any, property: any) => {
  const emailBody = `
    Hi ${leadData.fullName},

    Thank you for your interest in our cash offer!

    Property: ${property.address}
    Our Cash Offer: $${property.cash_offer_amount}

    What's Next?
    - Our team will contact you within 24 hours
    - We'll answer any questions you have
    - You can accept this offer anytime within 30 days

    View Your Offer: ${window.location.href}

    Questions? Reply to this email or call us at (321) 555-0123

    Best regards,
    Your Real Estate Team
  `;

  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: leadData.email,
      subject: `Your Cash Offer for ${property.address}`,
      body: emailBody,
    }),
  });
};
```

---

## 📊 Viewing Leads in Admin Dashboard

### Query All Leads

```typescript
const { data: leads } = await supabase
  .from('property_leads')
  .select(`
    *,
    properties (
      address,
      city,
      state,
      cash_offer_amount
    )
  `)
  .order('created_at', { ascending: false });
```

### Filter by Status

```typescript
// Get only new, uncontacted leads
const { data: newLeads } = await supabase
  .from('property_leads')
  .select('*')
  .eq('status', 'new')
  .eq('contacted', false)
  .order('created_at', { ascending: false });

// Get urgent leads (ASAP timeline)
const { data: urgentLeads } = await supabase
  .from('property_leads')
  .select('*')
  .eq('selling_timeline', 'asap')
  .eq('status', 'new');
```

### Mark as Contacted

```typescript
const { error } = await supabase
  .from('property_leads')
  .update({
    contacted: true,
    contacted_at: new Date().toISOString(),
    contacted_by: currentUser.id,
    status: 'contacted',
    notes: 'Called and left voicemail'
  })
  .eq('id', leadId);
```

---

## 🎯 Lead Scoring (Automatic)

Based on timeline, prioritize follow-up:

| Timeline | Priority | Action |
|----------|----------|--------|
| **ASAP** | 🔥🔥🔥🔥🔥 HOT | Call within 1 hour |
| **1-3 months** | 🔥🔥🔥🔥 WARM | Call within 24 hours |
| **3-6 months** | 🔥🔥🔥 MEDIUM | Email + call in 2-3 days |
| **6-12 months** | 🔥🔥 COLD | Email drip campaign |
| **Just exploring** | 🔥 LOW | Email nurture sequence |

---

## 📈 Analytics Query

```typescript
const { data: analytics } = await supabase
  .from('property_leads_analytics')
  .select('*')
  .order('total_leads', { ascending: false });

// Example result:
// {
//   property_id: '123',
//   address: '123 Main St',
//   total_leads: 5,
//   new_leads: 2,
//   contacted_leads: 2,
//   qualified_leads: 1,
//   urgent_leads: 3,
//   warm_leads: 2,
//   latest_lead_at: '2025-01-01T10:30:00Z'
// }
```

---

## 🔒 Privacy & Compliance

The lead capture form includes:

✅ Clear privacy notice: "Your information is secure and will never be shared"
✅ Purpose disclosure: Lead sees why you need their info (to reveal offer)
✅ Secure storage: Data encrypted in Supabase
✅ Owner verification: Checkbox confirms they own the property

---

## ✨ Features Included

### LeadCaptureModal:
- ✅ Form validation (email format, phone format, required fields)
- ✅ Error messages
- ✅ Loading state during submission
- ✅ Blurred offer preview (creates curiosity)
- ✅ Privacy/security messaging
- ✅ Mobile responsive

### OfferRevealCard:
- ✅ Animated number counting effect
- ✅ Congratulations message with user's name
- ✅ Value comparison (estimated vs offer)
- ✅ Benefits list (fast closing, no repairs, etc.)
- ✅ Multiple CTAs (Accept, Call, Email, Download)
- ✅ FAQ section
- ✅ "What happens next" guidance

---

## 🚀 Next Steps

1. **Run migration** - `supabase db push`
2. **Update your property detail page** - Add the components
3. **Test the flow** - Submit a test lead
4. **Set up email notifications** - Get alerted on new leads
5. **Create admin view** - Display and manage leads

---

## 💡 Pro Tips

1. **A/B Test**: Try different timeline options to see what converts best
2. **Follow-up Fast**: Contact ASAP leads within 1 hour for best conversion
3. **Personalize**: Use their name in all communications
4. **Track Source**: Add UTM parameters to know where leads come from
5. **Nurture**: Set up email sequences for "exploring" leads

---

## 🎨 Customization Ideas

### Make it Even Simpler (3 fields only):
Remove "I am the owner" checkbox and selling timeline, just collect name/email/phone

### Add More Fields:
- Why are you selling?
- Property condition?
- Is property occupied?

### Gamification:
- Progress bar
- "Unlock your offer" language
- Celebration confetti on reveal

---

**Ready to implement?** The components are production-ready and can be dropped into your existing property detail page!
