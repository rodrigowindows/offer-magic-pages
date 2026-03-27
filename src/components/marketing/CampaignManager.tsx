/**
 * Campaign Manager - Orchestrator component
 * Uses extracted step components and hooks for modularity.
 * State management delegated to useCampaignFilters hook.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  AlertCircle,
  Target,
  Users,
  Eye,
  Send,
  RefreshCw,
} from 'lucide-react';
import { checkHealth } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplatesDB';
import type { Channel } from '@/types/marketing.types';
import type { CampaignTemplate } from '@/types/campaign.types';
import {
  type CampaignProperty,
  getAllEmails,
  getSelectColumns,
} from '@/hooks/useCampaignContacts';
import { useCampaignFilters } from '@/hooks/useCampaignFilters';
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

const STEPS = [
  { step: 1, title: 'Template', icon: Target },
  { step: 2, title: 'Properties', icon: Users },
  { step: 3, title: 'Configure', icon: Filter },
  { step: 4, title: 'Preview', icon: Eye },
  { step: 5, title: 'Send', icon: Send },
] as const;

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const { templates, getTemplatesByChannel, getDefaultTemplate } = useTemplates();

  // Wizard step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<CampaignProperty[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('sms');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSendPreview, setShowSendPreview] = useState(false);
  const [smsDelay, setSmsDelay] = useState(1000);

  // Simulation
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationResults, setSimulationResults] = useState<ReturnType<typeof simulateCampaignSend> | null>(null);
  const [healthStatus, setHealthStatus] = useState<Awaited<ReturnType<typeof performSystemHealthCheck>> | null>(null);

  // Filter state (delegated to hook)
  const filters = useCampaignFilters(properties);

  // Template
  const selectedTemplate = useMemo(() => {
    const found = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) : getDefaultTemplate(selectedChannel);
    return found as CampaignTemplate | undefined;
  }, [selectedTemplateId, templates, selectedChannel, getDefaultTemplate]);

  // Hooks
  const { renderTemplatePreview, generateTemplateContent } = useTemplateRenderer({
    selectedChannel,
    selectedTemplate: selectedTemplate ?? null,
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
    getAllPhones: filters.getAllPhones,
    generateTemplateContent,
  });

  // Contact stats (memoized)
  const contactStats = useMemo(
    () => filters.getContactStats(selectedChannel),
    [filters.getContactStats, selectedChannel]
  );

  // Default template on channel change
  useEffect(() => {
    const dt = getDefaultTemplate(selectedChannel);
    if (dt) setSelectedTemplateId(dt.id);
  }, [selectedChannel, getDefaultTemplate]);

  // Fetch properties
  useEffect(() => {
    filters.setSelectedIds([]);
    fetchProperties();
  }, [filters.filterStatus, filters.selectedPhoneColumn, filters.selectedEmailColumn, filters.selectedBatch]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const cols = getSelectColumns(filters.selectedPhoneColumn, filters.selectedEmailColumn);
      let query = supabase.from('properties').select(cols).order('created_at', { ascending: false });
      if (filters.filterStatus !== 'all') query = query.eq('approval_status', filters.filterStatus);
      if (filters.selectedBatch && filters.selectedBatch !== 'all') query = query.eq('import_batch', filters.selectedBatch);
      const { data, error } = await query;
      if (error) throw error;
      setProperties((data as unknown as CampaignProperty[]) || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Erro ao carregar propriedades', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters.filterStatus, filters.selectedPhoneColumn, filters.selectedEmailColumn, filters.selectedBatch, toast]);

  // Navigation
  const nextStep = useCallback(() => { if (currentStep < 5) setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5); }, [currentStep]);
  const prevStep = useCallback(() => { if (currentStep > 1) setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5); }, [currentStep]);
  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) return selectedTemplateId !== '';
    if (currentStep === 2) return filters.selectedIds.length > 0;
    return true;
  }, [currentStep, selectedTemplateId, filters.selectedIds.length]);

  // Send handlers
  const handleSendCampaign = useCallback(async () => {
    const issues = validateCampaignReadiness(filters.selectedProps);
    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');
    if (errors.length > 0) { toast({ title: 'Campanha não pode ser enviada', description: errors.map(e => e.message).join('. '), variant: 'destructive', duration: 8000 }); return; }
    if (warnings.length > 0 && !window.confirm(`⚠️ AVISOS\n\n${warnings.map(w => w.message).join('\n')}\n\nContinuar?`)) return;
    try {
      const health = await performSystemHealthCheck();
      if (!health.api) { toast({ title: 'Sistema indisponível', description: 'API não está respondendo.', variant: 'destructive' }); return; }
    } catch { toast({ title: 'Erro de conectividade', variant: 'destructive' }); return; }
    setShowSendPreview(true);
  }, [filters.selectedProps, validateCampaignReadiness, performSystemHealthCheck, toast]);

  const handleConfirmSendCampaign = useCallback(async () => {
    setShowSendPreview(false);
    try { await checkHealth(); } catch { toast({ title: 'Serviço indisponível', variant: 'destructive' }); return; }
    if (filters.selectedProps.length === 0 || !selectedTemplate) { toast({ title: 'Erro de validação', variant: 'destructive' }); return; }
    if (filters.selectedProps.length > 100) { toast({ title: 'Máximo 100 propriedades por campanha', variant: 'destructive' }); return; }
    const totalContacts = filters.selectedProps.reduce((t, p) => t + (selectedChannel === 'email' ? getAllEmails(p).length : filters.getAllPhones(p).length), 0);
    const confirmed = window.confirm(`🚀 CONFIRMAR ENVIO\n\nTemplate: ${selectedTemplate.name}\nCanal: ${selectedChannel.toUpperCase()}\nPropriedades: ${filters.selectedProps.length}\nMensagens: ${totalContacts}\n\nContinuar?`);
    if (!confirmed) return;
    await executeCampaignSend(filters.selectedProps, () => filters.setSelectedIds([]));
  }, [filters.selectedProps, filters.getAllPhones, filters.setSelectedIds, selectedTemplate, selectedChannel, executeCampaignSend, toast]);

  const handleSimulate = useCallback(async () => {
    setSimulating(true);
    try {
      const sim = simulateCampaignSend(filters.selectedProps);
      const health = await performSystemHealthCheck();
      setSimulationResults(sim);
      setHealthStatus(health);
      setShowSimulationModal(true);
    } catch { toast({ title: 'Erro na simulação', variant: 'destructive' }); }
    setSimulating(false);
  }, [filters.selectedProps, simulateCampaignSend, performSystemHealthCheck, toast]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚀 Campaign Creator</h1>
            <p className="text-sm text-muted-foreground">Create and launch marketing campaigns step by step</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProperties} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {testMode && (
          <Alert className="border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">🧪 <strong>Test Mode Active:</strong> Messages will be simulated</AlertDescription>
          </Alert>
        )}

        {/* Wizard */}
        <Card>
          <CardContent className="pt-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {STEPS.map(({ step, title, icon: Icon }, index) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => step <= currentStep && setCurrentStep(step as 1 | 2 | 3 | 4 | 5)}
                    disabled={step > currentStep}
                    className={`flex items-center gap-2 transition-colors ${step <= currentStep ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${currentStep >= step ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                      {currentStep > step ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-xs font-medium ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</div>
                    </div>
                  </button>
                  {index < 4 && <ArrowRight className={`w-4 h-4 mx-2 ${currentStep > step ? 'text-primary' : 'text-muted-foreground/30'}`} />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[500px]">
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
                  filters={filters}
                  selectedChannel={selectedChannel}
                />
              )}
              {currentStep === 3 && (
                <CampaignStep3Summary
                  selectedIds={filters.selectedIds}
                  selectedChannel={selectedChannel}
                  propsWithPhone={contactStats.propsWithPhone}
                  propsWithEmail={contactStats.propsWithEmail}
                  selectedTemplate={selectedTemplate}
                  selectedProps={filters.selectedProps}
                  getAllPhones={filters.getAllPhones}
                  getAllEmails={getAllEmails}
                  excludedPhones={filters.excludedPhones}
                  setExcludedPhones={filters.setExcludedPhones}
                />
              )}
              {currentStep === 4 && (
                <CampaignStep4Preview
                  selectedProps={filters.selectedProps}
                  selectedChannel={selectedChannel}
                  selectedTemplate={selectedTemplate}
                  propsWithPhone={contactStats.propsWithPhone}
                  propsWithEmail={contactStats.propsWithEmail}
                  getAllPhones={filters.getAllPhones}
                  getAllEmails={getAllEmails}
                  renderTemplatePreview={renderTemplatePreview}
                />
              )}
              {currentStep === 5 && (
                <CampaignStep5Send
                  selectedIds={filters.selectedIds}
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
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep === 1 || loading || sending}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <span className="text-xs text-muted-foreground">Step {currentStep}/5</span>
              {currentStep < 5 ? (
                <Button size="sm" onClick={nextStep} disabled={!canProceedToNext || loading || sending}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div className="w-20" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CampaignSendPreviewDialog
          open={showSendPreview}
          onOpenChange={setShowSendPreview}
          selectedProps={filters.selectedProps}
          selectedChannel={selectedChannel}
          selectedTemplate={selectedTemplate}
          smsDelay={smsDelay}
          setSmsDelay={setSmsDelay}
          sending={sending}
          progressStats={progressStats}
          getAllPhones={filters.getAllPhones}
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