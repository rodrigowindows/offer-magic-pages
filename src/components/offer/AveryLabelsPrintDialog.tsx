import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Printer, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LabelProperty {
  id: string;
  owner_name?: string | null;
  confirmed_mailing_address?: string | null;
  confirmed_mailing_city?: string | null;
  confirmed_mailing_state?: string | null;
  confirmed_mailing_zip?: string | null;
  owner_address?: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface AveryLabelsPrintDialogProps {
  properties: LabelProperty[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_RETURN = {
  name: "MyLocalInvest",
  line1: "PO Box 123456",
  cityStateZip: "Miami, FL 33101",
};

export const AveryLabelsPrintDialog = ({ properties, open, onOpenChange }: AveryLabelsPrintDialogProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [includeReturn, setIncludeReturn] = useState(true);
  const [returnName, setReturnName] = useState(DEFAULT_RETURN.name);
  const [returnLine1, setReturnLine1] = useState(DEFAULT_RETURN.line1);
  const [returnCityStateZip, setReturnCityStateZip] = useState(DEFAULT_RETURN.cityStateZip);
  const [returnCount, setReturnCount] = useState(6);

  // Build label data — use confirmed_mailing_* with owner_address fallback, then property address
  const labels = properties.map((p) => {
    const addr = p.confirmed_mailing_address || p.owner_address || p.address;
    const city = p.confirmed_mailing_city || p.city;
    const state = p.confirmed_mailing_state || p.state;
    const zip = p.confirmed_mailing_zip || p.zip_code;
    return {
      name: p.owner_name || "Current Resident",
      line1: addr,
      cityStateZip: `${city}, ${state} ${zip}`.trim(),
    };
  });

  // Add return labels at the end if requested
  const allLabels = includeReturn
    ? [
        ...labels,
        ...Array(returnCount).fill({
          name: returnName,
          line1: returnLine1,
          cityStateZip: returnCityStateZip,
        }),
      ]
    : labels;

  const totalPages = Math.ceil(allLabels.length / 30);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Allow popups to print", variant: "destructive" });
      return;
    }

    // Avery 5160: 8.5" x 11" sheet, 30 labels (3 col x 10 rows), 1" x 2.625" each
    // Top margin 0.5", left margin 0.1875", horiz pitch 2.75", vert pitch 1"
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Avery 5160 Labels</title>
          <style>
            @page { size: 8.5in 11in; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; }
            .sheet {
              width: 8.5in;
              height: 11in;
              padding: 0.5in 0.1875in 0.5in 0.1875in;
              page-break-after: always;
            }
            .sheet:last-child { page-break-after: auto; }
            .grid {
              display: grid;
              grid-template-columns: 2.625in 2.625in 2.625in;
              grid-template-rows: repeat(10, 1in);
              column-gap: 0.125in;
              row-gap: 0;
            }
            .label {
              width: 2.625in;
              height: 1in;
              padding: 0.1in 0.15in;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: 10pt;
              line-height: 1.25;
            }
            .label .name { font-weight: 600; }
            .label .addr { font-size: 9.5pt; }
            @media screen {
              body { background: #e5e5e5; padding: 20px; }
              .sheet { background: white; margin: 0 auto 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .label { border: 1px dashed #ccc; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast({ title: "Imprimindo", description: `${allLabels.length} etiquetas em ${totalPages} folha(s)` });
  };

  // Group labels into pages of 30
  const pages: typeof allLabels[] = [];
  for (let i = 0; i < allLabels.length; i += 30) {
    pages.push(allLabels.slice(i, i + 30));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Imprimir Etiquetas Avery 5160 ({allLabels.length})
          </DialogTitle>
          <DialogDescription>
            30 etiquetas/página · 1" × 2⅝" · {totalPages} folha(s) Avery 5160
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <Switch checked={includeReturn} onCheckedChange={setIncludeReturn} id="rt" />
            <Label htmlFor="rt" className="text-sm">Incluir etiquetas de remetente (return address)</Label>
          </div>
          {includeReturn && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome / Empresa</Label>
                <Input value={returnName} onChange={(e) => setReturnName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Endereço</Label>
                <Input value={returnLine1} onChange={(e) => setReturnLine1(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Cidade, Estado ZIP</Label>
                <Input value={returnCityStateZip} onChange={(e) => setReturnCityStateZip(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Quantas etiquetas de remetente?</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={returnCount}
                  onChange={(e) => setReturnCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir {totalPages} folha(s)
          </Button>
        </div>

        <div className="border rounded-lg p-4 max-h-[55vh] overflow-y-auto bg-muted/20">
          <div ref={printRef}>
            {pages.map((pageLabels, pi) => (
              <div key={pi} className="sheet bg-white mx-auto mb-4" style={{ width: "8.5in", height: "11in", padding: "0.5in 0.1875in", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div className="grid" style={{ display: "grid", gridTemplateColumns: "2.625in 2.625in 2.625in", gridTemplateRows: "repeat(10, 1in)", columnGap: "0.125in" }}>
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const lbl = pageLabels[idx];
                    return (
                      <div key={idx} className="label" style={{ width: "2.625in", height: "1in", padding: "0.1in 0.15in", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", fontSize: "10pt", lineHeight: 1.25, border: "1px dashed #ccc" }}>
                        {lbl && (
                          <>
                            <div className="name" style={{ fontWeight: 600 }}>{lbl.name}</div>
                            <div className="addr" style={{ fontSize: "9.5pt" }}>{lbl.line1}</div>
                            <div className="addr" style={{ fontSize: "9.5pt" }}>{lbl.cityStateZip}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels.length} destinatários{includeReturn ? ` + ${returnCount} remetente` : ""}</span>
          <span>Compatível: Avery 5160, 5260, 8160, 8460</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
