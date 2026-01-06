import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings2, DollarSign, Calculator, ExternalLink, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OfferEditPanelProps {
  propertyId: string;
  currentEstimatedValue: number;
  currentCashOffer: number;
  zillowUrl?: string | null;
  onUpdate?: (estimatedValue: number, cashOffer: number) => void;
}

export const OfferEditPanel = ({
  propertyId,
  currentEstimatedValue,
  currentCashOffer,
  zillowUrl,
  onUpdate,
}: OfferEditPanelProps) => {
  const [open, setOpen] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(currentEstimatedValue);
  const [cashOffer, setCashOffer] = useState(currentCashOffer);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [offerPercentage, setOfferPercentage] = useState(70);
  const [saving, setSaving] = useState(false);
  const [comparisonLinks, setComparisonLinks] = useState({
    zillow: zillowUrl || "",
    redfin: "",
    realtor: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return parseInt(value.replace(/[^0-9]/g, "")) || 0;
  };

  const handleEstimatedValueChange = (value: string) => {
    const numValue = parseCurrency(value);
    setEstimatedValue(numValue);
    
    if (autoCalculate) {
      setCashOffer(Math.round(numValue * (offerPercentage / 100)));
    }
  };

  const handlePercentageChange = (value: string) => {
    const pct = parseInt(value) || 70;
    setOfferPercentage(pct);
    
    if (autoCalculate) {
      setCashOffer(Math.round(estimatedValue * (pct / 100)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          estimated_value: estimatedValue,
          cash_offer_amount: cashOffer,
          zillow_url: comparisonLinks.zillow || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast.success("Oferta atualizada com sucesso!");
      onUpdate?.(estimatedValue, cashOffer);
      setOpen(false);
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error("Erro ao atualizar oferta");
    } finally {
      setSaving(false);
    }
  };

  const currentPercentage = estimatedValue > 0 
    ? Math.round((cashOffer / estimatedValue) * 100) 
    : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Editar Oferta
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Editar Valores da Oferta
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Estimated Value */}
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Valor Estimado (Estimated Value)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="estimatedValue"
                type="text"
                value={formatCurrency(estimatedValue).replace("$", "")}
                onChange={(e) => handleEstimatedValueChange(e.target.value)}
                className="pl-8 text-lg font-semibold"
                placeholder="0"
              />
            </div>
          </div>

          {/* Auto Calculate Toggle */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cálculo Automático
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cash Offer = {offerPercentage}% do valor estimado
                  </p>
                </div>
                <Switch
                  checked={autoCalculate}
                  onCheckedChange={setAutoCalculate}
                />
              </div>

              {autoCalculate && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="percentage">Porcentagem (%)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="100"
                      value={offerPercentage}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                      className="w-24"
                    />
                    <div className="flex gap-1">
                      {[65, 70, 75, 80].map((pct) => (
                        <Button
                          key={pct}
                          variant={offerPercentage === pct ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePercentageChange(String(pct))}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Offer */}
          <div className="space-y-2">
            <Label htmlFor="cashOffer">Cash Offer</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cashOffer"
                type="text"
                value={formatCurrency(cashOffer).replace("$", "")}
                onChange={(e) => setCashOffer(parseCurrency(e.target.value))}
                disabled={autoCalculate}
                className="pl-8 text-lg font-semibold"
                placeholder="0"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPercentage}% do valor estimado
            </p>
          </div>

          <Separator />

          {/* Summary Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Estimado:</span>
                <span className="font-semibold">{formatCurrency(estimatedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Offer:</span>
                <span className="font-semibold text-primary">{formatCurrency(cashOffer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Porcentagem:</span>
                <span className="font-medium">{currentPercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Comparison Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <Label>Links de Comparação</Label>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="zillow" className="text-sm text-muted-foreground">
                  Zillow URL
                </Label>
                <Input
                  id="zillow"
                  type="url"
                  value={comparisonLinks.zillow}
                  onChange={(e) => setComparisonLinks(prev => ({ ...prev, zillow: e.target.value }))}
                  placeholder="https://zillow.com/homedetails/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="redfin" className="text-sm text-muted-foreground">
                  Redfin URL
                </Label>
                <Input
                  id="redfin"
                  type="url"
                  value={comparisonLinks.redfin}
                  onChange={(e) => setComparisonLinks(prev => ({ ...prev, redfin: e.target.value }))}
                  placeholder="https://redfin.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="realtor" className="text-sm text-muted-foreground">
                  Realtor URL
                </Label>
                <Input
                  id="realtor"
                  type="url"
                  value={comparisonLinks.realtor}
                  onChange={(e) => setComparisonLinks(prev => ({ ...prev, realtor: e.target.value }))}
                  placeholder="https://realtor.com/..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
