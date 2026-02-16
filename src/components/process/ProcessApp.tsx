import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROCESS_STEPS } from './processSteps';
import { StepPlaceholder } from './StepPlaceholder';
import { PropertiesStep } from './PropertiesStep';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </Button>
          <h1 className="text-lg font-semibold">Processo de Investimento</h1>
        </div>
      </header>

      {/* Stepper */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-center overflow-x-auto">
            {PROCESS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === currentIndex;

              return (
                <div key={step.number} className="flex items-center">
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-0.5 w-6 sm:w-10 mx-1',
                        index <= currentIndex ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}

                  {/* Step button */}
                  <Link
                    to={step.fullPath}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
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

      {/* Content */}
      <main className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<PropertiesStep />} />
          <Route path="/step-2" element={<StepPlaceholder step={PROCESS_STEPS[1]} />} />
          <Route path="/step-3" element={<StepPlaceholder step={PROCESS_STEPS[2]} />} />
          <Route path="/step-4" element={<StepPlaceholder step={PROCESS_STEPS[3]} />} />
          <Route path="/step-5" element={<StepPlaceholder step={PROCESS_STEPS[4]} />} />
          <Route path="*" element={<Navigate to="/process" replace />} />
        </Routes>
      </main>

      {/* Footer Navigation */}
      <div className="border-t bg-card sticky bottom-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {currentIndex > 0 ? (
            <Button variant="outline" onClick={goToPrevious} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
          ) : (
            <div />
          )}

          <span className="text-sm text-muted-foreground">
            Passo {currentIndex + 1} de {PROCESS_STEPS.length}
          </span>

          {currentIndex < PROCESS_STEPS.length - 1 ? (
            <Button onClick={goToNext} className="gap-2">
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="default" onClick={() => navigate('/')} className="gap-2">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
