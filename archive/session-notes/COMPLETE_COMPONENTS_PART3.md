# 🎯 Componentes Finais - Parte 3

## 6. History.tsx

```tsx
import { useState } from 'react';
import { useMarketingStore } from '@/store/marketingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Download, Eye, TestTube2, Rocket } from 'lucide-react';
import { formatDateTime, formatChannel, formatPhone } from '@/utils/formatters';
import type { CommunicationHistory, Channel } from '@/types/marketing.types';

export function History() {
  const history = useMarketingStore((state) => state.history);
  const clearHistory = useMarketingStore((state) => state.clearHistory);

  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | Channel>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'failed'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'test' | 'production'>('all');
  const [selectedItem, setSelectedItem] = useState<CommunicationHistory | null>(null);

  // Filter history
  const filteredHistory = history.filter((item) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        item.recipient.name.toLowerCase().includes(searchLower) ||
        item.recipient.email.toLowerCase().includes(searchLower) ||
        item.recipient.phone_number.includes(search) ||
        item.recipient.address.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Channel filter
    if (filterChannel !== 'all' && !item.channels.includes(filterChannel)) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }

    // Mode filter
    if (filterMode === 'test' && !item.test_mode) return false;
    if (filterMode === 'production' && item.test_mode) return false;

    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Phone', 'Email', 'Channels', 'Status', 'Mode'];
    const rows = filteredHistory.map((item) => [
      formatDateTime(item.timestamp),
      item.recipient.name,
      item.recipient.phone_number,
      item.recipient.email,
      item.channels.join(', '),
      item.status,
      item.test_mode ? 'Test' : 'Production',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-history-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication History</h1>
          <p className="text-muted-foreground">
            View and manage all sent communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Clear all history? This cannot be undone.')) {
                clearHistory();
              }
            }}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone, address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Channel Filter */}
            <Select value={filterChannel} onValueChange={(v: any) => setFilterChannel(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS Only</SelectItem>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="call">Call Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mode Filter */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={filterMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
            >
              All
            </Button>
            <Button
              variant={filterMode === 'test' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('test')}
            >
              <TestTube2 className="w-4 h-4 mr-1" />
              Test Only
            </Button>
            <Button
              variant={filterMode === 'production' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('production')}
            >
              <Rocket className="w-4 h-4 mr-1" />
              Production Only
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredHistory.length} of {history.length} communications
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {history.length === 0 ? 'No communications yet' : 'No matches found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(item.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.recipient.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {item.recipient.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <p>{formatPhone(item.recipient.phone_number)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.recipient.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.channels.map((channel) => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {formatChannel(channel)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === 'sent' ? 'default' : 'destructive'}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.test_mode ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <TestTube2 className="w-3 h-3 mr-1" />
                          Test
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          <Rocket className="w-3 h-3 mr-1" />
                          Prod
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={selectedItem !== null} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
            <DialogDescription>
              Sent on {selectedItem && formatDateTime(selectedItem.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Recipient Info */}
              <div>
                <h3 className="font-medium mb-2">Recipient</h3>
                <div className="text-sm space-y-1 bg-muted p-3 rounded">
                  <p><strong>Name:</strong> {selectedItem.recipient.name}</p>
                  <p><strong>Phone:</strong> {formatPhone(selectedItem.recipient.phone_number)}</p>
                  <p><strong>Email:</strong> {selectedItem.recipient.email}</p>
                  <p><strong>Address:</strong> {selectedItem.recipient.address}</p>
                  {selectedItem.recipient.seller_name && (
                    <p><strong>Seller:</strong> {selectedItem.recipient.seller_name}</p>
                  )}
                </div>
              </div>

              {/* Response Details */}
              {selectedItem.channels.includes('sms') && selectedItem.response.sms_body && (
                <div>
                  <h3 className="font-medium mb-2">SMS</h3>
                  <div className="text-sm bg-muted p-3 rounded space-y-2">
                    <p><strong>Status Code:</strong> {selectedItem.response.sms_status_code}</p>
                    <p><strong>Message:</strong></p>
                    <p className="whitespace-pre-wrap">{selectedItem.response.sms_body}</p>
                    {selectedItem.response.sms_response && (
                      <>
                        <p><strong>Response:</strong></p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(selectedItem.response.sms_response, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.channels.includes('email') && selectedItem.response.email_body && (
                <div>
                  <h3 className="font-medium mb-2">Email</h3>
                  <div className="text-sm bg-muted p-3 rounded space-y-2">
                    <p><strong>Status Code:</strong> {selectedItem.response.email_status_code}</p>
                    <p><strong>Subject:</strong> {selectedItem.response.email_title}</p>
                    <p><strong>Body:</strong></p>
                    <div className="whitespace-pre-wrap max-h-64 overflow-y-auto bg-background p-2 rounded">
                      {selectedItem.response.email_body}
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.channels.includes('call') && selectedItem.response.voicemail_body && (
                <div>
                  <h3 className="font-medium mb-2">Call / Voicemail</h3>
                  <div className="text-sm bg-muted p-3 rounded space-y-2">
                    <p><strong>Status Code:</strong> {selectedItem.response.call_status_code}</p>
                    <p><strong>Voicemail:</strong></p>
                    <p className="whitespace-pre-wrap">{selectedItem.response.voicemail_body}</p>
                    {selectedItem.response.call_response && (
                      <>
                        <p><strong>Response:</strong></p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(selectedItem.response.call_response, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default History;
```

---

## 7. Settings.tsx

