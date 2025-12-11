
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useEntryContext } from './EntryContext';
import { useTagContext } from './TagContext';
import { webdavService, SyncData } from '../services/WebDAVService';
import { useToast } from './ToastContext';
import { Entry, Tag } from '../types';

interface SyncContextType {
    isSyncing: boolean;
    lastSyncTime: string | null;
    syncError: string | null;
    config: { url: string; username: string };
    sync: () => Promise<void>;
    upload: () => Promise<void>;
    download: () => Promise<void>;
    updateConfig: (url: string, username: string, password?: string) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { entries, setEntries } = useEntryContext();
    const { tags, setTags } = useTagContext();
    const { showToast } = useToast();

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
        return localStorage.getItem('zenbullet_last_sync');
    });

    const [config, setConfigState] = useState(() => {
        const saved = localStorage.getItem('zenbullet_webdav_config');
        return saved ? JSON.parse(saved) : { url: '', username: '' };
    });

    // Initialize service with saved config
    useEffect(() => {
        const saved = localStorage.getItem('zenbullet_webdav_config');
        if (saved) {
            const { url, username, password } = JSON.parse(saved);
            if (url && username && password) {
                webdavService.updateConfig(url, username, password);
            }
        }
    }, []);

    const updateConfig = useCallback((url: string, username: string, password?: string) => {
        const newConfig = { url, username, password };
        localStorage.setItem('zenbullet_webdav_config', JSON.stringify(newConfig));
        setConfigState({ url, username });
        if (password) {
            webdavService.updateConfig(url, username, password);
        }
    }, []);

    const mergeEntries = (local: Entry[], remote: Entry[]): Entry[] => {
        const map = new Map<string, Entry>();

        // Add all local
        local.forEach(e => map.set(e.id, e));

        // Merge remote
        remote.forEach(remoteEntry => {
            const localEntry = map.get(remoteEntry.id);
            if (localEntry) {
                // Compare timestamps
                const localTime = new Date(localEntry.updatedAt || localEntry.createdAt).getTime();
                const remoteTime = new Date(remoteEntry.updatedAt || remoteEntry.createdAt).getTime();

                if (remoteTime > localTime) {
                    map.set(remoteEntry.id, remoteEntry);
                }
            } else {
                // New from remote
                map.set(remoteEntry.id, remoteEntry);
            }
        });

        return Array.from(map.values());
    };

    const mergeTags = (local: Tag[], remote: Tag[]): Tag[] => {
        // Simple name-based merge, prefer remote text color/icon if name matches? 
        // Or just unique by name. Let's do unique by name, prefer remote if conflict (arbitrary choice for simplicity)
        const map = new Map<string, Tag>();
        local.forEach(t => map.set(t.name, t));
        remote.forEach(t => map.set(t.name, t));
        return Array.from(map.values());
    };

    const upload = useCallback(async () => {
        if (!config.url) {
            showToast('WebDAV not configured');
            return;
        }
        setIsSyncing(true);
        setSyncError(null);
        try {
            await webdavService.uploadData(entries, tags);
            const now = new Date().toISOString();
            setLastSyncTime(now);
            localStorage.setItem('zenbullet_last_sync', now);
            showToast('Upload success: Cloud data overwritten with local version');
        } catch (err) {
            console.error("Upload error:", err);
            setSyncError(err instanceof Error ? err.message : 'Upload failed');
            showToast('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsSyncing(false);
        }
    }, [entries, tags, config.url, showToast]);

    const download = useCallback(async () => {
        if (!config.url) {
            showToast('WebDAV not configured');
            return;
        }
        setIsSyncing(true);
        setSyncError(null);
        try {
            const remoteData = await webdavService.downloadData();
            if (remoteData) {
                const mergedEntries = mergeEntries(entries, remoteData.entries);
                const mergedTags = mergeTags(tags, remoteData.tags);
                setEntries(mergedEntries);
                setTags(mergedTags);

                const now = new Date().toISOString();
                setLastSyncTime(now);
                localStorage.setItem('zenbullet_last_sync', now);
                showToast('Download success: Cloud changes merged into local');
            } else {
                showToast('No data found on server');
            }
        } catch (err) {
            console.error("Download error:", err);
            setSyncError(err instanceof Error ? err.message : 'Download failed');
            showToast('Download failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsSyncing(false);
        }
    }, [entries, tags, config.url, setEntries, setTags, showToast]);

    const sync = useCallback(async () => {
        if (!config.url) {
            // Don't show error toast for auto-sync when not configured
            // Just silently return
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            // 1. Download Remote
            const remoteData = await webdavService.downloadData();

            let mergedEntries = entries;
            let mergedTags = tags;
            let syncResult: 'cloud_updated' | 'local_updated' | 'no_change' = 'no_change';

            if (remoteData) {
                // Compare local vs remote to determine which is newer
                const localMaxTime = entries.reduce((max, e) => {
                    const t = new Date(e.updatedAt || e.createdAt).getTime();
                    return t > max ? t : max;
                }, 0);

                const remoteMaxTime = remoteData.entries.reduce((max, e) => {
                    const t = new Date(e.updatedAt || e.createdAt).getTime();
                    return t > max ? t : max;
                }, 0);

                // 2. Merge
                mergedEntries = mergeEntries(entries, remoteData.entries);
                mergedTags = mergeTags(tags, remoteData.tags);

                // Determine what changed
                const entriesChanged = JSON.stringify(mergedEntries) !== JSON.stringify(entries);
                const tagsChanged = JSON.stringify(mergedTags) !== JSON.stringify(tags);

                if (entriesChanged || tagsChanged) {
                    // Local state will be updated with merged data
                    setEntries(mergedEntries);
                    setTags(mergedTags);

                    // If remote had newer data, we're "downloading"
                    if (remoteMaxTime > localMaxTime) {
                        syncResult = 'cloud_updated';
                    } else {
                        syncResult = 'local_updated';
                    }
                }
            }

            // 3. Upload Merged (always upload to ensure cloud is in sync)
            await webdavService.uploadData(mergedEntries, mergedTags);

            // If we didn't download changes but we had local data, we uploaded
            if (syncResult === 'no_change' && entries.length > 0) {
                syncResult = 'local_updated';
            }

            const now = new Date().toISOString();
            setLastSyncTime(now);
            localStorage.setItem('zenbullet_last_sync', now);

            // Show specific message based on what happened
            if (syncResult === 'cloud_updated') {
                showToast('Sync: Cloud data downloaded to local');
            } else if (syncResult === 'local_updated') {
                showToast('Sync: Local data uploaded to cloud');
            } else {
                showToast('Sync: Already up to date');
            }

        } catch (err) {
            console.error("Sync error:", err);
            setSyncError(err instanceof Error ? err.message : 'Sync failed');
            showToast('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsSyncing(false);
        }
    }, [entries, tags, config.url, setEntries, setTags, showToast]);

    return (
        <SyncContext.Provider value={{
            isSyncing,
            lastSyncTime,
            syncError,
            config,
            sync,
            upload,
            download,
            updateConfig
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSyncContext = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSyncContext must be used within a SyncProvider');
    }
    return context;
};
