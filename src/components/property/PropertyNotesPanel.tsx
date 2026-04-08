import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Calendar, StickyNote, Camera } from "lucide-react";
import { format } from "date-fns";

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
  const [showExtras, setShowExtras] = useState(false);
  const [notePhotos, setNotePhotos] = useState<File[]>([]);

  useEffect(() => {
    if (propertyId) fetchNotes();
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

      toast({ title: "Nota adicionada" });
      setNoteText("");
      setFollowUpDate("");
      setNotePhotos([]);
      setShowExtras(false);
      await fetchNotes();
      onNoteChanged?.();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({ title: "Erro", description: "Falha ao adicionar nota", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("property_notes").delete().eq("id", noteId);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== noteId));
      onNoteChanged?.();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const isOverdue = (date: string | null) => date ? new Date(date) < new Date() : false;
  const isToday = (date: string | null) => {
    if (!date) return false;
    const d = new Date(date); const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  };

  if (loading) return <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {/* Compact add note form */}
      <form onSubmit={handleAddNote} className="space-y-1.5 p-2 border rounded-md bg-muted/20">
        <div className="flex gap-1.5">
          <Textarea
            placeholder="Adicionar nota..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={1}
            className="text-xs min-h-[32px] resize-none flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(e); } }}
          />
          <Button type="submit" size="sm" disabled={saving || !noteText.trim()} className="h-8 px-2 shrink-0">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>

        {/* Extras toggle */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowExtras(!showExtras)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
            <Camera className="h-3 w-3" /> Foto
          </button>
          <button type="button" onClick={() => setShowExtras(!showExtras)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
            <Calendar className="h-3 w-3" /> Follow-up
          </button>
          {notePhotos.length > 0 && <Badge variant="secondary" className="text-[8px]">{notePhotos.length} foto(s)</Badge>}
        </div>

        {showExtras && (
          <div className="flex items-center gap-2">
            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="text-xs h-7 flex-1" placeholder="Follow-up" />
            <label className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground border rounded px-2 py-1">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setNotePhotos(Array.from(e.target.files || []))} />
              📷 Fotos
            </label>
          </div>
        )}
      </form>

      {/* Notes list - chronological timeline */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <StickyNote className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma nota ainda</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="group relative border-l-2 border-muted-foreground/20 pl-2 py-1">
              {/* Timestamp */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}
                </span>
                <div className="flex items-center gap-1">
                  {note.follow_up_date && (
                    <Badge
                      variant={isOverdue(note.follow_up_date) ? "destructive" : isToday(note.follow_up_date) ? "default" : "secondary"}
                      className="text-[8px] px-1 h-4"
                    >
                      <Calendar className="h-2.5 w-2.5 mr-0.5" />
                      {format(new Date(note.follow_up_date), "dd/MM")}
                    </Badge>
                  )}
                  <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Note text */}
              <p className="text-xs whitespace-pre-wrap leading-relaxed">{note.note_text}</p>

              {/* Images */}
              {note.image_urls && note.image_urls.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {note.image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded overflow-hidden border hover:ring-1 hover:ring-primary">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
