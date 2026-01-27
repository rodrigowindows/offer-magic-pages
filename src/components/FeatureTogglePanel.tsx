/**
 * Feature Toggle Control Panel - Interface administrativa para gerenciar features
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeatureToggle, type FeatureFlags } from '@/contexts/FeatureToggleContext';
import {
  Settings,
  Zap,
  Eye,
  Sparkles,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Layers,
  BarChart3,
  Palette,
  Database,
  Send,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: Array<{
    key: keyof FeatureFlags;
    label: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Contact Management',
    description: 'Como os contatos são armazenados e acessados',
    icon: <Database className="h-5 w-5" />,
    features: [
      {
        key: 'useTagsForContacts',
        label: 'Use Tags for Contacts',
        description: 'Store preferred contacts in tags (current) vs database columns (legacy)',
        impact: 'high',
      },
      {
        key: 'showPreferredContactsFilter',
        label: 'Show Preferred Contacts Filter',
        description: 'Display "Only with Preferred Contacts" checkbox in property selection',
        impact: 'low',
      },
      {
        key: 'enableSkipTracingData',
        label: 'Enable Skip Tracing Data',
        description: 'Use skip_tracing_data field for additional contact information',
        impact: 'medium',
      },
    ],
  },
  {
    title: 'Campaign Wizard',
    description: 'Funcionalidades do assistente de criação de campanhas',
    icon: <Send className="h-5 w-5" />,
    features: [
      {
        key: 'enableCampaignPreview',
        label: 'Campaign Preview',
        description: 'Show preview step before sending campaigns',
        impact: 'medium',
      },
      {
        key: 'enableBatchProcessing',
        label: 'Batch Processing',
        description: 'Process sends in batches (5 per batch) for better reliability',
        impact: 'high',
      },
      {
        key: 'showCostEstimates',
        label: 'Cost Estimates',
        description: 'Display estimated costs in confirmation dialogs',
        impact: 'low',
      },
      {
        key: 'enableRetryLogic',
        label: 'Auto-Retry Failed Sends',
        description: 'Automatically retry failed campaign sends',
        impact: 'high',
      },
      {
        key: 'showCampaignTemplates',
        label: 'Campaign Templates',
        description: 'Show template selector in wizard',
        impact: 'medium',
      },
    ],
  },
  {
    title: 'UI/UX Design',
    description: 'Aparência e experiência do usuário',
    icon: <Palette className="h-5 w-5" />,
    features: [
      {
        key: 'useModernGradients',
        label: 'Modern Gradients',
        description: 'Use gradient backgrounds and modern design elements',
        impact: 'low',
      },
      {
        key: 'showAnimations',
        label: 'Animations',
        description: 'Enable transitions and animated elements',
        impact: 'low',
      },
      {
        key: 'enableDarkMode',
        label: 'Dark Mode',
        description: 'Enable dark mode theme (experimental)',
        impact: 'medium',
      },
      {
        key: 'showMetricCards',
        label: 'Metric Cards',
        description: 'Display metric cards in campaign wizard',
        impact: 'low',
      },
      {
        key: 'enableCompactView',
        label: 'Compact View',
        description: 'Use compact card layout for properties',
        impact: 'low',
      },
    ],
  },
  {
    title: 'Advanced Features',
    description: 'Funcionalidades avançadas de marketing',
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      {
        key: 'enableQRCodes',
        label: 'QR Code Generation',
        description: 'Generate QR codes for property pages',
        impact: 'medium',
      },
      {
        key: 'enableURLTracking',
        label: 'URL Tracking (UTM)',
        description: 'Add UTM parameters to track campaign sources',
        impact: 'medium',
      },
      {
        key: 'enableABTesting',
        label: 'A/B Testing',
        description: 'Enable A/B testing features for campaigns',
        impact: 'high',
      },
      {
        key: 'showAnalyticsDashboard',
        label: 'Analytics Dashboard',
        description: 'Display analytics and performance metrics',
        impact: 'medium',
      },
    ],
  },
  {
    title: 'Data Display',
    description: 'Informações mostradas nas telas',
    icon: <Eye className="h-5 w-5" />,
    features: [
      {
        key: 'showPropertyImages',
        label: 'Property Images',
        description: 'Show property images in lists and cards',
        impact: 'low',
      },
      {
        key: 'showOwnerInfo',
        label: 'Owner Information',
        description: 'Display owner name and contact info',
        impact: 'low',
      },
    ],
  },
  {
    title: 'Campaign Operations',
    description: 'Operações e funcionalidades de campanha',
    icon: <Zap className="h-5 w-5" />,
    features: [
      {
        key: 'enableQuickCampaign',
        label: 'Quick Campaign',
        description: 'Enable quick campaign creation dialog',
        impact: 'medium',
      },
      {
        key: 'enableScheduledSends',
        label: 'Scheduled Sends',
        description: 'Allow scheduling campaigns for future dates',
        impact: 'medium',
      },
      {
        key: 'enableTestMode',
        label: 'Test Mode',
        description: 'Enable test mode for campaign testing',
        impact: 'high',
      },
    ],
  },
];

const PRESETS = [
  {
    id: 'full' as const,
    name: 'Full Features',
    description: 'Todas as funcionalidades ativadas (versão atual)',
    badge: 'Current',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'legacy' as const,
    name: 'Legacy (Jan 8)',
    description: 'Versão 435bb94 - Database columns, batch processing',
    badge: 'Recommended',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'modern' as const,
    name: 'Modern UI (Jan 8)',
    description: 'Versão 45f168a - Enhanced UI with gradients',
    badge: 'Beautiful',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Apenas funcionalidades essenciais',
    badge: 'Simple',
    badgeColor: 'bg-gray-100 text-gray-700',
  },
];

export const FeatureTogglePanel: React.FC = () => {
  const { flags, updateFlag, resetToDefaults, loadPreset } = useFeatureToggle();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('presets');

  const handleExport = () => {
    const json = JSON.stringify(flags, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported Successfully',
      description: 'Feature flags saved to file',
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        Object.entries(imported).forEach(([key, value]) => {
          if (typeof value === 'boolean') {
            updateFlag(key as keyof FeatureFlags, value);
          }
        });
        toast({
          title: 'Imported Successfully',
          description: 'Feature flags loaded from file',
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Invalid file format',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Feature Toggle Control Panel</CardTitle>
                <CardDescription className="mt-1">
                  Ative/desative funcionalidades sem precisar fazer commits ou deploys
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">
            <Layers className="h-4 w-4 mr-2" />
            Quick Presets
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <Settings className="h-4 w-4 mr-2" />
            Detailed Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecione um preset para carregar configurações pré-definidas rapidamente
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300"
                onClick={() => {
                  loadPreset(preset.id);
                  toast({
                    title: 'Preset Loaded',
                    description: `${preset.name} configuration applied`,
                  });
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{preset.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {preset.description}
                      </CardDescription>
                    </div>
                    <Badge className={preset.badgeColor}>
                      {preset.badge}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              Controle individual de cada feature. Mudanças são salvas automaticamente.
            </AlertDescription>
          </Alert>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {FEATURE_GROUPS.map((group, groupIdx) => (
                <Card key={groupIdx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {group.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.title}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {group.features.map((feature) => (
                      <div key={feature.key} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                              {feature.label}
                            </Label>
                            <Badge variant="outline" className={`text-xs ${getImpactColor(feature.impact)}`}>
                              {feature.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={feature.key}
                            checked={flags[feature.key]}
                            onCheckedChange={(checked) => updateFlag(feature.key, checked)}
                          />
                          {flags[feature.key] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Current Configuration</h4>
              <p className="text-sm text-blue-700">
                {Object.values(flags).filter(Boolean).length} of {Object.keys(flags).length} features enabled
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
