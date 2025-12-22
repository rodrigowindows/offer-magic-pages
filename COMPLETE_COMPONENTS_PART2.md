# 🎯 Componentes Restantes - Parte 2

## 3. Step4Confirmation.tsx

```tsx
import { useState } from 'react';
import { useMarketing } from '@/hooks/useMarketing';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { formatChannel, estimateBatchTime, formatPhone } from '@/utils/formatters';
import { generateMessagePreview } from '@/services/marketingService';
import { useNavigate } from 'react-router-dom';

export function Step4Confirmation() {
  const navigate = useNavigate();
  const store = useMarketingStore();
  const { sendFromWizard, isSending, batchProgress } = useMarketing();
  const [showProductionConfirm, setShowProductionConfirm] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);

  const { wizard, settings } = store;
  const isTestMode = settings.defaults.test_mode;
  const isBatch = wizard.isBatchMode;
  const totalRecipients = isBatch ? wizard.batchRecipients.length : 1;

  const handleSendClick = () => {
    if (!isTestMode) {
      setShowProductionConfirm(true);
    } else {
      handleConfirmedSend();
    }
  };

  const handleConfirmedSend = async () => {
    setShowProductionConfirm(false);

    try {
      await sendFromWizard();
      setSendComplete(true);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleFinish = () => {
    store.resetWizard();
    navigate('/marketing/history');
  };

  if (sendComplete) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">
              {isTestMode ? '🧪 Test' : ''} Communications Sent!
            </h2>
            <p className="text-muted-foreground">
              {isBatch
                ? `Sent to ${totalRecipients} recipients`
                : `Sent to ${wizard.recipientInfo.name}`}
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={handleFinish}>View History</Button>
              <Button variant="outline" onClick={() => {
                setSendComplete(false);
                store.resetWizard();
              }}>
                Send Another
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Review & Confirm</CardTitle>
          <CardDescription>
            Review all details before sending {isTestMode && '(Test Mode)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Mode Warning */}
          {isTestMode && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>TEST MODE:</strong> No real communications will be sent. This is a simulation.
              </AlertDescription>
            </Alert>
          )}

          {/* Production Warning */}
          {!isTestMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>PRODUCTION MODE:</strong> Real communications will be sent to recipients.
                Credits will be consumed.
              </AlertDescription>
            </Alert>
          )}

          {/* Recipients */}
          <div>
            <h3 className="font-medium mb-2">Recipients</h3>
            {isBatch ? (
              <div className="space-y-2">
                <Badge variant="secondary">{totalRecipients} recipients</Badge>
                <p className="text-sm text-muted-foreground">
                  Estimated time: {estimateBatchTime(totalRecipients)}
                </p>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {wizard.recipientInfo.name}</p>
                <p><strong>Phone:</strong> {formatPhone(wizard.recipientInfo.phone_number || '')}</p>
                <p><strong>Email:</strong> {wizard.recipientInfo.email}</p>
                <p><strong>Address:</strong> {wizard.recipientInfo.address}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Channels */}
          <div>
            <h3 className="font-medium mb-2">Channels</h3>
            <div className="flex gap-2">
              {wizard.selectedChannels.map((channel) => (
                <Badge key={channel} variant="default">
                  {formatChannel(channel)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Message Previews */}
          <div>
            <h3 className="font-medium mb-2">Message Previews</h3>
            <div className="space-y-3">
              {wizard.selectedChannels.includes('sms') && (
                <div className="border rounded p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">SMS</p>
                  <p className="text-sm">
                    {generateMessagePreview(
                      wizard.customMessages.sms || '{name}, interested in selling {address}?...',
                      wizard.recipientInfo,
                      wizard.companyConfig
                    ).substring(0, 160)}...
                  </p>
                </div>
              )}

              {wizard.selectedChannels.includes('email') && (
                <div className="border rounded p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">
                    Subject: {wizard.customMessages.emailSubject || 'Cash Offer for Your Property'}
                  </p>
                </div>
              )}

              {wizard.selectedChannels.includes('call') && (
                <div className="border rounded p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Voicemail</p>
                  <p className="text-sm">
                    Style: {wizard.voicemailStyle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {wizard.llmConfig.use_llm && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
                AI will optimize messages using {wizard.llmConfig.llm_model} ({wizard.llmConfig.llm_prompt_style} style)
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sending Progress */}
      {isSending && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">
                    Sending {isTestMode && '(Test)'}...
                  </span>
                </div>
                {isBatch && (
                  <span className="text-sm text-muted-foreground">
                    {batchProgress.current} / {batchProgress.total}
                  </span>
                )}
              </div>
              {isBatch && (
                <Progress
                  value={(batchProgress.current / batchProgress.total) * 100}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => store.previousStep()}
          disabled={isSending}
        >
          Previous
        </Button>
        <Button
          onClick={handleSendClick}
          disabled={isSending}
          className={!isTestMode ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isTestMode ? 'Send Test' : 'Send Communications'}
            </>
          )}
        </Button>
      </div>

      {/* Production Confirmation Dialog */}
      <AlertDialog open={showProductionConfirm} onOpenChange={setShowProductionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Send Real Communications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send REAL communications to {isBatch ? `${totalRecipients} recipients` : wizard.recipientInfo.name}.
              This will consume credits and cannot be undone.
              <br /><br />
              <strong>Channels:</strong> {wizard.selectedChannels.join(', ')}
              <br />
              <strong>Recipients:</strong> {totalRecipients}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSend}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Step4Confirmation;
```

