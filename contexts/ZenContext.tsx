import React, { createContext, useContext, useCallback } from 'react';
import { Entry, Tag } from '../types';
import { INITIAL_ENTRIES, INITIAL_TAGS } from '../utils'; // Import initial data
import { ToastProvider, useToast } from './ToastContext';
import { EntryProvider, useEntryContext } from './EntryContext';
import { TagProvider, useTagContext } from './TagContext';
import { SyncProvider, useSyncContext } from './SyncContext';

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
  clearData: (type: 'entries' | 'all') => void; // New method
  restoreDefaults: () => void; // New method

  // Feedback (Toast)
  toast: any;
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;

  // Sync
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  syncConfig: { url: string; username: string };
  sync: () => Promise<void>;
  updateSyncConfig: (url: string, username: string, password?: string) => void;
}

// Internal hook that aggregates sub-contexts
const useAggregatedZenContext = (): ZenContextType => {
  const { toast, showToast, hideToast } = useToast();
  const { entries, addEntry, updateEntry, deleteEntry, batchAddEntries, setEntries } = useEntryContext();
  const { tags, addTag, removeTag, renameTag, reorderTags, setTags } = useTagContext();
  const { isSyncing, lastSyncTime, syncError, config: syncConfig, sync, updateConfig: updateSyncConfig } = useSyncContext();

  const importData = useCallback((newEntries: Entry[], newTags: Tag[]) => {
    setEntries(newEntries);
    setTags(newTags);
    showToast('Data imported successfully');
  }, [setEntries, setTags, showToast]);

  const clearData = useCallback((type: 'entries' | 'all') => {
    if (type === 'entries') {
      setEntries([]);
      showToast('All entries cleared');
    } else if (type === 'all') {
      setEntries([]);
      setTags([]);
      showToast('All data cleared');
    }
  }, [setEntries, setTags, showToast]);

  const restoreDefaults = useCallback(() => {
    setEntries(INITIAL_ENTRIES);
    setTags(INITIAL_TAGS);
    showToast('Default data restored');
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
    clearData,
    restoreDefaults,
    toast,
    showToast,
    hideToast,
    isSyncing,
    lastSyncTime,
    syncError,
    syncConfig,
    sync,
    updateSyncConfig
  };
};

export const ZenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <EntryProvider>
        <TagProvider>
          <SyncProvider>
            {children}
          </SyncProvider>
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