```tsx
import { useState } from 'react';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Building2, Globe, Sparkles, FileText, Save, Trash2 } from 'lucide-react';
import { TestModeToggle } from './TestModeToggle';
import type { CompanyConfig, LLMConfig } from '@/types/marketing.types';

export function Settings() {
  const store = useMarketingStore();
  const { templates, createTemplate, deleteTemplate } = useTemplates();

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(store.settings.company);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(store.settings.llm);
  const [apiUrl, setApiUrl] = useState(store.settings.api.marketing_url);

  const handleSaveCompany = () => {
    store.updateSettings({ company: companyConfig });
    toast.success('Company settings saved!');
  };

  const handleSaveLLM = () => {
    store.updateSettings({ llm: llmConfig });
    toast.success('AI settings saved!');
  };

  const handleSaveAPI = () => {
    store.updateSettings({ api: { marketing_url: apiUrl } });
    toast.success('API settings saved!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your marketing communication preferences
        </p>
      </div>

      {/* Test Mode Toggle */}
      <TestModeToggle />

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="api">
            <Globe className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-4 h-4 mr-2" />
            AI
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Default company details used in communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={companyConfig.company_name}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, company_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={companyConfig.city}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={companyConfig.region}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, region: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_phone">From Phone Number</Label>
                  <Input
                    id="from_phone"
                    value={companyConfig.from_phone_number}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, from_phone_number: e.target.value })}
                    placeholder="7868828251"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={companyConfig.contact_phone}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, contact_phone: e.target.value })}
                    placeholder="(786) 882-8251"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone_alt">Alternative Phone</Label>
                  <Input
                    id="contact_phone_alt"
                    value={companyConfig.contact_phone_alt}
                    onChange={(e) => setCompanyConfig({ ...companyConfig, contact_phone_alt: e.target.value })}
                    placeholder="504-383-7989"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure API endpoints for marketing communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketing_api_url">Marketing API URL</Label>
                <Input
                  id="marketing_api_url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://marketing.workfaraway.com"
                />
                <p className="text-xs text-muted-foreground">
                  Base URL for all marketing API endpoints
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAPI}>
                  <Save className="w-4 h-4 mr-2" />
                  Save API Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Default AI settings for message optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default AI Model</Label>
                <select
                  className="w-full border rounded p-2"
                  value={llmConfig.llm_model}
                  onChange={(e: any) => setLLMConfig({ ...llmConfig, llm_model: e.target.value })}
                >
                  <option value="mistral">Mistral AI</option>
                  <option value="llama">Llama</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Default Writing Style</Label>
                <select
                  className="w-full border rounded p-2"
                  value={llmConfig.llm_prompt_style}
                  onChange={(e: any) => setLLMConfig({ ...llmConfig, llm_prompt_style: e.target.value })}
                >
                  <option value="persuasive">Persuasive</option>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Max Words for Voicemail: {llmConfig.llm_max_words_voicemail}</Label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={llmConfig.llm_max_words_voicemail}
                  onChange={(e) => setLLMConfig({ ...llmConfig, llm_max_words_voicemail: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveLLM}>
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
              <CardDescription>
                Manage your message templates ({templates.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No templates saved yet. Create one from the message customization screen.
                </p>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary">{template.channel}</Badge>
                          {template.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              deleteTemplate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {template.subject && (
                        <p className="text-sm text-muted-foreground">
                          Subject: {template.subject}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {template.body.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;
```

---

## 8. MarketingApp.tsx (App Principal)

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
    { to: '/marketing', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/marketing/send', label: 'Send', icon: Send },
    { to: '/marketing/history', label: 'History', icon: HistoryIcon },
    { to: '/marketing/settings', label: 'Settings', icon: SettingsIcon },
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
            <Route path="/marketing" element={<Dashboard />} />
            <Route path="/marketing/send" element={<WizardLayout />} />
            <Route path="/marketing/history" element={<History />} />
            <Route path="/marketing/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/marketing" replace />} />
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

---

## 9. Integração com App Existente

### Opção A: Rota Separada (Recomendado)

No `App.tsx` principal, adicione:

```tsx
import { MarketingApp } from '@/components/marketing/MarketingApp';

// Nas rotas:
<Route path="/marketing/*" element={<MarketingApp />} />
```

### Opção B: Substituir App Completamente

Edite `src/main.tsx`:

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

## 🚀 Comandos Finais

```bash
# Instalar dependências
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
npm install

# Iniciar dev server
npm run dev

# Build para produção
npm run build
```

---

## ✅ Checklist de Implementação

- [x] Tipos TypeScript com test_mode
- [x] Serviços de API
- [x] Store Zustand com test_mode
- [x] Hooks (useMarketing, useTemplates, useBatchUpload)
- [x] Utils (validators, formatters)
- [x] TestModeToggle component
- [ ] Step1RecipientInfo (JÁ EXISTE)
- [ ] Step2ChannelsConfig
- [ ] Step3MessageCustomization
- [ ] Step4Confirmation
- [ ] WizardLayout
- [ ] Dashboard
- [ ] History
- [ ] Settings
- [ ] MarketingApp
- [ ] Integração com App principal

---

## 📊 Resultado Final

Sistema completo com:
- ✅ Test Mode funcional (toggle global)
- ✅ Wizard de 4 passos
- ✅ Dashboard com estatísticas
- ✅ Histórico com filtros
- ✅ Configurações persistentes
- ✅ Batch upload (CSV/JSON)
- ✅ Validações completas
- ✅ Indicadores visuais de teste vs produção
- ✅ Modal de confirmação para produção
- ✅ Toast notifications diferentes para test/prod
- ✅ Filtros de histórico por modo

**Pronto para uso em desenvolvimento e produção!** 🎉
