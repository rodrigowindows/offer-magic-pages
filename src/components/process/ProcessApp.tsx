import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ReviewQueue } from '@/components/shared/ReviewQueue';
import { MAOCalculator } from './MAOCalculator';
import { ProcessHeader } from './ProcessHeader';
import { PROCESS_STEPS } from './processSteps';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { lazy, Suspense } from 'react';

const ImportProperties = lazy(() => import('@/pages/ImportProperties'));
const SkipTrace = lazy(() => import('@/pages/SkipTrace'));
const ManualCompsManager = lazy(() =>
  import('@/components/shared/ManualCompsManager').then(m => ({ default: m.ManualCompsManager }))
);
const ResponseDashboard = lazy(() =>
  import('@/components/campaigns/ResponseDashboard').then(m => ({ default: m.ResponseDashboard }))
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
    return idx >= 0 ? idx : 1;
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
      <ProcessHeader
        currentStepIndex={currentStepIndex}
        selectedBatch={selectedBatch}
        onBatchChange={setSelectedBatch}
        onBack={() => navigate('/')}
        stepTitle={PROCESS_STEPS[currentStepIndex]?.title || 'Processo'}
      />

      <main className="flex-1 flex flex-col container mx-auto py-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<ReviewQueue selectedBatch={selectedBatch} />} />
              <Route path="/import" element={<ImportProperties />} />
              <Route path="/contacts" element={<SkipTrace />} />
              <Route path="/comps" element={<ManualCompsManager />} />
              <Route path="/mao" element={<MAOCalculator />} />
              <Route path="/responses" element={<ResponseDashboard />} />
              <Route path="*" element={<Navigate to="/process" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};
