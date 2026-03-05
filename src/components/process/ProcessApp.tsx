import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ReviewQueue } from '@/components/shared/ReviewQueue';
import { BatchSelector } from './BatchSelector';
import { ApiInfoPanel } from './ApiInfoPanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export const ProcessApp = () => {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/process', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Mobile header */}
      <header className="sm:hidden border-b bg-card shrink-0">
        <div className="flex items-center gap-1 px-2 py-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="shrink-0 h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold truncate">Análise</h1>
          <div className="ml-auto flex items-center gap-1">
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
      </header>

      {/* Desktop header */}
      <header className="hidden sm:block border-b bg-card shrink-0">
        <div className="container mx-auto px-4 py-1.5 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 shrink-0 h-8 px-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Menu</span>
          </Button>
          <h1 className="text-base font-semibold truncate">Análise de Propriedades</h1>
          <div className="ml-auto flex items-center gap-1.5">
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

      {/* Content - fills remaining height */}
      <main className="flex-1 flex flex-col container mx-auto py-1 min-h-0">
        <div className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<ReviewQueue selectedBatch={selectedBatch} />} />
            <Route path="*" element={<Navigate to="/process" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
