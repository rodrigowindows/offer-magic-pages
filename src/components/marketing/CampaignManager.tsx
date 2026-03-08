/**
 * Campaign Manager - Orchestrator component
 * Uses extracted step components and hooks for modularity.
 * Reduced from ~2700 lines to ~300 lines.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Filter,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
  Target,
  Users,
  Eye,
  Send,
} from 'lucide-react';
import { checkHealth } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplatesDB';
import type { Channel } from '@/types/marketing.types';
import {
  type CampaignProperty,
  hasSkiptracePhones,
  hasSkiptraceEmails,
  getAllPhones as getAllPhonesUtil,
  getAllEmails,
  getPhoneFieldCounts,
  getSelectColumns,
} from '@/hooks/useCampaignContacts';
import { useTemplateRenderer } from '@/hooks/useTemplateRenderer';
import { useCampaignSender } from '@/hooks/useCampaignSender';
import {
  CampaignStep1Template,
  CampaignStep2Properties,
  CampaignStep3Summary,
  CampaignStep4Preview,
  CampaignStep5Send,
  CampaignSendPreviewDialog,
  CampaignSimulationDialog,
} from './campaign-steps';

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const { templates, getTemplatesByChannel, getDefaultTemplate } = useTemplates();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Core state
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<CampaignProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('sms');
  const [filterStatus, setFilterStatus] = useState<string>('approved');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSendPreview, setShowSendPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ id: string; label: string }[]>([]);
  const [hasSkiptracePhoneFilter, setHasSkiptracePhoneFilter] = useState(false);
  const [hasSkiptraceEmailFilter, setHasSkiptraceEmailFilter] = useState(false);
  const [phoneFieldFilter, setPhoneFieldFilter] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState('phone1');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('email1');
  const [smsDelay, setSmsDelay] = useState<number>(1000);

  // Simulation states
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Template
  const selectedTemplate = selectedTemplateId
    ? templates.find((t) => t.id === selectedTemplateId)
    : getDefaultTemplate(selectedChannel);

  // Hooks
  const getAllPhones = (prop: CampaignProperty): string[] => getAllPhonesUtil(prop, phoneFieldFilter);

  const { renderTemplatePreview, generateTemplateContent } = useTemplateRenderer({
    selectedChannel,
    selectedTemplate: selectedTemplate as any,
  });

  const {
    sending,
    progressStats,
    performSystemHealthCheck,
    validateCampaignReadiness,
    simulateCampaignSend,
    executeCampaignSend,
  } = useCampaignSender({
    selectedChannel,
    selectedTemplate,
    smsDelay,
    getAllPhones,
    generateTemplateContent,
  });

  // Derived
  const countWithSkiptracePhones = properties.filter(hasSkiptracePhones).length;
  const countWithSkiptraceEmails = properties.filter(hasSkiptraceEmails).length;
  const phoneFieldCounts = getPhoneFieldCounts(properties);
  const selectedProps = properties.filter((p) => selectedIds.includes(p.id));
  const propsWithEmail = selectedProps.filter((p) => getAllEmails(p).length > 0).length;
  const propsWithPhone = selectedProps.filter((p) => getAllPhones(p).length > 0).length;

  const getFilteredProperties = () => {
    return properties.filter((p) => {
      const matchesSearch = !searchTerm || p.address.toLowerCase().includes(searchTerm.toLowerCase()) || p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.city.toLowerCase().includes(searchTerm.toLowerCase());
      if (hasSkiptracePhoneFilter && !hasSkiptracePhones(p)) return false;
      if (hasSkiptraceEmailFilter && !hasSkiptraceEmails(p)) return false;
      if (phoneFieldFilter.length > 0 && !phoneFieldFilter.some((field) => !!(p as any)[field])) return false;
      return matchesSearch;
    });
  };

  // Default template on channel change
  useEffect(() => {
    const dt = getDefaultTemplate(selectedChannel);
    if (dt) setSelectedTemplateId(dt.id);
  }, [selectedChannel, getDefaultTemplate]);

  // Fetch properties
  useEffect(() => {
    setSelectedIds([]);
    fetchProperties();
  }, [filterStatus, selectedPhoneColumn, selectedEmailColumn, selectedBatch]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const cols = getSelectColumns(selectedPhoneColumn, selectedEmailColumn);
      let query = supabase.from('properties').select(cols).order('created_at', { ascending: false });
      if (filterStatus !== 'all') query = query.eq('approval_status', filterStatus);
      if (selectedBatch && selectedBatch !== 'all') query = query.eq('import_batch', selectedBatch);
      const { data, error } = await query;
      if (error) throw error;
      setProperties((data as unknown as CampaignProperty[]) || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar propriedades', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Navigation
  const nextStep = () => { if (currentStep < 5) setCurrentStep((currentStep + 1) as any); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as any); };
  const canProceedToNext = () => {
    if (currentStep === 1) return selectedTemplateId !== '';
    if (currentStep === 2) return selectedIds.length > 0;
    return true;
  };

  // Send handlers
  const handleSendCampaign = async () => {
    const issues = validateCampaignReadiness(selectedProps);
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');
    if (errors.length > 0) { toast({ title: 'Campanha não pode ser enviada', description: errors.map((e) => e.message).join('. '), variant: 'destructive', duration: 8000 }); return; }
    if (warnings.length > 0 && !window.confirm(`⚠️ AVISOS\n\n${warnings.map((w) => w.message).join('\n')}\n\nContinuar?`)) return;
    try {
      const health = await performSystemHealthCheck();
      if (!health.api) { toast({ title: 'Sistema indisponível', description: 'API não está respondendo.', variant: 'destructive' }); return; }
    } catch { toast({ title: 'Erro de conectividade', variant: 'destructive' }); return; }
    setShowSendPreview(true);
  };

  const handleConfirmSendCampaign = async () => {
    setShowSendPreview(false);
    try { await checkHealth(); } catch { toast({ title: 'Serviço indisponível', variant: 'destructive' }); return; }
    if (selectedProps.length === 0 || !selectedTemplate) { toast({ title: 'Erro de validação', variant: 'destructive' }); return; }
    if (selectedProps.length > 100) { toast({ title: 'Máximo 100 propriedades por campanha', variant: 'destructive' }); return; }
    const totalContacts = selectedProps.reduce((t, p) => t + (selectedChannel === 'email' ? getAllEmails(p).length : getAllPhones(p).length), 0);
    const confirmed = window.confirm(`🚀 CONFIRMAR ENVIO\n\nTemplate: ${selectedTemplate.name}\nCanal: ${selectedChannel.toUpperCase()}\nPropriedades: ${selectedProps.length}\nMensagens: ${totalContacts}\n\nContinuar?`);
    if (!confirmed) return;
    await executeCampaignSend(selectedProps, () => setSelectedIds([]));
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const sim = simulateCampaignSend(selectedProps);
      const health = await performSystemHealthCheck();
      setSimulationResults(sim);
      setHealthStatus(health);
      setShowSimulationModal(true);
    } catch { toast({ title: 'Erro na simulação', variant: 'destructive' }); }
    setSimulating(false);
  };

  const steps = [
    { step: 1, title: 'Choose Template', icon: Target },
    { step: 2, title: 'Select Properties', icon: Users },
    { step: 3, title: 'Configure', icon: Filter },
    { step: 4, title: 'Preview', icon: Eye },
    { step: 5, title: 'Send Campaign', icon: Send },
  ];

  return (
    <TooltipProvider>
      <div className={`space-y-6 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 Campaign Creator</h1>
            <p className="text-muted-foreground">Create and launch marketing campaigns step by step</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p></TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={fetchProperties} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando...</> : <><Filter className="w-4 h-4 mr-2" /> Atualizar</>}
            </Button>
          </div>
        </div>

        {testMode && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">🧪 <strong>Test Mode Active:</strong> Messages will be simulated</AlertDescription>
          </Alert>
        )}

        {/* Wizard */}
        <Card>
          <CardContent className="pt-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              {steps.map(({ step, title, icon: Icon }, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</div>
                    <div className={`text-xs ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</div>
                  </div>
                  {index < 4 && <ArrowRight className={`w-4 h-4 mx-4 ${currentStep > step ? 'text-primary' : 'text-muted-foreground/30'}`} />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[600px]">
              {currentStep === 1 && (
                <CampaignStep1Template
                  selectedChannel={selectedChannel}
                  setSelectedChannel={setSelectedChannel}
                  selectedTemplateId={selectedTemplateId}
                  setSelectedTemplateId={setSelectedTemplateId}
                  selectedTemplate={selectedTemplate}
                  getTemplatesByChannel={getTemplatesByChannel}
                  generateTemplateContent={generateTemplateContent}
                />
              )}
              {currentStep === 2 && (
                <CampaignStep2Properties
                  loading={loading}
                  properties={properties}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  selectedChannel={selectedChannel}
                  selectedBatch={selectedBatch}
                  setSelectedBatch={setSelectedBatch}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  hasSkiptracePhoneFilter={hasSkiptracePhoneFilter}
                  setHasSkiptracePhoneFilter={setHasSkiptracePhoneFilter}
                  hasSkiptraceEmailFilter={hasSkiptraceEmailFilter}
                  setHasSkiptraceEmailFilter={setHasSkiptraceEmailFilter}
                  phoneFieldFilter={phoneFieldFilter}
                  setPhoneFieldFilter={setPhoneFieldFilter}
                  setSelectedPhoneColumn={setSelectedPhoneColumn}
                  showAdvancedFilters={showAdvancedFilters}
                  setShowAdvancedFilters={setShowAdvancedFilters}
                  activeFilters={activeFilters}
                  setActiveFilters={setActiveFilters}
                  countWithSkiptracePhones={countWithSkiptracePhones}
                  countWithSkiptraceEmails={countWithSkiptraceEmails}
                  phoneFieldCounts={phoneFieldCounts}
                  getFilteredProperties={getFilteredProperties}
                  getAllPhones={getAllPhones}
                  getAllEmails={getAllEmails}
                  toggleSelection={toggleSelection}
                  selectedProps={selectedProps}
                />
              )}
              {currentStep === 3 && (
                <CampaignStep3Summary
                  selectedIds={selectedIds}
                  selectedChannel={selectedChannel}
                  propsWithPhone={propsWithPhone}
                  propsWithEmail={propsWithEmail}
                  selectedTemplate={selectedTemplate}
                />
              )}
              {currentStep === 4 && (
                <CampaignStep4Preview
                  selectedProps={selectedProps}
                  selectedChannel={selectedChannel}
                  selectedTemplate={selectedTemplate}
                  propsWithPhone={propsWithPhone}
                  propsWithEmail={propsWithEmail}
                  getAllPhones={getAllPhones}
                  getAllEmails={getAllEmails}
                  renderTemplatePreview={renderTemplatePreview}
                />
              )}
              {currentStep === 5 && (
                <CampaignStep5Send
                  selectedIds={selectedIds}
                  selectedChannel={selectedChannel}
                  sending={sending}
                  progressStats={progressStats}
                  onSendCampaign={handleSendCampaign}
                  onSimulate={handleSimulate}
                  simulating={simulating}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || loading || sending} className="min-w-[100px]">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Passo {currentStep} de 5</div>
                {loading && <div className="flex items-center gap-2 text-xs text-blue-600"><Loader2 className="w-3 h-3 animate-spin" /> Carregando...</div>}
              </div>
              {currentStep < 5 ? (
                <Button onClick={nextStep} disabled={!canProceedToNext() || loading || sending} className="min-w-[100px]">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aguarde</> : <>Próximo <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              ) : (
                <div className="min-w-[100px]" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CampaignSendPreviewDialog
          open={showSendPreview}
          onOpenChange={setShowSendPreview}
          selectedProps={selectedProps}
          selectedChannel={selectedChannel}
          selectedTemplate={selectedTemplate}
          smsDelay={smsDelay}
          setSmsDelay={setSmsDelay}
          sending={sending}
          progressStats={progressStats}
          getAllPhones={getAllPhones}
          getAllEmails={getAllEmails}
          renderTemplatePreview={renderTemplatePreview}
          onConfirmSend={handleConfirmSendCampaign}
        />
        <CampaignSimulationDialog
          open={showSimulationModal}
          onOpenChange={setShowSimulationModal}
          simulationResults={simulationResults}
          healthStatus={healthStatus}
        />
      </div>
    </TooltipProvider>
  );
};
