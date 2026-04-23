import { Check, MessageCircle, MessageSquare, Mail, Calendar, PhoneCall } from "lucide-react";
import { useContactSettings, renderTemplate } from "@/hooks/useContactSettings";

interface CashOfferSectionBProps {
  offerAmount?: string;
  onViewOffer?: () => void;
  propertyAddress?: string;
  propertyId?: string;
}

interface ContactButtonProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  highlight?: "light" | "dark" | "none";
  external?: boolean;
}

const ContactButton = ({ href, onClick, icon, title, subtitle, highlight = "none", external }: ContactButtonProps) => {
  const baseClasses = "w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all hover:shadow-md text-left";
  const variantClasses =
    highlight === "light"
      ? "bg-green-50 border-green-200 hover:bg-green-100"
      : highlight === "dark"
      ? "bg-green-600 border-green-700 hover:bg-green-700 text-white"
      : "bg-white border-gray-200 hover:bg-gray-50";

  const titleColor = highlight === "dark" ? "text-white" : "text-gray-900";
  const subtitleColor = highlight === "dark" ? "text-green-100" : "text-gray-500";
  const iconBg = highlight === "dark" ? "bg-white/20 text-white" : highlight === "light" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

  const content = (
    <>
      <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-base ${titleColor}`}>{title}</div>
        <div className={`text-xs ${subtitleColor}`}>{subtitle}</div>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      {content}
    </button>
  );
};

const CashOfferSectionB = ({
  offerAmount = "$285,000",
  onViewOffer,
  propertyAddress = "",
  propertyId,
}: CashOfferSectionBProps) => {
  const { settings } = useContactSettings();

  const vars = {
    address: propertyAddress || "your property",
    propertyId: propertyId || "",
  };

  const wppNumber = (settings.whatsapp_number || "").replace(/[^\d]/g, "");
  const smsNumber = settings.sms_number || "";
  const email = settings.support_email || "offers@mylocalinvest.com";
  const calendly = settings.calendly_url;
  const retellNumber = settings.retell_phone_number || smsNumber;

  const wppMessage = encodeURIComponent(renderTemplate(settings.whatsapp_message_template, vars));
  const smsBody = encodeURIComponent(renderTemplate(settings.sms_message_template, vars));
  const emailSubject = encodeURIComponent(renderTemplate(settings.email_subject_template, vars));

  const trackAndOpen = () => {
    onViewOffer?.();
  };

  return (
    <section className="py-12 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Heading */}
          <div className="text-center space-y-3">
            <p className="text-base text-gray-600 font-medium">Your fair cash offer</p>
            <div className="text-6xl md:text-7xl font-black text-green-600 tracking-tight">
              {offerAmount}
            </div>
            <p className="text-sm text-gray-500">
              For {propertyAddress || "your property"}
            </p>
          </div>

          {/* Beige preliminary disclaimer */}
          <div className="rounded-xl p-5 border" style={{ backgroundColor: "#FDF4E3", borderColor: "#F0DFB6" }}>
            <p className="text-sm font-semibold text-amber-900 leading-relaxed">
              This is a preliminary offer. In many cases, we significantly improve it after talking with you.
            </p>
          </div>

          {/* Bullets */}
          <div className="space-y-3">
            {[
              { title: "Close in 7-14 days", subtitle: null },
              { title: "No repairs needed", subtitle: "we buy as-is" },
              { title: "No realtor fees", subtitle: "save thousands" },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-green-700" />
                </div>
                <p className="text-base text-gray-800">
                  <span className="font-semibold">{b.title}</span>
                  {b.subtitle && <span className="text-gray-600"> — {b.subtitle}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Contact buttons stack */}
          <div className="space-y-2.5 pt-2">
            <ContactButton
              href={wppNumber ? `https://wa.me/${wppNumber}?text=${wppMessage}` : undefined}
              external
              onClick={trackAndOpen}
              icon={<MessageCircle className="h-5 w-5" />}
              title="Chat on WhatsApp"
              subtitle="Quick answers, instant reply"
              highlight="light"
            />
            <ContactButton
              href={smsNumber ? `sms:${smsNumber}?body=${smsBody}` : undefined}
              onClick={trackAndOpen}
              icon={<MessageSquare className="h-5 w-5" />}
              title="Text us by SMS"
              subtitle="Ask anything from your phone"
            />
            <ContactButton
              href={`mailto:${email}?subject=${emailSubject}`}
              onClick={trackAndOpen}
              icon={<Mail className="h-5 w-5" />}
              title="Ask questions by email"
              subtitle="Detailed reply within hours"
            />
            <ContactButton
              href={calendly || undefined}
              external
              onClick={trackAndOpen}
              icon={<Calendar className="h-5 w-5" />}
              title="Schedule a call"
              subtitle={calendly ? "Pick a time that works for you" : "Coming soon — call us for now"}
            />
            <ContactButton
              href={retellNumber ? `tel:${retellNumber}` : undefined}
              onClick={trackAndOpen}
              icon={<PhoneCall className="h-5 w-5" />}
              title="Call us now"
              subtitle="Answered instantly by AI assistant"
              highlight="dark"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CashOfferSectionB;
