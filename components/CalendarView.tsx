
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getMonthDays, getISODate, generateGhostEntries, getPriorityLabel, getPriorityColor, getTagStyles } from '../utils';
import { Entry, Tag } from '../types';
import { useZenContext } from '../contexts/ZenContext';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CalendarViewProps {
  currentDate: Date;
  entries: Entry[];
  tags: Tag[];
  onChangeMonth: (increment: number) => void;
  onSelectDate: (date: Date) => void;
  onSetDate?: (date: Date) => void;
}



const DraggableCalendarEntry = ({ entry, children, disabled }: { entry: Entry, children: React.ReactNode, disabled?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cal-entry-${entry.id}`,
    disabled: disabled || (entry as any).isGhost // Disable dragging for ghost entries
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Hide original when dragging to avoid duplications
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="w-full flex-shrink-0">
      {children}
    </div>
  );
};

const DroppableCalendarDay = ({ dateIso, children, className }: { dateIso: string, children: React.ReactNode, className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cal-day-${dateIso}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-stone-50 rounded-lg z-10' : ''}`}
    >
      {children}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onChangeMonth,
  onSelectDate,
  onSetDate
}) => {
  const { entries, tags, preferences } = useZenContext();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const monthDays = useMemo(() => getMonthDays(currentDate, preferences.startWeekOnMonday), [currentDate, preferences.startWeekOnMonday]);

  // Generate Ghost Entries for recurring tasks using shared utility
  const allDisplayEntries = useMemo(() => {
    // Determine the range of the view
    const validDays = monthDays.filter(d => d !== null) as Date[];
    if (validDays.length === 0) return entries;

    const startOfMonth = validDays[0];
    const endOfMonth = validDays[validDays.length - 1];

    const ghosts = generateGhostEntries(entries, startOfMonth, endOfMonth);

    // Merge real and ghost entries
    const combined = [...entries, ...ghosts];

    // Filter out weekly-review from calendar
    const filtered = combined.filter(e => e.type !== 'weekly-review');

    // Sort by Priority (High to Low), then by order
    return filtered.sort((a, b) => (b.priority || 2) - (a.priority || 2));

  }, [entries, monthDays]);

  const weekDayHeaders = useMemo(() => {
    return preferences.startWeekOnMonday
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  }, [preferences.startWeekOnMonday]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(pickerYear);
    newDate.setMonth(monthIndex);
    // Use onSetDate if available to stay in calendar view, otherwise just close picker
    if (onSetDate) onSetDate(newDate);
    else {
      // Fallback manual calc if onSetDate not passed (legacy compat)
      const diff = (pickerYear - currentDate.getFullYear()) * 12 + (monthIndex - currentDate.getMonth());
      onChangeMonth(diff);
    }
    setIsPickerOpen(false);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    // Added pb-20 on mobile to prevent content from being covered by fixed bottom nav
    <div className="bg-paper h-full flex flex-col relative select-none">
      <div className="flex justify-between items-center px-4 md:px-0 shrink-0 bg-paper z-10 pt-safe md:py-4">
        <button
          onClick={() => {
            setPickerYear(currentDate.getFullYear());
            setIsPickerOpen(!isPickerOpen);
          }}
          className="font-bold text-2xl text-ink font-hand tracking-wide flex items-center gap-2 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          <ChevronDown size={20} className={`transition-transform duration-200 ${isPickerOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => onChangeMonth(-1)} className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => onChangeMonth(1)} className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Quick Picker Overlay */}
      {isPickerOpen && (
        <div className="absolute inset-0 bg-paper/95 backdrop-blur-sm z-20 flex flex-col animate-in fade-in duration-200">
          <div className="px-4 pb-4 pt-safe md:pt-4 border-b border-stone-200/60 flex items-center justify-center gap-6 bg-paper shadow-sm shrink-0">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="p-2 hover:bg-stone-200/50 rounded-full transition-colors text-stone-500 hover:text-ink"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-2xl font-bold font-hand tracking-widest text-ink">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              className="p-2 hover:bg-stone-200/50 rounded-full transition-colors text-stone-500 hover:text-ink"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4 content-start bg-paper">
            {monthNames.map((m, idx) => (
              <button
                key={m}
                onClick={() => handleMonthSelect(idx)}
                className={`p-4 rounded-2xl text-lg font-bold transition-all duration-200 ${currentDate.getMonth() === idx && currentDate.getFullYear() === pickerYear
                  ? 'bg-ink text-white shadow-lg transform scale-105'
                  : 'bg-white border border-stone-200/60 text-stone-600 shadow-sm hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-stone-200/60 bg-paper">
            <button
              onClick={() => setIsPickerOpen(false)}
              className="w-full py-3.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-0 shrink-0 mb-2">
        {weekDayHeaders.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-xs font-bold text-stone-400 bg-paper py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 flex-1 min-h-0 bg-paper overflow-y-auto pb-24 md:pb-0">
        {monthDays.map((day, i) => {
          if (!day) return <div key={i} className="bg-paper" />;
          const dayIso = getISODate(day);

          const dayEntries = allDisplayEntries.filter(e => e.date === dayIso);
          const isToday = dayIso === getISODate(new Date());

          return (
            <DroppableCalendarDay
              key={i}
              dateIso={day ? getISODate(day) : `empty-${i}`}
              className={`bg-paper p-1 hover:bg-stone-100 cursor-pointer transition-colors relative flex flex-col items-center justify-start gap-1 overflow-hidden h-28 ${!day ? 'invisible' : ''}`}
            >
              <div
                className="w-full h-full flex flex-col items-center"
                onClick={() => day && onSelectDate(day)}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-ink text-white shadow-sm' : 'text-stone-500'}`}>
                  {day?.getDate()}
                </span>

                <div className="flex flex-col gap-0.5 w-full overflow-hidden mt-1">
                  {dayEntries.slice(0, 5).map((e, idx) => {
                    const isGhost = (e as any).isGhost;
                    const priority = e.priority || 2;

                    return (
                      <DraggableCalendarEntry key={e.id} entry={e} disabled={isMobile}>
                        <div className={`text-[10px] px-1 rounded-md truncate w-full flex-shrink-0 flex items-center gap-1 border ${getTagStyles(e.tag, tags)} ${e.status !== 'todo' ? 'opacity-50 line-through' : ''} ${isGhost ? 'opacity-60 border-dashed' : 'border-transparent'}`}>
                          {getPriorityLabel(priority).length >= 3 && (
                            <span className={`${getPriorityColor(priority)} text-[8px] leading-none`}>{getPriorityLabel(priority)}</span>
                          )}
                          {e.content}
                        </div>
                      </DraggableCalendarEntry>
                    );
                  })}
                  {dayEntries.length > 5 && (
                    <div className="text-[9px] text-stone-400 pl-1">
                      +{dayEntries.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </DroppableCalendarDay>
          );
        })}
      </div>
    </div >
  );
};

export default CalendarView;
