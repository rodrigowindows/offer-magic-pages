/**
 * Comps Walkthrough - Tutorial Interativo
 * Guia o usuário passo a passo no processo de adicionar comps
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Lightbulb,
  Target,
  Zap,
  Copy,
  ExternalLink,
  MousePointerClick,
  Keyboard,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  tips: string[];
  icon: any;
  location: 'zillow' | 'system';
  estimatedTime: string;
  shortcuts?: string[];
}

const WALKTHROUGH_STEPS: Step[] = [
  {
    id: 1,
    title: 'Selecione a Propriedade',
    description: 'Escolha a propriedade para qual você quer encontrar comps',
    tips: [
      'Use o dropdown para selecionar uma propriedade existente',
      'O endereço será preenchido automaticamente',
      'Certifique-se de que o endereço está correto'
    ],
    icon: Target,
    location: 'system',
    estimatedTime: '5 segundos'
  },
  {
    id: 2,
    title: 'Clique "Buscar no Zillow"',
    description: 'Abrirá o Zillow automaticamente com a busca pronta',
    tips: [
      'Nova aba será aberta (não perca seu trabalho atual)',
      'Busca já vem configurada: "recently sold near [seu endereço]"',
      'Zillow abrirá em poucos segundos'
    ],
    icon: ExternalLink,
    location: 'system',
    estimatedTime: '2 segundos',
    shortcuts: ['Ou digite manualmente no Zillow se preferir']
  },
  {
    id: 3,
    title: 'Filtrar no Zillow',
    description: 'Configure os filtros para encontrar comps relevantes',
    tips: [
      'Clique "More Filters" no Zillow',
      'Marque: "Sold in last 6 months"',
      'Defina Price Range: ±20% do valor da sua propriedade',
      'Defina Square Feet: ±30% do sqft da sua propriedade',
      'Clique "Apply"'
    ],
    icon: TrendingUp,
    location: 'zillow',
    estimatedTime: '20 segundos'
  },
  {
    id: 4,
    title: 'Ordenar por Distância',
    description: 'Veja os comps mais próximos primeiro',
    tips: [
      'No Zillow, clique no dropdown de ordenação',
      'Selecione "Distance"',
      'Os comps mais próximos aparecem primeiro',
      'Foque nos primeiros 10-15 resultados'
    ],
    icon: Target,
    location: 'zillow',
    estimatedTime: '3 segundos'
  },
  {
    id: 5,
    title: 'Abrir Múltiplas Propriedades',
    description: 'Ctrl+Click para abrir em novas abas',
    tips: [
      'Segure Ctrl (Windows) ou Cmd (Mac)',
      'Clique em 10 propriedades',
      'Cada uma abre em nova aba',
      'Escolha as mais próximas e similares'
    ],
    icon: MousePointerClick,
    location: 'zillow',
    estimatedTime: '15 segundos',
    shortcuts: ['Ctrl+Click', 'Cmd+Click (Mac)']
  },
  {
    id: 6,
    title: 'Copiar URLs',
    description: 'Copie a URL de cada aba aberta',
    tips: [
      'Em cada aba: Ctrl+L (seleciona URL)',
      'Ctrl+C (copia URL)',
      'Ctrl+W (fecha aba)',
      'Repita para todas as 10 abas',
      'Cole no Notepad temporariamente'
    ],
    icon: Copy,
    location: 'zillow',
    estimatedTime: '20 segundos',
    shortcuts: ['Ctrl+L → Ctrl+C → Ctrl+W (repete 10x)']
  },
  {
    id: 7,
    title: 'Voltar ao Sistema',
    description: 'Abra o Bulk Add no nosso sistema',
    tips: [
      'Volte para a aba do nosso sistema',
      'Pressione Ctrl+Shift+B (abre Bulk Add)',
      'Ou clique no botão "📋 Bulk Add"',
      'Área roxa aparecerá'
    ],
    icon: Keyboard,
    location: 'system',
    estimatedTime: '2 segundos',
    shortcuts: ['Ctrl+Shift+B']
  },
  {
    id: 8,
    title: 'Colar e Adicionar',
    description: 'Cole todas as URLs e salve',
    tips: [
      'No Notepad: Ctrl+A (seleciona tudo)',
      'Ctrl+C (copia todas URLs)',
      'No Bulk Add: Ctrl+V (cola)',
      'Clique "⚡ Adicionar Todas"',
      'Aguarde processamento (3-5 segundos)'
    ],
    icon: Zap,
    location: 'system',
    estimatedTime: '5 segundos',
    shortcuts: ['Ctrl+V no campo Bulk Add']
  },
  {
    id: 9,
    title: 'Pronto! ✅',
    description: '10 comps adicionados em ~1 minuto',
    tips: [
      'Preview mostra comps adicionados',
      'Veja endereços e preços extraídos',
      'Pronto para exportar PDF',
      'Badge "Manual 💜" aparecerá no PDF'
    ],
    icon: CheckCircle2,
    location: 'system',
    estimatedTime: 'Concluído!',
  }
];

interface CompsWalkthroughProps {
  onClose?: () => void;
}

export const CompsWalkthrough = ({ onClose }: CompsWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showFullGuide, setShowFullGuide] = useState(false);

  const step = WALKTHROUGH_STEPS[currentStep];
  const totalSteps = WALKTHROUGH_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps([...completedSteps, step.id]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(totalSteps - 1);
  };

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={step.location === 'zillow' ? 'default' : 'secondary'}>
                  {step.location === 'zillow' ? '🏠 No Zillow' : '💻 No Sistema'}
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.estimatedTime}
                </Badge>
              </div>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  step.location === 'zillow' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    step.location === 'zillow' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Passo {currentStep + 1} de {totalSteps}
                  </div>
                  <div className="text-xl">{step.title}</div>
                </div>
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-medium">{step.description}</p>
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold">
              <Lightbulb className="w-5 h-5" />
              <span>Como fazer:</span>
            </div>
            <ul className="space-y-2 ml-7">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shortcuts */}
          {step.shortcuts && step.shortcuts.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-900 font-semibold mb-2">
                <Keyboard className="w-4 h-4" />
                <span>Atalhos:</span>
              </div>
              <div className="space-y-1 ml-6">
                {step.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="text-sm text-blue-800 font-mono">
                    {shortcut}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < totalSteps - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  Pular Tutorial
                </Button>
              )}

              {currentStep === totalSteps - 1 ? (
                <Button
                  onClick={onClose}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Começar!
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="pt-4 border-t">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullGuide(!showFullGuide)}
              className="text-xs"
            >
              {showFullGuide ? '▼' : '▶'} Ver resumo completo
            </Button>

            {showFullGuide && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-2">
                <div className="font-semibold">📋 Resumo Rápido:</div>
                {WALKTHROUGH_STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 ${
                      completedSteps.includes(s.id) ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {completedSteps.includes(s.id) ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    )}
                    <span>{idx + 1}. {s.title} ({s.estimatedTime})</span>
                  </div>
                ))}
                <div className="pt-2 border-t text-center font-semibold text-purple-600">
                  ⏱️ Tempo Total: ~1 minuto
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
