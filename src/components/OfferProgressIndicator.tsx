import { Check, Circle } from "lucide-react";

interface OfferProgressIndicatorProps {
  currentStep?: number;
}

const OfferProgressIndicator = ({ currentStep = 1 }: OfferProgressIndicatorProps) => {
  const steps = [
    { label: "View Offer", description: "Review your personalized cash offer" },
    { label: "Submit Info", description: "Share your contact details" },
    { label: "Get Call", description: "Speak with our team" },
    { label: "Close & Get Paid", description: "Sign papers and receive cash" }
  ];

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-6 text-center">
        Your Path to a Quick Sale
      </h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted hidden md:block" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-secondary transition-all duration-500 hidden md:block"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div key={index} className="relative text-center">
                {/* Step Circle */}
                <div 
                  className={`
                    w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center
                    transition-all duration-300 relative z-10
                    ${isCompleted ? 'bg-success text-success-foreground' : ''}
                    ${isCurrent ? 'bg-secondary text-secondary-foreground ring-4 ring-secondary/20' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-bold">{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <p className={`text-sm font-semibold mb-1 ${isCurrent ? 'text-secondary' : 'text-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </p>

                {/* Current Step Indicator */}
                {isCurrent && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <Circle className="w-2 h-2 fill-secondary text-secondary animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OfferProgressIndicator;
