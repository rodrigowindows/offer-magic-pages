import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, DollarSign } from 'lucide-react';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';

interface Props {
  property: CampaignProperty;
  phones: string[];
  emails: string[];
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function PropertyCard({ property, phones, emails, isSelected, onToggle }: Props) {
  return (
    <div
      className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => onToggle(property.id)}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
          {property.owner_name?.charAt(0) || property.address.charAt(0) || 'P'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {property.address}
          </p>
          <Badge
            variant={property.approval_status === 'approved' ? 'default' : 'secondary'}
            className="text-[10px] h-4 px-1 flex-shrink-0"
          >
            {property.approval_status}
          </Badge>
        </div>

        {property.cash_offer_amount && (
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <DollarSign className="w-3 h-3" />
            {property.cash_offer_amount.toLocaleString()}
          </div>
        )}

        {phones.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {phones.map((ph, i) => (
              <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 font-mono bg-accent text-accent-foreground border-border">
                <Phone className="w-2.5 h-2.5 mr-0.5" />{ph}
              </Badge>
            ))}
          </div>
        )}

        {emails.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {emails.map((em, i) => (
              <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 font-mono bg-secondary text-secondary-foreground border-border">
                <Mail className="w-2.5 h-2.5 mr-0.5" />{em}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Checkbox checked={isSelected} onChange={() => {}} className="flex-shrink-0" />
    </div>
  );
}
