import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CashOfferLetter } from "./CashOfferLetter";
import { AveryLabelsPrintDialog } from "./AveryLabelsPrintDialog";
import { Download, Printer, Globe, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
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
  confirmed_mailing_address?: string | null;
  confirmed_mailing_city?: string | null;
  confirmed_mailing_state?: string | null;
  confirmed_mailing_zip?: string | null;
  owner_address?: string | null;
}

interface BatchOfferPrintDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchOfferPrintDialog = ({ properties, open, onOpenChange }: BatchOfferPrintDialogProps) => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Address audit: which source each property will use ───────────
  const audit = properties.reduce(
    (acc, p) => {
      const hasConfirmed = !!(p.confirmed_mailing_address && p.confirmed_mailing_address.trim());
      const hasOwner = !!(p.owner_address && p.owner_address.trim());
      const hasName = !!(p.owner_name && p.owner_name.trim());
      if (hasConfirmed) acc.confirmed.push(p);
      else if (hasOwner) acc.ownerAddr.push(p);
      else acc.fallback.push(p);
      if (!hasName) acc.noName.push(p);
      return acc;
    },
    { confirmed: [] as Property[], ownerAddr: [] as Property[], fallback: [] as Property[], noName: [] as Property[] }
  );
  const allCovered = audit.fallback.length === 0;

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
            @page { size: letter; margin: 0.3in; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { margin: 0 !important; padding: 0 !important; }
            body { font-family: system-ui, sans-serif; }
            .letter-page {
              page-break-after: always;
              page-break-inside: avoid;
              break-inside: avoid;
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
          <Button onClick={() => setLabelsOpen(true)} variant="outline" className="gap-2">
            <Tag className="w-4 h-4" />
            Etiquetas Avery ({properties.length})
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print All ({properties.length})
          </Button>
        </div>

        <AveryLabelsPrintDialog
          properties={properties}
          open={labelsOpen}
          onOpenChange={setLabelsOpen}
        />

        {/* Address audit banner */}
        <div className={`rounded-lg border p-3 text-sm ${allCovered ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              {allCovered ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Todas as {properties.length} propriedades têm endereço do dono ✓</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span>{audit.fallback.length} propriedade(s) sem endereço — vão imprimir o endereço do imóvel</span>
                </>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowAudit(!showAudit)}>
              {showAudit ? 'Ocultar' : 'Ver detalhes'}
            </Button>
          </div>
          <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
            <span>📬 Confirmed mailing: <strong>{audit.confirmed.length}</strong></span>
            <span>🏠 Owner address: <strong>{audit.ownerAddr.length}</strong></span>
            <span>⚠️ Fallback (imóvel): <strong>{audit.fallback.length}</strong></span>
            {audit.noName.length > 0 && <span>👤 Sem owner_name: <strong>{audit.noName.length}</strong></span>}
          </div>
          {showAudit && audit.fallback.length > 0 && (
            <div className="mt-2 max-h-32 overflow-auto bg-background/50 rounded p-2 text-xs">
              <div className="font-semibold mb-1">Sem endereço do dono:</div>
              {audit.fallback.map(p => (
                <div key={p.id} className="font-mono">{p.address} — {p.owner_name || '(sem nome)'}</div>
              ))}
            </div>
          )}
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
                  minOffer={property.cash_offer_amount * 0.9}
                  maxOffer={property.cash_offer_amount * 1.1}
                  estimatedValue={property.estimated_value}
                  propertySlug={property.slug}
                  ownerName={property.owner_name || undefined}
                  language={language}
                  source="letter"
                  mailingAddress={property.confirmed_mailing_address || property.owner_address || undefined}
                  mailingCity={property.confirmed_mailing_city || undefined}
                  mailingState={property.confirmed_mailing_state || undefined}
                  mailingZip={property.confirmed_mailing_zip || undefined}
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
