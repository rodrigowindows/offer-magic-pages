import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PROCESS_STEPS } from './processSteps';
import { StepperNav } from './StepperNav';
import { ReviewQueue } from '@/components/ReviewQueue';
import { MAOCalculator } from './MAOCalculator';
import { BatchSelector } from './BatchSelector';

const getCurrentStepIndex = (pathname: string): number => {
  if (pathname === '/process' || pathname === '/process/') return 0;
  const match = pathname.match(/\/process\/step-(\d+)/);
  if (match) return parseInt(match[1], 10) - 1;
  return 0;
};

export const ProcessApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = getCurrentStepIndex(location.pathname);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  const goToPrevious = () => {
    if (currentIndex > 0) navigate(PROCESS_STEPS[currentIndex - 1].fullPath);
  };

  const goToNext = () => {
    if (currentIndex < PROCESS_STEPS.length - 1) navigate(PROCESS_STEPS[currentIndex + 1].fullPath);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile header */}
      <header className="sm:hidden border-b bg-card sticky top-0 z-40">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="shrink-0 h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <StepperNav currentIndex={currentIndex} compact />
          <div className="ml-auto shrink-0">
            <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
          </div>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden sm:block border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 shrink-0 h-9 px-3">
            <ChevronLeft className="h-4 w-4" />
            <span>Menu</span>
          </Button>
          <h1 className="text-lg font-semibold truncate">Processo de Investimento</h1>
          <div className="ml-auto shrink-0">
            <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
          </div>
        </div>
      </header>

      {/* Desktop stepper */}
      <div className="hidden sm:block border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <StepperNav currentIndex={currentIndex} />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto py-2 sm:py-6 pb-14 sm:pb-24">
        <Routes>
          <Route path="/" element={<ReviewQueue selectedBatch={selectedBatch} />} />
          <Route path="/step-2" element={<MAOCalculator />} />
          <Route path="*" element={<Navigate to="/process" replace />} />
        </Routes>
      </main>

      {/* Footer Navigation */}
      <div className="border-t bg-card sticky bottom-0 z-30">
        <div className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-3 flex items-center justify-between">
          {currentIndex > 0 ? (
            <Button variant="outline" onClick={goToPrevious} size="sm" className="gap-1.5 text-xs h-7 sm:h-9 sm:text-sm sm:gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Ant.
            </Button>
          ) : (
            <div />
          )}

          <span className="text-[10px] sm:text-sm text-muted-foreground">
            {currentIndex + 1}/{PROCESS_STEPS.length}
          </span>

          {currentIndex < PROCESS_STEPS.length - 1 ? (
            <Button onClick={goToNext} size="sm" className="gap-1.5 text-xs h-7 sm:h-9 sm:text-sm sm:gap-2">
              Prox.
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="default" onClick={() => navigate('/')} size="sm" className="text-xs h-7 sm:h-9 sm:text-sm">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
