/**
 * CompsModal - Modal for adding/viewing comps for a property.
 * Features: local draft persistence, copy address, expanded fields.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useComps, type CompData } from '@/hooks/useComps';
import { extractDataFromUrl } from '@/utils/urlDataExtractor';
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
  DollarSign,
  Ruler,
  SkipForward,
  Copy,
  Calendar,
  BedDouble,
  Bath,
  LandPlot,
} from 'lucide-react';

export interface CompsModalProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  square_feet: number | null;
}

interface CompsModalProps {
  open: boolean;
  onClose: () => void;
  property: CompsModalProperty | null;
}

// Draft storage
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

const DRAFT_KEY_PREFIX = 'comp_draft_';

function loadDraft(propertyId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${propertyId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(propertyId: string, draft: DraftData) {
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${propertyId}`, JSON.stringify(draft));
  } catch {}
}

function clearDraft(propertyId: string) {
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${propertyId}`);
  } catch {}
}

const emptyDraft: DraftData = { url: '', price: '', sqft: '', address: '', saleDate: '', lotSize: '', bedrooms: '', bathrooms: '' };

export const CompsModal = ({ open, onClose, property }: CompsModalProps) => {
  const [draft, setDraft] = useState<DraftData>(emptyDraft);
  const { toast } = useToast();

  const { comps, validComps, pricing, loading: compsLoading, saving, addComp, deleteComp } =
    useComps(property, open);

  // Load draft on open/property change
  useEffect(() => {
    if (open && property) {
      const saved = loadDraft(property.id);
      setDraft(saved || emptyDraft);
    }
  }, [property?.id, open]);

  // Persist draft on change
  const updateDraft = useCallback((partial: Partial<DraftData>) => {
    setDraft(prev => {
      const next = { ...prev, ...partial };
      if (property) saveDraft(property.id, next);
      return next;
    });
  }, [property?.id]);

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
      toast({ title: 'URL necessario', description: 'Cole o link do comp', variant: 'destructive' });
      return;
    }
    const priceNum = parseFloat(draft.price);
    const sqftNum = parseFloat(draft.sqft);
    if (!priceNum || !sqftNum || priceNum <= 0 || sqftNum <= 0) {
      toast({ title: 'Dados incompletos', description: 'Preencha preco e sqft', variant: 'destructive' });
      return;
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
      if (property) clearDraft(property.id);
    }
  };

  const handleCopyAddress = () => {
    if (!property) return;
    const addr = `${property.address}, ${property.city || ''}, ${property.state || ''} ${property.zip_code || ''}`.trim();
    navigator.clipboard.writeText(addr);
    toast({ title: 'Endereço copiado!' });
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Comparativos
            {comps.length > 0 && (
              <Badge variant="secondary" className="text-xs">{comps.length}</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm flex items-center gap-1">
            <span className="truncate">{property.address} — {[property.city, property.state].filter(Boolean).join(', ')}</span>
            <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0 shrink-0" title="Copiar endereço">
              <Copy className="h-3 w-3" />
            </Button>
          </DialogDescription>
        </DialogHeader>

        {/* Property summary */}
        <div className="flex gap-3 p-2.5 bg-muted/50 rounded-lg text-xs">
          <div>
            <span className="text-muted-foreground">Estimado: </span>
            <span className="font-bold">${property.estimated_value?.toLocaleString() || 'N/A'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Oferta: </span>
            <span className="font-bold">${property.cash_offer_amount?.toLocaleString() || 'N/A'}</span>
          </div>
          {property.square_feet && (
            <div>
              <span className="text-muted-foreground">Sqft: </span>
              <span className="font-bold">{property.square_feet.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Add Comp Form */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Link do Comp</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="url"
                placeholder="https://www.zillow.com/homedetails/..."
                value={draft.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={saving}
                className="text-sm"
              />
              {draft.url && (
                <Button variant="outline" size="sm" onClick={() => window.open(draft.url, '_blank')} className="shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Preco ($)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" placeholder="250000" value={draft.price} onChange={(e) => updateDraft({ price: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Sqft</Label>
              <div className="relative mt-1">
                <Ruler className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" placeholder="1500" value={draft.sqft} onChange={(e) => updateDraft({ sqft: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
          </div>

          {/* Expanded fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Endereço comp</Label>
              <Input placeholder="123 Main St" value={draft.address} onChange={(e) => updateDraft({ address: e.target.value })} disabled={saving} className="text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Data venda</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="date" value={draft.saleDate} onChange={(e) => updateDraft({ saleDate: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Lot Size</Label>
              <div className="relative mt-1">
                <LandPlot className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" placeholder="5000" value={draft.lotSize} onChange={(e) => updateDraft({ lotSize: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Quartos</Label>
              <div className="relative mt-1">
                <BedDouble className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" placeholder="3" value={draft.bedrooms} onChange={(e) => updateDraft({ bedrooms: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Banheiros</Label>
              <div className="relative mt-1">
                <Bath className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="number" placeholder="2" step="0.5" value={draft.bathrooms} onChange={(e) => updateDraft({ bathrooms: e.target.value })} disabled={saving} className="pl-7 text-sm" />
              </div>
            </div>
          </div>

          {draft.price && draft.sqft && Number(draft.sqft) > 0 && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-800">
              $/Sqft: ${Math.round(Number(draft.price) / Number(draft.sqft))}
            </div>
          )}

          <Button onClick={handleAddComp} disabled={saving || !draft.url} className="w-full gap-2" size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Adicionar Comp'}
          </Button>
        </div>

        {/* Saved Comps */}
        {compsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comps.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Comps Salvos ({comps.length})</p>
            {comps.map((comp) => {
              const price = comp.comp_data?.sale_price;
              const sqft = comp.comp_data?.square_feet;
              const address = comp.comp_data?.address;
              const pricePerSqft = price && sqft && sqft > 0 ? price / sqft : null;

              return (
                <div key={comp.id} className="p-2 bg-muted/50 rounded-lg border space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {price && <span className="font-bold text-green-700 text-sm">${price.toLocaleString()}</span>}
                      {sqft && <span className="text-muted-foreground text-xs">{sqft} sqft</span>}
                      {pricePerSqft && <Badge variant="secondary" className="text-[10px]">${Math.round(pricePerSqft)}/sqft</Badge>}
                      <Badge variant="outline" className="text-[10px] uppercase ml-auto">{comp.source}</Badge>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-1">
                      <Button variant="ghost" size="sm" onClick={() => window.open(comp.url, '_blank')} className="h-7 w-7 p-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteComp(comp.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {address && <p className="text-xs text-muted-foreground truncate">{address}</p>}
                </div>
              );
            })}

            {/* ARV Summary using pricing service */}
            {pricing.validCount > 0 && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">$/Sqft Medio</p>
                    <p className="text-base font-bold text-green-700">${pricing.avgPricePerSqft}</p>
                    <p className="text-[9px] text-muted-foreground">{pricing.validCount} comp{pricing.validCount > 1 ? 's' : ''} válido{pricing.validCount > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Sqft</p>
                    <p className="text-base font-bold text-blue-700">
                      {property.square_feet?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">ARV Estimado</p>
                    <p className="text-base font-bold text-purple-700">
                      {pricing.estimatedARV > 0 ? `$${pricing.estimatedARV.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
                {pricing.outliersRemoved > 0 && (
                  <p className="text-[9px] text-muted-foreground text-center mt-1">
                    {pricing.outliersRemoved} outlier{pricing.outliersRemoved > 1 ? 's' : ''} removido{pricing.outliersRemoved > 1 ? 's' : ''} (IQR)
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1 gap-1.5 text-sm">
            <SkipForward className="h-4 w-4" />
            {comps.length > 0 ? 'Fechar' : 'Pular (adicionar depois)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
