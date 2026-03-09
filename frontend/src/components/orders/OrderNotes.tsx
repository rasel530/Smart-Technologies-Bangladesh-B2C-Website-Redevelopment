/**
 * OrderNotes Component
 * 
 * Display and manage order notes with filtering, pinning, and CRUD operations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { OrderNote, NoteType } from '@/lib/api/orderManagement';
import { useOrderManagement } from '@/hooks/useOrderManagement';

interface OrderNotesProps {
  orderId: string;
  language?: 'en' | 'bn';
  className?: string;
  readOnly?: boolean;
  userId?: string;
  isAdmin?: boolean;
}

const OrderNotes: React.FC<OrderNotesProps> = ({
  orderId,
  language = 'en',
  className = '',
  readOnly = false,
  userId,
  isAdmin = false,
}) => {
  const { getOrderNotes, addOrderNote, updateOrderNote, deleteOrderNote, isLoading, error } = useOrderManagement();
  
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [filter, setFilter] = useState<NoteType | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('internal');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNotePinned, setEditNotePinned] = useState(false);

  const loadNotes = async () => {
    const data = await getOrderNotes(orderId, filter === 'all' ? undefined : filter);
    if (data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [orderId, filter]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    const result = await addOrderNote(orderId, {
      content: newNoteContent,
      type: newNoteType,
      isPinned: newNotePinned,
    });

    if (result) {
      setNewNoteContent('');
      setNewNoteType('internal');
      setNewNotePinned(false);
      setShowAddForm(false);
      await loadNotes();
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    const result = await updateOrderNote(orderId, noteId, {
      content: editNoteContent,
      isPinned: editNotePinned,
    });

    if (result) {
      setEditingNoteId(null);
      setEditNoteContent('');
      setEditNotePinned(false);
      await loadNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই নোটটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this note?')) {
      return;
    }

    const result = await deleteOrderNote(orderId, noteId);
    if (result) {
      await loadNotes();
    }
  };

  const canEditNote = (note: OrderNote): boolean => {
    if (readOnly) return false;
    if (isAdmin) return true;
    return note.createdBy === userId;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return language === 'bn'
      ? d.toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const noteTypeLabels: Record<NoteType, { en: string; bn: string; color: string }> = {
    internal: { en: 'Internal', bn: 'অভ্যন্তরীণ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    customer: { en: 'Customer', bn: 'গ্রাহক', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    system: { en: 'System', bn: 'সিস্টেম', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    fulfillment: { en: 'Fulfillment', bn: 'পূর্তি', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  };

  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true;
    return note.noteType === filter;
  });

  return (
    <div className={`order-notes ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {language === 'bn' ? 'অর্ডার নোট' : 'Order Notes'}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({notes.length})
          </span>
        </h3>

        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {showAddForm
              ? language === 'bn'
                ? 'বন্ধ করুন'
                : 'Close'
              : language === 'bn'
              ? 'নোট যোগ করুন'
              : 'Add Note'}
          </button>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {language === 'bn' ? 'সব' : 'All'}
        </button>
        {(['internal', 'customer', 'system', 'fulfillment'] as NoteType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {language === 'bn' ? noteTypeLabels[type].bn : noteTypeLabels[type].en}
          </button>
        ))}
      </div>

      {/* Add note form */}
      {showAddForm && !readOnly && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={language === 'bn' ? 'আপনার নোট লিখুন...' : 'Write your note...'}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            rows={4}
          />
          
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'bn' ? 'ধরন:' : 'Type:'}
              </label>
              <select
                value={newNoteType}
                onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                {(['internal', 'customer', 'system', 'fulfillment'] as NoteType[]).map(type => (
                  <option key={type} value={type}>
                    {language === 'bn' ? noteTypeLabels[type].bn : noteTypeLabels[type].en}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newNotePinned}
                onChange={(e) => setNewNotePinned(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'bn' ? 'পিন করুন' : 'Pin'}
              </span>
            </label>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewNoteContent('');
                  setNewNoteType('internal');
                  setNewNotePinned(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? language === 'bn'
                    ? 'যোগ করা হচ্ছে...'
                    : 'Adding...'
                  : language === 'bn'
                  ? 'যোগ করুন'
                  : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {language === 'bn' ? 'কোনো নোট নেই' : 'No notes found'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const typeInfo = noteTypeLabels[note.noteType];
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.isPinned
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.isPinned && (
                      <span className="text-yellow-500" title={language === 'bn' ? 'পিন করা' : 'Pinned'}>
                        📌
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {language === 'bn' ? typeInfo.bn : typeInfo.en}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(note.createdAt)}
                    </span>
                    {canEditNote(note) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingNoteId(null);
                              setEditNoteContent('');
                              setEditNotePinned(false);
                            } else {
                              setEditingNoteId(note.id);
                              setEditNoteContent(note.content);
                              setEditNotePinned(note.isPinned);
                            }
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                        >
                          {isEditing ? '✕' : '✏️'}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title={language === 'bn' ? 'মুছুন' : 'Delete'}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none mb-3"
                      rows={3}
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editNotePinned}
                          onChange={(e) => setEditNotePinned(e.target.checked)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {language === 'bn' ? 'পিন করুন' : 'Pin'}
                        </span>
                      </label>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditNoteContent('');
                            setEditNotePinned(false);
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                          {language === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editNoteContent.trim() || isLoading}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading
                            ? language === 'bn'
                              ? 'সংরক্ষণ হচ্ছে...'
                              : 'Saving...'
                            : language === 'bn'
                            ? 'সংরক্ষণ করুন'
                            : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderNotes;
