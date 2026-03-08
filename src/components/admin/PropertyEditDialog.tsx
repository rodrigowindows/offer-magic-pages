import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe } from 'lucide-react';
import type { AdminProperty } from '@/hooks/useAdminProperties';

interface PropertyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editFormData: Partial<AdminProperty>;
  onEditFormChange: (data: Partial<AdminProperty>) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const PropertyEditDialog = ({
  open,
  onOpenChange,
  editFormData,
  onEditFormChange,
  onSave,
  isLoading,
}: PropertyEditDialogProps) => {
  const update = (field: string, value: any) => onEditFormChange({ ...editFormData, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>Update property information and internal tracking details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Property Address</Label><Input value={editFormData.address || ''} onChange={e => update('address', e.target.value)} /></div>
              <div><Label>City</Label><Input value={editFormData.city || ''} onChange={e => update('city', e.target.value)} /></div>
              <div><Label>State</Label><Input value={editFormData.state || ''} onChange={e => update('state', e.target.value)} maxLength={2} /></div>
              <div><Label>ZIP Code</Label><Input value={editFormData.zip_code || ''} onChange={e => update('zip_code', e.target.value)} /></div>
              <div><Label>Estimated Value</Label><Input type="number" value={editFormData.estimated_value || ''} onChange={e => update('estimated_value', parseFloat(e.target.value))} /></div>
              <div>
                <Label className="text-sm font-semibold text-green-700">💰 Cash Offer</Label>
                <Input type="number" value={editFormData.cash_offer_amount || ''} onChange={e => update('cash_offer_amount', parseFloat(e.target.value))} className="border-green-300 focus:border-green-500" />
              </div>
              <div><Label>Min Offer (Optional)</Label><Input type="number" value={(editFormData as any).min_offer_amount || ''} onChange={e => update('min_offer_amount', parseFloat(e.target.value))} placeholder="Lower range" className="border-blue-200" /></div>
              <div><Label>Max Offer (Optional)</Label><Input type="number" value={(editFormData as any).max_offer_amount || ''} onChange={e => update('max_offer_amount', parseFloat(e.target.value))} placeholder="Upper range" className="border-blue-200" /></div>
              <div className="col-span-2"><Label>Property Image URL</Label><Input value={editFormData.property_image_url || ''} onChange={e => update('property_image_url', e.target.value)} placeholder="https://example.com/image.jpg" /></div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Owner Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Owner Name</Label><Input value={editFormData.owner_name || ''} onChange={e => update('owner_name', e.target.value)} /></div>
              <div className="col-span-2"><Label>Owner Address</Label><Input value={editFormData.owner_address || ''} onChange={e => update('owner_address', e.target.value)} /></div>
              <div><Label>Owner Phone</Label><Input value={editFormData.owner_phone || ''} onChange={e => update('owner_phone', e.target.value)} /></div>
              <div><Label>Neighborhood</Label><Input value={editFormData.neighborhood || ''} onChange={e => update('neighborhood', e.target.value)} /></div>
            </div>
          </div>

          {/* Tracking & Analysis */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Tracking & Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Origem (Origin)</Label><Input value={editFormData.origem || ''} onChange={e => update('origem', e.target.value)} /></div>
              <div><Label>Carta (Letter)</Label><Input value={editFormData.carta || ''} onChange={e => update('carta', e.target.value)} /></div>
              <div><Label>Evaluation</Label><Input value={editFormData.evaluation || ''} onChange={e => update('evaluation', e.target.value)} /></div>
              <div><Label>FOCAR</Label><Input value={editFormData.focar || ''} onChange={e => update('focar', e.target.value)} /></div>
              <div><Label>Comparative Price</Label><Input type="number" value={editFormData.comparative_price || ''} onChange={e => update('comparative_price', parseFloat(e.target.value))} /></div>
              <div className="col-span-2">
                <Label>Zillow URL</Label>
                <div className="flex gap-2">
                  <Input value={editFormData.zillow_url || ''} onChange={e => update('zillow_url', e.target.value)} placeholder="https://zillow.com/..." />
                  <Button type="button" variant="outline" size="sm" onClick={() => editFormData.zillow_url && window.open(editFormData.zillow_url, '_blank')} disabled={!editFormData.zillow_url} className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-300">
                    <Globe className="h-4 w-4 mr-1" />Open Zillow
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Flags</h3>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox checked={editFormData.answer_flag || false} onCheckedChange={c => update('answer_flag', c)} />
                <Label className="cursor-pointer">Answer Flag</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={editFormData.dnc_flag || false} onCheckedChange={c => update('dnc_flag', c)} />
                <Label className="cursor-pointer">DNC Flag</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={isLoading}>{isLoading ? 'Updating...' : 'Update Property'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
