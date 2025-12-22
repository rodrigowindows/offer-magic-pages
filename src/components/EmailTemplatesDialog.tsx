import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  address: string;
  city: string;
  state: string;
  estimated_value: number;
  cash_offer_amount: number;
  owner_name?: string;
  owner_email?: string;
}

interface EmailTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  userInfo?: {
    name: string;
    email: string;
    company: string;
    phone: string;
  };
}

const EMAIL_TEMPLATES = {
  initial_contact: {
    name: 'Initial Contact',
    subject: 'Fair Cash Offer for {address}',
    body: `Hi {owner_name},

I hope this message finds you well. I wanted to reach out regarding your property at {address} in {city}, {state}.

I represent a company that specializes in quick, hassle-free home purchases. We're interested in making a fair cash offer for your property.

Based on current market conditions, we can offer {cash_offer_amount} for your property, which represents a {offer_percentage}% of the estimated market value. We can close in as little as 7-10 days with no repairs, fees, or commissions required.

Key benefits of working with us:
• Fast closing (7-10 days)
• All cash offer
• No repairs needed
• No agent fees or commissions
• We handle all paperwork

Would you be interested in discussing this further? I'd be happy to answer any questions you might have.

Best regards,
{your_name}
{company}
{phone}
{email}`,
  },
  follow_up: {
    name: 'Follow-Up',
    subject: 'Following up on {address}',
    body: `Hi {owner_name},

I wanted to follow up on my previous message regarding your property at {address}.

I understand selling a home is a big decision, and I wanted to make sure you had all the information you need. Our offer of {cash_offer_amount} is still available, and we're ready to move forward whenever you are.

If you have any questions or concerns, I'm here to help. We pride ourselves on making the process as smooth and stress-free as possible.

Would you have a few minutes this week to discuss? I'm available for a call at your convenience.

Looking forward to hearing from you.

Best,
{your_name}
{company}
{phone}`,
  },
  offer_accepted: {
    name: 'Offer Accepted',
    subject: 'Next Steps for {address}',
    body: `Great news, {owner_name}!

Thank you for accepting our offer for {address}. I'm excited to move forward with this purchase.

Here are the next steps in our process:

1. **Purchase Agreement**: I'll send over the purchase agreement for your review and signature (attached to this email)

2. **Title Search**: We'll initiate a title search to ensure there are no liens or issues

3. **Inspection** (Optional): While we buy as-is, you're welcome to have an inspection if you'd like

4. **Closing Date**: We can close as soon as 7 days, or we can work with your timeline

**Timeline:**
• Today: Review and sign purchase agreement
• Day 2-3: Title search complete
• Day 5-6: Final walkthrough
• Day 7-10: Closing

I'll be in touch within 24 hours with the paperwork and to schedule our next call.

If you have any questions in the meantime, don't hesitate to reach out.

Congratulations on taking this next step!

Best regards,
{your_name}
{company}
{phone}
{email}`,
  },
  price_negotiation: {
    name: 'Price Negotiation',
    subject: 'Re: Offer for {address}',
    body: `Hi {owner_name},

Thank you for getting back to me about {address}. I appreciate you taking the time to consider our offer.

I understand that {cash_offer_amount} may not meet your initial expectations. Let me explain how we arrived at this number:

• Current market value: {estimated_value}
• Repair costs estimate: $[estimate]
• Closing costs we cover: $[costs]
• Speed premium for 7-day close: Included

Our offer is designed to be fair while accounting for the convenience of a quick, as-is sale with no fees or commissions.

That said, I'd like to understand your perspective better. What price would work for you? Perhaps we can find a middle ground that works for both of us.

I'm also open to adjusting the closing timeline if that would be helpful.

Would you be available for a quick call to discuss?

Best regards,
{your_name}
{phone}`,
  },
  check_in: {
    name: 'Check-In',
    subject: 'Checking in about {address}',
    body: `Hi {owner_name},

I wanted to reach out and see how things are going with {address}.

I know we last spoke [timeframe] ago, and circumstances can change. If you're still considering selling, or if your situation has changed and now might be a better time, I wanted you to know that we're still interested.

Our offer remains flexible, and we can work with your timeline.

No pressure at all – just wanted to keep the door open and let you know we're here if you need us.

Hope all is well!

Best,
{your_name}
{company}`,
  },
};

export const EmailTemplatesDialog = ({
  open,
  onOpenChange,
  property,
  userInfo = {
    name: 'Your Name',
    email: 'your.email@company.com',
    company: 'Your Company',
    phone: '(555) 555-5555',
  },
}: EmailTemplatesDialogProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof EMAIL_TEMPLATES>('initial_contact');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const fillTemplate = (templateKey: keyof typeof EMAIL_TEMPLATES) => {
    const template = EMAIL_TEMPLATES[templateKey];
    const offerPercentage = ((property.cash_offer_amount / property.estimated_value) * 100).toFixed(0);

    const replacements: Record<string, string> = {
      '{address}': property.address,
      '{city}': property.city,
      '{state}': property.state,
      '{owner_name}': property.owner_name || 'there',
      '{estimated_value}': `$${property.estimated_value.toLocaleString()}`,
      '{cash_offer_amount}': `$${property.cash_offer_amount.toLocaleString()}`,
      '{offer_percentage}': offerPercentage,
      '{your_name}': userInfo.name,
      '{company}': userInfo.company,
      '{phone}': userInfo.phone,
      '{email}': userInfo.email,
    };

    let filledSubject = template.subject;
    let filledBody = template.body;

    Object.entries(replacements).forEach(([placeholder, value]) => {
      filledSubject = filledSubject.replace(new RegExp(placeholder, 'g'), value);
      filledBody = filledBody.replace(new RegExp(placeholder, 'g'), value);
    });

    setSubject(filledSubject);
    setBody(filledBody);
  };

  const handleTemplateChange = (value: string) => {
    const templateKey = value as keyof typeof EMAIL_TEMPLATES;
    setSelectedTemplate(templateKey);
    fillTemplate(templateKey);
  };

  const handleCopyToClipboard = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullEmail);
    toast({
      title: "Copied to clipboard",
      description: "Email content has been copied",
    });
  };

  const handleSendEmail = () => {
    // Open default email client with pre-filled content
    const mailtoLink = `mailto:${property.owner_email || ''}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast({
      title: "Opening email client",
      description: "Your default email client should open shortly",
    });
  };

  // Initialize with default template
  useState(() => {
    fillTemplate('initial_contact');
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template and customize the message for {property.address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <Label>Select Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Info */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium mb-2">Property Details:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Address:</span>{' '}
                <span className="font-medium">{property.address}</span>
              </div>
              <div>
                <span className="text-gray-600">Owner:</span>{' '}
                <span className="font-medium">{property.owner_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated Value:</span>{' '}
                <span className="font-medium">${property.estimated_value.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Offer:</span>{' '}
                <span className="font-medium text-green-600">
                  ${property.cash_offer_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="body">Email Body</Label>
              <Badge variant="secondary" className="text-xs">
                {body.length} characters
              </Badge>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} className="gap-2" disabled={!property.owner_email}>
              <Send className="h-4 w-4" />
              Send Email
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
