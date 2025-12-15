import { Calculator, Check, X } from "lucide-react";

interface SavingsCalculatorProps {
  cashOffer: number;
  estimatedValue: number;
}

const SavingsCalculator = ({ cashOffer, estimatedValue }: SavingsCalculatorProps) => {
  // Traditional sale costs
  const realtorCommission = estimatedValue * 0.06; // 6% realtor fee
  const closingCosts = estimatedValue * 0.02; // 2% closing costs
  const repairCosts = estimatedValue * 0.05; // 5% typical repairs
  const holdingCosts = estimatedValue * 0.01; // 1% holding costs (mortgage, taxes, insurance)
  
  const traditionalNet = estimatedValue - realtorCommission - closingCosts - repairCosts - holdingCosts;
  const cashOfferNet = cashOffer; // No deductions
  
  const totalSavings = realtorCommission + closingCosts + repairCosts + holdingCosts;
  const netDifference = cashOfferNet - traditionalNet;

  return (
    <div className="bg-card rounded-2xl shadow-strong p-6 md:p-8 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">See What You Save</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Traditional Sale */}
        <div className="bg-muted/50 rounded-xl p-5 border border-border">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-destructive" />
            Traditional Sale
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">List Price</span>
              <span className="font-medium text-foreground">${estimatedValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Realtor Commission (6%)</span>
              <span>-${realtorCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Closing Costs (2%)</span>
              <span>-${closingCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Repairs & Prep (5%)</span>
              <span>-${repairCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Holding Costs (1%)</span>
              <span>-${holdingCosts.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span className="text-foreground">Your Net</span>
              <span className="text-foreground">${traditionalNet.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              + 3-6 months waiting time
            </div>
          </div>
        </div>

        {/* Our Cash Offer */}
        <div className="bg-secondary/10 rounded-xl p-5 border-2 border-secondary">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            Our Cash Offer
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cash Offer</span>
              <span className="font-medium text-foreground">${cashOffer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Realtor Commission</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Closing Costs</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Repairs Needed</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Holding Costs</span>
              <span>$0</span>
            </div>
            <div className="border-t border-secondary/30 pt-3 flex justify-between font-bold">
              <span className="text-foreground">Your Net</span>
              <span className="text-secondary">${cashOfferNet.toLocaleString()}</span>
            </div>
            <div className="text-xs text-success font-medium">
              Close in 7-14 days
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-success/10 rounded-xl p-4 border border-success/30 text-center">
        <p className="text-sm text-muted-foreground mb-1">You save on fees & costs</p>
        <p className="text-2xl font-bold text-success">${totalSavings.toLocaleString()}</p>
        {netDifference > 0 && (
          <p className="text-xs text-success mt-1">
            Plus ${netDifference.toLocaleString()} more in your pocket!
          </p>
        )}
      </div>
    </div>
  );
};

export default SavingsCalculator;
