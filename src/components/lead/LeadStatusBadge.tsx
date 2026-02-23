import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Phone, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  Star
} from "lucide-react";

export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'following_up' 
  | 'meeting_scheduled' 
  | 'offer_made' 
  | 'closed' 
  | 'not_interested';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const statusConfig: Record<LeadStatus, { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  new: {
    label: "New Lead",
    variant: "default",
    icon: Star,
    className: "bg-blue-500 hover:bg-blue-600 text-white"
  },
  contacted: {
    label: "Contacted",
    variant: "secondary",
    icon: Phone,
    className: "bg-purple-500 hover:bg-purple-600 text-white"
  },
  following_up: {
    label: "Following Up",
    variant: "outline",
    icon: MessageSquare,
    className: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
  },
  meeting_scheduled: {
    label: "Meeting Scheduled",
    variant: "secondary",
    icon: Calendar,
    className: "bg-orange-500 hover:bg-orange-600 text-white"
  },
  offer_made: {
    label: "Offer Made",
    variant: "default",
    icon: DollarSign,
    className: "bg-indigo-500 hover:bg-indigo-600 text-white"
  },
  closed: {
    label: "Closed",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-500 hover:bg-green-600 text-white"
  },
  not_interested: {
    label: "Not Interested",
    variant: "destructive",
    icon: XCircle,
    className: "bg-gray-500 hover:bg-gray-600 text-white"
  }
};

export const LeadStatusBadge = ({ status }: LeadStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
