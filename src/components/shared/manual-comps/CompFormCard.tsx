/**
 * CompFormCard - Form for adding/editing a comp link
 * Extracted from ManualCompsManager
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, Loader2, Home, CheckCircle2, ExternalLink, Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromUrl, isValidExtractedData, formatExtractedAddress } from '@/utils/urlDataExtractor';
import type { CompFormState, CompsProperty } from '@/hooks/useManualComps';

interface CompFormCardProps {
  form: CompFormState;
  updateForm: (partial: Partial<CompFormState>) => void;
  properties: CompsProperty[];
  preSelectedPropertyId?: string;
  saving: boolean;
  loading: boolean;
  onPropertySelect: (id: string) => void;
  onSave: () => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onAutoFill: () => void;
  onBulkAdd: () => void;
}

export const CompFormCard = ({
  form, updateForm, properties, preSelectedPropertyId,
  saving, loading, onPropertySelect, onSave, onUpdate, onCancelEdit, onAutoFill, onBulkAdd,
}: CompFormCardProps) => {
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        {form.editingLinkId && (
          <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
            <div className="flex items-center gap-2 text-blue-900">
              <Pencil className="w-5 h-5" />
              <span className="font-semibold">✏️ Modo de Edição</span>
            </div>
          </div>
        )}
        <CardTitle className="flex items-center gap-2">
          {form.editingLinkId ? <><Pencil className="w-5 h-5" /> Editar Comp</> : <><Plus className="w-5 h-5" /> Adicionar Comp</>}
        </CardTitle>
        <CardDescription>
          {form.editingLinkId ? 'Atualize os dados do comp' : preSelectedPropertyId ? 'Cole a URL e preencha o preço/sqft' : 'Selecione uma propriedade e adicione comps'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property selector */}
        {preSelectedPropertyId ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-green-600" />
              <Label className="text-green-900 font-semibold">Propriedade Selecionada</Label>
            </div>
            <p className="text-lg font-bold text-green-800">{form.propertyAddress}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Propriedade</Label>
              <Select value={form.selectedPropertyId} onValueChange={onPropertySelect}>
                <SelectTrigger disabled={saving}>
                  <SelectValue placeholder="Selecione uma propriedade ou digite manualmente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual"><div className="flex items-center gap-2"><Home className="w-4 h-4" />Digite Manualmente</div></SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.address}</span>
                        <span className="text-xs text-muted-foreground">{p.city}, {p.state} {p.zip_code}{p.estimated_value ? ` • $${p.estimated_value.toLocaleString()}` : ''}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Endereço da Propriedade</Label>
              <Input
                placeholder="Ex: 1025 S Washington Ave, Orlando, FL"
                value={form.propertyAddress}
                onChange={e => updateForm({ propertyAddress: e.target.value })}
                disabled={saving || (!!form.selectedPropertyId && form.selectedPropertyId !== 'manual')}
              />
              {form.selectedPropertyId && form.selectedPropertyId !== 'manual' && (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Endereço preenchido automaticamente</p>
              )}
              {form.propertyAddress && (
                <Button variant="outline" size="sm" className="w-full mt-2"
                  onClick={() => window.open(`https://www.zillow.com/homes/${encodeURIComponent(`recently sold ${form.propertyAddress}`)}_rb/`, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />🏠 Buscar Comps no Zillow
                </Button>
              )}
            </div>
          </>
        )}

        {/* URL */}
        <div className="space-y-2">
          <Label>Link da Página de Comps</Label>
          <Input
            type="url"
            placeholder="Ex: https://www.zillow.com/homedetails/..."
            value={form.compsUrl}
            onChange={e => {
              const newUrl = e.target.value;
              updateForm({ compsUrl: newUrl });
              if (newUrl.length > 20) {
                try {
                  const extracted = extractDataFromUrl(newUrl);
                  if (isValidExtractedData(extracted)) {
                    toast({ title: '✅ Dados detectados da URL', description: formatExtractedAddress(extracted) || 'Endereço encontrado', duration: 3000 });
                  }
                } catch {}
              }
            }}
            disabled={saving}
          />
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">💡 Cole o link e clique "Auto-Fill"!</p>
            {form.compsUrl && (form.compsUrl.includes('zillow') || form.compsUrl.includes('trulia') || form.compsUrl.includes('redfin')) && (
              <Button variant="outline" size="sm" onClick={onAutoFill} disabled={loading || saving}>
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : '🪄'} Auto-Fill
              </Button>
            )}
          </div>
        </div>

        {/* Price & Sqft */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">💰 Preço & Área</Label>
          <div className="grid grid-cols-2 gap-4 p-3 border-2 border-dashed border-green-300 rounded-lg bg-green-50/30">
            <div>
              <Label className="text-xs">Preço de Venda ($)</Label>
              <Input type="number" placeholder="250000" value={form.salePrice} onChange={e => updateForm({ salePrice: e.target.value })} className={form.salePrice ? 'border-green-500 border-2' : ''} disabled={saving} />
            </div>
            <div>
              <Label className="text-xs">Square Feet</Label>
              <Input type="number" placeholder="1500" value={form.squareFeet} onChange={e => updateForm({ squareFeet: e.target.value })} className={form.squareFeet ? 'border-green-500 border-2' : ''} disabled={saving} />
            </div>
          </div>
          {(form.salePrice || form.squareFeet) && (
            <div className="p-3 border-2 border-green-400 rounded-lg bg-green-100 text-green-900 text-sm font-semibold">
              ✓ Preview: {form.salePrice ? `Preço: $${Number(form.salePrice).toLocaleString()}` : ''}
              {form.squareFeet ? ` | Área: ${Number(form.squareFeet).toLocaleString()} sqft` : ''}
              {form.salePrice && form.squareFeet ? ` | $/Sqft: $${Math.round(Number(form.salePrice) / Number(form.squareFeet))}` : ''}
            </div>
          )}
        </div>

        {/* Advanced fields */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">📋 Dados Avançados (Opcional)</Label>
          <div className="grid grid-cols-2 gap-4 p-3 border rounded bg-gray-50/50">
            <div><Label className="text-xs">Bedrooms</Label><Input type="number" placeholder="3" value={form.bedrooms} onChange={e => updateForm({ bedrooms: e.target.value })} disabled={saving} /></div>
            <div><Label className="text-xs">Bathrooms</Label><Input type="number" step="0.5" placeholder="2" value={form.bathrooms} onChange={e => updateForm({ bathrooms: e.target.value })} disabled={saving} /></div>
            <div className="col-span-2"><Label className="text-xs">Sale Date</Label><Input type="date" value={form.saleDate} onChange={e => updateForm({ saleDate: e.target.value })} disabled={saving} /></div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notas (Opcional)</Label>
          <Textarea placeholder="Ex: Comps do mesmo condomínio..." value={form.notes} onChange={e => updateForm({ notes: e.target.value })} rows={2} disabled={saving} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {form.editingLinkId ? (
            <>
              <Button onClick={onUpdate} className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</> : <><Pencil className="w-4 h-4 mr-2" />Atualizar Link</>}
              </Button>
              <Button onClick={onCancelEdit} variant="outline" disabled={saving}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button onClick={onSave} className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Plus className="w-4 h-4 mr-2" />Salvar Link</>}
              </Button>
              <Button onClick={() => updateForm({ showBulkAdd: !form.showBulkAdd })} variant={form.showBulkAdd ? 'default' : 'outline'} disabled={saving}>📋 Bulk Add</Button>
            </>
          )}
        </div>

        {/* Bulk Add */}
        {form.showBulkAdd && (
          <div className="mt-4 p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/50 space-y-3">
            <h4 className="font-semibold text-purple-900">🚀 Bulk Add - Múltiplas URLs</h4>
            <Textarea
              placeholder={`https://www.zillow.com/homedetails/123...\nhttps://www.zillow.com/homedetails/456...`}
              value={form.bulkUrls} onChange={e => updateForm({ bulkUrls: e.target.value })}
              rows={6} disabled={saving} className="font-mono text-xs"
            />
            <div className="flex items-center gap-2">
              <Button onClick={onBulkAdd} disabled={saving || !form.bulkUrls.trim()} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> :
                  `⚡ Adicionar Todas (${form.bulkUrls.split('\n').filter(u => u.trim() && (u.includes('zillow') || u.includes('trulia') || u.includes('redfin'))).length})`}
              </Button>
              <Button onClick={() => updateForm({ showBulkAdd: false, bulkUrls: '' })} variant="outline" disabled={saving}>Cancelar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
