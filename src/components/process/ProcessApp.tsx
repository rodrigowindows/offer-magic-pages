import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROCESS_STEPS } from './processSteps';
import { PropertiesStep } from './PropertiesStep';
import { ReviewQueue } from '@/components/ReviewQueue';
import { CompsAnalysis } from '@/components/marketing/CompsAnalysis';
import { OfferCreationForm } from '@/components/OfferCreationForm';

const STEP_PATH_TO_INDEX: Record<string, number> = {
  '': 0,
  'step-2': 1,
  'step-3': 2,
  'step-4': 3,
};

const getCurrentStepIndex = (pathname: string): number => {
  if (pathname === '/process' || pathname === '/process/') return 0;
  const match = pathname.match(/\/process\/(step-\d+)/);
  if (match) return STEP_PATH_TO_INDEX[match[1]] ?? 0;
  return 0;
};

export const ProcessApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = getCurrentStepIndex(location.pathname);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      navigate(PROCESS_STEPS[currentIndex - 1].fullPath);
    }
  };

  const goToNext = () => {
    if (currentIndex < PROCESS_STEPS.length - 1) {
      navigate(PROCESS_STEPS[currentIndex + 1].fullPath);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1 shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </Button>
          <h1 className="text-base sm:text-lg font-semibold truncate">Processo de Investimento</h1>
        </div>
      </header>

      {/* Stepper - Mobile optimized with horizontal scroll */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-2 sm:px-4 py-2.5 sm:py-4">
          <nav className="flex items-center overflow-x-auto scrollbar-hide gap-0 sm:justify-center pb-1 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
            {PROCESS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;

              return (
                <div key={step.number} className="flex items-center shrink-0">
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-0.5 w-4 sm:w-10 mx-0.5 sm:mx-1',
                        index <= currentIndex ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}

                  {/* Step button */}
                  <Link
                    to={step.fullPath}
                    className={cn(
                      'flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isPast
                        ? 'text-primary/70 hover:bg-accent hover:text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="font-semibold">{step.number}</span>
                    </div>
                    <span className="hidden md:inline">{step.title}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content - grows to fill, with padding for bottom nav */}
      <main className="flex-1 container mx-auto py-3 sm:py-6 pb-20 sm:pb-24">
        <Routes>
          <Route path="/" element={<PropertiesStep />} />
          <Route path="/step-2" element={<ReviewQueue />} />
          <Route path="/step-3" element={<CompsAnalysis />} />
          <Route path="/step-4" element={<OfferCreationForm />} />
          <Route path="*" element={<Navigate to="/process" replace />} />
        </Routes>
      </main>

      {/* Footer Navigation - Mobile optimized */}
      <div className="border-t bg-card sticky bottom-0 z-30">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          {currentIndex > 0 ? (
            <Button variant="outline" onClick={goToPrevious} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Anterior</span>
              <span className="xs:hidden">Ant.</span>
            </Button>
          ) : (
            <div />
          )}

          <span className="text-xs sm:text-sm text-muted-foreground">
            {currentIndex + 1}/{PROCESS_STEPS.length}
          </span>

          {currentIndex < PROCESS_STEPS.length - 1 ? (
            <Button onClick={goToNext} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
              <span className="hidden xs:inline">Próximo</span>
              <span className="xs:hidden">Próx.</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          ) : (
            <Button variant="default" onClick={() => navigate('/')} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
