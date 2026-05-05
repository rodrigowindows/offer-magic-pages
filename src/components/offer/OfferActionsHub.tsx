import { useState } from "react";
import { TrendingUp, Calendar, MessageCircle, MessageSquare, Mail, PhoneCall } from "lucide-react";
import { useContactSettings, renderTemplate } from "@/hooks/useContactSettings";
import ScheduleVisitModal from "./ScheduleVisitModal";

interface OfferActionsHubProps {
  propertyId?: string;
  propertyAddress?: string;
  currentOffer?: number;
  onDownloadPdf?: () => void;
  onTrack?: (action: string) => void;
}

const OfferActionsHub = ({ propertyId, propertyAddress, currentOffer, onTrack }: OfferActionsHubProps) => {
  const { settings } = useContactSettings();
  const [visitOpen, setVisitOpen] = useState(false);

  const vars = { address: propertyAddress || "your property", propertyId: propertyId || "" };
  const wppNumber = (settings.whatsapp_number || "").replace(/[^\d]/g, "");
  const smsNumber = settings.sms_number || "";
  const email = settings.support_email || "rodrigowindows@gmail.com";
  const calendly = settings.calendly_url;
  const callNumber = settings.retell_phone_number || "+17868828251";

  const wppMsg = encodeURIComponent(renderTemplate(settings.whatsapp_message_template, vars));
  const smsBody = encodeURIComponent(renderTemplate(settings.sms_message_template, vars));
  const emailSubject = encodeURIComponent(renderTemplate(settings.email_subject_template, vars));

  const track = (a: string) => onTrack?.(a);

  type ChannelCardProps = {
    href: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    dataAction: string;
    onClick?: () => void;
    target?: string;
    rel?: string;
    variant?: "default" | "highlight" | "primary";
  };

  const ChannelCard = ({ href, icon, title, subtitle, dataAction, onClick, target, rel, variant = "default" }: ChannelCardProps) => {
    const styles =
      variant === "primary"
        ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
        : variant === "highlight"
        ? "bg-green-50 border-green-300 text-green-900 hover:bg-green-100"
        : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50";
    const subStyle = variant === "primary" ? "text-white/90" : variant === "highlight" ? "text-green-800" : "text-gray-500";
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        data-action={dataAction}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles} transition-all shadow-sm`}
      >
        <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col leading-tight text-left">
          <span className="text-base font-bold">{title}</span>
          <span className={`text-xs ${subStyle}`}>{subtitle}</span>
        </div>
      </a>
    );
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Schedule a Visit to Increase Offer (top, blue) */}
      <button
        type="button"
        data-action="open-schedule-visit"
        onClick={() => { track("schedule_visit_increase"); setVisitOpen(true); }}
        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-sm transition-all"
      >
        <TrendingUp className="h-5 w-5" />
        Schedule a Visit to Increase Offer
      </button>

      {/* Section header */}
      <div className="text-center pt-3">
        <p className="text-xs tracking-[0.2em] text-gray-500 font-semibold">
          TALK TO US — CHOOSE HOW
        </p>
      </div>

      {/* Channels list */}
      <div className="space-y-2">
        <ChannelCard
          variant="highlight"
          href={wppNumber ? `https://wa.me/${wppNumber}?text=${wppMsg}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          dataAction="contact-whatsapp"
          onClick={() => track("whatsapp")}
          icon={<MessageCircle className="h-5 w-5 text-green-700" />}
          title="Chat on WhatsApp"
          subtitle="Quick answers, instant reply"
        />

        <ChannelCard
          href={`sms:${smsNumber}?body=${smsBody}`}
          dataAction="contact-sms"
          onClick={() => track("sms")}
          icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
          title="Text us by SMS"
          subtitle="Ask anything from your phone"
        />

        <ChannelCard
          href={`mailto:${email}?subject=${emailSubject}`}
          dataAction="contact-email"
          onClick={() => track("email")}
          icon={<Mail className="h-5 w-5 text-gray-700" />}
          title="Ask questions by email"
          subtitle="Detailed reply within hours"
        />

        <ChannelCard
          href={calendly || `tel:${callNumber}`}
          target={calendly ? "_blank" : undefined}
          rel={calendly ? "noopener noreferrer" : undefined}
          dataAction="schedule-call"
          onClick={() => track("schedule_call")}
          icon={<Calendar className="h-5 w-5 text-gray-700" />}
          title="Schedule a call"
          subtitle="Pick a time that works for you"
        />

        <ChannelCard
          variant="primary"
          href={`tel:${callNumber}`}
          dataAction="contact-call"
          onClick={() => track("call")}
          icon={<PhoneCall className="h-5 w-5 text-white" />}
          title="Call us now"
          subtitle="Answered instantly by AI assistant"
        />
      </div>

      <ScheduleVisitModal
        open={visitOpen}
        onOpenChange={setVisitOpen}
        propertyId={propertyId}
        propertyAddress={propertyAddress}
      />
    </div>
  );
};

export default OfferActionsHub;
