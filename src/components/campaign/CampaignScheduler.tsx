/**
 * CampaignScheduler - Agendamento inteligente de campanhas
 * Permite programar campanhas para horários específicos e sequências
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Zap, TrendingUp } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  owner_phone?: string;
  owner_email?: string;
}

interface CampaignSchedulerProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ScheduledCampaign {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'call';
  scheduledDate: Date;
  templateId: string;
  properties: Property[];
  status: 'scheduled' | 'sent' | 'failed';
}

export const CampaignScheduler = ({
  properties,
  open,
  onOpenChange,
  onSuccess
}: CampaignSchedulerProps) => {
  const { toast } = useToast();
  const [scheduledCampaigns, setScheduledCampaigns] = useState<ScheduledCampaign[]>([]);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'sms' as 'sms' | 'email' | 'call',
    scheduledDate: '',
    scheduledTime: '',
    templateId: '',
    useSequence: false
  });

  const handleScheduleCampaign = () => {
    if (!newCampaign.name || !newCampaign.scheduledDate || !newCampaign.scheduledTime) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    const scheduledDateTime = new Date(`${newCampaign.scheduledDate}T${newCampaign.scheduledTime}`);

    if (scheduledDateTime <= new Date()) {
      toast({
        title: 'Data inválida',
        description: 'A data deve ser no futuro.',
        variant: 'destructive'
      });
      return;
    }

    const campaign: ScheduledCampaign = {
      id: `campaign_${Date.now()}`,
      name: newCampaign.name,
      channel: newCampaign.channel,
      scheduledDate: scheduledDateTime,
      templateId: newCampaign.templateId,
      properties: properties,
      status: 'scheduled'
    };

    setScheduledCampaigns(prev => [...prev, campaign]);

    // Reset form
    setNewCampaign({
      name: '',
      channel: 'sms',
      scheduledDate: '',
      scheduledTime: '',
      templateId: '',
      useSequence: false
    });

    toast({
      title: 'Campanha agendada!',
      description: `Será enviada em ${scheduledDateTime.toLocaleString()}`,
    });

    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendamento de Campanhas
          </DialogTitle>
          <DialogDescription>
            Programe campanhas para horários estratégicos e maximize suas conversões
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nova Campanha */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Nova Campanha Agendada
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Ex: Oferta Especial - Manhã"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="channel">Canal</Label>
                  <Select
                    value={newCampaign.channel}
                    onValueChange={(value: 'sms' | 'email' | 'call') =>
                      setNewCampaign(prev => ({ ...prev, channel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Ligação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newCampaign.scheduledDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newCampaign.scheduledTime}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sequence"
                    checked={newCampaign.useSequence}
                    onCheckedChange={(checked) =>
                      setNewCampaign(prev => ({ ...prev, useSequence: checked as boolean }))
                    }
                  />
                  <Label htmlFor="sequence" className="text-sm">
                    Usar sequência inteligente (SMS → Email → Call)
                  </Label>
                </div>

                <Button onClick={handleScheduleCampaign} className="w-full gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Campanha
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campanhas Agendadas */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Campanhas Agendadas ({scheduledCampaigns.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scheduledCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma campanha agendada ainda
                  </p>
                ) : (
                  scheduledCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{campaign.name}</h4>
                        <Badge
                          variant={campaign.status === 'scheduled' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {campaign.status === 'scheduled' ? 'Agendada' : 'Enviada'}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>📱 {campaign.channel.toUpperCase()}</p>
                        <p>📅 {campaign.scheduledDate.toLocaleString()}</p>
                        <p>🏠 {campaign.properties.length} propriedades</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dicas de Performance */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dicas para Melhor Performance
            </h4>
            <div className="text-sm text-purple-800 space-y-1">
              <p>• <strong>Manhã (9-11h):</strong> Melhor taxa de abertura para emails</p>
              <p>• <strong>Tarde (14-16h):</strong> Pessoas mais receptivas a ligações</p>
              <p>• <strong>Noite (19-21h):</strong> SMS têm melhor engajamento</p>
              <p>• <strong>Sequências:</strong> SMS primeiro, email em 48h, ligação em 1 semana</p>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};