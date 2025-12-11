
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import { getMonthDays, getISODate, addDays } from '../utils';

interface CalendarSelectProps {
  value: string | null; // ISO string 'YYYY-MM-DD' or null
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  showShortcuts?: boolean;
}

const CalendarSelect: React.FC<CalendarSelectProps> = ({
  value,
  onChange,
  placeholder = "Unscheduled",
  className = "",
  showShortcuts = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // View date allows navigating months without changing the selection
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // For Portal Positioning
  const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);
  const portalId = React.useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the main container
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Check if click is inside the portal content (if open)
        const portalEl = document.getElementById(`calendar-select-portal-${portalId}`);
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', () => setIsOpen(false));

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [portalId]);

  // Calculate coordinates synchronously before paint to prevent "fly in"
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Use fixed positioning based on viewport coordinates
          setCoords({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      };

      updatePosition();

      // Capture scroll on window to update position as user scrolls, keeping it attached
      window.addEventListener('scroll', updatePosition, { capture: true });
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, { capture: true });
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setCoords(null);
    }
  }, [isOpen]);

  // Sync view date if value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleSelectDate = (date: Date) => {
    onChange(getISODate(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    onChange(getISODate(now));
    setViewDate(now);
    setIsOpen(false);
  };

  const handleQuickDate = (daysToAdd: number) => {
    const d = addDays(new Date(), daysToAdd);
    onChange(getISODate(d));
    setIsOpen(false);
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 bg-stone-50 hover:bg-stone-100 transition-colors rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-transparent focus:border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 ${value ? 'text-ink font-medium' : 'text-stone-400'}`}
        >
          <CalendarIcon size={16} className={value ? "text-stone-600" : "text-stone-400"} />
          <span className="truncate">{displayValue}</span>
        </button>


      </div>

      {isOpen && (
        <>
          {/* Mobile: Fixed Center Modal Overlay - Rendered in place, z-index handles it */}
          <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:hidden animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-ink">Select Date</h4>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-stone-100">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
              <CalendarContent
                viewDate={viewDate}
                value={value}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onSelectDate={handleSelectDate}
                onClear={handleClear}
                onJumpToToday={handleJumpToToday}
                setViewDate={setViewDate}
              />
            </div>
          </div>

          {/* Desktop: Portal Dropdown */}
          {window.innerWidth >= 768 && coords && createPortal(
            <div
              id={`calendar-select-portal-${portalId}`}
              style={{ top: coords.top, left: coords.left, position: 'fixed' }}
              className="bg-white rounded-xl shadow-xl border border-stone-100 z-[9999] p-4 min-w-[280px] animate-in fade-in zoom-in-95 duration-100"
            >
              <CalendarContent
                viewDate={viewDate}
                value={value}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onSelectDate={handleSelectDate}
                onClear={handleClear}
                onJumpToToday={handleJumpToToday}
                setViewDate={setViewDate}
              />
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

// Reusable Calendar Content with Year/Month Picker
const CalendarContent = ({ viewDate, value, onPrevMonth, onNextMonth, onSelectDate, onClear, onJumpToToday, setViewDate }: any) => {
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());

  const formattedHeader = `${viewDate.getFullYear()}/${String(viewDate.getMonth() + 1).padStart(2, '0')}`;

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(pickerYear);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    setIsYearPickerOpen(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Year/Month Picker Overlay */}
      {isYearPickerOpen && (
        <div className="absolute inset-0 bg-white z-10 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-center gap-6 mb-4">
            <button onClick={() => setPickerYear((y: number) => y - 1)} className="p-1 hover:bg-stone-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold font-mono">{pickerYear}</span>
            <button onClick={() => setPickerYear((y: number) => y + 1)} className="p-1 hover:bg-stone-100 rounded">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto content-start">
            {Array.from({ length: 12 }, (_, i) => i).map((m) => (
              <button
                key={m}
                onClick={() => handleMonthSelect(m)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${viewDate.getMonth() === m && viewDate.getFullYear() === pickerYear
                    ? 'bg-ink text-white'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
              >
                {m + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setIsYearPickerOpen(false)} className="mt-2 text-xs text-stone-400 hover:text-ink w-full text-center py-2">
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-ink transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => { setPickerYear(viewDate.getFullYear()); setIsYearPickerOpen(true); }}
          className="font-bold text-sm text-ink flex items-center gap-1 hover:bg-stone-100 px-2 py-1 rounded transition-colors"
        >
          {formattedHeader}
          <ChevronDown size={14} className="text-stone-400" />
        </button>
        <button onClick={onNextMonth} className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-ink transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-stone-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {getMonthDays(viewDate).map((day: Date | null, idx: number) => {
          if (!day) return <div key={idx} />;

          const dayIso = getISODate(day);
          const isSelected = value === dayIso;
          const isToday = dayIso === getISODate(new Date());

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`h-9 w-9 md:h-8 md:w-8 rounded-lg flex items-center justify-center text-xs transition-colors relative
                   ${isSelected ? 'bg-ink text-white font-bold shadow-md' : 'hover:bg-stone-100 text-stone-700'}
                   ${isToday && !isSelected ? 'text-blue-600 font-bold bg-blue-50' : ''}
                 `}
            >
              {day.getDate()}
              {isToday && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <button
          onClick={onClear}
          className="text-xs text-stone-400 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onJumpToToday}
          className="text-xs text-blue-600 hover:text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default CalendarSelect;
