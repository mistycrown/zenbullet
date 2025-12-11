
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getMonthDays, getISODate, generateGhostEntries, getPriorityLabel, getPriorityColor, getTagStyles } from '../utils';
import { Entry, Tag } from '../types';

interface CalendarViewProps {
  currentDate: Date;
  entries: Entry[];
  tags: Tag[];
  onChangeMonth: (increment: number) => void;
  onSelectDate: (date: Date) => void;
  onSetDate?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  entries,
  tags,
  onChangeMonth,
  onSelectDate,
  onSetDate
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

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

    // Sort by Priority (High to Low), then by order
    return combined.sort((a, b) => (b.priority || 2) - (a.priority || 2));

  }, [entries, monthDays]);

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

  return (
    // Added pb-20 on mobile to prevent content from being covered by fixed bottom nav
    <div className="bg-white h-full flex flex-col overflow-hidden relative pb-20 md:pb-0 select-none">
      <div className="flex justify-between items-center p-4 shrink-0 bg-stone-50 border-b border-stone-100 z-10 pt-safe md:pt-4">
        <button
          onClick={() => {
            setPickerYear(currentDate.getFullYear());
            setIsPickerOpen(!isPickerOpen);
          }}
          className="font-bold text-lg text-ink flex items-center gap-2 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors"
        >
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          <ChevronDown size={16} className={`transition-transform duration-200 ${isPickerOpen ? 'rotate-180' : ''}`} />
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
        <div className="absolute top-[69px] left-0 right-0 bottom-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col animate-in fade-in duration-200">
          <div className="p-4 border-b border-stone-100 flex items-center justify-center gap-6 bg-white">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="p-2 hover:bg-stone-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-xl font-bold font-mono">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              className="p-2 hover:bg-stone-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4 content-start">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m, idx) => (
              <button
                key={m}
                onClick={() => handleMonthSelect(idx)}
                className={`p-4 rounded-xl text-lg font-medium transition-all ${currentDate.getMonth() === idx && currentDate.getFullYear() === pickerYear
                  ? 'bg-ink text-white shadow-lg scale-105'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-200 hover:scale-105'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-stone-100 bg-white">
            <button
              onClick={() => setIsPickerOpen(false)}
              className="w-full py-3 bg-stone-100 text-stone-600 font-medium rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-px bg-stone-100 shrink-0">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-stone-400 bg-white py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-stone-100 flex-1 min-h-0">
        {monthDays.map((day, i) => {
          if (!day) return <div key={i} className="bg-white" />;
          const dayIso = getISODate(day);

          const dayEntries = allDisplayEntries.filter(e => e.date === dayIso);
          const isToday = dayIso === getISODate(new Date());

          return (
            <div
              key={i}
              onClick={() => onSelectDate(day)}
              className={`bg-white p-1 hover:bg-stone-50 cursor-pointer transition-colors relative flex flex-col items-start justify-start gap-1 overflow-hidden`}
            >
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-ink text-white shadow-sm' : 'text-stone-500'}`}>
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                {dayEntries.slice(0, 5).map((e, idx) => {
                  const isGhost = (e as any).isGhost;
                  const priority = e.priority || 2;

                  return (
                    <div key={idx} className={`text-[10px] px-1 rounded-md truncate w-full flex-shrink-0 flex items-center gap-1 border ${getTagStyles(e.tag, tags)} ${e.status !== 'todo' ? 'opacity-50 line-through' : ''} ${isGhost ? 'opacity-60 border-dashed' : 'border-transparent'}`}>
                      {getPriorityLabel(priority).length >= 3 && (
                        <span className={`${getPriorityColor(priority)} text-[8px] leading-none`}>{getPriorityLabel(priority)}</span>
                      )}
                      {e.content}
                    </div>
                  );
                })}
                {dayEntries.length > 5 && (
                  <div className="text-[9px] text-stone-400 pl-1">
                    +{dayEntries.length - 5}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
