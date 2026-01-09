/**
 * Campaign Manager - Tela dedicada para criar e gerenciar campanhas
 * Fluxo claro: Selecionar Propriedades → Escolher Canal → Configurar → Enviar
 * Updated: 2026-01-08
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  Filter,
  Send,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  DollarSign,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall, checkHealth } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import type { SavedTemplate, Channel } from '@/types/marketing.types';

// Colunas de telefone disponíveis na tabela properties
const PHONE_COLUMNS = [
  { value: 'phone1', label: 'Phone 1 (Principal)' },
  { value: 'phone2', label: 'Phone 2' },
  { value: 'phone3', label: 'Phone 3' },
  { value: 'phone4', label: 'Phone 4' },
  { value: 'phone5', label: 'Phone 5' },
  { value: 'phone6', label: 'Phone 6' },
  { value: 'phone7', label: 'Phone 7' },
  { value: 'owner_phone', label: 'Owner Phone' },
  { value: 'person2_phone1', label: 'Person 2 - Phone 1' },
  { value: 'person2_phone2', label: 'Person 2 - Phone 2' },
  { value: 'person3_phone1', label: 'Person 3 - Phone 1' },
];

// Colunas de email disponíveis na tabela properties
const EMAIL_COLUMNS = [
  { value: 'email1', label: 'Email 1 (Principal)' },
  { value: 'email2', label: 'Email 2' },
  { value: 'person2_email1', label: 'Person 2 - Email 1' },
  { value: 'person2_email2', label: 'Person 2 - Email 2' },
  { value: 'person3_email1', label: 'Person 3 - Email 1' },
  { value: 'person3_email2', label: 'Person 3 - Email 2' },
];

interface CampaignProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  tags?: string[];
  // Dynamic columns
  [key: string]: string | number | boolean | null | undefined | string[] | object;
}

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const settings = useMarketingStore((state) => state.settings);
  const { templates, getTemplatesByChannel, getDefaultTemplate } = useTemplates();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<CampaignProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('sms');
  const [filterStatus, setFilterStatus] = useState<string>('approved');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSendPreview, setShowSendPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{id: string; label: string}[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [progressStats, setProgressStats] = useState({ 
    completed: 0, 
    total: 0, 
    success: 0, 
    fail: 0,
    successCount: 0,
    failCount: 0,
    estimatedTimeRemaining: '0s'
  });

  // Simulation states
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Toggle theme
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Update progress
  const updateProgress = (completed: number, total: number, success: number, fail: number) => {
    const remaining = total - completed;
    const avgTime = 0.5; // seconds per message
    const estimatedSeconds = Math.round(remaining * avgTime);
    const estimatedTimeRemaining = estimatedSeconds > 60 
      ? `${Math.round(estimatedSeconds / 60)}m` 
      : `${estimatedSeconds}s`;
    setProgressStats({ 
      completed, 
      total, 
      success, 
      fail, 
      successCount: success, 
      failCount: fail,
      estimatedTimeRemaining 
    });
  };

  // Preview navigation
  const prevPreview = () => setPreviewIndex(prev => Math.max(0, prev - 1));
  const nextPreview = () => setPreviewIndex(prev => Math.min(getSelectedProperties().length - 1, prev + 1));

  // Remove filter
  const removeFilter = (id: string) => setActiveFilters(prev => prev.filter(f => f.id !== id));

  // Get filtered properties
  const getFilteredProperties = () => {
    return properties.filter(p => {
      const matchesSearch = !searchTerm || 
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  // Set default template when channel changes
  useEffect(() => {
    const defaultTemplate = getDefaultTemplate(selectedChannel);
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [selectedChannel, getDefaultTemplate]);

  // Get selected template
  const selectedTemplate = selectedTemplateId 
    ? templates.find(t => t.id === selectedTemplateId) 
    : getDefaultTemplate(selectedChannel);

  // Helper function to render template preview
  const renderTemplatePreview = (prop: CampaignProperty, type: 'body' | 'subject' = 'body') => {
    if (!selectedTemplate) {
      return 'Selecione um template';
    }

    const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    const propertyUrl = `https://offer.mylocalinvest.com/property/${prop.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
    
    if (type === 'subject' && selectedTemplate.subject) {
      let subject = selectedTemplate.subject;
      subject = subject.replace(/\{address\}/g, prop.address);
      subject = subject.replace(/\{name\}/g, prop.owner_name || 'Owner');
      subject = subject.replace(/\{city\}/g, prop.city);
      subject = subject.replace(/\{state\}/g, prop.state);
      return subject;
    }

    // Replace template variables for body
    let content = selectedTemplate.body;
    content = content.replace(/\{name\}/g, prop.owner_name || 'Owner');
    content = content.replace(/\{address\}/g, prop.address);
    content = content.replace(/\{city\}/g, prop.city);
    content = content.replace(/\{state\}/g, prop.state);
    content = content.replace(/\{cash_offer\}/g, prop.cash_offer_amount?.toLocaleString() || '0');
    content = content.replace(/\{company_name\}/g, settings.company.company_name);
    content = content.replace(/\{phone\}/g, settings.company.contact_phone);
    content = content.replace(/\{seller_name\}/g, settings.company.company_name);
    content = content.replace(/\{full_address\}/g, fullAddress);
    content = content.replace(/\{property_url\}/g, propertyUrl);
    content = content.replace(/\{qr_code_url\}/g, qrCodeUrl);
    content = content.replace(/\{source_channel\}/g, selectedChannel);

    return content;
  };

  // Helper function to generate template content for sending
  const generateTemplateContent = (template: any, prop: CampaignProperty, trackingId?: string) => {
    const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    const propertyUrl = `https://offer.mylocalinvest.com/property/${prop.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

    // Generate trackable link if tracking ID is provided
    const trackablePropertyUrl = trackingId
      ? `${window.location.origin}/track/click?tid=${trackingId}&url=${encodeURIComponent(propertyUrl)}`
      : propertyUrl;

    const trackingPixel = trackingId ? `<img src="${window.location.origin}/track/open?tid=${trackingId}" width="1" height="1" style="display:none;" alt="" />` : '';
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?property=${prop.id}`;

    let content = template.body;
    content = content.replace(/\{name\}/g, prop.owner_name || 'Owner');
    content = content.replace(/\{address\}/g, prop.address);
    content = content.replace(/\{city\}/g, prop.city);
    content = content.replace(/\{state\}/g, prop.state);
    content = content.replace(/\{cash_offer\}/g, prop.cash_offer_amount?.toLocaleString() || '0');
    content = content.replace(/\{company_name\}/g, settings.company.company_name);
    content = content.replace(/\{phone\}/g, settings.company.contact_phone);
    content = content.replace(/\{seller_name\}/g, settings.company.company_name);
    content = content.replace(/\{full_address\}/g, fullAddress);
    content = content.replace(/\{property_url\}/g, trackablePropertyUrl);
    content = content.replace(/\{qr_code_url\}/g, qrCodeUrl);
    content = content.replace(/\{source_channel\}/g, selectedChannel);
    content = content.replace(/\{tracking_pixel\}/g, trackingPixel);
    content = content.replace(/\{unsubscribe_url\}/g, unsubscribeUrl);

    const subject = template.subject?.replace(/\{address\}/g, prop.address) || `Cash Offer for ${prop.address}`;

    return { content, subject };
  };
  
  // Column selection state
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState('phone1');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('email1');
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Build select columns based on selected phone/email columns
  const getSelectColumns = () => {
    const baseColumns = ['id', 'address', 'city', 'state', 'zip_code', 'owner_name', 'cash_offer_amount', 'approval_status', 'tags'];
    const phoneCol = selectedPhoneColumn;
    const emailCol = selectedEmailColumn;
    
    // Add unique columns
    const allColumns = [...baseColumns];
    if (!allColumns.includes(phoneCol)) allColumns.push(phoneCol);
    if (!allColumns.includes(emailCol)) allColumns.push(emailCol);
    
    return allColumns.join(', ');
  };

  // Fetch properties on mount and when columns change
  useEffect(() => {
    fetchProperties();
  }, [filterStatus, selectedPhoneColumn, selectedEmailColumn]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const selectColumns = getSelectColumns();
      
      let query = supabase
        .from('properties')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('approval_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Cast data to unknown first, then to Property[] to satisfy TypeScript
      setProperties((data as unknown as CampaignProperty[]) || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Erro ao carregar propriedades',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  const getSelectedProperties = () => {
    return properties.filter((p) => selectedIds.includes(p.id));
  };

  // Get phone/email from property based on selected column
  const getPhone = (prop: CampaignProperty): string | undefined => {
    // Priority 1: Get from tags (pref_phone:)
    const prefPhones = (prop.tags || []).filter((t: string) => t.startsWith('pref_phone:')).map((t: string) => t.replace('pref_phone:', ''));
    if (prefPhones.length > 0) {
      return prefPhones[0];
    }
    // Priority 2: Fall back to selected column
    return prop[selectedPhoneColumn] as string | undefined;
  };

  const getEmail = (prop: CampaignProperty): string | undefined => {
    // Priority 1: Get from tags (pref_email:)
    const prefEmails = (prop.tags || []).filter((t: string) => t.startsWith('pref_email:')).map((t: string) => t.replace('pref_email:', ''));
    if (prefEmails.length > 0) {
      return prefEmails[0];
    }
    // Priority 2: Fall back to selected column
    return prop[selectedEmailColumn] as string | undefined;
  };

  const getAllPhones = (prop: CampaignProperty): string[] => {
    // Priority 1: Get from tags
    const prefPhones = (prop.tags || []).filter((t: string) => t.startsWith('pref_phone:')).map((t: string) => t.replace('pref_phone:', ''));
    if (prefPhones.length > 0) {
      return prefPhones;
    }
    // Priority 2: Selected column
    const phone = prop[selectedPhoneColumn] as string | undefined;
    return phone ? [phone] : [];
  };

  const getAllEmails = (prop: CampaignProperty): string[] => {
    // Priority 1: Get from tags
    const prefEmails = (prop.tags || []).filter((t: string) => t.startsWith('pref_email:')).map((t: string) => t.replace('pref_email:', ''));
    if (prefEmails.length > 0) {
      return prefEmails;
    }
    // Priority 2: Selected column
    const email = prop[selectedEmailColumn] as string | undefined;
    return email ? [email] : [];
  };

  // Wizard navigation functions
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedTemplateId !== '';
      case 2: return selectedIds.length > 0;
      case 3: return true; // Configuration is always valid
      case 4: return true; // Preview is always valid
      case 5: return true; // Send step
      default: return false;
    }
  };

  // Campaign statistics calculations
  const getCampaignStats = () => {
    const selectedProps = getSelectedProperties();
    const approvedProps = selectedProps.filter(p => p.approval_status === 'approved');
    const propsWithPhones = selectedProps.filter(p => getAllPhones(p).length > 0);
    const propsWithEmails = selectedProps.filter(p => getAllEmails(p).length > 0);

    return {
      totalProperties: selectedProps.length,
      approvedProperties: approvedProps.length,
      propertiesWithPhones: propsWithPhones.length,
      propertiesWithEmails: propsWithEmails.length,
      totalPhoneContacts: propsWithPhones.reduce((sum, p) => sum + getAllPhones(p).length, 0),
      totalEmailContacts: propsWithEmails.reduce((sum, p) => sum + getAllEmails(p).length, 0),
    };
  };

  const handleSendCampaign = async () => {
    const selectedProps = getSelectedProperties();

    // ===== VALIDAÇÕES PRÉ-ENVIO =====
    const validationIssues = validateCampaignReadiness();

    // Separar erros críticos de avisos
    const criticalErrors = validationIssues.filter(issue => issue.type === 'error');
    const warnings = validationIssues.filter(issue => issue.type === 'warning');

    // Mostrar erros críticos
    if (criticalErrors.length > 0) {
      toast({
        title: 'Campanha não pode ser enviada',
        description: criticalErrors.map(err => err.message).join('. '),
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    // Mostrar avisos importantes
    if (warnings.length > 0) {
      const proceedAnyway = window.confirm(
        `⚠️ AVISOS IMPORTANTES\n\n${warnings.map(w => w.message).join('\n')}\n\nDeseja continuar mesmo assim?`
      );
      if (!proceedAnyway) return;
    }

    // ===== VERIFICAÇÃO DE SAÚDE DO SISTEMA =====
    try {
      const health = await performSystemHealthCheck();
      if (!health.api) {
        toast({
          title: 'Sistema indisponível',
          description: 'A API de comunicação não está respondendo. Tente novamente em alguns minutos.',
          variant: 'destructive',
          duration: 6000,
        });
        return;
      }
    } catch (error) {
      toast({
        title: 'Erro de conectividade',
        description: 'Não foi possível verificar o status do sistema.',
        variant: 'destructive',
      });
      return;
    }

    // Se tudo estiver OK, mostrar preview
    setShowSendPreview(true);
  };

  const handleConfirmSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    setShowSendPreview(false);

    // ===== PRÉ-VALIDAÇÃO AVANÇADA =====
    const validationErrors = [];

    // 1. Verificar serviço disponível
    try {
      await checkHealth();
    } catch (error) {
      validationErrors.push('Serviço de comunicação indisponível. Tente novamente em alguns minutos.');
    }

    // 2. Validações básicas
    if (selectedProps.length === 0) {
      validationErrors.push('Nenhuma propriedade selecionada');
    }

    if (!selectedTemplate) {
      validationErrors.push('Nenhum template selecionado');
    }

    // 3. Verificar contatos compatíveis
    const incompatibleProps = selectedProps.filter(prop => {
      if (selectedChannel === 'sms' || selectedChannel === 'call') {
        return getAllPhones(prop).length === 0;
      } else if (selectedChannel === 'email') {
        return getAllEmails(prop).length === 0;
      }
      return false;
    });

    if (incompatibleProps.length > 0) {
      validationErrors.push(`${incompatibleProps.length} propriedades não têm ${selectedChannel === 'email' ? 'email' : 'telefone'} válido`);
    }

    // 4. Verificar limite de envio (evitar sobrecarga)
    if (selectedProps.length > 100) {
      validationErrors.push('Máximo de 100 propriedades por campanha. Divida em campanhas menores.');
    }

    if (validationErrors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: validationErrors.join('. '),
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    // ===== CONFIRMAÇÃO DETALHADA =====
    const contactSummary = selectedChannel === 'email'
      ? `${propsWithEmail}/${selectedProps.length} propriedades com email`
      : `${propsWithPhone}/${selectedProps.length} propriedades com telefone`;

    const confirmed = window.confirm(
      `🚀 CONFIRMAR ENVIO DE CAMPANHA\n\n` +
      `📧 Template: ${selectedTemplate.name}\n` +
      `📡 Canal: ${selectedChannel.toUpperCase()}\n` +
      `🏠 Propriedades: ${selectedProps.length}\n` +
      `📞 Contatos válidos: ${contactSummary}\n\n` +
      `⚠️  Esta ação irá enviar ${selectedProps.length} comunicações\n` +
      `💰 Custo estimado: ${selectedChannel === 'sms' ? `$${(selectedProps.length * 0.05).toFixed(2)}` : selectedChannel === 'call' ? `$${(selectedProps.length * 0.10).toFixed(2)}` : '$0.00'}\n\n` +
      `❓ Tem certeza que deseja continuar?`
    );

    if (!confirmed) return;

    // ===== INÍCIO DO ENVIO CONTROLADO =====
    setSending(true);
    let successCount = 0;
    let failCount = 0;
    let completedCount = 0;
    const failedProperties: any[] = [];
    const batchSize = 5; // Processar em lotes para evitar sobrecarga

    updateProgress(0, selectedProps.length, 0, 0);

    // Processar em lotes
    for (let batchStart = 0; batchStart < selectedProps.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, selectedProps.length);
      const batch = selectedProps.slice(batchStart, batchEnd);

      // Processar lote em paralelo (até 3 simultâneos)
      const batchPromises = batch.map(async (prop, indexInBatch) => {
        const globalIndex = batchStart + indexInBatch;
        return processPropertySend(prop, globalIndex);
      });

      // Aguardar conclusão do lote
      const batchResults = await Promise.allSettled(batchPromises);

      // Atualizar progresso e contadores
      batchResults.forEach((result, indexInBatch) => {
        const globalIndex = batchStart + indexInBatch;
        completedCount++;

        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            failCount++;
            failedProperties.push(result.value.property);
          }
        } else {
          failCount++;
          failedProperties.push(selectedProps[globalIndex]);
        }

        updateProgress(completedCount, selectedProps.length, successCount, failCount);
      });

      // Pequena pausa entre lotes para não sobrecarregar
      if (batchEnd < selectedProps.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setSending(false);

    // ===== RESULTADO FINAL COM AÇÕES =====
    const totalSent = successCount + failCount;
    const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

    const resultToast = {
      title: (
        <div className="flex items-center gap-2">
          {successRate === 100 ? (
            <Trophy className="w-5 h-5 text-yellow-500" />
          ) : successRate >= 80 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : successRate >= 50 ? (
            <Activity className="w-5 h-5 text-blue-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          )}
          Campanha {successRate === 100 ? 'Perfeita!' : successRate >= 80 ? 'Concluída!' : 'Concluída'}
        </div>
      ),
      description: `${successCount} enviados com sucesso, ${failCount} falharam. Taxa de sucesso: ${successRate}%`,
      duration: 15000,
    };

    // Adicionar ações baseadas no resultado
    if (successRate < 100 && failedProperties.length > 0) {
      resultToast.action = (
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Tentar novamente apenas os que falharam
              setSelectedIds(failedProperties.map(p => p.id));
              setCurrentStep(4);
              toast({
                title: 'Propriedades falharam selecionadas',
                description: 'Vá para o passo 4 para tentar novamente apenas os envios que falharam.',
              });
            }}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar Novamente ({failCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Ver logs detalhados
              toast({
                title: 'Logs de campanha',
                description: 'Verifique os logs detalhados no painel de administração.',
              });
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Logs
          </Button>
        </div>
      );
    } else if (successRate === 100) {
      resultToast.action = (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentStep(1);
            setSelectedIds([]);
            setSelectedTemplateId('');
          }}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      );
    }

    toast(resultToast);

    // Limpar seleção após envio
    setSelectedIds([]);
    setProgressStats({ completed: 0, total: 0, success: 0, fail: 0, successCount: 0, failCount: 0, estimatedTimeRemaining: '0s' });
  };

  // ===== FUNÇÃO AUXILIAR PARA PROCESSAR PROPRIEDADE =====
  const processPropertySend = async (prop: any, globalIndex: number) => {
    try {
      const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
      const allPhones = getAllPhones(prop);
      const allEmails = getAllEmails(prop);

      let sent = false;
      let lastError: any = null;
      const trackingId = crypto.randomUUID();

      if (selectedChannel === 'sms') {
        if (allPhones.length === 0) {
          return { success: false, property: prop, error: 'No phone available' };
        }

        const { content } = generateTemplateContent(selectedTemplate, prop, trackingId);

        for (const phone of allPhones) {
          try {
            await sendSMS({
              phone_number: phone,
              body: content,
            });

            // Log successful SMS send
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId,
              campaign_type: 'manual',
              channel: 'sms',
              property_id: prop.id,
              recipient_phone: phone,
              sent_at: new Date().toISOString(),
              metadata: {
                template_id: selectedTemplate.id,
                template_name: selectedTemplate.name,
                contact_index: allPhones.indexOf(phone),
                total_contacts: allPhones.length,
                batch_index: globalIndex
              }
            });

            sent = true;
            break;
          } catch (error) {
            lastError = error;
            console.error(`SMS failed for ${phone}:`, error);
          }
        }
      } else if (selectedChannel === 'email') {
        if (allEmails.length === 0) {
          return { success: false, property: prop, error: 'No email available' };
        }

        const { content, subject } = generateTemplateContent(selectedTemplate, prop, trackingId);

        for (const email of allEmails) {
          try {
            await sendEmail({
              receiver_email: email,
              subject: subject,
              message_body: content,
            });

            // Log successful email send
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId,
              campaign_type: 'manual',
              channel: 'email',
              property_id: prop.id,
              recipient_email: email,
              sent_at: new Date().toISOString(),
              metadata: {
                template_id: selectedTemplate.id,
                template_name: selectedTemplate.name,
                contact_index: allEmails.indexOf(email),
                total_contacts: allEmails.length,
                subject: subject,
                batch_index: globalIndex
              }
            });

            sent = true;
            break;
          } catch (error) {
            lastError = error;
            console.error(`Email failed for ${email}:`, error);
          }
        }
      } else if (selectedChannel === 'call') {
        if (allPhones.length === 0) {
          return { success: false, property: prop, error: 'No phone available' };
        }

        const { content } = generateTemplateContent(selectedTemplate, prop, trackingId);

        for (const phone of allPhones) {
          try {
            await initiateCall({
              name: prop.owner_name || 'Owner',
              address: fullAddress,
              from_number: settings.company.contact_phone,
              to_number: phone,
              voicemail_drop: content,
              seller_name: settings.company.company_name,
            });

            // Log successful call initiation
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId,
              campaign_type: 'manual',
              channel: 'call',
              property_id: prop.id,
              recipient_phone: phone,
              sent_at: new Date().toISOString(),
              metadata: {
                template_id: selectedTemplate.id,
                template_name: selectedTemplate.name,
                contact_index: allPhones.indexOf(phone),
                total_contacts: allPhones.length,
                batch_index: globalIndex
              }
            });

            sent = true;
            break;
          } catch (error) {
            lastError = error;
            console.error(`Call failed for ${phone}:`, error);
          }
        }
      }

      return { success: sent, property: prop, error: sent ? null : lastError };
    } catch (error: any) {
      console.error(`Error sending to ${prop.id}:`, error);
      return { success: false, property: prop, error };
    }
  };

  // ===== SISTEMA DE VALIDAÇÃO PRÉ-ENVIO =====
  const validateCampaignReadiness = () => {
    const selectedProps = getSelectedProperties();
    const issues: Array<{type: 'error' | 'warning', message: string, action?: string}> = [];

    // 1. Validações críticas (bloqueiam envio)
    if (selectedProps.length === 0) {
      issues.push({type: 'error', message: 'Nenhuma propriedade selecionada'});
    }

    if (!selectedTemplate) {
      issues.push({type: 'error', message: 'Nenhum template selecionado'});
    }

    // 2. Validação de contatos por canal
    const contactValidation = validateContactsForChannel(selectedProps, selectedChannel);
    issues.push(...contactValidation.errors);

    // 3. Avisos importantes (não bloqueiam, mas alertam)
    issues.push(...contactValidation.warnings);

    // 4. Validações de limite e performance
    if (selectedProps.length > 50) {
      issues.push({
        type: 'warning',
        message: `${selectedProps.length} propriedades selecionadas. Considere dividir em campanhas menores para melhor controle.`
      });
    }

    // 5. Validação de template
    const templateValidation = validateTemplateContent(selectedTemplate, selectedChannel);
    issues.push(...templateValidation);

    return issues;
  };

  // ===== VALIDAÇÃO DE CONTATOS =====
  const validateContactsForChannel = (properties: any[], channel: Channel) => {
    const errors: Array<{type: 'error' | 'warning', message: string}> = [];
    const warnings: Array<{type: 'error' | 'warning', message: string}> = [];

    let totalContacts = 0;
    let propertiesWithContacts = 0;
    let propertiesWithoutContacts = 0;

    properties.forEach(prop => {
      const phones = getAllPhones(prop);
      const emails = getAllEmails(prop);

      if (channel === 'sms' || channel === 'call') {
        if (phones.length === 0) {
          propertiesWithoutContacts++;
        } else {
          propertiesWithContacts++;
          totalContacts += phones.length;
        }
      } else if (channel === 'email') {
        if (emails.length === 0) {
          propertiesWithoutContacts++;
        } else {
          propertiesWithContacts++;
          totalContacts += emails.length;
        }
      }
    });

    if (propertiesWithoutContacts > 0) {
      errors.push({
        type: 'error',
        message: `${propertiesWithoutContacts} propriedades não têm ${channel === 'email' ? 'email' : 'telefone'} válido`
      });
    }

    if (propertiesWithContacts > 0 && totalContacts > propertiesWithContacts * 2) {
      warnings.push({
        type: 'warning',
        message: `Algumas propriedades têm múltiplos contatos (${totalContacts} total). O sistema tentará todos sequencialmente.`
      });
    }

    return { errors, warnings, stats: { totalContacts, propertiesWithContacts, propertiesWithoutContacts } };
  };

  // ===== VALIDAÇÃO DE TEMPLATE =====
  const validateTemplateContent = (template: any, channel: Channel) => {
    const issues: Array<{type: 'error' | 'warning', message: string}> = [];

    if (!template) return issues;

    // Verificar variáveis obrigatórias
    const requiredVars = ['name', 'address'];
    const templateContent = channel === 'email' ? template.content : template.content;

    requiredVars.forEach(varName => {
      if (!templateContent.includes(`{${varName}}`)) {
        issues.push({
          type: 'warning',
          message: `Template não contém variável obrigatória: {${varName}}`
        });
      }
    });

    // Verificar comprimento por canal
    if (channel === 'sms' && templateContent.length > 160) {
      issues.push({
        type: 'warning',
        message: `SMS muito longo (${templateContent.length} chars). Pode ser dividido em múltiplas mensagens.`
      });
    }

    return issues;
  };

  // ===== VERIFICAÇÃO DE SAÚDE DO SISTEMA =====
  const performSystemHealthCheck = async () => {
    const healthResults = {
      api: false,
      database: false,
      services: [] as string[],
      warnings: [] as string[]
    };

    try {
      // 1. Verificar API
      await checkHealth();
      healthResults.api = true;
      healthResults.services.push('API de comunicação');
    } catch (error) {
      healthResults.warnings.push('API de comunicação indisponível');
    }

    try {
      // 2. Verificar conexão com banco
      const { data, error } = await supabase.from('campaign_logs').select('count').limit(1);
      if (!error) {
        healthResults.database = true;
        healthResults.services.push('Banco de dados');
      }
    } catch (error) {
      healthResults.warnings.push('Erro de conexão com banco de dados');
    }

    return healthResults;
  };

  // ===== SIMULAÇÃO DE ENVIO =====
  const simulateCampaignSend = async () => {
    const selectedProps = getSelectedProperties();
    const simulationResults = {
      total: selectedProps.length,
      wouldSend: 0,
      wouldFail: 0,
      contactBreakdown: [] as Array<{property: string, contacts: string[], channel: string}>,
      estimatedCost: 0,
      estimatedTime: 0
    };

    selectedProps.forEach(prop => {
      const phones = getAllPhones(prop);
      const emails = getAllEmails(prop);

      if (selectedChannel === 'sms' && phones.length > 0) {
        simulationResults.wouldSend++;
        simulationResults.contactBreakdown.push({
          property: prop.address,
          contacts: phones,
          channel: 'SMS'
        });
        simulationResults.estimatedCost += phones.length * 0.05;
      } else if (selectedChannel === 'email' && emails.length > 0) {
        simulationResults.wouldSend++;
        simulationResults.contactBreakdown.push({
          property: prop.address,
          contacts: emails,
          channel: 'Email'
        });
      } else if (selectedChannel === 'call' && phones.length > 0) {
        simulationResults.wouldSend++;
        simulationResults.contactBreakdown.push({
          property: prop.address,
          contacts: phones,
          channel: 'Call'
        });
        simulationResults.estimatedCost += phones.length * 0.10;
      } else {
        simulationResults.wouldFail++;
      }
    });

    // Estimativa de tempo (5 props por lote, 1s entre lotes)
    simulationResults.estimatedTime = Math.ceil(selectedProps.length / 5) * 1;

    return simulationResults;
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 Campaign Creator</h1>
            <p className="text-muted-foreground">
              Create and launch marketing campaigns step by step
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={fetchProperties} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-2" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>

      {/* Test Mode Warning */}
      {testMode && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            🧪 <strong>Test Mode Active:</strong> Messages will be simulated (not actually sent)
          </AlertDescription>
        </Alert>
      )}

      {/* Wizard Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-8">
            {[
              { step: 1, title: 'Choose Template', icon: Target },
              { step: 2, title: 'Select Properties', icon: Users },
              { step: 3, title: 'Configure', icon: Filter },
              { step: 4, title: 'Preview', icon: Eye },
              { step: 5, title: 'Send Campaign', icon: Send },
            ].map(({ step, title, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {currentStep > step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  <div className={`text-xs ${
                    currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {title}
                  </div>
                </div>
                {index < 4 && (
                  <ArrowRight className={`w-4 h-4 mx-4 ${
                    currentStep > step ? 'text-primary' : 'text-muted-foreground/30'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[600px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Choose Template</h2>
                  <p className="text-muted-foreground">Select a template for your campaign</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['sms', 'email', 'call'].map((channel) => (
                    <div key={channel} className="space-y-3">
                      <Label className="text-sm font-medium capitalize flex items-center gap-2">
                        {channel === 'sms' && <MessageSquare className="w-4 h-4" />}
                        {channel === 'email' && <Mail className="w-4 h-4" />}
                        {channel === 'call' && <Phone className="w-4 h-4" />}
                        {channel.toUpperCase()} Templates
                      </Label>
                      <div className="space-y-2">
                        {getTemplatesByChannel(channel as Channel).map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTemplateId === template.id && selectedChannel === channel
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              setSelectedChannel(channel as Channel);
                              setSelectedTemplateId(template.id);
                            }}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {template.subject || template.body.substring(0, 50)}...
                            </div>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs mt-1">Default</Badge>
                            )}
                          </div>
                        ))}
                        {getTemplatesByChannel(channel as Channel).length === 0 && (
                          <div className="p-4 border rounded-lg text-center text-muted-foreground bg-muted/20">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Nenhum template disponível</p>
                            <p className="text-xs">Crie templates primeiro para usar este canal</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">🎯 Select Properties</h2>
                  <p className="text-muted-foreground">Choose the properties you want to target with your campaign</p>
                </div>

                {/* Filtros e Busca Avançados */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar propriedades por endereço, nome ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros Avançados
                    </Button>
                  </div>

                  {/* Filtros de Status */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={filterStatus === 'approved' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('approved')}
                    >
                      ✅ Approved ({properties.filter(p => p.approval_status === 'approved').length})
                    </Button>
                    <Button
                      variant={filterStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('pending')}
                    >
                      ⏳ Pending ({properties.filter(p => p.approval_status === 'pending').length})
                    </Button>
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      📋 All ({properties.length})
                    </Button>
                  </div>

                  {/* Filtros Ativos */}
                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map(filter => (
                        <Badge key={filter.id} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => removeFilter(filter.id)}>
                          {filter.label} ×
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>
                        <X className="w-3 h-3 mr-1" />
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-5" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-32 w-full" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : getFilteredProperties().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Target className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhuma propriedade encontrada' : 'Nenhuma propriedade disponível'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? `Não encontramos propriedades que correspondam à sua busca "${searchTerm}".`
                        : `Não há propriedades com status "${filterStatus}" disponíveis para campanhas.`
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      {searchTerm && (
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                          Limpar busca
                        </Button>
                      )}
                      <Button onClick={() => setFilterStatus('all')}>
                        Ver todas as propriedades
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="group hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          📋 Available Properties
                        </CardTitle>
                        <CardDescription>
                          {getFilteredProperties().length} propriedades encontradas
                          {searchTerm && ` para "${searchTerm}"`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-2">
                            {getFilteredProperties().map((property) => {
                                const phones = getAllPhones(property);
                                const emails = getAllEmails(property);
                                return (
                                  <div
                                    key={property.id}
                                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => toggleSelection(property.id)}
                                  >
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                        {property.owner_name?.charAt(0) || property.address.charAt(0) || 'P'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                          {property.address}
                                        </p>
                                        <Badge
                                          variant={property.approval_status === 'approved' ? 'default' : 'secondary'}
                                          className="text-xs flex-shrink-0"
                                        >
                                          {property.approval_status}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                              <Phone className="w-3 h-3" />
                                              {phones.length}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{phones.length} números de telefone disponíveis</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                              <Mail className="w-3 h-3" />
                                              {emails.length}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{emails.length} endereços de email disponíveis</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        {property.cash_offer_amount && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="flex items-center gap-1 cursor-help">
                                                <DollarSign className="w-3 h-3" />
                                                {property.cash_offer_amount.toLocaleString()}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Oferta de cash: ${property.cash_offer_amount.toLocaleString()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                    <Checkbox
                                      checked={selectedIds.includes(property.id)}
                                      onChange={() => {}}
                                      className="flex-shrink-0"
                                    />
                                  </div>
                                );
                              })}
                          </div>
                        </ScrollArea>
                        {getFilteredProperties().length === 0 && !loading && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Nenhuma propriedade encontrada</p>
                            <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Selected Properties ({selectedIds.length})</CardTitle>
                        <CardDescription>
                          Properties that will receive your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedIds.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            No properties selected
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Nenhuma propriedade selecionada</p>
                            <p className="text-sm">Selecione propriedades na lista ao lado para continuar</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Configure Campaign</h2>
                  <p className="text-muted-foreground">Set up your campaign settings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Channel Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Communication Channel</Label>
                        <Tabs value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as Channel)}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="sms" className="gap-1">
                              <MessageSquare className="w-4 h-4" />
                              SMS
                            </TabsTrigger>
                            <TabsTrigger value="email" className="gap-1">
                              <Mail className="w-4 h-4" />
                              Email
                            </TabsTrigger>
                            <TabsTrigger value="call" className="gap-1">
                              <Phone className="w-4 h-4" />
                              Call
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {(selectedChannel === 'sms' || selectedChannel === 'call') && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Phone Column</Label>
                          <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHONE_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedChannel === 'email' && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Email Column</Label>
                          <Select value={selectedEmailColumn} onValueChange={setSelectedEmailColumn}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EMAIL_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-medium">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Channel:</span>
                          <span className="font-medium capitalize">{selectedChannel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Properties:</span>
                          <span className="font-medium">{selectedIds.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mode:</span>
                          <span className="font-medium">{testMode ? '🧪 Test' : '🚀 Live'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Campaign Preview</h2>
                  <p className="text-muted-foreground">Review your campaign before sending</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const stats = getCampaignStats();
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Properties:</span>
                                <span className="font-semibold">{stats.totalProperties}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Approved:</span>
                                <span className="font-semibold text-green-600">{stats.approvedProperties}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Preferred Phones:</span>
                                <span className="font-semibold">{stats.propertiesWithPhones}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Primary Phones:</span>
                                <span className="font-semibold">{stats.totalPhoneContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Skip Tracing Phones:</span>
                                <span className="font-semibold">0</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Phone Contacts:</span>
                                <span className="font-semibold">{stats.totalPhoneContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Preferred Emails:</span>
                                <span className="font-semibold">{stats.propertiesWithEmails}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Primary Emails:</span>
                                <span className="font-semibold">{stats.totalEmailContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Skip Tracing Emails:</span>
                                <span className="font-semibold">0</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Email Contacts:</span>
                                <span className="font-semibold">{stats.totalEmailContacts}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-semibold">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Channels:</span>
                          <span className="font-semibold">{selectedChannel}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Expected Success:</span>
                          <span className="font-semibold text-green-600">15-25%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>📧 Message Content Preview</span>
                      {selectedProps.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPreview}
                            disabled={previewIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                            {previewIndex + 1} / {selectedProps.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPreview}
                            disabled={previewIndex === selectedProps.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Preview of actual messages that will be sent to recipients
                      {selectedProps.length > 0 && (
                        <span className="block text-sm font-medium text-foreground mt-1">
                          Previewing: {selectedProps[previewIndex]?.address || 'N/A'}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProps.length > 0 && selectedTemplate ? (
                      <div className="space-y-6">
                        {selectedChannel === 'sms' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-medium">SMS Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {renderTemplatePreview(selectedProps[0])}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              ~{renderTemplatePreview(selectedProps[0]).length} characters
                            </div>
                          </div>
                        )}

                        {selectedChannel === 'email' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4" />
                              <span className="font-medium">Email Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              <div className="font-medium mb-2">
                                Subject: {renderTemplatePreview(selectedProps[0], 'subject')}
                              </div>
                              <div className="whitespace-pre-line">
                                {renderTemplatePreview(selectedProps[0])}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              HTML email with professional formatting
                            </div>
                          </div>
                        )}

                        {selectedChannel === 'call' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4" />
                              <span className="font-medium">Call Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {renderTemplatePreview(selectedProps[0])}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Voicemail message for unanswered calls
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Select properties and template to see preview
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Campaign Summary & Validation */}
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Campaign Summary & Validation
                    </CardTitle>
                    <CardDescription>
                      Final checklist before sending your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Template Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Template
                        </h4>
                        <div className="pl-6 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Name:</span>
                            <span className="font-medium">{selectedTemplate?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Channel:</span>
                            <span className="font-medium capitalize">{selectedChannel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Properties Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Recipients
                        </h4>
                        <div className="pl-6 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Selected:</span>
                            <span className="font-medium">{selectedIds.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>With Contact:</span>
                            <span className={`font-medium ${(selectedChannel === 'email' ? propsWithEmail : propsWithPhone) === selectedIds.length ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedChannel === 'email' ? propsWithEmail : propsWithPhone} / {selectedIds.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validation Checklist */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Pre-Send Validation
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {selectedTemplate ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={selectedTemplate ? 'text-green-700' : 'text-red-700'}>
                            Template selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {selectedIds.length > 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={selectedIds.length > 0 ? 'text-green-700' : 'text-red-700'}>
                            Properties selected ({selectedIds.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {(selectedChannel === 'email' ? propsWithEmail : propsWithPhone) === selectedIds.length ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-700">
                                Todas as propriedades têm contato válido
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-700">
                                {selectedIds.length - (selectedChannel === 'email' ? propsWithEmail : propsWithPhone)} propriedades sem contato
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">
                            Campaign ready to send
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Send Campaign</h2>
                  <p className="text-muted-foreground">Launch your campaign to selected properties</p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Ready to Send</h3>
                        <p className="text-muted-foreground">
                          Your campaign will be sent to {selectedIds.length} properties using {selectedChannel.toUpperCase()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">
                          Make sure your marketing API is configured before proceeding.
                        </p>
                      </div>

                      {/* Simulation Button */}
                      <div className="flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={async () => {
                            setSimulating(true);
                            try {
                              const simulation = await simulateCampaignSend();
                              const health = await performSystemHealthCheck();

                              setSimulationResults(simulation);
                              setHealthStatus(health);
                              setShowSimulationModal(true);
                            } catch (error) {
                              toast({
                                title: 'Erro na simulação',
                                description: 'Verifique se a API de marketing está configurada.',
                                variant: 'destructive'
                              });
                            }
                            setSimulating(false);
                          }}
                          disabled={simulating || sending || selectedIds.length === 0}
                          className="flex-1 max-w-xs"
                        >
                          {simulating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Simulando...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Testar Campanha
                            </>
                          )}
                        </Button>

                        <Button
                          size="lg"
                          onClick={handleSendCampaign}
                          disabled={sending || simulating || selectedIds.length === 0}
                          className="flex-1 max-w-xs"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Enviar ({selectedIds.length})
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      {sending && (
                        <div className="space-y-3 mt-6">
                          <div className="flex justify-between text-sm">
                            <span>Enviando campanha...</span>
                            <span>{progressStats.completed}/{progressStats.total} ({Math.round((progressStats.completed/progressStats.total)*100) || 0}%)</span>
                          </div>
                          <Progress
                            value={(progressStats.completed/progressStats.total)*100 || 0}
                            className="h-3"
                          />
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
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || loading || sending}
              className="min-w-[100px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Passo {currentStep} de 5
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Carregando...
                </div>
              )}
            </div>

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext() || loading || sending}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aguarde
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <div className="min-w-[100px]"></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== MODAL DE PREVIEW DE ENVIO ===== */}
      <Dialog open={showSendPreview} onOpenChange={setShowSendPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Confirmar Envio da Campanha
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes abaixo antes de enviar a campanha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo da Campanha */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Template</Label>
                    <p className="text-sm text-muted-foreground">{selectedTemplate?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Canal</Label>
                    <p className="text-sm text-muted-foreground">{selectedChannel.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedProps.length}</div>
                    <div className="text-sm text-muted-foreground">Propriedades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedProps.filter(p =>
                        selectedChannel === 'email' ? getAllEmails(p).length > 0 : getAllPhones(p).length > 0
                      ).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Contatos Válidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedProps.filter(p =>
                        selectedChannel === 'email' ? getAllEmails(p).length > 0 : getAllPhones(p).length > 0
                      ).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Mensagens</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Propriedades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Propriedades Selecionadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedProps.slice(0, 10).map((prop, index) => {
                    const phones = getAllPhones(prop);
                    const emails = getAllEmails(prop);
                    const contacts = selectedChannel === 'email' ? emails : phones;

                    return (
                      <div key={prop.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{prop.address}</div>
                          <div className="text-xs text-muted-foreground">
                            {prop.owner_name || 'Proprietário não informado'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {contacts.map((contact, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {selectedChannel === 'email' ? '✉️' : '📱'} {contact}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {selectedProps.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... e mais {selectedProps.length - 10} propriedades
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview do Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview do Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedChannel === 'email' && selectedTemplate?.subject && (
                    <div>
                      <Label className="text-sm font-medium">Assunto</Label>
                      <p className="text-sm bg-muted p-2 rounded">
                        {renderTemplatePreview(selectedProps[0], 'subject')}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Mensagem</Label>
                    <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {renderTemplatePreview(selectedProps[0], 'body')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barra de Progresso durante envio */}
            {sending && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enviando campanha...</span>
                      <span>{Math.round(progressStats.completed / progressStats.total * 100)}%</span>
                    </div>
                    <Progress value={progressStats.completed / progressStats.total * 100} className="w-full" />
                    <div className="text-xs text-muted-foreground text-center">
                      {progressStats.successCount} sucesso • {progressStats.failCount} falhas • {progressStats.estimatedTimeRemaining} restantes
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSendPreview(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSendCampaign}
              disabled={sending}
              className="min-w-32 bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar Envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulation Results Modal */}
      <Dialog open={showSimulationModal} onOpenChange={setShowSimulationModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Simulação de Envio - Resultados
            </DialogTitle>
            <DialogDescription>
              Análise completa do que seria enviado nesta campanha
            </DialogDescription>
          </DialogHeader>

          {simulationResults && healthStatus && (
            <div className="space-y-6">
              {/* System Health Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {healthStatus.api ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">API de Comunicação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {healthStatus.database ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Banco de Dados</span>
                    </div>
                  </div>
                  {healthStatus.warnings.length > 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Avisos:</strong> {healthStatus.warnings.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Resumo da Campanha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{simulationResults.total}</p>
                      <p className="text-xs text-muted-foreground">Total Propriedades</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{simulationResults.wouldSend}</p>
                      <p className="text-xs text-muted-foreground">Seriam Enviadas</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{simulationResults.wouldFail}</p>
                      <p className="text-xs text-muted-foreground">Sem Contato</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">${simulationResults.estimatedCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Custo Estimado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Detalhamento por Propriedade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {simulationResults.contactBreakdown.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">{item.property}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.contacts.length} contato(s) • {item.channel}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {item.contacts.length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSimulationModal(false)}>
                  Fechar
                </Button>
                {simulationResults.wouldSend > 0 && (
                  <Button onClick={() => {
                    setShowSimulationModal(false);
                    handleSendCampaign();
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Confirmar Envio ({simulationResults.wouldSend} mensagens)
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== MODAL DE PREVIEW DE ENVIO ===== */}
      <SendPreviewModal />
    </div>
    </TooltipProvider>
  );
};

export default CampaignManager;
