import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Entry } from '../types';
import { getNextDate, INITIAL_ENTRIES } from '../utils';
import { useToast } from './ToastContext';

interface EntryContextType {
    entries: Entry[];
    addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
    updateEntry: (id: string, updates: Partial<Entry>) => void;
    deleteEntry: (id: string, mode?: 'single' | 'series') => void;
    batchAddEntries: (entries: Omit<Entry, 'id' | 'createdAt'>[]) => void;
    setEntries: React.Dispatch<React.SetStateAction<Entry[]>>; // Exposed for advanced usage (TagContext)
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

export const EntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast, hideToast } = useToast();

    const [entries, setEntries] = useState<Entry[]>(() => {
        try {
            const saved = localStorage.getItem('zenbullet_entries');
            return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
        } catch {
            return INITIAL_ENTRIES;
        }
    });

    const lastDeletedEntriesRef = useRef<Entry[]>([]);

    // -- Persistence --
    useEffect(() => {
        localStorage.setItem('zenbullet_entries', JSON.stringify(entries));
    }, [entries]);

    // -- Logic --

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
        const updatedAt = createdAt;
        const priority = newEntry.priority || 2;
        setEntries(prev => [...prev, { ...newEntry, id, createdAt, updatedAt, priority }]);

        if (newEntry.content) {
            showToast('Entry created');
        }
    }, [showToast]);

    const batchAddEntries = useCallback((newEntries: Omit<Entry, 'id' | 'createdAt'>[]) => {
        const entriesToAdd = newEntries.map(entry => ({
            ...entry,
            id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
            let finalUpdates = { ...updates, updatedAt: new Date().toISOString() };

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

    return (
        <EntryContext.Provider value={{
            entries,
            addEntry,
            updateEntry,
            deleteEntry,
            batchAddEntries,
            setEntries
        }}>
            {children}
        </EntryContext.Provider>
    );
};

export const useEntryContext = () => {
    const context = useContext(EntryContext);
    if (context === undefined) {
        throw new Error('useEntryContext must be used within a EntryProvider');
    }
    return context;
};
