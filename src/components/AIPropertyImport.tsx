import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParsedProperty {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  estimatedValue?: number;
  cashOfferAmount?: number;
  imageUrl?: string;
}

export const AIPropertyImport = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedProperties, setParsedProperties] = useState<ParsedProperty[]>([]);

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please paste property data first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-property-assistant', {
        body: {
          action: 'parse',
          data: inputText,
        },
      });

      if (error) throw error;

      if (data.properties && data.properties.length > 0) {
        setParsedProperties(data.properties);
        toast({
          title: "Success!",
          description: `Found ${data.properties.length} properties. Review and import.`,
        });
      } else {
        toast({
          title: "No properties found",
          description: "Could not extract property data. Please check your input.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error parsing properties:', error);
      toast({
        title: "Error",
        description: "Failed to parse property data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedProperties.length === 0) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-property-assistant', {
        body: {
          action: 'import',
          data: { properties: parsedProperties },
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Imported ${data.count} properties successfully`,
      });

      setIsOpen(false);
      setInputText("");
      setParsedProperties([]);
      onImportComplete();
    } catch (error) {
      console.error('Error importing properties:', error);
      toast({
        title: "Error",
        description: "Failed to import properties",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Property Import Assistant</DialogTitle>
          <DialogDescription>
            Paste property data or upload a CSV file. AI will extract information and fetch images automatically.
          </DialogDescription>
        </DialogHeader>

        {parsedProperties.length === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV or paste property data</label>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" asChild className="cursor-pointer">
                  <label>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste property data here... Example:
1530 NW 46th Street, Miami, FL, 33142, $150000, $135000
1121 NW 38th Street, Miami, FL, 33127, $180000, $162000"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={handleParse} disabled={isProcessing || !inputText.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Found {parsedProperties.length} properties. Review and click Import to add them.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>ZIP</TableHead>
                      <TableHead>Est. Value</TableHead>
                      <TableHead>Offer</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedProperties.map((property, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{property.address}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.zipCode}</TableCell>
                        <TableCell>${property.estimatedValue?.toLocaleString()}</TableCell>
                        <TableCell>${property.cashOfferAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          {property.imageUrl && (
                            <img
                              src={property.imageUrl}
                              alt={property.address}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${parsedProperties.length} Properties`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setParsedProperties([]);
                  setInputText("");
                }}
                disabled={isProcessing}
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
