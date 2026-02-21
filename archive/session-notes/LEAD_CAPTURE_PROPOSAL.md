# Lead Capture & Owner Information - Proposal

## 💡 Concept: "See Your Offer" Lead Magnet

Instead of showing the cash offer immediately, gate it behind a lead capture form to:
1. **Qualify the lead** - Ensure they're the actual owner
2. **Collect contact info** - Get multiple ways to reach them
3. **Enrich data** - Learn about their situation/motivation
4. **Build rapport** - Show you care about their needs
5. **Legal compliance** - Get consent for communications

---

## 🎯 User Flow

### Current Flow (Too Direct):
```
Customer clicks link
    ↓
Sees property details
    ↓
Sees cash offer immediately ($450,000)
    ↓
Contact form (optional)
```

### Proposed Flow (Lead Capture):
```
Customer clicks link
    ↓
Sees property details (address, photos, etc.)
    ↓
Sees "Cash Offer Ready" with blurred amount
    ↓
Clicks "Reveal My Offer"
    ↓
Step 1: Verify Ownership
  - Full Name
  - Email
  - Phone Number
    ↓
Step 2: Property Details (Optional but recommended)
  - Are you the current owner? (Yes/No)
  - When did you purchase the property?
  - Current mortgage status (Paid off/Financed/Other)
  - Property condition (Excellent/Good/Fair/Needs Work)
    ↓
Step 3: Selling Motivation (Optional)
  - Why are you considering selling?
    [ ] Relocating
    [ ] Downsizing
    [ ] Financial reasons
    [ ] Inherited property
    [ ] Just curious about value
  - Timeline to sell?
    [ ] ASAP (within 30 days)
    [ ] 1-3 months
    [ ] 3-6 months
    [ ] 6+ months
    [ ] Not sure yet
    ↓
REVEAL: Cash Offer Amount + Next Steps
  - Shows $450,000
  - Shows comparison to estimated value
  - "Accept Offer" button
  - "Schedule Call" button
  - "I have questions" button
```

---

## 📋 Information to Collect

### Tier 1: Required (Must Have)
```typescript
{
  fullName: string;           // Legal name
  email: string;              // Primary contact
  phone: string;              // For quick follow-up
  isOwner: boolean;           // Qualification
}
```

### Tier 2: Recommended (Lead Enrichment)
```typescript
{
  purchaseYear?: number;      // How long they've owned it
  mortgageStatus?: 'paid' | 'financed' | 'other';
  propertyCondition?: 'excellent' | 'good' | 'fair' | 'needs-work';
  currentlyLiving?: boolean;  // Occupied or vacant
}
```

### Tier 3: Optional (Sales Intelligence)
```typescript
{
  sellingReasons?: string[];  // Multiple motivations
  timeline?: string;          // Urgency indicator
  additionalNotes?: string;   // Free-form input
  preferredContact?: 'email' | 'phone' | 'text';
  bestTimeToCall?: string;    // e.g., "Weekday evenings"
}
```

---

## 🎨 UI Design Concepts

### Concept 1: Progressive Disclosure (Recommended)
```
┌─────────────────────────────────────────┐
│  Your Cash Offer is Ready! 🎉          │
│                                         │
│  Estimated Value: $500,000              │
│  Our Cash Offer:  [BLURRED $XXX,XXX]   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  To see your offer, we need:     │  │
│  │                                   │  │
│  │  Full Name:  [____________]       │  │
│  │  Email:      [____________]       │  │
│  │  Phone:      [____________]       │  │
│  │                                   │  │
│  │  ☑ I am the property owner       │  │
│  │                                   │  │
│  │  [Reveal My Offer →]             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  🔒 Your information is secure          │
│  We respect your privacy                │
└─────────────────────────────────────────┘
```

