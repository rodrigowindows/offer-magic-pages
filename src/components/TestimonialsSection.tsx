import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria Rodriguez",
    location: "Miami, FL",
    text: "I was drowning in tax debt and didn't know what to do. MyLocalInvest gave me a fair offer and helped me close in just 10 days. The weight off my shoulders is incredible.",
    rating: 5
  },
  {
    name: "James Thompson",
    location: "Hialeah, FL",
    text: "These folks really care. They explained everything clearly, never pressured me, and the whole process was smooth. I got cash in hand and my tax problems are solved.",
    rating: 5
  },
  {
    name: "Carmen Diaz",
    location: "Kendall, FL",
    text: "I inherited a property with tax issues and no way to fix it. MyLocalInvest made a great offer, handled all the paperwork, and I closed on my schedule. Highly recommend!",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Miami Homeowners Are Saying
          </h2>
          <p className="text-lg text-muted-foreground">
            Real stories from people we've helped move forward
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="border-t border-border pt-4">
                <p className="font-bold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
