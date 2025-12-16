import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import { ChevronLeft, ChevronRight, X, TrendingUp, DollarSign } from "lucide-react";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  focar?: string; // score
  comparative_price?: number;
  airbnb_eligible?: boolean;
  evaluation?: string; // AI recommendation
  tags?: string[];
  owner_name?: string;
  owner_phone?: string;
}

interface BatchReviewModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onViewAnalysis: (id: string) => void;
}

export const BatchReviewMode = ({
  open,
  onOpenChange,
  properties,
  onApprove,
  onReject,
  onViewAnalysis,
}: BatchReviewModeProps) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const currentProperty = properties[currentIndex];
  const progress = ((reviewed.size / properties.length) * 100).toFixed(0);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing) return;

      switch (e.key.toLowerCase()) {
        case "a":
          handleApprove();
          break;
        case "r":
          handleReject();
          break;
        case "s":
          handleSkip();
          break;
        case "arrowright":
          handleNext();
          break;
        case "arrowleft":
          handlePrevious();
          break;
        case "escape":
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [open, currentIndex, isProcessing]);

  const handleApprove = async () => {
    if (!currentProperty || isProcessing) return;

    setIsProcessing(true);
    try {
      await onApprove(currentProperty.id);
      setReviewed(new Set(reviewed).add(currentProperty.id));
      toast({
        title: "✅ Approved",
        description: `${currentProperty.address} approved`,
      });
      handleNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve property",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentProperty || isProcessing) return;

    setIsProcessing(true);
    try {
      await onReject(currentProperty.id);
      setReviewed(new Set(reviewed).add(currentProperty.id));
      toast({
        title: "❌ Rejected",
        description: `${currentProperty.address} rejected`,
      });
      handleNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject property",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished all properties
      toast({
        title: "🎉 Batch Review Complete!",
        description: `Reviewed ${reviewed.size} of ${properties.length} properties`,
      });
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentProperty) {
    return null;
  }

  const offerPercentage = ((currentProperty.cash_offer_amount / currentProperty.estimated_value) * 100).toFixed(1);
  const score = currentProperty.focar ? parseInt(currentProperty.focar) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              🔍 Batch Review Mode
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Property {currentIndex + 1} of {properties.length}
              </span>
              <span>{reviewed.size} reviewed</span>
            </div>
            <Progress value={parseFloat(progress)} className="h-2" />
          </div>
        </div>

        {/* Property Content */}
        <div className="space-y-4 mt-6">
          {/* Image */}
          <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
            <PropertyImageDisplay
              imageUrl={currentProperty.property_image_url || ""}
              address={currentProperty.address}
              className="w-full h-full"
              showZoom={false}
            />

            {/* Score Badge */}
            {score > 0 && (
              <div
                className={`absolute bottom-4 left-4 px-4 py-2 rounded-full font-bold text-lg shadow-lg ${
                  score >= 85
                    ? "bg-red-100 text-red-800"
                    : score >= 70
                    ? "bg-orange-100 text-orange-800"
                    : score >= 50
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                Score: {score}/100
                {score >= 85 && " 🔥"}
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-bold">{currentProperty.address}</h3>
              <p className="text-muted-foreground">
                {currentProperty.city}, {currentProperty.state} {currentProperty.zip_code}
              </p>
              {currentProperty.owner_name && (
                <p className="text-sm text-muted-foreground mt-2">
                  Owner: {currentProperty.owner_name}
                  {currentProperty.owner_phone && ` • ${currentProperty.owner_phone}`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {/* Value */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Value</p>
                  <p className="font-bold text-lg">
                    ${currentProperty.estimated_value.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Offer */}
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Cash Offer</p>
                  <p className="font-bold text-lg text-green-600">
                    ${currentProperty.cash_offer_amount.toLocaleString()}
                    <span className="text-sm font-normal ml-2">({offerPercentage}%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Offer Bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Offer Analysis</span>
              <span className="font-semibold">{offerPercentage}% of value</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  parseFloat(offerPercentage) < 65
                    ? "bg-red-500"
                    : parseFloat(offerPercentage) < 75
                    ? "bg-green-500"
                    : parseFloat(offerPercentage) < 85
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
                style={{ width: `${Math.min(parseFloat(offerPercentage), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>60% (Low)</span>
              <span>70% (Good)</span>
              <span>80% (High)</span>
              <span>90%</span>
            </div>
          </div>

          {/* AI Analysis */}
          {currentProperty.evaluation && (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🤖 AI Recommendation
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {currentProperty.evaluation.split("\n")[0]}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {currentProperty.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {currentProperty.comparative_price && (
              <Badge variant="outline">
                🤖 AI Value: ${currentProperty.comparative_price.toLocaleString()}
              </Badge>
            )}
            {currentProperty.airbnb_eligible && (
              <Badge variant="outline" className="bg-green-50">
                ✅ Airbnb Eligible
              </Badge>
            )}
          </div>

          {/* View Full Analysis Button */}
          <Button
            variant="outline"
            onClick={() => onViewAnalysis(currentProperty.id)}
            className="w-full"
          >
            📊 View Full AI Analysis
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t">
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            size="lg"
            className="h-16 bg-green-600 hover:bg-green-700 text-lg"
          >
            {isProcessing ? "Processing..." : "✓ Approve"}
            <span className="block text-xs mt-1">Press A</span>
          </Button>

          <Button
            onClick={handleSkip}
            disabled={isProcessing}
            variant="outline"
            size="lg"
            className="h-16 text-lg"
          >
            ⏭️ Skip
            <span className="block text-xs mt-1">Press S</span>
          </Button>

          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="destructive"
            size="lg"
            className="h-16 text-lg"
          >
            ✗ Reject
            <span className="block text-xs mt-1">Press R</span>
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isProcessing}
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Use ← → arrow keys to navigate
          </div>

          <Button
            onClick={handleNext}
            disabled={currentIndex === properties.length - 1 || isProcessing}
            variant="ghost"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <strong>Keyboard Shortcuts:</strong> A = Approve • R = Reject • S = Skip • ← → = Navigate • ESC = Exit
        </div>
      </DialogContent>
    </Dialog>
  );
};