### Concept 2: Multi-Step Wizard
```
Step 1 of 3: Contact Information
┌─────────────────────────────────────────┐
│  Let's Get Started                      │
│                                         │
│  Full Name: [_________________]         │
│  Email:     [_________________]         │
│  Phone:     [_________________]         │
│                                         │
│  [Continue →]                           │
│                                         │
│  ●○○ Progress                           │
└─────────────────────────────────────────┘

Step 2 of 3: Property Ownership
┌─────────────────────────────────────────┐
│  Tell Us About Your Property            │
│                                         │
│  ○ I am the owner                       │
│  ○ I am an authorized representative    │
│                                         │
│  When did you purchase?                 │
│  Year: [____]                           │
│                                         │
│  Mortgage Status:                       │
│  ○ Paid off  ○ Financed  ○ Other       │
│                                         │
│  [← Back]  [Continue →]                │
│                                         │
│  ●●○ Progress                           │
└─────────────────────────────────────────┘

Step 3 of 3: Your Situation
┌─────────────────────────────────────────┐
│  Help Us Understand Your Needs          │
│                                         │
│  Why considering selling? (optional)    │
│  ☐ Relocating                           │
│  ☐ Downsizing                           │
│  ☐ Financial reasons                    │
│  ☐ Inherited property                   │
│  ☐ Just curious                         │
│                                         │
│  Timeline to sell?                      │
│  ○ Within 30 days                       │
│  ○ 1-3 months                           │
│  ○ 3-6 months                           │
│  ○ 6+ months                            │
│  ○ Just browsing                        │
│                                         │
│  [← Back]  [Reveal My Offer! →]        │
│                                         │
│  ●●● Progress                           │
└─────────────────────────────────────────┘
```

### Concept 3: Single Page with Sections
```
┌─────────────────────────────────────────┐
│  🏠 123 Main St, Orlando, FL 32801      │
│                                         │
│  [Property Photos Carousel]             │
│                                         │
│  Estimated Value: $500,000              │
│  Cash Offer: Click below to reveal      │
│                                         │
│  ▼ Contact Information (Required)       │
│  ├─ Name:  [__________]                 │
│  ├─ Email: [__________]                 │
│  └─ Phone: [__________]                 │
│                                         │
│  ▼ Ownership (Required)                 │
│  └─ ☑ I own this property               │
│                                         │
│  ▼ Additional Details (Optional)        │
│  ├─ Purchase Year: [____]               │
│  ├─ Condition: [dropdown]               │
│  └─ Timeline: [dropdown]                │
│                                         │
│  [Reveal Cash Offer →]                  │
└─────────────────────────────────────────┘
```

---

## 💾 Data Storage Plan

### Update Property Table
Add lead capture data to existing property:

```sql
-- New columns for lead capture
ALTER TABLE properties ADD COLUMN lead_captured BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN lead_captured_at TIMESTAMP;
ALTER TABLE properties ADD COLUMN owner_full_name TEXT;
ALTER TABLE properties ADD COLUMN owner_email TEXT;
ALTER TABLE properties ADD COLUMN owner_phone TEXT;
ALTER TABLE properties ADD COLUMN is_verified_owner BOOLEAN;
ALTER TABLE properties ADD COLUMN purchase_year INTEGER;
ALTER TABLE properties ADD COLUMN mortgage_status TEXT;
ALTER TABLE properties ADD COLUMN property_condition TEXT;
ALTER TABLE properties ADD COLUMN selling_reasons TEXT[]; -- Array
ALTER TABLE properties ADD COLUMN selling_timeline TEXT;
ALTER TABLE properties ADD COLUMN preferred_contact_method TEXT;
ALTER TABLE properties ADD COLUMN best_time_to_call TEXT;
ALTER TABLE properties ADD COLUMN additional_notes TEXT;
```

### Or Create Separate Lead Table (Better)
```sql
CREATE TABLE property_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),

  -- Contact Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Ownership Verification
  is_owner BOOLEAN NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Property Details
  purchase_year INTEGER,
  mortgage_status TEXT,
  property_condition TEXT,
  currently_living BOOLEAN,

  -- Sales Intelligence
  selling_reasons TEXT[],
  selling_timeline TEXT,
  preferred_contact_method TEXT,
  best_time_to_call TEXT,
  additional_notes TEXT,

  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Follow-up
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP,
  contacted_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'new', -- new, contacted, qualified, not-interested

  UNIQUE(property_id, email) -- Prevent duplicates
);
```

---

## 🛠️ Implementation Components

### 1. LeadCaptureModal.tsx
```typescript
interface LeadCaptureModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadCaptureData) => Promise<void>;
}

// Multi-step form with validation
// Progress indicator
// Save partial progress to localStorage
```

### 2. OfferReveal.tsx
```typescript
interface OfferRevealProps {
  property: Property;
  leadData: LeadCaptureData;
}

// Animated reveal of cash offer
// Comparison chart
// Next steps CTAs
// Download PDF offer button
```

### 3. useLeadCapture.ts (Hook)
```typescript
const useLeadCapture = (propertyId: string) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [leadData, setLeadData] = useState<LeadCaptureData | null>(null);

  const submitLead = async (data: LeadCaptureData) => {
    // Save to Supabase
    // Track in analytics
    // Trigger email notification to admin
    // Send confirmation email to lead
    setIsRevealed(true);
  };

  return { isRevealed, leadData, submitLead };
};
```

