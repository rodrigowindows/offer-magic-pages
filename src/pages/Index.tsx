const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              MyLocalInvest
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Miami's Trusted Cash Home Buyers
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Fair Cash Offers for Miami Homeowners
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Facing tax deed issues? We help Miami homeowners with fast, fair cash offers. 
              No repairs needed, no commissions, and we can close in as little as 7 days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/admin"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg transition-colors"
              >
                Admin Portal
              </a>
              <a
                href="tel:305-555-0123"
                className="inline-flex items-center justify-center px-8 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-lg transition-colors"
              >
                Call Us: (305) 555-0123
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="text-4xl font-bold text-primary mb-2">7 Days</div>
              <p className="text-muted-foreground">Average closing time</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="text-4xl font-bold text-primary mb-2">$0</div>
              <p className="text-muted-foreground">Fees or commissions</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-muted-foreground">Fair cash offers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
