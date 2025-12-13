
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Square, XSquare, Circle, CheckCircle, XCircle, Minus, Repeat, PanelRightClose, RotateCcw, Pencil, Check, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Entry, Tag } from '../types';
import { getStartOfWeek, getWeekDays, getWeekNumber, getISODate, getTagStyles, generateGhostEntries, getPriorityLabel, getPriorityColor, addDays } from '../utils';

interface WeeklyViewProps {
  currentDate: Date;
  entries: Entry[];
  tags: Tag[];
  onDateClick: (date: Date) => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddGoal: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToggleSidebar?: () => void;
  onUpdateEntry?: (id: string, updates: Partial<Entry>) => void;
  onNavigateToReviews?: (entryId: string) => void;
  onDeleteEntry?: (id: string) => void;
  onAddEntry?: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
}

const REVIEW_SEPARATOR = '\n\n--- REVIEW SECTION ---\n\n';

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="text-sm text-stone-700 space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        const parseBold = (text: string) => {
          return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };

        const isUnordered = trimmed.startsWith('- ');
        const isOrdered = /^\d+\.\s/.test(trimmed);

        if (isUnordered) {
          const text = trimmed.replace(/^- /, '');
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-stone-400 mt-2 w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0 block"></span>
              <span className="flex-1 leading-relaxed">{parseBold(text)}</span>
            </div>
          );
        }

        if (isOrdered) {
          const match = trimmed.match(/^(\d+)\.\s/);
          const number = match ? match[1] : '1';
          const text = trimmed.replace(/^\d+\.\s/, '');
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-stone-400 font-mono text-xs mt-1 shrink-0 select-none">{number}.</span>
              <span className="flex-1 leading-relaxed">{parseBold(text)}</span>
            </div>
          );
        }

        return <div key={idx} className="min-h-[1.2em] leading-relaxed">{parseBold(line)}</div>;
      })}
    </div>
  );
};

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Helper for Droppable Day Column
const DroppableDay = ({ dateIso, children, className }: { dateIso: string, children: React.ReactNode, className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateIso}`,
  });

  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset rounded-lg transition-colors' : ''}`}>
      {children}
    </div>
  );
};

