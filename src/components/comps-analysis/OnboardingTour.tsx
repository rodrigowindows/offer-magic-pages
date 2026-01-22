import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingTour = ({ open, onOpenChange }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Comps Analysis!",
      description: "Let me show you around in 4 quick steps"
    },
    {
      title: "Select a Property",
      description: "Choose any property from the dropdown to start"
    },
    {
      title: "Review Comparables",
      description: "Comps load automatically and you can adjust them"
    },
    {
      title: "Save & Export",
      description: "Save to history or export as PDF when done"
    }
  ];

  const handleClose = () => {
    onOpenChange(false);
    localStorage.setItem('comps_onboarding_seen', 'true');
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            {steps[step].title}
          </DialogTitle>
          <DialogDescription>
            {steps[step].description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full ${i === step ? 'bg-blue-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              Skip
            </Button>
            <Button size="sm" onClick={handleNext}>
              {step < steps.length - 1 ? 'Next →' : 'Get Started!'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
