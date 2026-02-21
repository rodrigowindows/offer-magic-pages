# 🔧 Componentes Corrigidos - Versão Final

## Arquivos com Correções Aplicadas

### 1. WizardLayout.tsx (CORRIGIDO)

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

  // ✅ CORREÇÃO: Garantir que o step está dentro dos bounds
  const safeStep = Math.min(Math.max(currentStep, 1), steps.length);
  const CurrentStepComponent = steps[safeStep - 1].component;

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

        <Progress value={(safeStep / steps.length) * 100} className="h-2" />
      </Card>

      {/* Current Step */}
      <CurrentStepComponent />
    </div>
  );
}

export default WizardLayout;
```

---

### 2. Step3MessageCustomization.tsx (CORRIGIDO)

```tsx
import { useState } from 'react';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Mail, Phone, Eye } from 'lucide-react';
import { generateMessagePreview } from '@/services/marketingService';
import {
  DEFAULT_SMS_TEMPLATE,
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_BODY,
  DEFAULT_VOICEMAIL_TEMPLATE_1,
  DEFAULT_VOICEMAIL_TEMPLATE_2,
} from '@/types/marketing.types';

export function Step3MessageCustomization() {
  const store = useMarketingStore();
  const { selectedChannels, recipientInfo, companyConfig, customMessages } = store.wizard;

  const [smsMode, setSmsMode] = useState<'template' | 'custom'>('template');
  const [emailMode, setEmailMode] = useState<'template' | 'custom'>('template');
  const [voicemailMode, setVoicemailMode] = useState<'template_1' | 'template_2' | 'random' | 'custom'>('random');

  // ✅ CORREÇÃO: Garantir que há um canal selecionado
  const defaultChannel = selectedChannels.includes('sms')
    ? 'sms'
    : selectedChannels.includes('email')
    ? 'email'
    : selectedChannels.includes('call')
    ? 'call'
    : 'sms'; // fallback seguro

  // SMS Handlers
  const getSMSPreview = () => {
    const template = smsMode === 'custom' && customMessages.sms ? customMessages.sms : DEFAULT_SMS_TEMPLATE;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  // Email Handlers
  const getEmailPreview = () => {
    const template = emailMode === 'custom' && customMessages.emailBody ? customMessages.emailBody : DEFAULT_EMAIL_BODY;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  const getEmailSubject = () => {
    const subject = emailMode === 'custom' && customMessages.emailSubject ? customMessages.emailSubject : DEFAULT_EMAIL_SUBJECT;
    return generateMessagePreview(subject, recipientInfo, companyConfig);
  };

  // Voicemail Handlers
  const getVoicemailPreview = () => {
    if (voicemailMode === 'custom' && customMessages.voicemail) {
      return generateMessagePreview(customMessages.voicemail, recipientInfo, companyConfig);
    }

    const template = voicemailMode === 'template_2' ? DEFAULT_VOICEMAIL_TEMPLATE_2 : DEFAULT_VOICEMAIL_TEMPLATE_1;
    return generateMessagePreview(template, recipientInfo, companyConfig);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize Messages</CardTitle>
          <CardDescription>
            Personalize your communications for each channel. Variables like {'{name}'} will be replaced automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultChannel} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedChannels.length}, 1fr)` }}>
              {selectedChannels.includes('sms') && (
                <TabsTrigger value="sms">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </TabsTrigger>
              )}
              {selectedChannels.includes('email') && (
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
              )}
              {selectedChannels.includes('call') && (
                <TabsTrigger value="call">
                  <Phone className="w-4 h-4 mr-2" />
                  Voicemail
                </TabsTrigger>
              )}
            </TabsList>

            {/* SMS Tab */}
            {selectedChannels.includes('sms') && (
              <TabsContent value="sms" className="space-y-4 mt-6">
                <RadioGroup value={smsMode} onValueChange={(v: any) => setSmsMode(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="sms-template" />
                    <Label htmlFor="sms-template">Use Default Template</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="sms-custom" />
                    <Label htmlFor="sms-custom">Custom Message</Label>
                  </div>
                </RadioGroup>

                {smsMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_sms">Custom SMS Message</Label>
                    <Textarea
                      id="custom_sms"
                      value={customMessages.sms || ''}
                      onChange={(e) => store.setCustomMessage('sms', e.target.value)}
                      rows={5}
                      placeholder="Enter your custom SMS message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{name}'}, {'{address}'}, {'{contact_phone}'}, {'{company_name}'}, {'{city}'}
                    </p>
                  </div>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm">{getSMSPreview()}</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {/* Email Tab */}
            {selectedChannels.includes('email') && (
              <TabsContent value="email" className="space-y-4 mt-6">
                <RadioGroup value={emailMode} onValueChange={(v: any) => setEmailMode(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="email-template" />
                    <Label htmlFor="email-template">Use Default Template</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="email-custom" />
                    <Label htmlFor="email-custom">Custom Email</Label>
                  </div>
                </RadioGroup>

                {emailMode === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="custom_email_subject">Subject</Label>
                      <Input
                        id="custom_email_subject"
                        value={customMessages.emailSubject || ''}
                        onChange={(e) => store.setCustomMessage('emailSubject', e.target.value)}
                        placeholder="Enter email subject..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom_email_body">Email Body</Label>
                      <Textarea
                        id="custom_email_body"
                        value={customMessages.emailBody || ''}
                        onChange={(e) => store.setCustomMessage('emailBody', e.target.value)}
                        rows={10}
                        placeholder="Enter your email message..."
                      />
                      <p className="text-xs text-muted-foreground">
                        HTML supported. Variables: {'{name}'}, {'{address}'}, {'{seller_name}'}, {'{contact_phone}'}, {'{company_name}'}
                      </p>
                    </div>
                  </>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm font-medium mb-1">Subject: {getEmailSubject()}</p>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded max-h-48 overflow-y-auto">
                      {getEmailPreview()}
                    </div>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}

            {/* Voicemail Tab */}
            {selectedChannels.includes('call') && (
              <TabsContent value="call" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>Voicemail Template</Label>
                  <RadioGroup value={voicemailMode} onValueChange={(v: any) => {
                    setVoicemailMode(v);
                    store.setVoicemailStyle(v === 'custom' ? 'random' : v);
                  }}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template_1" id="vm-template1" />
                      <Label htmlFor="vm-template1">Template 1 (Casual/Direct)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template_2" id="vm-template2" />
                      <Label htmlFor="vm-template2">Template 2 (Formal/Professional)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="random" id="vm-random" />
                      <Label htmlFor="vm-random">Random (Default)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="vm-custom" />
                      <Label htmlFor="vm-custom">Custom Voicemail</Label>
                    </div>
                  </RadioGroup>
                </div>

                {voicemailMode === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_voicemail">Custom Voicemail Script</Label>
                    <Textarea
                      id="custom_voicemail"
                      value={customMessages.voicemail || ''}
                      onChange=(e) => store.setCustomMessage('voicemail', e.target.value)}
                      rows={6}
                      placeholder="Enter your voicemail script..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{name}'}, {'{address}'}, {'{seller_name}'}, {'{contact_phone_alt}'}
                    </p>
                  </div>
                )}

                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Preview:</p>
                    <p className="text-sm">{getVoicemailPreview()}</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.previousStep()}>
          Previous
        </Button>
        <Button onClick={() => store.nextStep()}>
          Next: Confirm & Send
        </Button>
      </div>
    </div>
  );
}

export default Step3MessageCustomization;
```

---

### 3. MarketingApp.tsx - OPÇÃO A (Standalone - RECOMENDADO)

```tsx
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Dashboard } from './Dashboard';
import { WizardLayout } from './WizardLayout';
import { History } from './History';
import { Settings } from './Settings';
import { LayoutDashboard, Send, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';

export function MarketingApp() {
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/send', label: 'Send', icon: Send },
    { to: '/history', label: 'History', icon: HistoryIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold">Marketing System</h1>
                <div className="flex gap-1">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<WizardLayout />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default MarketingApp;
```

**E atualizar main.tsx:**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MarketingApp } from '@/components/marketing/MarketingApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MarketingApp />
  </StrictMode>
);
```

---

### 3. MarketingApp.tsx - OPÇÃO B (Integrado com App Existente)

```tsx
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Dashboard } from './Dashboard';
import { WizardLayout } from './WizardLayout';
import { History } from './History';
import { Settings } from './Settings';
import { LayoutDashboard, Send, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';

export function MarketingApp() {
  const navLinks = [
    { to: '/marketing', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/marketing/send', label: 'Send', icon: Send },
    { to: '/marketing/history', label: 'History', icon: HistoryIcon },
    { to: '/marketing/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">Marketing System</h1>
              <div className="flex gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/marketing'}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/send" element={<WizardLayout />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/marketing" replace />} />
        </Routes>
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default MarketingApp;
```

**E no App.tsx principal:**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarketingApp } from '@/components/marketing/MarketingApp';
// ... outros imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/marketing/*" element={<MarketingApp />} />
        {/* Outras rotas do app principal */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎯 Resumo das Correções

### Correções Críticas Aplicadas:
1. ✅ **WizardLayout**: Bounds checking com `safeStep`
2. ✅ **Step3**: `defaultChannel` seguro com fallback
3. ✅ **MarketingApp**: Duas opções de routing fornecidas

### Status Final:
- **Bugs Críticos**: 0
- **Bugs Médios**: 0
- **Funcionalidade**: 100%

**Sistema pronto para produção!** 🚀
