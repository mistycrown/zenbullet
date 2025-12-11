import React, { createContext, useContext, useCallback } from 'react';
import { Entry, Tag } from '../types';
import { ToastProvider, useToast } from './ToastContext';
import { EntryProvider, useEntryContext } from './EntryContext';
import { TagProvider, useTagContext } from './TagContext';

// Define the shape of the Unified Context (Backward Compatible)
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

  // Feedback (Toast)
  toast: any;
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;
}

// Internal hook that aggregates sub-contexts
const useAggregatedZenContext = (): ZenContextType => {
  const { toast, showToast, hideToast } = useToast();
  const { entries, addEntry, updateEntry, deleteEntry, batchAddEntries, setEntries } = useEntryContext();
  const { tags, addTag, removeTag, renameTag, reorderTags, setTags } = useTagContext();

  const importData = useCallback((newEntries: Entry[], newTags: Tag[]) => {
    setEntries(newEntries);
    setTags(newTags);
    showToast('Data imported successfully');
  }, [setEntries, setTags, showToast]);

  return {
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
  };
};

export const ZenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <EntryProvider>
        <TagProvider>
          {children}
        </TagProvider>
      </EntryProvider>
    </ToastProvider>
  );
};

// Re-export the hook
export const useZenContext = () => {
  return useAggregatedZenContext();
};

export { ToastDisplay } from './ToastContext';
