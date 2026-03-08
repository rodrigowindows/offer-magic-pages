import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Send, Eye, Loader2, Rocket, BarChart3 } from 'lucide-react';
import type { ProgressStats } from '@/hooks/useCampaignSender';
import type { CampaignProperty } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';

interface Props {
  selectedIds: string[];
  selectedChannel: Channel;
  sending: boolean;
  progressStats: ProgressStats;
  onSendCampaign: () => void;
  onSimulate: () => void;
  simulating: boolean;
}

export function CampaignStep5Send({ selectedIds, selectedChannel, sending, progressStats, onSendCampaign, onSimulate, simulating }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3"><Rocket className="w-7 h-7 text-primary" /> Launch Campaign</CardTitle>
          <CardDescription>Everything is ready. Review and send your campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚀</div>
            <h3 className="text-xl font-semibold">Ready to Send!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your campaign targeting {selectedIds.length} properties via {selectedChannel.toUpperCase()} is ready to launch.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">Make sure your marketing API is configured before proceeding.</p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="lg" onClick={onSimulate} disabled={simulating || sending || selectedIds.length === 0} className="flex-1 max-w-xs">
                {simulating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulando...</> : <><Eye className="w-4 h-4 mr-2" /> Testar Campanha</>}
              </Button>
              <Button size="lg" onClick={onSendCampaign} disabled={sending || simulating || selectedIds.length === 0} className="flex-1 max-w-xs">
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar ({selectedIds.length})</>}
              </Button>
            </div>

            {sending && (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-sm">
                  <span>Enviando campanha...</span>
                  <span>{progressStats.completed}/{progressStats.total} ({Math.round((progressStats.completed / (progressStats.total || 1)) * 100)}%)</span>
                </div>
                <Progress value={(progressStats.completed / (progressStats.total || 1)) * 100} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>✅ {progressStats.successCount} sucesso</span>
                  <span>❌ {progressStats.failCount} falhas</span>
                  <span>⏱️ {progressStats.estimatedTimeRemaining}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
