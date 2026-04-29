import { ChevronLeft, Code, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminChat } from '@/components/ai/AdminChat';
import { BatchSelector } from './BatchSelector';
import { BatchExportButton } from './BatchExportButton';
import { ApiInfoPanel } from './ApiInfoPanel';
import { StepperNav } from './StepperNav';

interface ProcessHeaderProps {
  currentStepIndex: number;
  selectedBatch: string;
  onBatchChange: (batch: string) => void;
  onBack: () => void;
  stepTitle: string;
}

/** Secondary action buttons (without batch selector) */
const SecondaryActions = () => (
  <>
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Bot className="h-3 w-3 text-primary" />
          <span className="hidden sm:inline">Chat IA</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
        <div className="h-full pt-8">
          <AdminChat />
        </div>
      </SheetContent>
    </Sheet>
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Code className="h-3 w-3 text-violet-500" />
          <span className="hidden sm:inline">API</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-4 w-4 text-violet-500" />
            process-api v2.0 — Documentação
          </DialogTitle>
        </DialogHeader>
        <ApiInfoPanel embedded />
      </DialogContent>
    </Dialog>
    <BatchExportButton />
  </>
);

export const ProcessHeader = ({
  currentStepIndex,
  selectedBatch,
  onBatchChange,
  onBack,
  stepTitle,
}: ProcessHeaderProps) => (
  <>
    {/* Mobile header */}
    <header className="sm:hidden border-b bg-card shrink-0">
      <div className="flex items-center gap-1 px-2 py-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 h-7 w-7 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-semibold truncate">{stepTitle}</h1>
        <div className="ml-auto flex items-center gap-1">
          <HeaderActions selectedBatch={selectedBatch} onBatchChange={onBatchChange} />
        </div>
      </div>
      <div className="px-2 py-1 overflow-x-auto">
        <StepperNav currentIndex={currentStepIndex} compact />
      </div>
    </header>

    {/* Desktop header */}
    <header className="hidden sm:block border-b bg-card shrink-0">
      <div className="container mx-auto px-4 py-1.5 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 shrink-0 h-8 px-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Menu</span>
        </Button>
        <div className="flex-1 flex justify-center">
          <StepperNav currentIndex={currentStepIndex} />
        </div>
        <div className="flex items-center gap-1.5">
          <HeaderActions selectedBatch={selectedBatch} onBatchChange={onBatchChange} />
        </div>
      </div>
    </header>
  </>
);
