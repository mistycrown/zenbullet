
import React, { useState } from 'react';
import { CheckSquare, Square, XSquare, Circle, CheckCircle, XCircle, Minus, Repeat, CalendarPlus, Hash, FolderKanban, CalendarDays } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Entry, Tag } from '../types';
import { getTagStyles, getISODate, getPriorityLabel, getPriorityColor, getStartOfWeek, addDays, TAG_COLORS } from '../utils';

interface EntryRowProps {
  entry: Entry;
  tags: Tag[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onMoveToTomorrow: (id: string) => void;
  onMoveToToday?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Entry>) => void;
  currentDate?: Date; // Context date for Quick Schedule
  compact?: boolean;
  enableQuickSchedule?: boolean;
}

const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  tags,
  isSelected,
  onToggle,
  onSelect,
  onMoveToTomorrow,
  onMoveToToday,
  onUpdate,
  currentDate = new Date(),
  compact = false,
  enableQuickSchedule = false
}) => {
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [showQuickTag, setShowQuickTag] = useState(false);

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners
  } = useSortable({ id: entry.id, disabled: entry.isGhost });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = entry.status === 'done';
  const isCanceled = entry.status === 'canceled';
  const isOverdue = !isDone && !isCanceled && entry.date && entry.date < getISODate(new Date());

  const priority = entry.priority || 2;
  const isGhost = entry.isGhost;

  // Only display the first line of content in the list view, trimmed to remove trailing spaces
  const displayContent = entry.content.split('\n')[0].trim();

  const getIcon = () => {
    switch (entry.type) {
      case 'task':
        if (isCanceled) return <XSquare size={compact ? 16 : 20} className="text-stone-400" />;
        return isDone ?
          <CheckSquare size={compact ? 16 : 20} className="text-stone-400" /> :
          <Square size={compact ? 16 : 20} className={isGhost ? "text-stone-300" : "text-stone-600"} />;
      case 'event':
        if (isCanceled) return <XCircle size={compact ? 16 : 20} className="text-stone-400" />;
        return isDone ?
          <CheckCircle size={compact ? 16 : 20} className="text-stone-400" /> :
          <Circle size={compact ? 16 : 20} className={isGhost ? "text-stone-300" : "text-stone-600"} />;
      case 'note':
        return <Minus size={compact ? 16 : 20} className={isGhost ? "text-stone-300" : "text-stone-600"} />;
      case 'project':
        // Use custom color if available, otherwise default blue-ish
        const colorClass = entry.color ? TAG_COLORS[entry.color].split(' ')[1] : 'text-blue-500';
        return <FolderKanban size={compact ? 16 : 20} className={colorClass} />;
      default:
        return <Square size={compact ? 16 : 20} className={isGhost ? "text-stone-300" : "text-stone-600"} />;
    }
  };

  const handleQuickSchedule = (dayIndex: number) => {
    if (!onUpdate) return;
    const startOfWeek = getStartOfWeek(currentDate);
    const targetDate = addDays(startOfWeek, dayIndex);
    onUpdate(entry.id, { date: getISODate(targetDate) });
    setShowQuickSchedule(false);
  };

  const handleQuickTag = (tagName: string) => {
    if (!onUpdate) return;
    onUpdate(entry.id, { tag: tagName });
    setShowQuickTag(false);
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const renderActionButtons = () => (
    <div className={`flex items-center gap-1 ${compact ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-auto'}`}>
      {/* Quick Schedule */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowQuickSchedule(!showQuickSchedule); setShowQuickTag(false); }}
          className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 ${showQuickSchedule ? 'bg-stone-200 text-ink' : 'hover:bg-stone-100 text-stone-400 hover:text-ink'}`}
          title="Quick Schedule"
        >
          <CalendarPlus size={14} />
        </button>
        {showQuickSchedule && (
          <div
            className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-stone-200 rounded-lg p-1 flex gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {weekDays.map((d, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSchedule(idx)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-100 text-[10px] font-bold text-stone-600 hover:text-ink"
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tag (Only show if not compact, or if explicitly desired) */}
      {!compact && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowQuickTag(!showQuickTag); setShowQuickSchedule(false); }}
            className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 ${showQuickTag ? 'bg-stone-200 text-ink' : 'hover:bg-stone-100 text-stone-400 hover:text-ink'}`}
            title="Quick Collection"
          >
            <Hash size={14} />
          </button>
          {showQuickTag && (
            <div
              className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-stone-200 rounded-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100 min-w-[120px] grid grid-cols-1 gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => handleQuickTag('Inbox')} className="text-left px-2 py-1 text-xs hover:bg-stone-50 rounded">Inbox</button>
              {tags.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleQuickTag(t.name)}
                  className="text-left px-2 py-1 text-xs hover:bg-stone-50 rounded truncate"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Move Logic */}
      {isOverdue && onMoveToToday ? (
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToToday(entry.id); }}
          className="p-1 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold"
          title="Move to Today"
        >
          <CalendarDays size={14} /> Today
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(entry.id)}
      className={`group flex items-start gap-3 rounded-xl transition-all duration-200 cursor-pointer border relative ${compact ? 'p-2 mb-1 text-sm items-center' : 'p-3 mb-2'
        } ${isSelected
          ? 'bg-white border-stone-800 shadow-sm'
          : 'bg-white/50 hover:bg-white border-transparent hover:border-stone-200'
        } ${isDone || isCanceled ? 'opacity-60' : ''} ${isOverdue ? 'border-l-4 border-l-red-200' : ''} ${isGhost ? 'opacity-50 border-dashed border-stone-200' : ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); if (!isGhost) onToggle(entry.id); }}
        disabled={isGhost || entry.type === 'project'}
        className={`mt-0.5 transition-transform focus:outline-none flex-shrink-0 ${!isGhost && entry.type !== 'project' ? 'hover:scale-110' : 'cursor-default'}`}
      >
        {getIcon()}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* Main Text Container - flex-1 allows it to take space, inner spans flow inline */}
          <div className={`flex-1 font-medium leading-snug break-words ${isDone || isCanceled ? 'line-through text-stone-400' : 'text-ink'}`}>
            <span>{displayContent}</span>
            {compact && entry.date && (
              <span className="text-xs text-stone-400 font-normal whitespace-nowrap ml-2">
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {priority >= 3 && (
              <span className={`${getPriorityColor(priority)} tracking-tighter ml-1 whitespace-nowrap`}>{getPriorityLabel(priority)}</span>
            )}
          </div>

          {/* If compact and quick schedule enabled, show actions here */}
          {compact && enableQuickSchedule && !isDone && !isGhost && renderActionButtons()}

          {/* Repeat Icon */}
          {entry.recurrence && !compact && !isDone && (
            <Repeat size={14} className="text-stone-400 shrink-0 mt-1 ml-auto" />
          )}
        </div>

        {!compact && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap min-h-[20px]">
            {isOverdue && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                Overdue
              </span>
            )}
            {isGhost && (
              <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                Upcoming
              </span>
            )}
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${getTagStyles(entry.tag, tags)}`}>
              {entry.tag}
            </span>


            {/* Action Buttons for Normal View */}
            {!isGhost && !isDone && !isCanceled && renderActionButtons()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryRow;
