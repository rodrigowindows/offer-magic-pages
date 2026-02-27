import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, ClipboardPaste } from 'lucide-react';

interface DecisionPhotoUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  accent?: 'green' | 'red';
}

export const DecisionPhotoUpload = ({ files, onChange, accent = 'green' }: DecisionPhotoUploadProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate previews when files change
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length > 0) {
      onChange([...files, ...valid]);
    }
  }, [files, onChange]);

  // Listen for paste events (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const borderColor = accent === 'green' ? 'border-green-200' : 'border-red-200';
  const bgColor = accent === 'green' ? 'bg-green-50/50' : 'bg-red-50/50';
  const textColor = accent === 'green' ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-2 space-y-2`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className={`h-7 text-xs gap-1 ${textColor}`}
        >
          <Camera className="h-3 w-3" />
          Foto
        </Button>
        <span className={`text-[10px] ${textColor} flex items-center gap-1`}>
          <ClipboardPaste className="h-3 w-3" />
          Ctrl+V para colar
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {previews.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
