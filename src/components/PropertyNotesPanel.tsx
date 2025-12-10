import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Calendar, StickyNote } from "lucide-react";
import { format } from "date-fns";

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  created_at: string;
}

interface PropertyNotesPanelProps {
  propertyId: string;
  propertyAddress?: string;
}

export const PropertyNotesPanel = ({ propertyId, propertyAddress }: PropertyNotesPanelProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    if (propertyId) {
      fetchNotes();
    }
  }, [propertyId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("property_notes")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("property_notes").insert({
        property_id: propertyId,
        note_text: noteText.trim(),
        follow_up_date: followUpDate || null,
      });

      if (error) throw error;

      toast({
        title: "Note added",
        description: "Your note has been saved",
      });

      setNoteText("");
      setFollowUpDate("");
      await fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("property_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "Your note has been removed",
      });

      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const isFollowUpOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isFollowUpToday = (date: string | null) => {
    if (!date) return false;
    const today = new Date();
    const followUp = new Date(date);
    return (
      followUp.getFullYear() === today.getFullYear() &&
      followUp.getMonth() === today.getMonth() &&
      followUp.getDate() === today.getDate()
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {propertyAddress && (
        <div className="text-sm text-muted-foreground">
          Notes for: <strong>{propertyAddress}</strong>
        </div>
      )}

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor="noteText">New Note</Label>
          <Textarea
            id="noteText"
            placeholder="Add a note about this property..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="followUpDate">Follow-up Date (optional)</Label>
            <Input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving || !noteText.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notes yet for this property</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {note.follow_up_date && (
                          <Badge
                            variant={
                              isFollowUpOverdue(note.follow_up_date)
                                ? "destructive"
                                : isFollowUpToday(note.follow_up_date)
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Follow-up: {format(new Date(note.follow_up_date), "MMM d, yyyy")}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Added {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
