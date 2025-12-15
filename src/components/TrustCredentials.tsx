import { Shield, Star, Award, Users, Building, Clock } from "lucide-react";

const TrustCredentials = () => {
  const credentials = [
    {
      icon: Building,
      value: "500+",
      label: "Properties Purchased",
      color: "text-primary"
    },
    {
      icon: Users,
      value: "98%",
      label: "Satisfied Sellers",
      color: "text-success"
    },
    {
      icon: Clock,
      value: "7 Days",
      label: "Average Close Time",
      color: "text-secondary"
    },
    {
      icon: Award,
      value: "A+",
      label: "BBB Rating",
      color: "text-warning"
    }
  ];

  const reviews = [
    {
      name: "Maria G.",
      location: "Miami, FL",
      text: "They helped me avoid foreclosure and gave me a fair price. Closed in just 10 days!",
      rating: 5
    },
    {
      name: "Carlos R.",
      location: "Hialeah, FL",
      text: "Professional team, no hidden fees. Exactly what they promised.",
      rating: 5
    },
    {
      name: "Sandra T.",
      location: "Coral Gables, FL",
      text: "Best decision I made. Fast, easy, and stress-free.",
      rating: 5
    }
  ];

  return (
    <div className="space-y-8">
      {/* Credentials Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {credentials.map((cred, index) => (
          <div 
            key={index}
            className="bg-card rounded-xl p-4 border border-border text-center hover:shadow-md transition-shadow"
          >
            <cred.icon className={`w-8 h-8 mx-auto mb-2 ${cred.color}`} />
            <div className="text-2xl font-bold text-foreground">{cred.value}</div>
            <div className="text-xs text-muted-foreground">{cred.label}</div>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
          <Shield className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-foreground">Licensed & Insured</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">100% Confidential</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">No Obligation</span>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">
          What Our Sellers Say
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div key={index} className="bg-muted/30 rounded-xl p-4">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-3">&quot;{review.text}&quot;</p>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{review.name}</span> • {review.location}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustCredentials;
