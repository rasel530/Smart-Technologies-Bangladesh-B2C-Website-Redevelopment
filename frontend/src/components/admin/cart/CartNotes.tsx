'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  User,
  Calendar,
  X
} from 'lucide-react';

interface CartNote {
  id: string;
  cartId: string;
  userId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CartNotesProps {
  cartId: string;
  language?: 'en' | 'bn';
  onNoteChange?: () => void;
}

const CartNotes: React.FC<CartNotesProps> = ({ cartId, language = 'en', onNoteChange }) => {
  const [notes, setNotes] = useState<CartNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<CartNote | null>(null);
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID from session/localStorage
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('adminUser') || '{}') : {};
    setCurrentUserId(user.id || null);
    fetchNotes();
  }, [cartId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/notes?includePrivate=true`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newContent.trim()) {
      alert('Please enter note content');
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newContent.trim(),
          isPrivate
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add note');
      }

      const newNote = await response.json();
      setNotes([newNote.data, ...notes]);
      setNewContent('');
      setIsPrivate(true);
      setShowAddDialog(false);
      
      if (onNoteChange) {
        onNoteChange();
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      alert(error.message);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.content.trim()) {
      alert('Please enter note content');
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/carts/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editingNote.content
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update note');
      }

      const updatedNote = await response.json();
      setNotes(notes.map(n => n.id === updatedNote.data.id ? updatedNote.data : n));
      setEditingNote(null);
      
      if (onNoteChange) {
        onNoteChange();
      }
    } catch (error: any) {
      console.error('Error updating note:', error);
      alert(error.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/v1/admin/carts/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete note');
      }

      setNotes(notes.filter(n => n.id !== noteId));
      
      if (onNoteChange) {
        onNoteChange();
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert(error.message);
    }
  };

  const translations = {
    en: {
      title: 'Cart Notes',
      addNote: 'Add Note',
      content: 'Content',
      private: 'Private',
      public: 'Public',
      privateNote: 'Private Note',
      publicNote: 'Public Note',
      addedBy: 'Added by',
      at: 'at',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
      noNotes: 'No notes for this cart yet',
      addFirstNote: 'Add the first note',
      loading: 'Loading notes...',
      error: 'Error loading notes'
    },
    bn: {
      title: 'কার্ট নোট',
      addNote: 'নোট যোগ করুন',
      content: 'বিষয়বস্তু',
      private: 'ব্যক্তিগত',
      public: 'সর্বজনীন',
      privateNote: 'ব্যক্তিগত নোট',
      publicNote: 'সর্বজনীন নোট',
      addedBy: 'যোগ করেছেন',
      at: 'তারিখ',
      edit: 'সম্পাদনা',
      delete: 'মুছে ফেলুন',
      cancel: 'বাতিল',
      save: 'সংরক্ষণ',
      noNotes: 'এই কার্টের জন্য এখন পর্যন্ত কোনো নোট নেই',
      addFirstNote: 'প্রথম নোট যোগ করুন',
      loading: 'নোট লোড হচ্ছে...',
      error: 'নোট লোড করতে ত্রুটি'
    }
  };

  const t = translations[language];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteColor = (isPrivateNote: boolean, noteUserId: string) => {
    if (isPrivateNote) {
      return noteUserId === currentUserId ? 'bg-purple-50 border-purple-200' : 'bg-purple-50 border-purple-200 opacity-75';
    }
    return 'bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{t.error}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
            {notes.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.addNote}
        </button>
      </div>

      {/* Add Note Dialog */}
      {showAddDialog && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.content}
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your note..."
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {isPrivate ? t.private : t.public}
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewContent('');
                  setIsPrivate(true);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Dialog */}
      {editingNote && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{t.edit} Note</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleUpdateNote}
                disabled={!editingNote.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t.noNotes}</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            {t.addFirstNote}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-lg border p-4 ${getNoteColor(note.isPrivate, note.userId)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Note Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {note.isPrivate ? (
                      <Lock className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={`text-xs font-medium ${note.isPrivate ? 'text-purple-700' : 'text-blue-700'}`}>
                      {note.isPrivate ? t.privateNote : t.publicNote}
                    </span>
                  </div>
                  
                  {/* Note Content */}
                  <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                  
                  {/* Note Footer */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {note.userId === currentUserId ? 'You' : note.userId.slice(0, 8) + '...'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
                
                {/* Note Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingNote(note)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.edit}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartNotes;
