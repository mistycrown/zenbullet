
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Settings, Sparkles, Inbox, FolderKanban, BookOpen, X, Search } from 'lucide-react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { Entry } from './types';
import { formatDate, getISODate, addDays, getTagStyles, getStartOfWeek, generateGhostEntries } from './utils';

import { useZenContext, ToastDisplay } from './contexts/ZenContext';
import Sidebar from './components/Sidebar';
import WeeklyView from './components/WeeklyView';
import ResizableRightSidebar from './components/ResizableRightSidebar';
import MobileNav from './components/MobileNav';
import EntryCreatorModal from './components/EntryCreatorModal';
import AIEntryCreatorModal from './components/AIEntryCreatorModal';
import InlineCreator from './components/InlineCreator';
import EntryRow from './components/EntryRow';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import EntryDetails from './components/EntryDetails';
import ProjectView from './components/ProjectView';
import ProjectCard from './components/ProjectCard';
import DynamicIcon from './components/DynamicIcon';
import SearchView from './components/SearchView';

const REVIEW_SEPARATOR = '\n\n--- REVIEW SECTION ---\n\n';

export default function App() {
  // Use Context
  const { 
    entries, 
    tags, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    showToast,
    // Note: We don't need updateTag/deleteTag here anymore as SettingsView handles them
  } = useZenContext();

  const [activeTab, setActiveTab] = useState('today');
  const [settingsView, setSettingsView] = useState<'root' | 'ai' | 'tags' | 'prefs' | 'data'>('root');
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  
  // State for Weekly Focus expansion
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Computed data
  const dateKey = getISODate(currentDate);
  const todayKey = getISODate(new Date());
  
  const viewEntries = useMemo(() => {
    let result: Entry[] = [];

    // 1. Tag Filter (including Inbox)
    if (activeTagFilter) {
       result = entries.filter(e => e.tag === activeTagFilter);
       // EXCLUDE weekly-review
       result = result.filter(e => e.type !== 'weekly-review');
    } 
    // 2. Today's View (ActiveTab == today, No Filter)
    else if (activeTab === 'today') {
       if (dateKey === todayKey) {
          result = entries.filter(e => {
            if (!e.date) return false; 
            const isToday = e.date === dateKey;
            const isOverdue = e.date < dateKey && e.status === 'todo';
            return isToday || isOverdue;
          });
       } else {
          // Future or Past Date
          result = entries.filter(e => e.date === dateKey);

          // Inject Ghost Entries if viewing a future date
          if (dateKey > todayKey) {
             const [y, m, d] = dateKey.split('-').map(Number);
             const viewDateObj = new Date(y, m - 1, d);
             const ghosts = generateGhostEntries(entries, viewDateObj, viewDateObj);
             result = [...result, ...ghosts];
          }
       }
       // Filter out Weekly Reviews from the Daily Log
       result = result.filter(e => e.type !== 'weekly-review');
    }

    // Filter out Subtasks (parentId exists) from top-level lists
    // Note: Project Parents (type='project') will remain here and be rendered as cards.
    result = result.filter(e => !e.parentId);

    // Sort Logic
    return result.sort((a, b) => {
       const pA = a.priority || 2;
       const pB = b.priority || 2;
       if (pA !== pB) return pB - pA;

       if (activeTab === 'today' && dateKey === todayKey) {
          const dateA = a.date || '';
          const dateB = b.date || '';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
       }

       if (!a.date && !b.date) return 0;
       if (!a.date) return -1;
       if (!b.date) return 1;

       return 0;
    });

  }, [entries, dateKey, activeTagFilter, activeTab, todayKey]);

  // Separate Projects and Tasks for the List View
  const { projectEntries, taskEntries } = useMemo(() => {
     const p = viewEntries.filter(e => e.type === 'project');
     const t = viewEntries.filter(e => e.type !== 'project');
     return { projectEntries: p, taskEntries: t };
  }, [viewEntries]);

  const isListView = !!activeTagFilter;
  
  const groupedEntries = useMemo(() => {
    if (!isListView) return {};
    const groups: Record<string, Entry[]> = {};
    taskEntries.forEach(e => {
      // Group by date or 'Unscheduled'
      const key = e.date || 'Unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [taskEntries, isListView]);

  // Sort keys so Unscheduled comes first, then dates
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => {
      if (a === 'Unscheduled') return -1;
      if (b === 'Unscheduled') return 1;
      return a.localeCompare(b);
    });
  }, [groupedEntries]);

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return entries.find(e => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  // Handlers
  const handleToggleEntry = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const newStatus = entry.status === 'todo' ? 'done' : 'todo';
    updateEntry(id, { status: newStatus });
  };
  
  const handleSelectEntry = (id: string) => {
      const entry = entries.find(e => e.id === id);
      if (entry && entry.type === 'weekly-review') return;
      setSelectedEntryId(id);
  };
  
  const handleAddSubtask = (projectId: string, content: string) => {
    addEntry({
      content,
      type: 'task',
      status: 'todo',
      tag: 'Work',
      date: null,
      parentId: projectId,
      priority: 2
    });
  };

  const handleCreateWeeklyReview = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const dateStr = getISODate(startOfWeek);
    const exists = entries.find(e => e.type === 'weekly-review' && e.date === dateStr);
    if (!exists) {
        addEntry({
            date: dateStr,
            type: 'weekly-review',
            content: '',
            status: 'todo',
            tag: 'Inbox', 
            priority: 2
        });
    }
  };

  const handleNavigateToReviews = (entryId: string) => {
     setActiveTab('reviews');
     setActiveTagFilter(null);
     setExpandedReviewId(entryId);
  };

  const changeDate = (days: number) => {
    setCurrentDate(prev => addDays(prev, days));
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
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

  // Note: Drag and Drop currently just reorders visuals locally in some libraries,
  // but here we might want to persist order. The current implementation 
  // passed reorder logic to setEntries. Since context manages entries, 
  // reordering requires a context method or simply updating entries fully.
  // For now, we will assume strict sorting by priority/date/created, 
  // so visual drag reorder might just update priority under the hood in a real app.
  // We'll simplisticly skip implementing manual reorder persistence in this refactor 
  // unless we add a 'sortOrder' field. 
  // We will temporarily allow visual drag but it won't save order if we rely on sort logic.
  const handleDragEnd = (event: DragEndEvent) => {
    // Implementing reorder with a store that enforces sort logic is tricky.
    // For this refactor, we acknowledge DnD is visual only if sort logic overrides it.
  };

  const handleBack = () => {
    if (activeTab === 'settings' && settingsView !== 'root') {
      setSettingsView('root');
      return;
    }
    if (activeTagFilter) {
      setActiveTagFilter(null);
      setActiveTab('lists');
    } else if (activeTab === 'lists' || activeTab === 'projects' || activeTab === 'reviews' || activeTab === 'search') {
      setActiveTab('today');
    } else if (activeTab === 'settings') {
      setActiveTab('today');
    }
  };
  
  // Weekly Focus Helpers
  const reviewsList = entries.filter(e => e.type === 'weekly-review').sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  const expandedReview = reviewsList.find(r => r.id === expandedReviewId);
  const [reviewPlan, reviewSummary] = useMemo(() => {
     if (!expandedReview) return ['', ''];
     const parts = (expandedReview.content || '').split(REVIEW_SEPARATOR);
     return [parts[0] || '', parts[1] || ''];
  }, [expandedReview]);

  const handleUpdateReviewContent = (type: 'plan' | 'summary', text: string) => {
      if (!expandedReview) return;
      const newContent = type === 'plan' 
          ? `${text}${REVIEW_SEPARATOR}${reviewSummary}`
          : `${reviewPlan}${REVIEW_SEPARATOR}${text}`;
      updateEntry(expandedReview.id, { content: newContent });
  };


  const isMobileHeaderVisible = !((activeTab === 'calendar' || activeTab === 'week') && window.innerWidth < 768);

  const getHeaderTitle = () => {
    if (activeTab === 'search') return 'Search';
    if (activeTab === 'settings') {
      switch(settingsView) {
        case 'ai': return 'AI Configuration';
        case 'tags': return 'Collection Management';
        case 'prefs': return 'Preferences';
        case 'data': return 'Import / Export';
        default: return 'Settings';
      }
    }
    if (activeTab === 'calendar') return 'Calendar';
    if (activeTab === 'week') return 'Weekly'; 
    if (activeTab === 'projects') return 'Projects';
    if (activeTab === 'reviews') return 'Weekly'; 
    if (activeTab === 'lists' && !activeTagFilter) return 'Collection'; 
    return formatDate(currentDate);
  };

  const isNestedSettings = activeTab === 'settings' && settingsView !== 'root';
  const shouldShowBackButton = activeTagFilter || isNestedSettings || activeTab === 'projects' || activeTab === 'reviews' || activeTab === 'search' || (activeTab === 'lists' && !activeTagFilter);
  const hideBackButtonOnDesktop = !isNestedSettings;
  const inboxCount = entries.filter(e => e.tag === 'Inbox' && e.status === 'todo' && e.type !== 'weekly-review' && !e.parentId).length;

  return (
    <div className="flex h-screen bg-paper overflow-hidden font-sans select-none relative">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        activeTag={activeTagFilter}
        onTagChange={setActiveTagFilter}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col relative min-w-0">
          <header className={`shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10 ${!isMobileHeaderVisible ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center gap-4">
              {shouldShowBackButton && (
                <button 
                  onClick={handleBack}
                  className={`p-2 -ml-2 rounded-lg hover:bg-stone-200 text-stone-600 ${hideBackButtonOnDesktop ? 'md:hidden' : ''}`}
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {!activeTagFilter && activeTab !== 'lists' && (
                <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">
                  {getHeaderTitle()}
                </h1>
              )}

              {activeTab === 'lists' && !activeTagFilter && (
                 <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Collection</h1>
              )}

              {activeTagFilter && (
                 <div className="flex items-center gap-2">
                   <span className={`text-sm font-bold px-3 py-1 rounded-full ${getTagStyles(activeTagFilter, tags)}`}>
                     #{activeTagFilter}
                   </span>
                 </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {activeTab === 'today' && !activeTagFilter && (
                <div className="flex items-center gap-4">
                   {dateKey !== todayKey && (
                     <button 
                       onClick={() => setCurrentDate(new Date())}
                       className="p-2 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
                       title="Back to Today"
                     >
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
                 {activeTab !== 'settings' && (
                   <button 
                      onClick={() => setIsAIModalOpen(true)}
                      className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                    >
                      <Sparkles size={20} />
                   </button>
                 )}
                 {activeTab !== 'settings' && activeTab !== 'calendar' && activeTab !== 'week' && (
                   <button 
                     onClick={() => { setActiveTab('settings'); setActiveTagFilter(null); }}
                     className="p-2 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
                   >
                      <Settings size={20} />
                   </button>
                 )}
              </div>
            </div>
          </header>

          <div className={`flex-1 overflow-y-auto no-scrollbar md:pb-0 ${activeTab === 'calendar' ? 'pb-0' : 'pb-24'}`}>
            
            {activeTab === 'lists' && !activeTagFilter && (
              <div className="p-6 space-y-2 md:hidden">
                {/* Mobile Search Entry Point */}
                <button
                  onClick={() => setActiveTab('search')}
                  className="w-full flex items-center gap-3 p-3 mb-4 bg-stone-100 text-stone-500 rounded-xl active:scale-[0.98] transition-transform"
                >
                  <Search size={18} />
                  <span className="font-medium">Search...</span>
                </button>

                <button
                  onClick={() => { setActiveTab('today'); setActiveTagFilter('Inbox'); }}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <Inbox size={20} className="text-stone-500" />
                    <span className="font-medium">Inbox</span>
                  </div>
                  {inboxCount > 0 && (
                     <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full text-xs font-bold">{inboxCount}</span>
                  )}
                </button>
                <button
                   onClick={() => setActiveTab('projects')}
                   className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-transform"
                >
                   <FolderKanban size={20} className="text-stone-500" />
                   <span className="font-medium">Projects</span>
                </button>
                 <button
                   onClick={() => setActiveTab('reviews')}
                   className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-transform"
                >
                   <BookOpen size={20} className="text-stone-500" />
                   <span className="font-medium">Weekly</span>
                </button>
                <div className="h-px bg-stone-100 my-2 mx-2"></div>
                {tags.map(tag => (
                   <button
                     key={tag.name}
                     onClick={() => { setActiveTab('today'); setActiveTagFilter(tag.name); }}
                     className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-transform"
                   >
                     <DynamicIcon name={tag.icon} size={20} className={`opacity-60 ${getTagStyles(tag.name, tags).split(' ')[1]}`} />
                     <span className="font-medium">{tag.name}</span>
                   </button>
                ))}
              </div>
            )}

            {activeTab === 'today' && (
              <div className="px-6 pb-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <InlineCreator 
                   onSubmit={addEntry} 
                   activeDate={dateKey}
                   activeTag={activeTagFilter} 
                />

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={viewEntries.map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {!isListView ? (
                      <div className="space-y-4">
                        {viewEntries.length === 0 && (
                           <div className="text-center py-10 text-stone-400 italic">
                             No entries for today. Enjoy the calm.
                           </div>
                        )}
                        
                        <div className="space-y-2">
                           {/* Separate Projects from Tasks in display */}
                           {projectEntries.length > 0 && (
                              <div className="mb-4 space-y-3">
                                 {projectEntries.map(entry => {
                                     const subtasks = entries.filter(e => e.parentId === entry.id);
                                     return (
                                        <ProjectCard 
                                          key={entry.id}
                                          project={entry}
                                          subtasks={subtasks}
                                          tags={tags}
                                          onAddSubtask={handleAddSubtask}
                                          onUpdateEntry={updateEntry}
                                          onToggleEntry={handleToggleEntry}
                                          onSelectEntry={handleSelectEntry}
                                          currentDate={currentDate}
                                          isSortable={true}
                                        />
                                     );
                                 })}
                              </div>
                           )}

                           {taskEntries.map((entry) => (
                             <EntryRow 
                               key={entry.id} 
                               entry={entry} 
                               tags={tags}
                               isSelected={selectedEntryId === entry.id}
                               onToggle={handleToggleEntry}
                               onSelect={handleSelectEntry}
                               onMoveToTomorrow={handleMoveToTomorrow}
                               onMoveToToday={handleMoveToToday}
                               onUpdate={updateEntry}
                               currentDate={currentDate}
                             />
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                         {/* Projects in List View - Rendered as a separate Group at top if they exist */}
                         {projectEntries.length > 0 && (
                            <div>
                               <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 pl-1">Projects</h3>
                               <div className="space-y-3">
                                  {projectEntries.map(entry => {
                                     const subtasks = entries.filter(e => e.parentId === entry.id);
                                     return (
                                        <ProjectCard 
                                          key={entry.id}
                                          project={entry}
                                          subtasks={subtasks}
                                          tags={tags}
                                          onAddSubtask={handleAddSubtask}
                                          onUpdateEntry={updateEntry}
                                          onToggleEntry={handleToggleEntry}
                                          onSelectEntry={handleSelectEntry}
                                          currentDate={currentDate}
                                          isSortable={true}
                                        />
                                     );
                                  })}
                               </div>
                            </div>
                         )}

                         {sortedGroupKeys.map(dateKey => (
                            <div key={dateKey}>
                               <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 pl-1">
                                 {dateKey === 'Unscheduled' ? 'Inbox / Unscheduled' : new Date(dateKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                               </h3>
                               <div className="space-y-2">
                                  {groupedEntries[dateKey].map(entry => (
                                    <EntryRow 
                                      key={entry.id} 
                                      entry={entry} 
                                      tags={tags}
                                      isSelected={selectedEntryId === entry.id}
                                      onToggle={handleToggleEntry}
                                      onSelect={handleSelectEntry}
                                      onMoveToTomorrow={handleMoveToTomorrow}
                                      onMoveToToday={dateKey === 'Unscheduled' ? handleMoveToToday : undefined}
                                      onUpdate={updateEntry}
                                      currentDate={currentDate}
                                    />
                                  ))}
                               </div>
                            </div>
                         ))}
                         {viewEntries.length === 0 && (
                            <div className="text-center py-10 text-stone-400 italic">
                              No entries found in this list.
                            </div>
                         )}
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'week' && (
               <WeeklyView 
                  entries={entries} 
                  tags={tags}
                  currentDate={currentDate} 
                  onDateClick={(d) => { setCurrentDate(d); setActiveTab('today'); }}
                  onToggle={handleToggleEntry}
                  onSelect={handleSelectEntry}
                  onAddGoal={handleCreateWeeklyReview}
                  onPrevWeek={() => changeDate(-7)}
                  onNextWeek={() => changeDate(7)}
                  onUpdateEntry={updateEntry}
                  onNavigateToReviews={handleNavigateToReviews}
                  onDeleteEntry={deleteEntry}
                  onAddEntry={addEntry}
               />
            )}

            {activeTab === 'calendar' && (
              <CalendarView 
                currentDate={currentDate}
                entries={entries}
                tags={tags}
                onChangeMonth={changeMonth}
                onSelectDate={(d) => { setCurrentDate(d); setActiveTab('today'); }}
                onSetDate={setCurrentDate}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                currentView={settingsView}
                onViewChange={setSettingsView}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectView 
                currentDate={currentDate}
              />
            )}
            
            {activeTab === 'search' && (
               <SearchView 
                 onSelect={handleSelectEntry}
               />
            )}

            {activeTab === 'reviews' && (
              <div className="p-6 max-w-4xl mx-auto min-h-full">
                 {!expandedReviewId ? (
                   // List View
                   <div className="grid gap-4 animate-in fade-in duration-300">
                      {reviewsList.length === 0 && (
                          <div className="text-center py-10 text-stone-400 italic">No reviews recorded yet.</div>
                      )}
                      {reviewsList.map(r => (
                         <div key={r.id} onClick={() => setExpandedReviewId(r.id)} className="bg-white p-4 rounded-xl border border-stone-100 hover:border-stone-300 cursor-pointer shadow-sm group">
                            <div className="flex justify-between items-start mb-2">
                               <div className="font-bold text-lg text-ink group-hover:text-blue-600 transition-colors flex-1">
                                  {r.customTitle || `Week of ${r.date}`}
                                </div>
                               {r.customTitle && (
                                  <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                     Week of {r.date}
                                  </span>
                               )}
                            </div>
                            <p className="text-stone-500 line-clamp-2 whitespace-pre-wrap text-sm">{r.content ? r.content.split(REVIEW_SEPARATOR)[0] : 'No content'}</p>
                         </div>
                      ))}
                   </div>
                 ) : (
                   // Expanded Editor View
                   <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-right duration-300">
                      <button 
                        onClick={() => setExpandedReviewId(null)}
                        className="flex items-center gap-2 text-stone-500 hover:text-ink mb-4 font-medium self-start"
                      >
                         <ChevronLeft size={18} /> Back to List
                      </button>
                      
                      {expandedReview && (
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-stone-100 bg-stone-50">
                               <input
                                  type="text"
                                  value={expandedReview.customTitle || ''}
                                  onChange={(e) => updateEntry(expandedReview.id, { customTitle: e.target.value })}
                                  placeholder={`Focus for Week of ${expandedReview.date}`}
                                  className="text-lg font-bold font-hand text-ink bg-transparent border-none outline-none placeholder:text-stone-300 w-full"
                               />
                               {!expandedReview.customTitle && <p className="text-xs text-stone-400 mt-1">Tap title to rename</p>}
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-6">
                                {/* Plan Section */}
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Plan / Focus</label>
                                    <textarea 
                                        value={reviewPlan}
                                        onChange={(e) => handleUpdateReviewContent('plan', e.target.value)}
                                        placeholder="What are your main goals this week?"
                                        className="w-full flex-1 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-300 resize-none font-sans"
                                    />
                                </div>
                                {/* Review Section */}
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Review / Summary</label>
                                    <textarea 
                                        value={reviewSummary}
                                        onChange={(e) => handleUpdateReviewContent('summary', e.target.value)}
                                        placeholder="How did it go? Wins? Improvements?"
                                        className="w-full flex-1 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-300 resize-none font-sans"
                                    />
                                </div>
                           </div>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            )}
          </div>
        </main>

        <ResizableRightSidebar 
           entry={selectedEntry}
           entries={entries}
           tags={tags}
           currentDate={currentDate}
           onClose={() => setSelectedEntryId(null)}
           onUpdate={updateEntry}
           onDelete={deleteEntry}
           onDateChange={setCurrentDate}
           onToggle={handleToggleEntry}
           onSelect={handleSelectEntry}
           onAddGoal={handleCreateWeeklyReview}
           onNavigateToReviews={handleNavigateToReviews}
           onCreate={addEntry} 
        />

      </div>

      <MobileNav 
        activeTab={activeTab} 
        onTabChange={(t) => { setActiveTab(t); if(t !== 'today') setActiveTagFilter(null); }}
        onAdd={() => setIsModalOpen(true)}
      />

      <ToastDisplay />

      <EntryCreatorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addEntry}
        activeDate={dateKey}
        tags={tags}
      />
      
      <AIEntryCreatorModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onBatchAdd={(newEntries) => {
            // Context batchAddEntries
            const { batchAddEntries } = useZenContext();
            batchAddEntries(newEntries);
        }}
        tags={tags}
        currentDate={currentDate}
      />

      {selectedEntry && (
         <div className="md:hidden fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-200">
            <EntryDetails 
              entry={selectedEntry} 
              entries={entries}
              tags={tags}
              onClose={() => setSelectedEntryId(null)}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              onCreate={addEntry}
              onToggleSidebar={() => setSelectedEntryId(null)}
            />
         </div>
      )}
    </div>
  );
}
