/**
 * Offer Configuration Component
 * Permite configurar ofertas com valor fixo OU faixa de preço
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Target } from "lucide-react";

export interface OfferConfig {
  type: 'fixed' | 'range';
  fixedAmount?: number;
  rangeMin?: number;
  rangeMax?: number;
  estimatedValue?: number;
}

interface OfferConfigurationProps {
  propertyValue?: number;
  currentOffer?: OfferConfig;
  onOfferChange: (offer: OfferConfig) => void;
  className?: string;
}

export const OfferConfiguration = ({
  propertyValue,
  currentOffer,
  onOfferChange,
  className = ""
}: OfferConfigurationProps) => {
  const [offerType, setOfferType] = useState<'fixed' | 'range'>(currentOffer?.type || 'fixed');
  const [fixedAmount, setFixedAmount] = useState(currentOffer?.fixedAmount?.toString() || '');
  const [rangeMin, setRangeMin] = useState(currentOffer?.rangeMin?.toString() || '');
  const [rangeMax, setRangeMax] = useState(currentOffer?.rangeMax?.toString() || '');

  const handleTypeChange = (type: 'fixed' | 'range') => {
    setOfferType(type);
    if (type === 'fixed') {
      setRangeMin('');
      setRangeMax('');
    } else {
      setFixedAmount('');
    }
  };

  const handleSave = () => {
    const offer: OfferConfig = {
      type: offerType,
      estimatedValue: propertyValue,
    };

    if (offerType === 'fixed' && fixedAmount) {
      offer.fixedAmount = parseFloat(fixedAmount);
    } else if (offerType === 'range' && rangeMin && rangeMax) {
      offer.rangeMin = parseFloat(rangeMin);
      offer.rangeMax = parseFloat(rangeMax);
    }

    onOfferChange(offer);
  };

  const getSuggestedOffer = (value: number) => {
    // Sugestão baseada no valor estimado (70-85% do valor)
    const minOffer = Math.round(value * 0.7);
    const maxOffer = Math.round(value * 0.85);
    return { min: minOffer, max: maxOffer };
  };

  const suggestedOffer = propertyValue ? getSuggestedOffer(propertyValue) : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Offer Configuration
        </CardTitle>
        <CardDescription>
          Set a fixed amount or price range for your cash offer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Value Display */}
        {propertyValue && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated Property Value</span>
              <Badge variant="outline" className="text-lg font-bold">
                ${propertyValue.toLocaleString()}
              </Badge>
            </div>
            {suggestedOffer && (
              <p className="text-xs text-muted-foreground mt-2">
                Suggested offer range: ${suggestedOffer.min.toLocaleString()} - ${suggestedOffer.max.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Offer Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Offer Type</Label>
          <RadioGroup value={offerType} onValueChange={handleTypeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                Fixed Amount
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range" className="flex items-center gap-2 cursor-pointer">
                <TrendingUp className="h-4 w-4" />
                Price Range
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fixed Amount Input */}
        {offerType === 'fixed' && (
          <div className="space-y-2">
            <Label htmlFor="fixed-amount">Fixed Offer Amount ($)</Label>
            <Input
              id="fixed-amount"
              type="number"
              placeholder="Enter fixed amount"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              className="text-lg"
            />
            {suggestedOffer && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFixedAmount(suggestedOffer.min.toString())}
                >
                  Use Min: ${suggestedOffer.min.toLocaleString()}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFixedAmount(suggestedOffer.max.toString())}
                >
                  Use Max: ${suggestedOffer.max.toLocaleString()}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Range Inputs */}
        {offerType === 'range' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="range-min">Minimum Amount ($)</Label>
              <Input
                id="range-min"
                type="number"
                placeholder="Min amount"
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-max">Maximum Amount ($)</Label>
              <Input
                id="range-max"
                type="number"
                placeholder="Max amount"
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
              />
            </div>
            {suggestedOffer && (
              <div className="col-span-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRangeMin(suggestedOffer.min.toString());
                    setRangeMax(suggestedOffer.max.toString());
                  }}
                >
                  Use Suggested Range
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(fixedAmount || (rangeMin && rangeMax)) && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Offer Preview</h4>
            {offerType === 'fixed' && fixedAmount && (
              <p className="text-green-700">
                Fixed offer: <span className="font-bold text-lg">${parseFloat(fixedAmount).toLocaleString()}</span>
              </p>
            )}
            {offerType === 'range' && rangeMin && rangeMax && (
              <p className="text-green-700">
                Price range: <span className="font-bold text-lg">${parseFloat(rangeMin).toLocaleString()} - ${parseFloat(rangeMax).toLocaleString()}</span>
              </p>
            )}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={
            (offerType === 'fixed' && !fixedAmount) ||
            (offerType === 'range' && (!rangeMin || !rangeMax))
          }
        >
          Save Offer Configuration
        </Button>
      </CardContent>
    </Card>
  );
};