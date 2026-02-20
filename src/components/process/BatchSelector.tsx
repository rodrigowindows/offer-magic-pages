import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';

interface BatchSelectorProps {
  value: string;
  onChange: (batch: string) => void;
}

export const BatchSelector = ({ value, onChange }: BatchSelectorProps) => {
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('import_batch')
        .not('import_batch', 'is', null);

      if (data) {
        const unique = [...new Set(data.map((p: any) => p.import_batch as string))].sort().reverse();
        setBatches(unique);
      }
    } catch (err) {
      console.error('Error loading batches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs sm:text-sm w-[140px] sm:w-[200px]">
          <SelectValue placeholder={loading ? 'Carregando...' : 'Todos os batches'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os batches</SelectItem>
          {batches.map((batch) => (
            <SelectItem key={batch} value={batch}>
              {batch}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
