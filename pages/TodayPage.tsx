import React, { useMemo, useState } from 'react';
import {
    ChevronLeft, ChevronRight, RotateCcw, Settings, Sparkles, Inbox, FolderKanban, BookOpen, Search
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useZenContext } from '../contexts/ZenContext';
import { Entry } from '../types';
import { formatDate, getISODate, addDays, getTagStyles, generateGhostEntries } from '../utils';

import InlineCreator from '../components/InlineCreator';
import ProjectCard from '../components/ProjectCard';
import EntryRow from '../components/EntryRow';
import DynamicIcon from '../components/DynamicIcon';

interface TodayPageProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    activeTagFilter: string | null;
    onClearTagFilter: () => void;
    onSelectEntry: (id: string) => void;
    onOpenAIModal: () => void;
    onOpenSettings: () => void;
    onOpenSearch: () => void;

    // Navigation for mobile "Back" 
    onBack?: () => void;

    // Navigation helpers for Mobile Lists view
    onNavigate: (tab: string, tag?: string | null) => void;
    isMobileListsView?: boolean;
}

export const TodayPage: React.FC<TodayPageProps> = ({
    currentDate,
    onDateChange,
    activeTagFilter,
    onClearTagFilter,
    onSelectEntry,
    onOpenAIModal,
    onOpenSettings,
    onOpenSearch,
    onBack,
    onNavigate,
    isMobileListsView = false
}) => {
    const { entries, tags, addEntry, updateEntry, showToast } = useZenContext();
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null); // Local state for selection highlighting

    // Computed data
    const dateKey = getISODate(currentDate);
    const todayKey = getISODate(new Date());

    const viewEntries = useMemo(() => {
        let result: Entry[] = [];

        // 1. Tag Filter (including Inbox)
        if (activeTagFilter) {
            result = entries.filter(e => e.tag === activeTagFilter);
            result = result.filter(e => e.type !== 'weekly-review');
        }
        // 2. Today's View
        else {
            if (dateKey === todayKey) {
                result = entries.filter(e => {
                    if (!e.date) return false;
                    const isToday = e.date === dateKey;
                    const isOverdue = e.date < dateKey && e.status === 'todo';
                    return isToday || isOverdue;
                });
            } else {
                result = entries.filter(e => e.date === dateKey);
                if (dateKey > todayKey) {
                    const [y, m, d] = dateKey.split('-').map(Number);
                    const viewDateObj = new Date(y, m - 1, d);
                    const ghosts = generateGhostEntries(entries, viewDateObj, viewDateObj);
                    result = [...result, ...ghosts];
                }
            }
            result = result.filter(e => e.type !== 'weekly-review');
        }

        // Filter out Subtasks
        result = result.filter(e => !e.parentId);

        // Sort Logic
        return result.sort((a, b) => {
            const pA = a.priority || 2;
            const pB = b.priority || 2;
            if (pA !== pB) return pB - pA;

            if (!activeTagFilter && dateKey === todayKey) {
                const dateA = a.date || '';
                const dateB = b.date || '';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
            }

            if (!a.date && !b.date) return 0;
            if (!a.date) return -1;
            if (!b.date) return 1;

            return 0;
        });

    }, [entries, dateKey, activeTagFilter, todayKey]);

    // Separate Projects/Tasks
    const { projectEntries, taskEntries } = useMemo(() => {
        const p = viewEntries.filter(e => e.type === 'project');
        const t = viewEntries.filter(e => e.type !== 'project');
        return { projectEntries: p, taskEntries: t };
    }, [viewEntries]);

    // Grouping for List View
    const isListView = !!activeTagFilter;
    const groupedEntries = useMemo(() => {
        if (!isListView) return {};
        const groups: Record<string, Entry[]> = {};
        taskEntries.forEach(e => {
            const key = e.date || 'Unscheduled';
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return groups;
    }, [taskEntries, isListView]);

    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedEntries).sort((a, b) => {
            if (a === 'Unscheduled') return -1;
            if (b === 'Unscheduled') return 1;
            return a.localeCompare(b);
        });
    }, [groupedEntries]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleToggleEntry = (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;
        const newStatus = entry.status === 'todo' ? 'done' : 'todo';
        updateEntry(id, { status: newStatus });
    };

    const handleAddSubtask = (projectId: string, content: string) => {
        addEntry({
            content, type: 'task', status: 'todo', tag: 'Work',
            date: null, parentId: projectId, priority: 2
        });
    };

    const handleMoveToTomorrow = (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;
        const baseDate = entry.date ? new Date(entry.date) : new Date();
        const nextDay = getISODate(addDays(baseDate, 1));
        updateEntry(id, { date: nextDay });
        showToast('Moved to tomorrow');
    };

    const handleMoveToToday = (id: string) => {
        updateEntry(id, { date: todayKey });
        showToast('Moved to today');
    };

    const inboxCount = entries.filter(e => e.tag === 'Inbox' && e.status === 'todo' && e.type !== 'weekly-review' && !e.parentId).length;

    const changeDate = (days: number) => {
        onDateChange(addDays(currentDate, days));
    };


    // --- Render Mobile Lists Menu ---
    if (isMobileListsView) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
                    <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Collection</h1>
                </header>
                <div className="p-6 space-y-2 flex-1 overflow-y-auto">
                    <button onClick={onOpenSearch} className="w-full flex items-center gap-3 p-3 mb-4 bg-stone-100 text-stone-500 rounded-xl">
                        <Search size={18} />
                        <span className="font-medium">Search...</span>
                    </button>

                    <button onClick={() => onNavigate('today', 'Inbox')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                        <div className="flex items-center gap-3">
                            <Inbox size={20} className="text-stone-500" />
                            <span className="font-medium">Inbox</span>
                        </div>
                        {inboxCount > 0 && <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full text-xs font-bold">{inboxCount}</span>}
                    </button>
                    <button onClick={() => onNavigate('projects')} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                        <FolderKanban size={20} className="text-stone-500" />
                        <span className="font-medium">Projects</span>
                    </button>
                    <button onClick={() => onNavigate('reviews')} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                        <BookOpen size={20} className="text-stone-500" />
                        <span className="font-medium">Weekly</span>
                    </button>
                    <div className="h-px bg-stone-100 my-2 mx-2"></div>
                    {tags.map(tag => (
                        <button key={tag.name} onClick={() => onNavigate('today', tag.name)} className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98]">
                            <DynamicIcon name={tag.icon} size={20} className={`opacity-60 ${getTagStyles(tag.name, tags).split(' ')[1]}`} />
                            <span className="font-medium">{tag.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Render Main View ---
    return (
        <div className="flex-1 flex flex-col h-full bg-paper">
            {/* Header */}
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
                <div className="flex items-center gap-4">
                    {/* Mobile Back Button if filter active */}
                    {activeTagFilter && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-stone-200 text-stone-600">
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {!activeTagFilter ? (
                        <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">
                            {formatDate(currentDate)}
                        </h1>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${getTagStyles(activeTagFilter, tags)}`}>
                                #{activeTagFilter}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!activeTagFilter && (
                        <div className="flex items-center gap-4">
                            {dateKey !== todayKey && (
                                <button onClick={() => onDateChange(new Date())} className="p-2 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors" title="Back to Today">
                                    <RotateCcw size={18} />
                                </button>
                            )}
                            <div className="flex gap-2">
                                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-stone-200 rounded-full text-stone-600 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={() => changeDate(1)} className="p-2 hover:bg-stone-200 rounded-full text-stone-600 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex md:hidden items-center gap-1">
                        <button onClick={onOpenAIModal} className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors">
                            <Sparkles size={20} />
                        </button>
                        <button onClick={onOpenSettings} className="p-2 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0">
                <div className="px-6 pb-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <InlineCreator
                        onSubmit={addEntry}
                        activeDate={dateKey}
                        activeTag={activeTagFilter}
                    />

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={() => { }}
                    >
                        <SortableContext items={viewEntries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            {!isListView ? (
                                <div className="space-y-4">
                                    {viewEntries.length === 0 && <div className="text-center py-10 text-stone-400 italic">No entries for today. Enjoy the calm.</div>}

                                    <div className="space-y-2">
                                        {projectEntries.length > 0 && (
                                            <div className="mb-4 space-y-3">
                                                {projectEntries.map(entry => {
                                                    const subtasks = entries.filter(e => e.parentId === entry.id);
                                                    return <ProjectCard key={entry.id} project={entry} subtasks={subtasks} tags={tags} onAddSubtask={handleAddSubtask} onUpdateEntry={updateEntry} onToggleEntry={handleToggleEntry} onSelectEntry={onSelectEntry} currentDate={currentDate} isSortable={true} />;
                                                })}
                                            </div>
                                        )}
                                        {taskEntries.map(entry => (
                                            <EntryRow key={entry.id} entry={entry} tags={tags} isSelected={selectedEntryId === entry.id} onToggle={handleToggleEntry} onSelect={onSelectEntry} onMoveToTomorrow={handleMoveToTomorrow} onMoveToToday={handleMoveToToday} onUpdate={updateEntry} currentDate={currentDate} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {projectEntries.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 pl-1">Projects</h3>
                                            <div className="space-y-3">
                                                {projectEntries.map(entry => {
                                                    const subtasks = entries.filter(e => e.parentId === entry.id);
                                                    return <ProjectCard key={entry.id} project={entry} subtasks={subtasks} tags={tags} onAddSubtask={handleAddSubtask} onUpdateEntry={updateEntry} onToggleEntry={handleToggleEntry} onSelectEntry={onSelectEntry} currentDate={currentDate} isSortable={true} />;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {sortedGroupKeys.map(dKey => (
                                        <div key={dKey}>
                                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 pl-1">
                                                {dKey === 'Unscheduled' ? 'Inbox / Unscheduled' : new Date(dKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </h3>
                                            <div className="space-y-2">
                                                {groupedEntries[dKey].map(entry => (
                                                    <EntryRow key={entry.id} entry={entry} tags={tags} isSelected={selectedEntryId === entry.id} onToggle={handleToggleEntry} onSelect={onSelectEntry} onMoveToTomorrow={handleMoveToTomorrow} onMoveToToday={dKey === 'Unscheduled' ? handleMoveToToday : undefined} onUpdate={updateEntry} currentDate={currentDate} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {viewEntries.length === 0 && <div className="text-center py-10 text-stone-400 italic">No entries found in this list.</div>}
                                </div>
                            )}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
};