---

## 4. WizardLayout.tsx

```tsx
import { useMarketingStore } from '@/store/marketingStore';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { Step1RecipientInfo } from './Step1RecipientInfo';
import { Step2ChannelsConfig } from './Step2ChannelsConfig';
import { Step3MessageCustomization } from './Step3MessageCustomization';
import { Step4Confirmation } from './Step4Confirmation';

const steps = [
  { number: 1, title: 'Recipient', component: Step1RecipientInfo },
  { number: 2, title: 'Channels', component: Step2ChannelsConfig },
  { number: 3, title: 'Messages', component: Step3MessageCustomization },
  { number: 4, title: 'Confirm', component: Step4Confirmation },
];

export function WizardLayout() {
  const currentStep = useMarketingStore((state) => state.wizard.currentStep);

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    step.number < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.number === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-sm mt-2 font-medium ${
                  step.number === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step.number < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
      </Card>

      {/* Current Step */}
      <CurrentStepComponent />
    </div>
  );
}

export default WizardLayout;
```

---

## 5. Dashboard.tsx

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketing } from '@/hooks/useMarketing';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { TestModeToggle } from './TestModeToggle';

export function Dashboard() {
  const navigate = useNavigate();
  const { performHealthCheck, apiHealthy } = useMarketing();
  const history = useMarketingStore((state) => state.history);
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);

  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Calculate stats
  const last24h = history.filter((item) => {
    const hoursDiff = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  const stats = {
    total: history.length,
    last24h: last24h.length,
    successful: history.filter((h) => h.status === 'sent').length,
    failed: history.filter((h) => h.status === 'failed').length,
    sms: history.filter((h) => h.channels.includes('sms')).length,
    email: history.filter((h) => h.channels.includes('email')).length,
    call: history.filter((h) => h.channels.includes('call')).length,
    testMode: history.filter((h) => h.test_mode).length,
    production: history.filter((h) => !h.test_mode).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Send and manage your marketing communications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {apiHealthy ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              API Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              API Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Test Mode Toggle */}
      <TestModeToggle />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          onClick={() => navigate('/marketing/send')}
          className="h-20"
        >
          <Send className="w-5 h-5 mr-2" />
          Send Communication
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/marketing/history')}
          className="h-20"
        >
          <History className="w-5 h-5 mr-2" />
          View History
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/marketing/settings')}
          className="h-20"
        >
          <Settings className="w-5 h-5 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Communications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.last24h} in last 24h
            </p>
          </CardContent>
        </Card>

        {/* SMS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Text messages sent
            </p>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.email}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Emails sent
            </p>
          </CardContent>
        </Card>

        {/* Calls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.call}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calls initiated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Successful</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(stats.successful / stats.total) * 100 || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.successful}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(stats.failed / stats.total) * 100 || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.failed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test vs Production</CardTitle>
            <CardDescription>Communications by mode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">🧪 Test Mode</span>
                <Badge variant="secondary">{stats.testMode}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">🚀 Production</span>
                <Badge variant="default">{stats.production}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 5 communications</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No communications yet. Send your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.recipient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.test_mode && (
                      <Badge variant="secondary">Test</Badge>
                    )}
                    <Badge variant={item.status === 'sent' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
```

---

Vou continuar com os componentes finais em outro arquivo...

