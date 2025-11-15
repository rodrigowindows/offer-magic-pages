import { MessageSquare, FileText, HandCoins } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Contact Us",
    description: "Tell us about your situation. We'll listen carefully and answer all your questions with no pressure."
  },
  {
    number: "02",
    icon: FileText,
    title: "Get Your Offer",
    description: "Receive your formal, written cash offer. Review it on your own time and make the decision that's right for you."
  },
  {
    number: "03",
    icon: HandCoins,
    title: "Get Paid & Close",
    description: "Choose your closing date, sign the paperwork, and walk away with cash in hand. It's that simple."
  }
];

const ProcessSection = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Simple 3-Step Process
          </h2>
          <p className="text-lg text-muted-foreground">
            We've made selling your house as straightforward as possible. No complications, no hassles.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" 
                 style={{ width: 'calc(100% - 8rem)', left: '4rem' }} 
            />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-card rounded-2xl p-8 shadow-md border border-border hover:shadow-lg transition-all h-full flex flex-col">
                    {/* Step Number Badge */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black text-lg shadow-md z-10">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center mb-6 mx-auto">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-foreground mb-3 text-center">{step.title}</h3>
                    <p className="text-muted-foreground text-center leading-relaxed flex-grow">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
