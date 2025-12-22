import { useMarketingStore } from '@/store/marketingStore';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { Step1RecipientInfo } from './Step1RecipientInfo';
import { Step2ChannelsConfig } from './Step2ChannelsConfig';
import { Step3MessageCustomization } from './Step3MessageCustomization';
import { Step4Confirmation } from './Step4Confirmation';

const steps = [
  { number: 1, title: 'Recipient', component: Step1RecipientInfo },
  { number: 2, title: 'Channels', component: Step2ChannelsConfig },
  { number: 3, title: 'Messages', component: Step3MessageCustomization },
  { number: 4, title: 'Confirm', component: Step4Confirmation },
];

export function WizardLayout() {
  const currentStep = useMarketingStore((state) => state.wizard.currentStep);

  // ✅ CORREÇÃO: Garantir que o step está dentro dos bounds
  const safeStep = Math.min(Math.max(currentStep, 1), steps.length);
  const CurrentStepComponent = steps[safeStep - 1].component;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    step.number < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.number === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-sm mt-2 font-medium ${
                  step.number === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step.number < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Progress value={(safeStep / steps.length) * 100} className="h-2" />
      </Card>

      {/* Current Step */}
      <CurrentStepComponent />
    </div>
  );
}

export default WizardLayout;
