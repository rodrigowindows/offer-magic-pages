import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PropertyAnalytics } from '@/components/property/PropertyAnalytics';

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  created_at: string;
}

interface PropertyNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string | null;
  notes: PropertyNote[];
  noteFormData: { noteText: string; followUpDate: string };
  onNoteFormChange: (data: { noteText: string; followUpDate: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const PropertyNotesDialog = ({
  open,
  onOpenChange,
  propertyId,
  notes,
  noteFormData,
  onNoteFormChange,
  onSubmit,
  isLoading,
}: PropertyNotesDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Property Analytics & Notes</DialogTitle>
        <DialogDescription>Track analytics, communication and follow-ups</DialogDescription>
      </DialogHeader>

      {propertyId && (
        <div className="mb-6">
          <PropertyAnalytics propertyId={propertyId} />
        </div>
      )}

      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Note</Label>
            <Textarea
              value={noteFormData.noteText}
              onChange={e => onNoteFormChange({ ...noteFormData, noteText: e.target.value })}
              placeholder="Add a note..."
              required
            />
          </div>
          <div>
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={noteFormData.followUpDate}
              onChange={e => onNoteFormChange({ ...noteFormData, followUpDate: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Adding...' : 'Add Note'}</Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">Previous Notes</h3>
          {notes.map(note => (
            <div key={note.id} className="p-3 bg-muted rounded-lg">
              <p>{note.note_text}</p>
              {note.follow_up_date && (
                <p className="text-sm text-muted-foreground mt-1">Follow up: {new Date(note.follow_up_date).toLocaleDateString()}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{new Date(note.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
