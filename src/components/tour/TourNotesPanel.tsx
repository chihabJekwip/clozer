'use client';

import { useState, useEffect } from 'react';
import { TourNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  FileText,
  Plus,
  Mic,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
} from 'lucide-react';
import { getTourNotes, addTourNote, updateTourNote, deleteTourNote } from '@/lib/storage';

interface TourNotesPanelProps {
  open: boolean;
  onClose: () => void;
  tourId: string;
  tourName: string;
}

export default function TourNotesPanel({
  open,
  onClose,
  tourId,
  tourName,
}: TourNotesPanelProps) {
  const [notes, setNotes] = useState<TourNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load notes when panel opens
  useEffect(() => {
    if (open) {
      setNotes(getTourNotes(tourId));
    }
  }, [open, tourId]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    setIsLoading(true);
    const newNote = await addTourNote(tourId, newNoteContent.trim());
    if (newNote) {
      setNotes(prev => [...prev, newNote]);
      setNewNoteContent('');
    }
    setIsLoading(false);
  };

  const handleStartEdit = (note: TourNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingContent.trim()) return;
    
    setIsLoading(true);
    const updated = await updateTourNote(editingNoteId, editingContent.trim());
    if (updated) {
      setNotes(prev => prev.map(n => n.id === editingNoteId ? updated : n));
    }
    setEditingNoteId(null);
    setEditingContent('');
    setIsLoading(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Supprimer cette note ?')) return;
    
    setIsLoading(true);
    const success = await deleteTourNote(noteId);
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
    }
    setIsLoading(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes de tournée
          </SheetTitle>
          <SheetDescription>
            {tourName} - Carnet de bord
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-80px)] mt-4">
          {/* Notes list */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune note pour cette tournée</p>
                <p className="text-sm">Ajoutez des notes pour les retrouver dans le rapport final</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted/50 rounded-lg border"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editingContent.trim() || isLoading}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(note.createdAt)}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleStartEdit(note)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{note.content}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add new note */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <Mic className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Astuce : Dictée vocale</p>
                <p className="text-blue-600">
                  Appuyez sur l'icône micro de votre clavier pour dicter.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Ajouter une note... (Ex: Embouteillage sur la N10, prévoir +15min)"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
              />
            </div>
            
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isLoading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la note
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
