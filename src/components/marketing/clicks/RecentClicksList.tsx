/**
 * Recent Clicks List — shows individual click events with contact info + quick reply
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageSquare, Mail, Reply } from 'lucide-react';
import type { ClickAnalytic } from '@/hooks/useClicksAnalytics';
import { getSourceIcon, getSourceColor, getTimeAgo } from '@/hooks/useClicksAnalytics';
import { QuickReplyDialog } from './QuickReplyDialog';

interface Props {
  clicks: ClickAnalytic[];
}

export function RecentClicksList({ clicks }: Props) {
  const [replyClick, setReplyClick] = useState<ClickAnalytic | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
          <CardDescription>Latest property page visits with detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clicks.map((click) => {
              const source = click.source || 'direct';
              const Icon = getSourceIcon(source);
              const timeAgo = getTimeAgo(click.created_at);
              const hasContact = !!(click.contact_phone || click.contact_email);
              return (
                <div key={click.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${getSourceColor(source)}`} />
                      <Badge className={`${timeAgo.color} text-white text-xs`}>
                        <Clock className="w-3 h-3 mr-1" />{timeAgo.text}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        {click.property_address && (
                          <div className="mb-3 pb-2 border-b">
                            <div className="font-semibold text-sm text-primary flex items-center gap-2">🏠 {click.property_address}</div>
                          </div>
                        )}
                        {(click.contact_name || click.contact_email || click.contact_phone) && (
                          <div className="mb-3 pb-2 border-b bg-primary/5 px-3 py-2 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-sm">👤 Contact Info:</div>
                              {hasContact && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs gap-1.5"
                                  onClick={() => setReplyClick(click)}
                                >
                                  <Reply className="w-3 h-3" />
                                  Quick Reply
                                  {click.contact_phone && <MessageSquare className="w-3 h-3" />}
                                  {click.contact_email && <Mail className="w-3 h-3" />}
                                </Button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs">
                              {click.contact_name && <span className="font-medium">{click.contact_name}</span>}
                              {click.contact_email && <a href={`mailto:${click.contact_email}`} className="text-primary hover:underline">✉️ {click.contact_email}</a>}
                              {click.contact_phone && <a href={`tel:${click.contact_phone}`} className="text-primary hover:underline">📞 {click.contact_phone}</a>}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize text-xs">{source}</Badge>
                          <Badge variant="secondary" className="text-xs">{click.event_type}</Badge>
                          {click.device_type && <Badge variant="outline" className="text-xs">{click.device_type}</Badge>}
                          {click.city && <Badge variant="outline" className="text-xs">{click.city}{click.country ? `, ${click.country}` : ''}</Badge>}
                        </div>
                        {click.referrer && <p className="text-xs text-muted-foreground truncate">Referrer: {click.referrer}</p>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(click.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            {clicks.length === 0 && <div className="text-center py-8 text-muted-foreground">No recent clicks</div>}
          </div>
        </CardContent>
      </Card>

      {replyClick && (
        <QuickReplyDialog
          open={!!replyClick}
          onOpenChange={(open) => { if (!open) setReplyClick(null); }}
          click={replyClick}
        />
      )}
    </>
  );
}
