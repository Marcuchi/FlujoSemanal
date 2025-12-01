
import React from 'react';
import { X, StickyNote, Plus, Trash2, Edit2, Save, Check } from 'lucide-react';
import { Note } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  currentAppName: string;
}

export const NotesModal: React.FC<NotesModalProps> = ({ 
  isOpen, 
  onClose, 
  notes, 
  onAdd, 
  onUpdate, 
  onDelete,
  currentAppName
}) => {
  const [newNote, setNewNote] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAdd(newNote);
      setNewNote('');
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      onUpdate(id, editContent);
      setEditingId(null);
    }
  };

  // Sort notes by createdAt desc
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <StickyNote size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-100">Anotaciones</h2>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">{currentAppName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Add Note Form */}
            <form onSubmit={handleAdd} className="p-4 bg-slate-800/50 border-b border-slate-800">
                <div className="relative">
                    <textarea 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder={`Nueva nota para ${currentAppName}...`}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none h-20"
                    />
                    <button 
                        type="submit"
                        disabled={!newNote.trim()}
                        className="absolute bottom-2 right-2 p-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </form>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {sortedNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 opacity-50">
                        <StickyNote size={48} />
                        <p>No hay anotaciones en {currentAppName}.</p>
                    </div>
                ) : (
                    sortedNotes.map(note => (
                        <div key={note.id} className="group bg-amber-100 text-slate-800 rounded-xl p-4 shadow-lg relative border-l-4 border-amber-400">
                            {editingId === note.id ? (
                                <div className="flex flex-col gap-2">
                                    <textarea 
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-white/50 border border-amber-300 rounded p-2 text-sm focus:outline-none resize-none h-24"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-600"><X size={14}/></button>
                                        <button onClick={() => saveEdit(note.id)} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white"><Check size={14}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm whitespace-pre-wrap font-medium">{note.content}</p>
                                    <div className="flex justify-between items-end mt-3">
                                        <span className="text-[10px] text-amber-800/60 font-semibold">
                                            {new Date(note.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => startEditing(note)} 
                                                className="p-1.5 bg-white/50 hover:bg-white rounded text-amber-700 hover:text-amber-900 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(note.id)} 
                                                className="p-1.5 bg-white/50 hover:bg-white rounded text-rose-600 hover:text-rose-800 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
