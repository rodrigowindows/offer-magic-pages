/**
 * Step 4: Confirmation
 * Review final da comunicação antes do envio
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useMarketingStore } from '@/store/marketingStore';
import { useMarketing } from '@/hooks/useMarketing';
import {
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  AlertTriangle,
  Loader2,
  Send,
  TestTube2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const Step4Confirmation = () => {
  const store = useMarketingStore();
  const { sendFromWizard, isSending, batchProgress } = useMarketing();
  const [showProdConfirm, setShowProdConfirm] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const { wizard, settings } = store;
  const {
    recipientInfo,
    selectedChannels,
    isBatchMode,
    batchRecipients,
    companyConfig,
    llmConfig,
  } = wizard;
  const testMode = settings.defaults.test_mode;

  const totalRecipients = isBatchMode ? batchRecipients.length : 1;
  const estimatedCost = totalRecipients * selectedChannels.length * 0.05; // Estimativa

  const handleSend = async () => {
    // Se não for test mode, confirmar primeiro
    if (!testMode) {
      setShowProdConfirm(true);
      return;
    }

    // Test mode: enviar diretamente
    await executeSend();
  };

  const executeSend = async () => {
    try {
      await sendFromWizard();
      setSendSuccess(true);

      // Reset wizard após 2 segundos
      setTimeout(() => {
        store.resetWizard();
        setSendSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const channelIcons = {
    sms: MessageSquare,
    email: Mail,
    call: Phone,
  };

  const channelLabels = {
    sms: 'SMS',
    email: 'Email',
    call: 'Phone Call',
  };

  if (sendSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {testMode ? '🧪 Test Communication Sent!' : '✅ Communication Sent!'}
        </h2>
        <p className="text-muted-foreground">
          {isBatchMode
            ? `${totalRecipients} communications ${testMode ? 'simulated' : 'sent'} successfully`
            : `Communication ${testMode ? 'simulated' : 'sent'} successfully`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Mode Alert */}
      {testMode ? (
        <Alert className="border-orange-500 bg-orange-50">
          <TestTube2 className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>TEST MODE ACTIVE:</strong> This will simulate the communication without actually sending it.
            No credits will be consumed.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>PRODUCTION MODE:</strong> This will send REAL communications and consume credits!
          </AlertDescription>
        </Alert>
      )}

      {/* Recipients Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isBatchMode ? <Users className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {isBatchMode ? 'Batch Recipients' : 'Recipient'}
          </CardTitle>
          <CardDescription>
            {isBatchMode
              ? `${totalRecipients} recipients will receive this communication`
              : 'Single recipient communication'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBatchMode ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Recipients:</span>
                <Badge variant="secondary">{totalRecipients}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {batchRecipients.slice(0, 3).map((r, i) => (
                  <div key={i}>• {r.name} ({r.phone_number})</div>
                ))}
                {batchRecipients.length > 3 && (
                  <div>... and {batchRecipients.length - 3} more</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{recipientInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{recipientInfo.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{recipientInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{recipientInfo.address}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channels Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Communication will be sent via</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {selectedChannels.map((channel) => {
              const Icon = channelIcons[channel];
              return (
                <Badge key={channel} variant="secondary" className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {channelLabels[channel]}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Company & LLM Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Company</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>{companyConfig.company_name}</div>
              <div>{companyConfig.contact_phone}</div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">AI Settings</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Model: {llmConfig.llm_provider} ({llmConfig.llm_model})</div>
              <div>Temperature: {llmConfig.llm_temperature}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {totalRecipients} recipient{totalRecipients > 1 ? 's' : ''} × {selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''}
            </span>
            <span className="text-2xl font-bold">
              {testMode ? (
                <Badge variant="secondary">FREE (Test Mode)</Badge>
              ) : (
                `$${estimatedCost.toFixed(2)}`
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => store.setWizardStep(3)}
          disabled={isSending}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={handleSend}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {batchProgress.total > 0
                ? `Sending ${batchProgress.current}/${batchProgress.total}...`
                : 'Sending...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {testMode ? '🧪 Test Send' : 'Send Communication'}
            </>
          )}
        </Button>
      </div>

      {/* Production Confirmation Dialog */}
      <Dialog open={showProdConfirm} onOpenChange={setShowProdConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Production Send Confirmation
            </DialogTitle>
            <DialogDescription>
              You are about to send REAL communications that will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  <li>Send actual SMS, Emails, and/or Phone Calls</li>
                  <li>Consume credits from your account</li>
                  <li>Contact {totalRecipients} real recipient{totalRecipients > 1 ? 's' : ''}</li>
                  <li>Cost approximately ${estimatedCost.toFixed(2)}</li>
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Are you absolutely sure you want to proceed?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProdConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowProdConfirm(false);
                executeSend();
              }}
            >
              Yes, Send in Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step4Confirmation;
