import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PhoneOff, Plus, Trash2, Upload, X } from 'lucide-react';

interface Props {
  excludedPhones: string[];
  setExcludedPhones: (phones: string[]) => void;
}

/** Normalize phone to digits only for dedup */
const normalize = (phone: string) => phone.replace(/\D/g, '');

/** Format phone for display */
const formatPhone = (phone: string) => {
  const digits = normalize(phone);
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
};

export function ExcludePhonesList({ excludedPhones, setExcludedPhones }: Props) {
  const [singlePhone, setSinglePhone] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const addPhone = useCallback((raw: string) => {
    const digits = normalize(raw);
    if (digits.length < 7) return false;
    const existing = new Set(excludedPhones.map(normalize));
    if (existing.has(digits)) return false;
    setExcludedPhones([...excludedPhones, raw.trim()]);
    return true;
  }, [excludedPhones, setExcludedPhones]);

  const handleAddSingle = useCallback(() => {
    if (addPhone(singlePhone)) setSinglePhone('');
  }, [singlePhone, addPhone]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSingle(); }
  }, [handleAddSingle]);

  const handleBulkAdd = useCallback(() => {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(l => normalize(l).length >= 7);
    const existing = new Set(excludedPhones.map(normalize));
    const newPhones: string[] = [];
    for (const line of lines) {
      const digits = normalize(line);
      if (!existing.has(digits)) {
        existing.add(digits);
        newPhones.push(line);
      }
    }
    if (newPhones.length > 0) {
      setExcludedPhones([...excludedPhones, ...newPhones]);
    }
    setBulkText('');
    setShowBulk(false);
  }, [bulkText, excludedPhones, setExcludedPhones]);

  const removePhone = useCallback((index: number) => {
    setExcludedPhones(excludedPhones.filter((_, i) => i !== index));
  }, [excludedPhones, setExcludedPhones]);

  const clearAll = useCallback(() => setExcludedPhones([]), [setExcludedPhones]);

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneOff className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-sm text-orange-900">Exclude Phone Numbers</h3>
            {excludedPhones.length > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                {excludedPhones.length} excluded
              </Badge>
            )}
          </div>
          {excludedPhones.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs text-orange-600 hover:text-orange-800" onClick={clearAll}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear All
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Add phone numbers to skip during this campaign. These numbers will not receive SMS or calls.
        </p>

        {/* Single phone input */}
        <div className="flex gap-2">
          <Input
            placeholder="(555) 123-4567"
            value={singlePhone}
            onChange={(e) => setSinglePhone(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 px-3" onClick={handleAddSingle} disabled={normalize(singlePhone).length < 7}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setShowBulk(!showBulk)}>
            <Upload className="w-3 h-3 mr-1" /> Bulk
          </Button>
        </div>

        {/* Bulk paste area */}
        {showBulk && (
          <div className="space-y-2">
            <Textarea
              placeholder="Paste multiple phone numbers (one per line, or separated by commas)&#10;Example:&#10;(555) 123-4567&#10;555-987-6543&#10;5551234567"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setBulkText(''); setShowBulk(false); }}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleBulkAdd} disabled={!bulkText.trim()}>
                Add All
              </Button>
            </div>
          </div>
        )}

        {/* Excluded phones list */}
        {excludedPhones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {excludedPhones.map((phone, index) => (
              <Badge key={index} variant="outline" className="bg-white border-orange-200 text-orange-800 text-xs py-0.5 pl-2 pr-1 gap-1">
                {formatPhone(phone)}
                <button onClick={() => removePhone(index)} className="hover:bg-orange-100 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
