import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Printer, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resolveMailingAddress, formatCityStateZip, type PropertyForMailing } from "@/utils/mailingAddress";

type LabelProperty = PropertyForMailing & { id: string };

interface AveryLabelsPrintDialogProps {
  properties: LabelProperty[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Avery sheet specifications
// 18262 — Address labels: 14/sheet, 2 col × 7 rows, 1.33" × 4"
//   top margin 0.83", left margin 0.156", col pitch 4.19", row pitch 1.33"
// 18294 — Return address labels: 60/sheet, 4 col × 15 rows, 0.67" × 1.75"
//   top margin 0.5", left margin 0.3", col pitch 2.0", row pitch 0.67"
// ---------------------------------------------------------------------------
const SPEC_18262 = {
  id: "18262",
  perSheet: 14,
  cols: 2,
  rows: 7,
  labelW: "4in",
  labelH: "1.33in",
  padTop: "0.83in",
  padLeft: "0.156in",
  colGap: "0.19in", // 4.19 pitch − 4.0 width
  fontSize: "11pt",
  nameSize: "11pt",
  addrSize: "10.5pt",
};

// 8160 — Address labels: 30/sheet, 3 col × 10 rows, 1" × 2.625"
//   top margin 0.5", left margin 0.19", col pitch 2.75", row pitch 1.0"
const SPEC_8160 = {
  id: "8160",
  perSheet: 30,
  cols: 3,
  rows: 10,
  labelW: "2.625in",
  labelH: "1in",
  padTop: "0.5in",
  padLeft: "0.19in",
  colGap: "0.125in", // 2.75 pitch − 2.625 width
  fontSize: "9.5pt",
  nameSize: "9.5pt",
  addrSize: "9pt",
};

const SPEC_18294 = {
  id: "18294",
  perSheet: 60,
  cols: 4,
  rows: 15,
  labelW: "1.75in",
  labelH: "0.67in",
  padTop: "0.5in",
  padLeft: "0.3in",
  colGap: "0.25in", // 2.0 pitch − 1.75 width
  fontSize: "7.5pt",
  nameSize: "7.5pt",
  addrSize: "7pt",
};

const DEFAULT_RETURN = {
  name: "MyLocalInvest",
  line1: "PO Box 123456",
  cityStateZip: "Miami, FL 33101",
};

type LabelData = { name: string; line1: string; cityStateZip: string };

export const AveryLabelsPrintDialog = ({ properties, open, onOpenChange }: AveryLabelsPrintDialogProps) => {
  const { toast } = useToast();
  const recipientRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLDivElement>(null);

  const [includeReturn, setIncludeReturn] = useState(true);
  const [returnName, setReturnName] = useState(DEFAULT_RETURN.name);
  const [returnLine1, setReturnLine1] = useState(DEFAULT_RETURN.line1);
  const [returnCityStateZip, setReturnCityStateZip] = useState(DEFAULT_RETURN.cityStateZip);
  const [returnCount, setReturnCount] = useState(60);
  const [recipientTemplate, setRecipientTemplate] = useState<"18262" | "8160">("18262");
  const recipientSpec = recipientTemplate === "18262" ? SPEC_18262 : SPEC_8160;

  // Recipient labels (Avery 18262 — 14/sheet)
  const recipientLabels: LabelData[] = properties.map((p) => {
    const parts = resolveMailingAddress(p);
    return {
      name: parts.name,
      line1: parts.line1,
      cityStateZip: formatCityStateZip(parts),
    };
  });

  // Return labels (Avery 18294 — 60/sheet)
  const returnLabels: LabelData[] = Array(returnCount).fill({
    name: returnName,
    line1: returnLine1,
    cityStateZip: returnCityStateZip,
  });

  const recipientPages = Math.ceil(recipientLabels.length / recipientSpec.perSheet);
  const returnPages = includeReturn ? Math.ceil(returnLabels.length / SPEC_18294.perSheet) : 0;

  const buildSheetCss = (spec: typeof SPEC_18262) => `
    .sheet-${spec.id} {
      width: 8.5in;
      height: 11in;
      padding: ${spec.padTop} ${spec.padLeft};
      page-break-after: always;
    }
    .sheet-${spec.id}:last-child { page-break-after: auto; }
    .grid-${spec.id} {
      display: grid;
      grid-template-columns: repeat(${spec.cols}, ${spec.labelW});
      grid-template-rows: repeat(${spec.rows}, ${spec.labelH});
      column-gap: ${spec.colGap};
      row-gap: 0;
    }
    .label-${spec.id} {
      width: ${spec.labelW};
      height: ${spec.labelH};
      padding: 0.08in 0.12in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-size: ${spec.fontSize};
      line-height: 1.2;
    }
    .label-${spec.id} .name { font-weight: 600; font-size: ${spec.nameSize}; }
    .label-${spec.id} .addr { font-size: ${spec.addrSize}; }
  `;

  const handlePrint = (which: "recipient" | "return") => {
    const ref = which === "recipient" ? recipientRef : returnRef;
    const content = ref.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Allow popups to print", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Avery ${which === "recipient" ? "18262" : "18294"} Labels</title>
          <style>
            @page { size: 8.5in 11in; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; }
            ${buildSheetCss(SPEC_18262)}
            ${buildSheetCss(SPEC_18294)}
            @media screen {
              body { background: #e5e5e5; padding: 20px; }
              [class^="sheet-"] { background: white; margin: 0 auto 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              [class^="label-"] { border: 1px dashed #ccc; }
            }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    const total = which === "recipient" ? recipientLabels.length : returnLabels.length;
    const pages = which === "recipient" ? recipientPages : returnPages;
    toast({ title: "Imprimindo", description: `${total} etiquetas em ${pages} folha(s)` });
  };

  // Group labels into pages
  const groupPages = (labels: LabelData[], perSheet: number) => {
    const pages: LabelData[][] = [];
    for (let i = 0; i < labels.length; i += perSheet) {
      pages.push(labels.slice(i, i + perSheet));
    }
    return pages;
  };

  const recipientPagesData = groupPages(recipientLabels, SPEC_18262.perSheet);
  const returnPagesData = groupPages(returnLabels, SPEC_18294.perSheet);

  const renderSheet = (
    pageLabels: LabelData[],
    spec: typeof SPEC_18262,
    key: number,
  ) => (
    <div
      key={key}
      className={`sheet-${spec.id} bg-white mx-auto mb-4`}
      style={{
        width: "8.5in",
        height: "11in",
        padding: `${spec.padTop} ${spec.padLeft}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className={`grid-${spec.id}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${spec.cols}, ${spec.labelW})`,
          gridTemplateRows: `repeat(${spec.rows}, ${spec.labelH})`,
          columnGap: spec.colGap,
        }}
      >
        {Array.from({ length: spec.perSheet }).map((_, idx) => {
          const lbl = pageLabels[idx];
          return (
            <div
              key={idx}
              className={`label-${spec.id}`}
              style={{
                width: spec.labelW,
                height: spec.labelH,
                padding: "0.08in 0.12in",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontSize: spec.fontSize,
                lineHeight: 1.2,
                border: "1px dashed #ccc",
              }}
            >
              {lbl && (
                <>
                  <div className="name" style={{ fontWeight: 600, fontSize: spec.nameSize }}>
                    {lbl.name}
                  </div>
                  <div className="addr" style={{ fontSize: spec.addrSize }}>{lbl.line1}</div>
                  <div className="addr" style={{ fontSize: spec.addrSize }}>{lbl.cityStateZip}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Imprimir Etiquetas Avery
          </DialogTitle>
          <DialogDescription>
            Destinatários: Avery <strong>18262</strong> (14/folha · 1.33" × 4") ·
            Remetente: Avery <strong>18294</strong> (60/folha · 0.67" × 1.75")
          </DialogDescription>
        </DialogHeader>

        {/* ============ RECIPIENT (18262) ============ */}
        <section className="space-y-3 border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Destinatários — Avery 18262</h3>
              <p className="text-xs text-muted-foreground">
                {recipientLabels.length} etiquetas em {recipientPages} folha(s)
              </p>
            </div>
            <Button onClick={() => handlePrint("recipient")} className="gap-2" disabled={recipientLabels.length === 0}>
              <Printer className="w-4 h-4" />
              Imprimir {recipientPages} folha(s)
            </Button>
          </div>

          <div className="border rounded-lg p-3 max-h-[40vh] overflow-y-auto bg-muted/20">
            <div ref={recipientRef}>
              {recipientPagesData.map((pl, pi) => renderSheet(pl, SPEC_18262, pi))}
            </div>
          </div>
        </section>

        {/* ============ RETURN (18294) ============ */}
        <section className="space-y-3 border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <Switch checked={includeReturn} onCheckedChange={setIncludeReturn} id="rt" />
            <Label htmlFor="rt" className="text-sm font-semibold">
              Incluir etiquetas de remetente — Avery 18294
            </Label>
          </div>

          {includeReturn && (
            <>
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
                  <Label className="text-xs">Quantas etiquetas? (máx 60/folha)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={returnCount}
                    onChange={(e) => setReturnCount(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {returnLabels.length} etiquetas em {returnPages} folha(s)
                </p>
                <Button onClick={() => handlePrint("return")} className="gap-2" variant="secondary">
                  <Printer className="w-4 h-4" />
                  Imprimir {returnPages} folha(s)
                </Button>
              </div>

              <div className="border rounded-lg p-3 max-h-[40vh] overflow-y-auto bg-muted/20">
                <div ref={returnRef}>
                  {returnPagesData.map((pl, pi) => renderSheet(pl, SPEC_18294, pi))}
                </div>
              </div>
            </>
          )}
        </section>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Use a folha Avery correta para cada impressão</span>
          <span>18262 · 18294</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
