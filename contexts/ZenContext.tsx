
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Entry, Tag, RecurrenceType } from '../types';
import { INITIAL_TAGS, getNextDate } from '../utils';
import { X } from 'lucide-react';

// --- Mock Data (Moved from App.tsx) ---
const INITIAL_ENTRIES: Entry[] = [
  { id: '1', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'event', content: '10:00 AM Team Sync\n\nDiscuss Q2 Roadmap', status: 'todo', tag: 'Work', recurrence: 'weekly', priority: 3 },
  { id: '2', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Finalize Q1 Financial Report', status: 'done', tag: 'Work', priority: 4 },
  { id: '3', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Printer is out of ink', status: 'todo', tag: 'Office', priority: 1 },
  { id: '4', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Leg day at gym', status: 'todo', tag: 'Health', recurrence: 'daily', priority: 2 },
  { id: '5', createdAt: new Date().toISOString(), date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'task', content: 'Send contract draft to client', status: 'todo', tag: 'Work', priority: 3 },
  { id: '6', createdAt: new Date().toISOString(), date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'event', content: 'Lunch with Sarah', status: 'todo', tag: 'Life', priority: 2 },
  { id: '7', createdAt: new Date().toISOString(), date: new Date(Date.now() - 86400000).toISOString().split('T')[0], type: 'task', content: 'Buy groceries', status: 'done', tag: 'Life', priority: 2 },
  { id: '8', createdAt: new Date().toISOString(), date: new Date(Date.now() - 172800000).toISOString().split('T')[0], type: 'task', content: 'Old overdue task', status: 'todo', tag: 'Work', priority: 4 },
  { id: '10', createdAt: new Date().toISOString(), date: null, type: 'task', content: 'Read that new book', status: 'todo', tag: 'Inbox', priority: 1 },
];

interface ToastData {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ZenContextType {
  entries: Entry[];
  tags: Tag[];
  
  // Actions
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string, mode?: 'single' | 'series') => void;
  batchAddEntries: (entries: Omit<Entry, 'id' | 'createdAt'>[]) => void;
  
  // Tag Actions
  addTag: (tag: Tag) => void;
  removeTag: (tagName: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  reorderTags: (tags: Tag[]) => void;
  
  // Data Management
  importData: (entries: Entry[], tags: Tag[]) => void;
  
  // Feedback
  toast: ToastData | null;
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;
}

const ZenContext = createContext<ZenContextType | undefined>(undefined);

export const ZenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -- State --
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem('zenbullet_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch { 
      return INITIAL_ENTRIES; 
    }
  });
  
  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('zenbullet_tags');
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDeletedEntriesRef = useRef<Entry[]>([]);

  // -- Persistence --
  useEffect(() => {
    localStorage.setItem('zenbullet_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('zenbullet_tags', JSON.stringify(tags));
  }, [tags]);

  // -- Toast Helpers --
  const showToast = useCallback((message: string, action?: { label: string, onClick: () => void }) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const id = Date.now();
    setToast({ id, message, action });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => prev && prev.id === id ? null : prev);
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  // -- Entry Logic --
  
  const handleUndoDelete = useCallback(() => {
    const deleted = lastDeletedEntriesRef.current;
    if (deleted.length === 0) return;
    setEntries(prev => [...prev, ...deleted]);
    hideToast();
    lastDeletedEntriesRef.current = [];
  }, [hideToast]);

  const addEntry = useCallback((newEntry: Omit<Entry, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    const priority = newEntry.priority || 2; 
    setEntries(prev => [...prev, { ...newEntry, id, createdAt, priority }]);
    
    if (newEntry.content) {
        showToast('Entry created');
    }
  }, [showToast]);

  const batchAddEntries = useCallback((newEntries: Omit<Entry, 'id' | 'createdAt'>[]) => {
    const entriesToAdd = newEntries.map(entry => ({
      ...entry,
      id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      priority: entry.priority || 2,
      status: 'todo' as const
    }));
    setEntries(prev => [...prev, ...entriesToAdd]);
    showToast(`${entriesToAdd.length} entries added`);
  }, [showToast]);

  const updateEntry = useCallback((id: string, updates: Partial<Entry>) => {
    setEntries(prevEntries => {
      const entry = prevEntries.find(e => e.id === id);
      if (!entry) return prevEntries;

      let entriesToAdd: Entry[] = [];
      
      const newStatus = updates.status;
      const isCompleting = newStatus === 'done' && entry.status === 'todo';
      const isRecurring = entry.recurrence;
      let finalUpdates = { ...updates };

      if (isRecurring && isCompleting && entry.date) {
        const nextDate = getNextDate(entry.date, entry.recurrence!);
        const duplicateExists = prevEntries.some(e => 
          e.content === entry.content && 
          e.date === nextDate && 
          e.tag === entry.tag &&
          e.type === entry.type
        );
        const isPastEndDate = entry.recurrenceEnd ? new Date(nextDate) > new Date(entry.recurrenceEnd) : false;

        if (!duplicateExists && !isPastEndDate) {
          const nextEntry: Entry = {
            ...entry,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            date: nextDate,
            status: 'todo',
          };
          entriesToAdd.push(nextEntry);
        }
        finalUpdates.recurrence = null;
        finalUpdates.recurrenceEnd = null;
      }
      const updatedEntries = prevEntries.map(e => 
        e.id === id ? { ...e, ...finalUpdates } : e
      );
      return [...updatedEntries, ...entriesToAdd];
    });
  }, []);

  const deleteEntry = useCallback((id: string, deleteMode: 'single' | 'series' = 'single') => {
    setEntries(prev => {
      const entryToDelete = prev.find(e => e.id === id);
      if (!entryToDelete) return prev;

      let deletedItems: Entry[] = [entryToDelete];
      let newEntries: Entry[] = [];

      if (entryToDelete.type === 'project') {
         const subtasks = prev.filter(e => e.parentId === id);
         deletedItems = [entryToDelete, ...subtasks];
         newEntries = prev.filter(e => e.id !== id && e.parentId !== id);
      } else {
         newEntries = prev.filter(e => e.id !== id);
      }

      // Handle recurrence skip logic
      if (
        deleteMode === 'single' && 
        entryToDelete && 
        entryToDelete.recurrence && 
        entryToDelete.date && 
        entryToDelete.status === 'todo'
      ) {
        const nextDate = getNextDate(entryToDelete.date, entryToDelete.recurrence);
        const duplicateExists = prev.some(e => 
          e.content === entryToDelete.content && 
          e.date === nextDate && 
          e.tag === entryToDelete.tag
        );
        const isPastEndDate = entryToDelete.recurrenceEnd ? new Date(nextDate) > new Date(entryToDelete.recurrenceEnd) : false;

        if (!duplicateExists && !isPastEndDate) {
          const nextEntry: Entry = {
            ...entryToDelete,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            date: nextDate,
            status: 'todo',
          };
          newEntries.push(nextEntry);
        }
      }

      lastDeletedEntriesRef.current = deletedItems;
      showToast(
        deletedItems.length > 1 ? `${deletedItems.length} items deleted` : 'Entry deleted', 
        { label: 'Undo', onClick: handleUndoDelete }
      );

      return newEntries;
    });
  }, [showToast, handleUndoDelete]);

  // -- Tag Logic --
  
  const addTag = useCallback((tag: Tag) => {
    setTags(prev => [...prev, tag]);
    showToast(`Collection "${tag.name}" added`);
  }, [showToast]);

  const removeTag = useCallback((tagName: string) => {
    setTags(prev => prev.filter(t => t.name !== tagName));
    setEntries(prev => prev.map(e => e.tag === tagName ? { ...e, tag: 'Inbox' } : e));
    showToast(`Collection "${tagName}" removed`);
  }, [showToast]);

  const renameTag = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return;
    setTags(prev => {
      if (prev.some(t => t.name === newName)) {
        alert('Collection name already exists');
        return prev;
      }
      return prev.map(t => t.name === oldName ? { ...t, name: newName } : t);
    });
    setEntries(prev => prev.map(e => e.tag === oldName ? { ...e, tag: newName } : e));
  }, []);

  const reorderTags = useCallback((newTags: Tag[]) => {
    setTags(newTags);
  }, []);

  const importData = useCallback((newEntries: Entry[], newTags: Tag[]) => {
    setEntries(newEntries);
    setTags(newTags);
    showToast('Data imported successfully');
  }, [showToast]);

  return (
    <ZenContext.Provider value={{
      entries,
      tags,
      addEntry,
      updateEntry,
      deleteEntry,
      batchAddEntries,
      addTag,
      removeTag,
      renameTag,
      reorderTags,
      importData,
      toast,
      showToast,
      hideToast
    }}>
      {children}
    </ZenContext.Provider>
  );
};

export const useZenContext = () => {
  const context = useContext(ZenContext);
  if (context === undefined) {
    throw new Error('useZenContext must be used within a ZenProvider');
  }
  return context;
};

// -- Reusable UI Component for Toast (Can be here or in components/) --
export const ToastDisplay = () => {
  const { toast, hideToast } = useZenContext();
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <span className="text-sm font-medium">{toast.message}</span>
      {toast.action && (
        <button 
          onClick={toast.action.onClick}
          className="text-sm font-bold text-blue-300 hover:text-blue-200 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={hideToast} className="text-stone-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};
