/**
 * Adjustment Calculator Component
 * Allows users to apply adjustments to comparable properties
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calculator, Plus, Trash2, DollarSign, Percent } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AdjustmentPreset {
  name: string;
  value: number;
  category: 'add' | 'subtract';
  type: 'dollar' | 'percent';
}

const ADJUSTMENT_PRESETS: AdjustmentPreset[] = [
  { name: 'Pool', value: 10000, category: 'add', type: 'dollar' },
  { name: '2-Car Garage', value: 5000, category: 'add', type: 'dollar' },
  { name: '3-Car Garage', value: 8000, category: 'add', type: 'dollar' },
  { name: 'Recently Renovated', value: 15000, category: 'add', type: 'dollar' },
  { name: 'Updated Kitchen', value: 8000, category: 'add', type: 'dollar' },
  { name: 'Updated Bathrooms', value: 5000, category: 'add', type: 'dollar' },
  { name: 'Finished Basement', value: 12000, category: 'add', type: 'dollar' },
  { name: 'Larger Lot (+1000 sqft)', value: 3000, category: 'add', type: 'dollar' },
  { name: 'Waterfront', value: 25000, category: 'add', type: 'dollar' },
  { name: 'Corner Lot', value: 2000, category: 'add', type: 'dollar' },
  { name: 'Needs Major Repairs', value: 20000, category: 'subtract', type: 'dollar' },
  { name: 'Needs Roof Replacement', value: 12000, category: 'subtract', type: 'dollar' },
  { name: 'Needs HVAC', value: 8000, category: 'subtract', type: 'dollar' },
  { name: 'Outdated Interior', value: 10000, category: 'subtract', type: 'dollar' },
  { name: 'Smaller Lot (-1000 sqft)', value: 3000, category: 'subtract', type: 'dollar' },
  { name: 'Busy Street', value: 5000, category: 'subtract', type: 'dollar' },
  { name: 'Superior Condition (+10%)', value: 10, category: 'add', type: 'percent' },
  { name: 'Inferior Condition (-10%)', value: 10, category: 'subtract', type: 'percent' },
];

interface CustomAdjustment {
  name: string;
  amount: number;
  id: string;
}

interface AdjustmentCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compAddress: string;
  basePrice: number;
  onApplyAdjustments: (adjustedPrice: number, adjustments: any) => void;
  initialAdjustments?: {
    conditionAdjustment: number;
    poolAdjustment: number;
    garageSpaces: number;
    recentRenovation: number;
    lotSizeAdjustment: number;
    customAdjustments: Array<{ name: string; amount: number; }>;
  };
}

export const AdjustmentCalculator = ({
  open,
  onOpenChange,
  compAddress,
  basePrice,
  onApplyAdjustments,
  initialAdjustments,
}: AdjustmentCalculatorProps) => {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [customAdjustments, setCustomAdjustments] = useState<CustomAdjustment[]>([]);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(0);

  const togglePreset = (presetName: string) => {
    setSelectedPresets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presetName)) {
        newSet.delete(presetName);
      } else {
        newSet.add(presetName);
      }
      return newSet;
    });
  };

  const addCustomAdjustment = () => {
    if (!customName.trim() || customAmount === 0) return;

    setCustomAdjustments(prev => [
      ...prev,
      {
        name: customName,
        amount: customAmount,
        id: Date.now().toString(),
      }
    ]);

    setCustomName('');
    setCustomAmount(0);
  };

  const removeCustomAdjustment = (id: string) => {
    setCustomAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const calculateTotal = () => {
    let total = basePrice;
    let dollarAdjustments = 0;
    let percentAdjustments = 0;

    // Apply preset adjustments
    selectedPresets.forEach(presetName => {
      const preset = ADJUSTMENT_PRESETS.find(p => p.name === presetName);
      if (preset) {
        if (preset.type === 'dollar') {
          const adjustment = preset.category === 'add' ? preset.value : -preset.value;
          dollarAdjustments += adjustment;
        } else {
          const adjustment = preset.category === 'add' ? preset.value : -preset.value;
          percentAdjustments += adjustment;
        }
      }
    });

    // Apply custom adjustments
    customAdjustments.forEach(adj => {
      dollarAdjustments += adj.amount;
    });

    // Apply percent adjustments first
    total = total * (1 + percentAdjustments / 100);

    // Then apply dollar adjustments
    total += dollarAdjustments;

    return {
      adjustedPrice: Math.round(total),
      dollarAdjustments,
      percentAdjustments,
    };
  };

  const handleApply = () => {
    const { adjustedPrice } = calculateTotal();

    const adjustmentsData = {
      conditionAdjustment: 0,
      poolAdjustment: selectedPresets.has('Pool') ? 10000 : 0,
      garageSpaces: selectedPresets.has('2-Car Garage') ? 2 : selectedPresets.has('3-Car Garage') ? 3 : 0,
      recentRenovation: selectedPresets.has('Recently Renovated') ? 15000 : 0,
      lotSizeAdjustment: 0,
      customAdjustments: customAdjustments.map(adj => ({
        name: adj.name,
        amount: adj.amount,
      })),
    };

    onApplyAdjustments(adjustedPrice, adjustmentsData);
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedPresets(new Set());
    setCustomAdjustments([]);
    setCustomName('');
    setCustomAmount(0);
  };

  const { adjustedPrice, dollarAdjustments, percentAdjustments } = calculateTotal();
  const totalAdjustment = adjustedPrice - basePrice;

  const addPresets = ADJUSTMENT_PRESETS.filter(p => p.category === 'add');
  const subtractPresets = ADJUSTMENT_PRESETS.filter(p => p.category === 'subtract');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Adjustment Calculator
          </DialogTitle>
          <DialogDescription>
            {compAddress}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Adjustments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Positive Adjustments */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                Add Value (Comp has these features)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {addPresets.map(preset => (
                  <div
                    key={preset.name}
                    className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                      selectedPresets.has(preset.name)
                        ? 'bg-green-50 border-green-500'
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => togglePreset(preset.name)}
                  >
                    <Checkbox
                      checked={selectedPresets.has(preset.name)}
                      onCheckedChange={() => togglePreset(preset.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{preset.name}</div>
                      <div className="text-xs text-green-600 font-semibold">
                        +{preset.type === 'dollar' ? `$${preset.value.toLocaleString()}` : `${preset.value}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Negative Adjustments */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                Subtract Value (Comp needs these)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {subtractPresets.map(preset => (
                  <div
                    key={preset.name}
                    className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                      selectedPresets.has(preset.name)
                        ? 'bg-red-50 border-red-500'
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => togglePreset(preset.name)}
                  >
                    <Checkbox
                      checked={selectedPresets.has(preset.name)}
                      onCheckedChange={() => togglePreset(preset.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{preset.name}</div>
                      <div className="text-xs text-red-600 font-semibold">
                        -{preset.type === 'dollar' ? `$${preset.value.toLocaleString()}` : `${preset.value}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Adjustments */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Custom Adjustments</h3>

              <div className="space-y-2 mb-3">
                {customAdjustments.map(adj => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between p-2 bg-muted rounded border"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{adj.name}</div>
                      <div className={`text-xs font-semibold ${adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adj.amount >= 0 ? '+' : ''}{adj.amount < 0 ? adj.amount : `$${adj.amount.toLocaleString()}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomAdjustment(adj.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="custom-name" className="text-xs">Description</Label>
                  <Input
                    id="custom-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Extra bedroom"
                    className="mt-1"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="custom-amount" className="text-xs">Amount ($)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    placeholder="5000"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    onClick={addCustomAdjustment}
                    disabled={!customName.trim() || customAmount === 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use negative numbers to subtract value (e.g., -5000)
              </p>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border sticky top-0">
              <h3 className="text-sm font-semibold mb-4">Adjustment Summary</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Base Price</div>
                  <div className="text-2xl font-bold">${basePrice.toLocaleString()}</div>
                </div>

                <Separator />

                {percentAdjustments !== 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Condition Adjustments
                    </div>
                    <div className={`text-lg font-semibold ${percentAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {percentAdjustments >= 0 ? '+' : ''}{percentAdjustments}%
                    </div>
                  </div>
                )}

                {dollarAdjustments !== 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Feature Adjustments
                    </div>
                    <div className={`text-lg font-semibold ${dollarAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dollarAdjustments >= 0 ? '+' : ''} ${Math.abs(dollarAdjustments).toLocaleString()}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="text-xs text-muted-foreground">Total Adjustment</div>
                  <div className={`text-xl font-bold ${totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalAdjustment >= 0 ? '+' : ''} ${Math.abs(totalAdjustment).toLocaleString()}
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-primary/10 rounded">
                  <div className="text-xs text-muted-foreground mb-1">Adjusted Price</div>
                  <div className="text-3xl font-bold text-primary">
                    ${adjustedPrice.toLocaleString()}
                  </div>
                </div>

                {selectedPresets.size === 0 && customAdjustments.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Select adjustments to see the impact
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleApply}
                disabled={selectedPresets.size === 0 && customAdjustments.length === 0}
              >
                Apply Adjustments
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleReset}
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
