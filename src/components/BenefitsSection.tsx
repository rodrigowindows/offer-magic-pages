import { Shield, Clock, Home, Banknote, FileCheck, Heart } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Stop Tax Foreclosure",
    description: "Avoid the stress and uncertainty of tax deed sales with our immediate cash solution."
  },
  {
    icon: Home,
    title: "No Repairs Needed",
    description: "Sell your property as-is. We buy houses in any condition, saving you time and money."
  },
  {
    icon: Banknote,
    title: "Pay Off Your Tax Debt",
    description: "Use our cash offer to clear your tax obligations and start fresh with a clean slate."
  },
  {
    icon: Clock,
    title: "Close in 7 Days or Less",
    description: "Need to move quickly? We can close in as little as one week, on your schedule."
  },
  {
    icon: FileCheck,
    title: "Zero Commissions or Fees",
    description: "No agent fees, no closing costs, no hidden charges. What we offer is what you get."
  },
  {
    icon: Heart,
    title: "Compassionate Support",
    description: "We understand the stress you're facing and treat every situation with empathy and respect."
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why This is a Great Solution for Tax Deed Issues
          </h2>
          <p className="text-lg text-muted-foreground">
            We specialize in helping Miami homeowners facing tax challenges. Here's how we can help you:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all hover:border-primary/50 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
