import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MarketingSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarketingSettingsDialog = ({
  open,
  onOpenChange,
}: MarketingSettingsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTestSection, setShowTestSection] = useState(false);
  const [testResponse, setTestResponse] = useState<{ status: number; data: any } | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    api_endpoint: "",
    seller_name: "Alex",
  });
  const [testData, setTestData] = useState({
    phone_number: "+1234567890",
    name: "Test User",
    address: "123 Test Street, Miami, FL 33101",
    email: "test@example.com",
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      // We'll store marketing settings in email_settings table with a specific marker
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          api_endpoint: data.api_endpoint || "",
          seller_name: (data.headers as any)?.seller_name || "Alex",
        });
      }
    } catch (error) {
      console.error("Error fetching marketing settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.api_endpoint) {
      toast({
        title: "Error",
        description: "API Endpoint is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const settingsData = {
        api_endpoint: formData.api_endpoint,
        http_method: "POST",
        headers: { seller_name: formData.seller_name },
      };

      if (settingsId) {
        const { error } = await supabase
          .from("email_settings")
          .update(settingsData)
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Marketing API settings saved",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.api_endpoint) {
      toast({
        title: "Error",
        description: "API Endpoint is required to test",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResponse(null);
    try {
      const payload = {
        ...testData,
        seller_name: formData.seller_name || "Alex",
      };

      const response = await fetch(formData.api_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      setTestResponse({
        status: response.status,
        data: responseData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API test successful! Endpoint is working.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("API test failed:", error);
      setTestResponse({
        status: 0,
        data: { error: error.message || "Network error" },
      });
      toast({
        title: "Test Failed",
        description: error.message || "Could not reach the API endpoint",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Marketing API Settings</DialogTitle>
          <DialogDescription>
            Configure your unified marketing API endpoint for calls, SMS, and emails
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="api_endpoint">API Endpoint</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, api_endpoint: e.target.value })
                  }
                  placeholder="https://marketing.workfaraway.com/start"
                />
                <p className="text-xs text-muted-foreground">
                  The API will receive: phone_number, name, address, email, seller_name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller_name">Seller Name</Label>
                <Input
                  id="seller_name"
                  value={formData.seller_name}
                  onChange={(e) =>
                    setFormData({ ...formData, seller_name: e.target.value })
                  }
                  placeholder="Alex"
                />
              </div>

              {/* Test Section */}
              <div className="border rounded-lg">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3"
                  onClick={() => setShowTestSection(!showTestSection)}
                >
                  <span className="font-medium">Test API</span>
                  {showTestSection ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showTestSection && (
                  <div className="p-3 pt-0 space-y-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="test_phone" className="text-xs">Phone Number</Label>
                        <Input
                          id="test_phone"
                          value={testData.phone_number}
                          onChange={(e) =>
                            setTestData({ ...testData, phone_number: e.target.value })
                          }
                          placeholder="+1234567890"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="test_name" className="text-xs">Name</Label>
                        <Input
                          id="test_name"
                          value={testData.name}
                          onChange={(e) =>
                            setTestData({ ...testData, name: e.target.value })
                          }
                          placeholder="Test User"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="test_address" className="text-xs">Address</Label>
                      <Input
                        id="test_address"
                        value={testData.address}
                        onChange={(e) =>
                          setTestData({ ...testData, address: e.target.value })
                        }
                        placeholder="123 Test Street, Miami, FL 33101"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="test_email" className="text-xs">Email</Label>
                      <Input
                        id="test_email"
                        value={testData.email}
                        onChange={(e) =>
                          setTestData({ ...testData, email: e.target.value })
                        }
                        placeholder="test@example.com"
                        className="h-8 text-sm"
                      />
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTest}
                      disabled={testing || !formData.api_endpoint}
                      className="w-full"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Send Test Request"
                      )}
                    </Button>

                    {testResponse && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Response:</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              testResponse.status >= 200 && testResponse.status < 300
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            Status: {testResponse.status || "Error"}
                          </span>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {typeof testResponse.data === "string"
                            ? testResponse.data
                            : JSON.stringify(testResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
