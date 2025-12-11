import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tag } from '../types';
import { INITIAL_TAGS } from '../utils';
import { useToast } from './ToastContext';
import { useEntryContext } from './EntryContext';

interface TagContextType {
    tags: Tag[];
    addTag: (tag: Tag) => void;
    removeTag: (tagName: string) => void;
    renameTag: (oldName: string, newName: string) => void;
    reorderTags: (tags: Tag[]) => void;
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export const TagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const { setEntries } = useEntryContext();

    const [tags, setTags] = useState<Tag[]>(() => {
        try {
            const saved = localStorage.getItem('zenbullet_tags');
            return saved ? JSON.parse(saved) : INITIAL_TAGS;
        } catch {
            return INITIAL_TAGS;
        }
    });

    // -- Persistence --
    useEffect(() => {
        localStorage.setItem('zenbullet_tags', JSON.stringify(tags));
    }, [tags]);

    // -- Logic --

    const addTag = useCallback((tag: Tag) => {
        setTags(prev => [...prev, tag]);
        showToast(`Collection "${tag.name}" added`);
    }, [showToast]);

    const removeTag = useCallback((tagName: string) => {
        setTags(prev => prev.filter(t => t.name !== tagName));
        // Side effect: update entries
        setEntries(prev => prev.map(e => e.tag === tagName ? { ...e, tag: 'Inbox' } : e));
        showToast(`Collection "${tagName}" removed`);
    }, [showToast, setEntries]);

    const renameTag = useCallback((oldName: string, newName: string) => {
        if (oldName === newName) return;
        setTags(prev => {
            if (prev.some(t => t.name === newName)) {
                alert('Collection name already exists'); // Alert could be replaced by Toast if we want standard UI
                return prev;
            }
            return prev.map(t => t.name === oldName ? { ...t, name: newName } : t);
        });
        // Side effect: update entries
        setEntries(prev => prev.map(e => e.tag === oldName ? { ...e, tag: newName } : e));
    }, [setEntries]);

    const reorderTags = useCallback((newTags: Tag[]) => {
        setTags(newTags);
    }, []);

    return (
        <TagContext.Provider value={{
            tags,
            addTag,
            removeTag,
            renameTag,
            reorderTags,
            setTags
        }}>
            {children}
        </TagContext.Provider>
    );
};

export const useTagContext = () => {
    const context = useContext(TagContext);
    if (context === undefined) {
        throw new Error('useTagContext must be used within a TagProvider');
    }
    return context;
};
