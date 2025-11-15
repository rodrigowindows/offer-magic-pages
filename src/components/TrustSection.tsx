import { Shield, Clock, Banknote, Award } from "lucide-react";

const trustSignals = [
  {
    icon: Shield,
    text: "Licensed & Insured"
  },
  {
    icon: Clock,
    text: "Fast Closings"
  },
  {
    icon: Banknote,
    text: "As-Is Purchase"
  },
  {
    icon: Award,
    text: "Local Miami Experts"
  }
];

const TrustSection = () => {
  return (
    <section className="py-12 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Trusted by Miami Homeowners
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustSignals.map((signal, index) => {
              const Icon = signal.icon;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-3 p-4 bg-card rounded-lg border border-border"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground text-center">{signal.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