// Helper for Draggable Weekly Entry
const DraggableWeeklyEntry = ({ entry, children }: { entry: Entry, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    disabled: (entry as any).isGhost // Disable dragging for ghost entries
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentDate,
  entries,
  tags,
  onDateClick,
  onToggle,
  onSelect,
  onAddGoal,
  onPrevWeek,
  onNextWeek,
  onToggleSidebar,
  onUpdateEntry,
  onNavigateToReviews,
  onDeleteEntry,
  onAddEntry,
  isCompact = false
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekDays(currentDate);
  const weekNumber = getWeekNumber(currentDate);
  const year = currentDate.getFullYear();
  const weekStartIso = getISODate(weekDays[0]);
  const weekEndIso = getISODate(weekDays[6]);

  const today = new Date();
  const todayIso = getISODate(today);
  const isCurrentWeek = todayIso >= weekStartIso && todayIso <= weekEndIso;

  // Logic to merge real entries and ghost recurring entries
  const allWeekEntries = useMemo(() => {
    const ghosts = generateGhostEntries(entries, weekDays[0], weekDays[6]);
    return [...entries, ...ghosts];
  }, [entries, weekDays]);

  const weekEntries = allWeekEntries.filter(e => {
    if (!e.date) return false;
    return e.date >= weekStartIso && e.date <= weekEndIso;
  }).sort((a, b) => (b.priority || 2) - (a.priority || 2));

  const reviewEntry = entries.find(e => e.type === 'weekly-review' && e.date === weekStartIso);

  // Split content logic
  const planContent = useMemo(() => {
    if (!reviewEntry || !reviewEntry.content) return '';
    const parts = reviewEntry.content.split(REVIEW_SEPARATOR);
    return parts[0] || '';
  }, [reviewEntry]);

  const mobileStartStr = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mobileEndStr = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderIcon = (e: Entry) => {
    const isDone = e.status === 'done';
    const isCanceled = e.status === 'canceled';

    switch (e.type) {
      case 'task':
        if (isCanceled) return <XSquare size={18} className="text-stone-400" />;
        return isDone ? <CheckSquare size={18} /> : <Square size={18} />;
      case 'event':
        if (isCanceled) return <XCircle size={18} className="text-stone-400" />;
        return isDone ? <CheckCircle size={18} /> : <Circle size={18} />;
      case 'note':
        return <Minus size={18} />;
      default:
        return <Square size={18} />;
    }
  };

  const handleFocusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reviewEntry && onNavigateToReviews) {
      onNavigateToReviews(reviewEntry.id);
    } else if (!reviewEntry) {
      onAddGoal();
    }
  };

  const handleMoveEntry = (entry: Entry, direction: 'up' | 'down') => {
    if (!onUpdateEntry || !entry.date) return;
    const current = new Date(entry.date);
    // Up means previous day (-1), Down means next day (+1) in this list context
    const diff = direction === 'up' ? -1 : 1;
    const newDate = addDays(current, diff);
    onUpdateEntry(entry.id, { date: getISODate(newDate) });
  };

  const handleQuickAdd = (dateStr: string) => {
    if (!onAddEntry) return;
    onAddEntry({
      content: '',
      type: 'task',
      status: 'todo',
      tag: 'Inbox',
      date: dateStr,
      priority: 2
    });
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode: cleanup empty entries
      weekEntries.forEach(e => {
        const isGhost = (e as any).isGhost;
        if (!isGhost &&
          ['task', 'event', 'note'].includes(e.type) &&
          (!e.content || !e.content.trim())) {
          if (onDeleteEntry) onDeleteEntry(e.id);
        }
      });
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Floating Action Button for Edit Mode */}
      <button
        onClick={handleToggleEditMode}
        className={`fixed z-30 bottom-24 right-4 md:bottom-8 md:right-8 p-3 rounded-full shadow-lg hover:scale-105 transition-all ${isEditMode ? 'bg-blue-600 text-white' : 'bg-ink text-white'}`}
        title={isEditMode ? "Finish Editing" : "Quick Edit"}
      >
        {isEditMode ? <Check size={24} /> : <Pencil size={24} />}
      </button>

      <div className={`flex items-center justify-between mb-2 ${isCompact ? 'mb-2' : 'md:mb-4'} md:border-b md:border-stone-100 pb-2 ${isCompact ? 'pb-2' : 'md:pb-4'} px-4 md:px-0 pt-safe md:pt-0`}>
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden md:block text-stone-400 hover:text-ink p-1 rounded hover:bg-stone-100 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelRightClose size={20} />
            </button>
          )}
          <div className="hidden md:block">
            <h2 className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-ink`}>Week {weekNumber} of {year}</h2>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Weekly</span>
          </div>

          <div className="md:hidden flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-ink font-hand leading-none">
              {mobileStartStr} - {mobileEndStr}
            </h2>
            <span className="text-lg font-bold text-stone-300 font-hand">Week {weekNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button
              onClick={() => onDateClick(new Date())}
              className="p-1.5 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
              title="Back to Today"
            >
              <RotateCcw size={18} />
            </button>
          )}
          {!isCurrentWeek && <div className="w-px h-4 bg-stone-200 mx-1"></div>}
          <button onClick={onPrevWeek} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-ink">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onNextWeek} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-ink">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-0">

        {/* Weekly Entry Link Section */}
        <div className={`${isCompact ? 'pl-2' : 'md:pl-[4.5rem]'} md:pr-2 mb-2`}>
          {!reviewEntry ? (
            <button
              onClick={handleFocusClick}
              className="w-full text-left py-2 text-stone-400 text-sm italic hover:text-stone-500 transition-colors flex items-center gap-2"
            >
              <Plus size={14} /> Add Weekly Entry
            </button>
          ) : (
            <div
              onClick={handleFocusClick}
              className="w-full cursor-pointer hover:bg-stone-50 rounded-lg p-3 transition-colors group border border-transparent hover:border-stone-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider group-hover:text-stone-500">
                  {reviewEntry.customTitle || 'Weekly'}
                </span>
                <span className="text-xs text-stone-300 group-hover:text-blue-500 font-medium">Edit &rarr;</span>
              </div>
              <div className="pl-2 border-l-2 border-stone-200 group-hover:border-stone-300">
                {planContent ? (
                  <SimpleMarkdown content={planContent} />
                ) : (
                  <span className="text-stone-400 italic text-sm">Tap to write weekly focus...</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`my-2 border-b border-stone-100 border-dashed ${isCompact ? '' : 'md:ml-[4.5rem]'}`}></div>

        <div className="space-y-8 pb-20 md:pb-0">
          {weekDays.map(day => {
            const dayIso = getISODate(day);
            const isToday = dayIso === getISODate(new Date());

            const dayEntries = weekEntries.filter(e =>
              e.date === dayIso &&
              e.type !== 'weekly-review' &&
              e.type !== 'project'
            );

            return (
              <div key={dayIso} className={`flex ${isCompact ? 'gap-2' : 'gap-4 md:gap-6'} group`}>
                <div
                  onClick={() => onDateClick(day)}
                  className={`${isCompact ? 'w-8' : 'w-10 md:w-12'} flex flex-col items-center pt-1 cursor-pointer flex-shrink-0`}
                  title="Jump to this date"
                >
                  <span className={`text-xs font-bold uppercase mb-0.5 ${isToday ? 'text-blue-600' : 'text-stone-400'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                  </span>
                  <span className={`text-lg font-bold leading-none ${isToday ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-sm' : 'text-ink'}`}>
                    {day.getDate()}
                  </span>
                </div>

                <DroppableDay dateIso={dayIso} className="flex-1 space-y-3 pt-1 border-b border-stone-50 pb-6 last:border-0 min-w-0">
                  {dayEntries.length > 0 ? (
                    dayEntries.map(e => {
                      const isGhost = (e as any).isGhost;
                      const priority = e.priority || 2;

                      return (
                        <DraggableWeeklyEntry key={e.id} entry={e}>
                          <div
                            onClick={() => !isEditMode && onSelect(e.id)}
                            className={`flex items-start gap-3 ${isEditMode ? '' : 'cursor-pointer group/item'} ${isGhost ? 'opacity-70' : ''}`}
                          >
                            {/* Edit Mode Controls */}
                            {isEditMode && !isGhost ? (
                              <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                                <div className="flex flex-col gap-0.5">
                                  <button onClick={() => handleMoveEntry(e, 'up')} className="text-stone-300 hover:text-ink p-0.5 hover:bg-stone-100 rounded" title="Move to previous day"><ArrowUp size={14} /></button>
                                  <button onClick={() => handleMoveEntry(e, 'down')} className="text-stone-300 hover:text-ink p-0.5 hover:bg-stone-100 rounded" title="Move to next day"><ArrowDown size={14} /></button>
                                </div>
                                <input
                                  type="text"
                                  value={e.content}
                                  onChange={(ev) => onUpdateEntry && onUpdateEntry(e.id, { content: ev.target.value })}
                                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                                <button
                                  onClick={() => onDeleteEntry && onDeleteEntry(e.id)}
                                  className="text-stone-300 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); !isGhost && onToggle(e.id); }}
                                  className={`mt-0.5 text-stone-400 hover:text-ink transition-colors flex-shrink-0 ${isGhost ? 'cursor-default' : ''}`}
                                >
                                  {renderIcon(e)}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium leading-snug break-words ${e.status !== 'todo' ? 'line-through text-stone-300' : 'text-ink'}`}>
                                    <span>{e.content}</span>
                                    {priority >= 3 && (
                                      <span className={`${getPriorityColor(priority)} tracking-tighter ml-1`}>{getPriorityLabel(priority)}</span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTagStyles(e.tag, tags)}`}>
                                      #{e.tag.toLowerCase()}
                                    </span>
                                    {e.recurrence && (
                                      <div className="flex items-center gap-0.5 text-[10px] text-stone-400 bg-stone-50 px-1 rounded border border-stone-100">
                                        <Repeat size={10} />
                                        <span className="capitalize">{e.recurrence}</span>
                                      </div>
                                    )}
                                    {isGhost && <span className="text-[10px] text-stone-400 italic">(Upcoming)</span>}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </DraggableWeeklyEntry>
                      );
                    })
                  ) : (
                    !isEditMode && (
                      <div
                        onClick={() => onDateClick(day)}
                        className="h-6 flex items-center text-xs text-stone-300 hover:text-stone-400 cursor-pointer italic"
                      >
                        No entries
                      </div>
                    )
                  )}

                  {/* Quick Add Button in Edit Mode */}
                  {isEditMode && (
                    <button
                      onClick={() => handleQuickAdd(dayIso)}
                      className="w-full py-2 flex items-center justify-center gap-2 text-stone-400 hover:text-ink hover:bg-stone-50 rounded-lg border border-dashed border-stone-200 text-xs font-medium mt-2 transition-colors"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  )}
                </DroppableDay>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
