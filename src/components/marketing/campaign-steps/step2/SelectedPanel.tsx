import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';
import { getAllEmails } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

interface Props {
  selectedProps: CampaignProperty[];
  selectedChannel: Channel;
  getAllPhones: (prop: CampaignProperty) => string[];
}

export function SelectedPanel({ selectedProps, selectedChannel, getAllPhones }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Selected ({selectedProps.length})</CardTitle>
        <CardDescription className="text-xs">Properties that will receive your campaign</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {selectedProps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No properties selected</div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-1.5">
              {selectedProps.map((property) => (
                <div key={property.id} className="p-2 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{property.address}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{property.city}, {property.state} {property.zip_code}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                      {selectedChannel === 'email' ? `${getAllEmails(property).length} email` : `${getAllPhones(property).length} ph`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
