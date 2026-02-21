// Example: How to integrate CSVImporter into your admin dashboard

// Option 1: Add to existing Admin Dashboard
// ==========================================

// src/pages/AdminDashboard.tsx
import { CSVImporter } from "@/components/CSVImporter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Your existing overview content */}
        </TabsContent>

        <TabsContent value="properties">
          {/* Your existing properties list */}
        </TabsContent>

        <TabsContent value="import">
          <CSVImporter />
        </TabsContent>

        <TabsContent value="campaigns">
          {/* Your campaigns content */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Option 2: Create dedicated Import page
// =======================================

// src/pages/ImportPage.tsx
import { CSVImporter } from "@/components/CSVImporter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ImportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Import Property Data</h1>
      </div>

      <CSVImporter />
    </div>
  );
};

// Then add route:
// src/App.tsx or router config
/*
<Route path="/admin/import" element={<ImportPage />} />
*/

// Option 3: Add as a modal/dialog
// ================================

// src/components/ImportButton.tsx
import { useState } from "react";
import { CSVImporter } from "@/components/CSVImporter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";

export const ImportButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Property Data</DialogTitle>
        </DialogHeader>
        <CSVImporter />
      </DialogContent>
    </Dialog>
  );
};

// Usage:
/*
// src/pages/PropertiesPage.tsx
import { ImportButton } from "@/components/ImportButton";

export const PropertiesPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Properties</h1>
        <ImportButton />
      </div>
      // ... rest of page
    </div>
  );
};
*/

// Option 4: Standalone page with navigation
// ==========================================

// src/pages/DataManagement.tsx
import { CSVImporter } from "@/components/CSVImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, FileDown, FileUp, Trash2 } from "lucide-react";

export const DataManagement = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Data Management</h1>
        <p className="text-muted-foreground">
          Import, export, and manage your property data
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="h-5 w-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV files to add properties
            </p>
            <Button className="w-full">Start Import</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileDown className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download your data as CSV
            </p>
            <Button variant="outline" className="w-full">
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Database Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View database statistics
            </p>
            <Button variant="outline" className="w-full">
              View Stats
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CSV Importer */}
      <CSVImporter />
    </div>
  );
};

// Option 5: With custom success callback
// =======================================

// Create wrapper component that handles success
// src/components/CSVImporterWithCallback.tsx
import { CSVImporter } from "@/components/CSVImporter";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onImportComplete?: (results: { success: number; errors: number }) => void;
}

export const CSVImporterWithCallback = ({ onImportComplete }: Props) => {
  const { toast } = useToast();

  // You would modify CSVImporter to accept and call this callback
  // For now, showing the pattern

  const handleSuccess = (results: { success: number; errors: number }) => {
    toast({
      title: "Import Complete",
      description: `${results.success} properties imported successfully`,
    });

    onImportComplete?.(results);
  };

  return <CSVImporter />;
};

// Usage:
/*
<CSVImporterWithCallback
  onImportComplete={(results) => {
    console.log('Import done:', results);
    // Refresh property list
    // Navigate somewhere
    // etc.
  }}
/>
*/