---

## 📧 Email Automations

### To Lead (Immediate):
```
Subject: Your Cash Offer for 123 Main St

Hi [Name],

Thank you for your interest! Here's your cash offer:

Property: 123 Main St, Orlando, FL 32801
Estimated Value: $500,000
Our Cash Offer: $450,000

Why choose our cash offer?
✓ Close in as little as 7 days
✓ No repairs needed
✓ No realtor fees (save $30,000)
✓ We cover closing costs

Next Steps:
1. Review the attached offer details
2. Schedule a call: [Calendar Link]
3. Have questions? Reply to this email

[Accept Offer Button]

Best regards,
Your Real Estate Team
```

### To Admin (Immediate):
```
Subject: 🔔 New Lead Captured - 123 Main St

A potential seller has viewed their offer!

Property: 123 Main St, Orlando, FL 32801
Lead: John Smith
Email: john@example.com
Phone: (321) 555-0123

Details:
- Owner: Yes
- Timeline: 1-3 months
- Reason: Relocating
- Condition: Good

[View in Admin] [Call Now] [Send Email]
```

---

## 🎯 Benefits of This Approach

### For You (Business):
1. ✅ **Qualify Leads** - Know they're the actual owner
2. ✅ **Contact Info** - Multiple ways to follow up
3. ✅ **Sales Intelligence** - Know their motivation/timeline
4. ✅ **Better Conversion** - Personalize your pitch
5. ✅ **Legal Protection** - Documented consent
6. ✅ **Analytics** - Track which offers get views

### For Customer (Owner):
1. ✅ **Fair Exchange** - Info for offer value
2. ✅ **Transparency** - Know what you're getting
3. ✅ **Convenience** - All info in one place
4. ✅ **Speed** - Faster process with pre-collected data
5. ✅ **Options** - Multiple next steps to choose from

---

## 🚀 Recommended Implementation

### Phase 1: Basic Lead Capture (1-2 hours)
- Create simple modal with name, email, phone
- "I am the owner" checkbox
- Reveal offer after submission
- Save to property_leads table
- Send confirmation email

### Phase 2: Multi-Step Form (2-3 hours)
- Add property details step
- Add motivation step
- Progress indicator
- Form validation
- Local storage persistence

### Phase 3: Admin Dashboard (2-3 hours)
- Lead management view
- Filter by status (new, contacted, qualified)
- Quick actions (call, email, mark as contacted)
- Lead scoring (hot, warm, cold)

### Phase 4: Automation (2-3 hours)
- Automatic email sequences
- SMS notifications (optional)
- CRM integration
- Lead assignment workflow

---

## 📊 Tracking & Analytics

### Metrics to Track:
```typescript
{
  // Funnel Metrics
  linkClicks: number;           // How many clicked the link
  pageViews: number;            // How many viewed property
  offerRequests: number;        // How many started form
  completedCaptures: number;    // How many finished form
  offerAcceptances: number;     // How many accepted

  // Conversion Rates
  viewToRequest: number;        // % who started form
  requestToComplete: number;    // % who finished form
  completeToAccept: number;     // % who accepted offer

  // Lead Quality
  verifiedOwners: number;       // % who claim ownership
  hotLeads: number;             // ASAP timeline
  warmLeads: number;            // 1-3 month timeline
  coldLeads: number;            // 6+ months
}
```

---

## 🎨 Psychological Triggers

### Curiosity Gap
"Your Cash Offer: **$XXX,XXX**" (blurred)
→ Makes them WANT to fill out the form

### Reciprocity
"We've already done the work to value your home"
→ They feel obligated to give info in return

### Social Proof
"Join 1,247 Orlando homeowners who sold with us"
→ Trust through numbers

### Scarcity
"This offer expires in 7 days"
→ Creates urgency

### Authority
"Certified Home Buyers | A+ BBB Rating"
→ Builds credibility

---

## ✅ Next Steps - What Do You Want?

I can implement any of these:

### Option A: Simple Lead Gate (Fastest)
- Name, email, phone only
- Immediate offer reveal
- **Time: 30 minutes**

### Option B: Multi-Step Wizard (Recommended)
- 3-step form
- Property details + motivation
- Animated reveal
- **Time: 2 hours**

### Option C: Full Lead System (Most Complete)
- Multi-step form
- Lead management dashboard
- Email automations
- Analytics tracking
- **Time: 6-8 hours**

**Which option do you want me to build?**

Or tell me what specific fields/steps you want!
