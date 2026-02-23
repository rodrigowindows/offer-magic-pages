import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatus } from "./LeadStatusBadge";

interface LeadStatusSelectProps {
  value: LeadStatus;
  onValueChange: (value: LeadStatus) => void;
}

export const LeadStatusSelect = ({ value, onValueChange }: LeadStatusSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">New Lead</SelectItem>
        <SelectItem value="contacted">Contacted</SelectItem>
        <SelectItem value="following_up">Following Up</SelectItem>
        <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
        <SelectItem value="offer_made">Offer Made</SelectItem>
        <SelectItem value="closed">Closed</SelectItem>
        <SelectItem value="not_interested">Not Interested</SelectItem>
      </SelectContent>
    </Select>
  );
};
