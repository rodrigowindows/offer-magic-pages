import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CashOfferLetter } from "./CashOfferLetter";
import { Download, Printer, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  owner_name?: string | null;
}

interface BatchOfferPrintDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchOfferPrintDialog = ({ properties, open, onOpenChange }: BatchOfferPrintDialogProps) => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<"en" | "es">("en");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Offer Letters</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; }
            .letter-page { 
              page-break-after: always; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .letter-page:last-child { page-break-after: auto; }
            @media print {
              .letter-page { padding: 0; }
            }
          </style>
          <link href="${window.location.origin}/src/index.css" rel="stylesheet" />
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast({
      title: "Print ready",
      description: `Printing ${properties.length} offer letters...`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Batch Print Offer Letters ({properties.length})</span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">EN</span>
              <Switch 
                checked={language === "es"} 
                onCheckedChange={(checked) => setLanguage(checked ? "es" : "en")} 
              />
              <span className="text-sm text-muted-foreground">ES</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Preview and print all {properties.length} offer letters at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-end">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print All ({properties.length})
          </Button>
        </div>

        <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto bg-muted/30">
          <div ref={printRef}>
            {properties.map((property, index) => (
              <div key={property.id} className="letter-page mb-8 last:mb-0">
                <div className="text-xs text-muted-foreground mb-2 print:hidden">
                  Letter {index + 1} of {properties.length}
                </div>
                <CashOfferLetter
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  zipCode={property.zip_code}
                  cashOffer={property.cash_offer_amount}
                  minOffer={property.min_offer_amount}
                  maxOffer={property.max_offer_amount}
                  estimatedValue={property.estimated_value}
                  propertySlug={property.slug}
                  ownerName={property.owner_name || undefined}
                  language={language}
                  source="letter"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{properties.length} letters ready to print</span>
          <span>Each letter will print on a separate page</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
