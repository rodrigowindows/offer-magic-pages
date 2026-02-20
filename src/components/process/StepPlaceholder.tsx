import { ProcessStep } from './processSteps';
import { Card } from '@/components/ui/card';

interface StepPlaceholderProps {
  step: ProcessStep;
}

export const StepPlaceholder = ({ step }: StepPlaceholderProps) => {
  const Icon = step.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">
          Passo {step.number}: {step.title}
        </h1>
      </div>
      <p className="text-muted-foreground mb-6">{step.description}</p>
      <Card className="p-8 text-center border-dashed border-2">
        <p className="text-muted-foreground">
          Conteúdo será migrado aqui.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Componente futuro: Passo {step.number}
        </p>
      </Card>
    </div>
  );
};
