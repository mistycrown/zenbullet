import React, { useMemo, useState } from 'react';
import {
    Inbox, FolderKanban, BookOpen, Search
} from 'lucide-react';
import { useZenContext } from '../contexts/ZenContext';
import { getTagStyles } from '../utils';
import DynamicIcon from '../components/DynamicIcon';
import { useNavigate } from 'react-router-dom';

export const CollectionMenuPage: React.FC = () => {
    const { entries, tags } = useZenContext();
    const navigate = useNavigate();
    const inboxCount = entries.filter(e => e.tag === 'Inbox' && e.status === 'todo' && e.type !== 'weekly-review' && !e.parentId).length;

    return (
        <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
                <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Collection</h1>
            </header>
            <div className="p-6 space-y-2 flex-1 overflow-y-auto">
                <button onClick={() => navigate('/search')} className="w-full flex items-center gap-3 p-3 mb-4 bg-stone-100 text-stone-500 rounded-xl">
                    <Search size={18} />
                    <span className="font-medium">Search...</span>
                </button>

                <button onClick={() => navigate('/tag/Inbox')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                        <Inbox size={20} className="text-stone-500" />
                        <span className="font-medium">Inbox</span>
                    </div>
                    {inboxCount > 0 && <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full text-xs font-bold">{inboxCount}</span>}
                </button>
                <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                    <FolderKanban size={20} className="text-stone-500" />
                    <span className="font-medium">Projects</span>
                </button>
                <button onClick={() => navigate('/reviews')} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                    <BookOpen size={20} className="text-stone-500" />
                    <span className="font-medium">Weekly</span>
                </button>
                <div className="h-px bg-stone-100 my-2 mx-2"></div>
                {tags.map(tag => (
                    <button key={tag.name} onClick={() => navigate(`/tag/${encodeURIComponent(tag.name)}`)} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                        <DynamicIcon name={tag.icon} size={20} className={`opacity-60 ${getTagStyles(tag.name, tags).split(' ')[1]}`} />
                        <span className="font-medium">{tag.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
