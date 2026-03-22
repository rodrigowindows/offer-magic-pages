/**
 * InlineCompForm - Inline comp entry form that replaces the modal for adding comps.
 * Shows primary fields in one row, with secondary fields collapsible.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useComps, type CompData } from '@/hooks/useComps';
import { extractDataFromUrl } from '@/utils/urlDataExtractor';
import {
  Plus,
  Loader2,
  DollarSign,
  Ruler,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface InlineCompFormProps {
  property: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    square_feet: number | null;
  };
  /** Called after a comp is successfully added */
  onCompAdded?: () => void;
}

interface DraftData {
  url: string;
  price: string;
  sqft: string;
  address: string;
  saleDate: string;
  lotSize: string;
  bedrooms: string;
  bathrooms: string;
}

const DRAFT_KEY_PREFIX = 'comp_inline_draft_';
const emptyDraft: DraftData = { url: '', price: '', sqft: '', address: '', saleDate: '', lotSize: '', bedrooms: '', bathrooms: '' };

function loadDraft(propertyId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${propertyId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraftToStorage(propertyId: string, draft: DraftData) {
  try { localStorage.setItem(`${DRAFT_KEY_PREFIX}${propertyId}`, JSON.stringify(draft)); } catch {}
}

function clearDraftStorage(propertyId: string) {
  try { localStorage.removeItem(`${DRAFT_KEY_PREFIX}${propertyId}`); } catch {}
}

export const InlineCompForm = ({ property, onCompAdded }: InlineCompFormProps) => {
  const [draft, setDraft] = useState<DraftData>(emptyDraft);
  const [showExtra, setShowExtra] = useState(false);
  const { toast } = useToast();

  const { saving, addComp } = useComps(property, true);

  // Load draft on property change
  useEffect(() => {
    const saved = loadDraft(property.id);
    setDraft(saved || emptyDraft);
    setShowExtra(false);
  }, [property.id]);

  const updateDraft = useCallback((partial: Partial<DraftData>) => {
    setDraft(prev => {
      const next = { ...prev, ...partial };
      saveDraftToStorage(property.id, next);
      return next;
    });
  }, [property.id]);

  const handleUrlChange = (newUrl: string) => {
    const updates: Partial<DraftData> = { url: newUrl };
    if (newUrl.length > 20) {
      try {
        const extracted = extractDataFromUrl(newUrl);
        if (extracted.price) updates.price = extracted.price.toString();
        if (extracted.sqft) updates.sqft = extracted.sqft.toString();
        if (extracted.address) updates.address = extracted.address;
      } catch {}
    }
    updateDraft(updates);
  };

  const handleAddComp = async () => {
    if (!draft.url.trim()) {
      toast({ title: 'URL necessário', description: 'Cole o link do comp', variant: 'destructive' });
      return;
    }
    const priceNum = parseFloat(draft.price);
    const sqftNum = parseFloat(draft.sqft);
    if (!priceNum || !sqftNum || priceNum <= 0 || sqftNum <= 0) {
      toast({ title: 'Dados incompletos', description: 'Preencha preço e sqft', variant: 'destructive' });
      return;
    }

    if (sqftNum <= 1) {
      toast({ title: 'Sqft inválido', description: 'Sqft deve ser maior que 1', variant: 'destructive' });
      return;
    }

    // ZIP code mismatch warning
    if (property.zip_code && draft.address) {
      const compZipMatch = draft.address.match(/\b(\d{5})(?:-\d{4})?\b/);
      if (compZipMatch && compZipMatch[1] !== property.zip_code) {
        const confirmed = window.confirm(
          `⚠️ ZIP CODE DIFERENTE!\n\nComp: ZIP ${compZipMatch[1]}\nPropriedade: ZIP ${property.zip_code}\n\nComps de ZIP codes diferentes podem distorcer o ARV.\nDeseja adicionar mesmo assim?`
        );
        if (!confirmed) return;
      }
    }

    const compData: CompData = {
      sale_price: priceNum,
      square_feet: sqftNum,
      address: draft.address || undefined,
      sale_date: draft.saleDate || undefined,
      lot_size: draft.lotSize ? parseFloat(draft.lotSize) : undefined,
      bedrooms: draft.bedrooms ? parseInt(draft.bedrooms) : undefined,
      bathrooms: draft.bathrooms ? parseFloat(draft.bathrooms) : undefined,
    };

    const ok = await addComp(draft.url, compData);
    if (ok) {
      setDraft(emptyDraft);
      clearDraftStorage(property.id);
      onCompAdded?.();
    }
  };

  const psfPreview = draft.price && draft.sqft && Number(draft.sqft) > 0
    ? Math.round(Number(draft.price) / Number(draft.sqft))
    : null;

  return (
    <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-2 space-y-2" data-section="inline-comp-form">
      {/* Primary row: URL | Price | Sqft | Add */}
      <div className="flex gap-1.5 items-end">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Input
              type="url"
              placeholder="Link do comp (Zillow, Redfin...)"
              value={draft.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={saving}
              className="text-sm h-8 bg-white dark:bg-gray-900"
            />
            {draft.url && (
              <Button variant="ghost" size="sm" onClick={() => window.open(draft.url, '_blank')} className="h-8 w-8 p-0 shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="w-24 shrink-0">
          <div className="relative">
            <DollarSign className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Preço"
              value={draft.price}
              onChange={(e) => updateDraft({ price: e.target.value })}
              disabled={saving}
              className="pl-6 text-sm h-8 bg-white dark:bg-gray-900"
            />
          </div>
        </div>
        <div className="w-20 shrink-0">
          <div className="relative">
            <Ruler className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Sqft"
              value={draft.sqft}
              onChange={(e) => updateDraft({ sqft: e.target.value })}
              disabled={saving}
              className="pl-6 text-sm h-8 bg-white dark:bg-gray-900"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComp(); }}
            />
          </div>
        </div>
        {psfPreview && (
          <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 shrink-0 h-8 px-2">
            ${psfPreview}/sqft
          </Badge>
        )}
        <Button
          onClick={handleAddComp}
          disabled={saving || !draft.url}
          size="sm"
          className="h-8 px-3 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add
        </Button>
      </div>

      {/* Toggle for extra fields */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          {showExtra ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showExtra ? 'Menos campos' : 'Endereço, Data, Lote, Q/B...'}
        </button>
      </div>

      {/* Secondary fields (collapsible) */}
      {showExtra && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <Input
            placeholder="Endereço do comp"
            value={draft.address}
            onChange={(e) => updateDraft({ address: e.target.value })}
            disabled={saving}
            className="text-xs h-7 bg-white dark:bg-gray-900"
          />
          <Input
            type="date"
            placeholder="Data venda"
            value={draft.saleDate}
            onChange={(e) => updateDraft({ saleDate: e.target.value })}
            disabled={saving}
            className="text-xs h-7 bg-white dark:bg-gray-900"
          />
          <Input
            type="number"
            placeholder="Lot Size"
            value={draft.lotSize}
            onChange={(e) => updateDraft({ lotSize: e.target.value })}
            disabled={saving}
            className="text-xs h-7 bg-white dark:bg-gray-900"
          />
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="Q"
              value={draft.bedrooms}
              onChange={(e) => updateDraft({ bedrooms: e.target.value })}
              disabled={saving}
              className="text-xs h-7 bg-white dark:bg-gray-900"
            />
            <Input
              type="number"
              placeholder="B"
              step="0.5"
              value={draft.bathrooms}
              onChange={(e) => updateDraft({ bathrooms: e.target.value })}
              disabled={saving}
              className="text-xs h-7 bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
