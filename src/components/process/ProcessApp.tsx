import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Code, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ReviewQueue } from '@/components/shared/ReviewQueue';
import { BatchSelector } from './BatchSelector';
import { ApiInfoPanel } from './ApiInfoPanel';
import { StepperNav } from './StepperNav';
import { MAOCalculator } from './MAOCalculator';
import { AdminChat } from '@/components/ai/AdminChat';
import { PROCESS_STEPS } from './processSteps';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { lazy, Suspense } from 'react';

const ImportProperties = lazy(() => import('@/pages/ImportProperties'));
const SkipTrace = lazy(() => import('@/pages/SkipTrace'));
const ManualCompsManager = lazy(() =>
  import('@/components/shared/ManualCompsManager').then(m => ({ default: m.ManualCompsManager }))
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

export const ProcessApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const { user, loading } = useCurrentUser();

  const currentStepIndex = useMemo(() => {
    const path = location.pathname.replace('/process', '').replace(/^\//, '');
    const idx = PROCESS_STEPS.findIndex(s => s.path === path);
    return idx >= 0 ? idx : 1; // default to Análise (index 1)
  }, [location.pathname]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/process', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Mobile header */}
      <header className="sm:hidden border-b bg-card shrink-0">
        <div className="flex items-center gap-1 px-2 py-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="shrink-0 h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold truncate">
            {PROCESS_STEPS[currentStepIndex]?.title || 'Processo'}
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Assistente IA">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] p-0">
                <div className="h-full pt-8">
                  <AdminChat />
                </div>
              </SheetContent>
            </Sheet>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="API para Web Agent">
                  <Code className="h-3.5 w-3.5 text-violet-500" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <ApiInfoPanel embedded />
              </DialogContent>
            </Dialog>
            <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
          </div>
        </div>
        {/* Mobile stepper */}
        <div className="px-2 py-1 overflow-x-auto">
          <StepperNav currentIndex={currentStepIndex} compact />
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden sm:block border-b bg-card shrink-0">
        <div className="container mx-auto px-4 py-1.5 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 shrink-0 h-8 px-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Menu</span>
          </Button>
          <div className="flex-1 flex justify-center">
            <StepperNav currentIndex={currentStepIndex} />
          </div>
          <div className="flex items-center gap-1.5">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                  <Bot className="h-3 w-3 text-primary" />
                  Chat IA
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] p-0">
                <div className="h-full pt-8">
                  <AdminChat />
                </div>
              </SheetContent>
            </Sheet>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                  <Code className="h-3 w-3 text-violet-500" />
                  API
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <ApiInfoPanel embedded />
              </DialogContent>
            </Dialog>
            <BatchSelector value={selectedBatch} onChange={setSelectedBatch} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col container mx-auto py-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<ReviewQueue selectedBatch={selectedBatch} />} />
              <Route path="/import" element={<ImportProperties />} />
              <Route path="/contacts" element={<SkipTrace />} />
              <Route path="/comps" element={<ManualCompsManager />} />
              <Route path="/mao" element={<MAOCalculator />} />
              <Route path="*" element={<Navigate to="/process" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};
