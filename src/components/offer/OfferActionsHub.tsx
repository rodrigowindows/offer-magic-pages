import { useState } from "react";
import { TrendingUp, Calendar, MessageCircle, MessageSquare, Mail, PhoneCall, Download } from "lucide-react";
import { useContactSettings, renderTemplate } from "@/hooks/useContactSettings";
import ScheduleVisitModal from "./ScheduleVisitModal";

interface OfferActionsHubProps {
  propertyId?: string;
  propertyAddress?: string;
  currentOffer?: number;
  onDownloadPdf?: () => void;
  onTrack?: (action: string) => void;
}

const OfferActionsHub = ({ propertyId, propertyAddress, currentOffer, onDownloadPdf, onTrack }: OfferActionsHubProps) => {
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

  return (
    <div className="space-y-3 pt-2">
      {/* Primary: Schedule a Call (green) */}
      {calendly ? (
        <a
          href={calendly}
          target="_blank"
          rel="noopener noreferrer"
          data-action="schedule-call"
          onClick={() => track("schedule_call")}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
        >
          <Calendar className="h-5 w-5" />
          Schedule a Call
        </a>
      ) : (
        <a
          href={`tel:${callNumber}`}
          data-action="schedule-call"
          onClick={() => track("schedule_call")}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
        >
          <Calendar className="h-5 w-5" />
          Schedule a Call
        </a>
      )}

      {/* Secondary: Schedule a Visit to Increase Offer (merged with Increase Offer) */}
      <button
        type="button"
        data-action="open-schedule-visit"
        onClick={() => { track("schedule_visit_increase"); setVisitOpen(true); }}
        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-sm transition-all"
      >
        <TrendingUp className="h-5 w-5" />
        Schedule a Visit to Increase Offer
      </button>

      {/* Channel pair: WhatsApp / SMS */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={wppNumber ? `https://wa.me/${wppNumber}?text=${wppMsg}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          data-action="contact-whatsapp"
          onClick={() => track("whatsapp")}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 text-green-800 font-semibold text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={`sms:${smsNumber}?body=${smsBody}`}
          data-action="contact-sms"
          onClick={() => track("sms")}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          SMS
        </a>
      </div>

      {/* Channel pair: Email / Call Us */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`mailto:${email}?subject=${emailSubject}`}
          data-action="contact-email"
          onClick={() => track("email")}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm"
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
        <a
          href={`tel:${callNumber}`}
          data-action="contact-call"
          onClick={() => track("call")}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm"
        >
          <PhoneCall className="h-4 w-4" />
          Call Us
        </a>
      </div>

      {/* Download PDF */}
      {onDownloadPdf && (
        <button
          type="button"
          data-action="download-pdf"
          onClick={() => { track("download_pdf"); onDownloadPdf(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium transition-all"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      )}

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
