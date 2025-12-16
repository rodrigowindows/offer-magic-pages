import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface PropertyImageUploadProps {
  propertyId: string;
  propertySlug: string;
  currentImageUrl?: string | null;
  onImageUploaded?: (url: string) => void;
}

export const PropertyImageUpload = ({
  propertyId,
  propertySlug,
  currentImageUrl,
  onImageUploaded,
}: PropertyImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Upload to Supabase storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `properties/${propertySlug}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("property-images")
        .upload(fileName, selectedFile, {
          upsert: true, // Replace if exists
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName);

      // Update property record
      const { error: updateError } = await supabase
        .from("properties")
        .update({ property_image_url: publicUrl })
        .eq("id", propertyId);

      if (updateError) throw updateError;

      toast({
        title: "✅ Image uploaded",
        description: "Property image has been updated successfully",
      });

      // Callback
      if (onImageUploaded) {
        onImageUploaded(publicUrl);
      }

      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-4">
      {/* Current Image */}
      {currentImageUrl && !previewUrl && (
        <div>
          <Label>Current Image:</Label>
          <div className="mt-2 border rounded-lg overflow-hidden">
            <img
              src={currentImageUrl}
              alt="Current property"
              className="w-full h-48 object-cover"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div>
          <Label>Preview:</Label>
          <div className="mt-2 border rounded-lg overflow-hidden relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File Input */}
      <div>
        <Label htmlFor="image-upload">Select Image:</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="mt-2"
        />
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>Uploading...</>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 mr-2" />
            Upload Image
          </>
        )}
      </Button>
    </div>
  );
};