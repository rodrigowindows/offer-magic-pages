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
import { DecisionPhotoUpload } from "@/components/review/DecisionPhotoUpload";

interface PropertyNote {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string | null;
  image_urls: string[] | null;
  created_at: string;
}

interface PropertyNotesPanelProps {
  propertyId: string;
  propertyAddress?: string;
  onNoteChanged?: () => void;
}

export const PropertyNotesPanel = ({ propertyId, propertyAddress, onNoteChanged }: PropertyNotesPanelProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notePhotos, setNotePhotos] = useState<File[]>([]);

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
        title: "Erro",
        description: "Falha ao carregar notas",
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
      const uploadedUrls: string[] = [];
      for (const file of notePhotos) {
        const fileExt = file.name.split(".").pop();
        const fileName = `notes/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const { error } = await supabase.from("property_notes").insert({
        property_id: propertyId,
        note_text: noteText.trim(),
        follow_up_date: followUpDate || null,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
      });

      if (error) throw error;

      toast({
        title: "Nota adicionada",
        description: "Sua nota foi salva",
      });

      setNoteText("");
      setFollowUpDate("");
      setNotePhotos([]);
      await fetchNotes();
      onNoteChanged?.();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar nota",
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
        title: "Nota removida",
        description: "Sua nota foi excluída",
      });

      setNotes(notes.filter(n => n.id !== noteId));
      onNoteChanged?.();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir nota",
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
          Notas para: <strong>{propertyAddress}</strong>
        </div>
      )}

      {/* Notes List — shown first for visibility */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <StickyNote className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma nota ainda</p>
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
                      
                      {note.image_urls && note.image_urls.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {note.image_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all">
                              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                      
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
                          {format(new Date(note.created_at), "MMM d, yyyy 'às' h:mm a")}
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

      {/* Add Note Form — below existing notes */}
      <form onSubmit={handleAddNote} className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor="noteText">Nova Nota</Label>
          <Textarea
            id="noteText"
            placeholder="Adicionar nota sobre este imóvel..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Fotos (opcional)</Label>
          <DecisionPhotoUpload files={notePhotos} onChange={setNotePhotos} accent="green" />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="followUpDate">Follow-up (opcional)</Label>
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
                Adicionar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
