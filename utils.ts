
import { Tag, TagColor, RecurrenceType, Entry } from './types';

export const TAG_COLORS: Record<TagColor, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  stone: 'bg-stone-200 text-stone-700 border-stone-300',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
};

export const INITIAL_TAGS: Tag[] = [
  { name: 'Work', color: 'blue', icon: 'Briefcase' },
  { name: 'Life', color: 'yellow', icon: 'Smile' },
  { name: 'Health', color: 'green', icon: 'Activity' },
  { name: 'Office', color: 'stone', icon: 'Building' },
  { name: 'Idea', color: 'purple', icon: 'Lightbulb' },
];

export const getTagStyles = (tagName: string, tags: Tag[]) => {
  if (tagName === 'Inbox') return 'bg-white text-stone-500 border-stone-200';
  if (tagName === 'Goal') return 'bg-orange-50 text-orange-600 border-orange-200';
  
  const tag = tags.find(t => t.name === tagName);
  const colorKey = tag?.color || 'stone';
  return TAG_COLORS[colorKey];
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// CRITICAL FIX: Use local time for date string generation to match calendar grid and user input
export const getISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const getWeekDays = (date: Date) => {
  const start = getStartOfWeek(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
};

export const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

export const getNextDate = (baseDate: string, recurrence: RecurrenceType): string => {
  // Fix specifically for timezones: treat input string as local date components
  const [y, m, d] = baseDate.split('-').map(Number);
  const date = new Date(y, m - 1, d); // Month is 0-indexed

  if (recurrence === 'daily') date.setDate(date.getDate() + 1);
  else if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
  else if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
  
  return getISODate(date);
};

/**
 * Generates "Ghost" entries for recurring tasks within a specific date range.
 * These are virtual entries that haven't been created in the database yet.
 */
export const generateGhostEntries = (entries: Entry[], startDate: Date, endDate: Date): (Entry & { isGhost?: boolean })[] => {
  const ghosts: (Entry & { isGhost?: boolean })[] = [];
  const activeRecurring = entries.filter(e => e.recurrence && e.status === 'todo' && e.date);
  
  const startISO = getISODate(startDate);
  const endISO = getISODate(endDate);

  activeRecurring.forEach(entry => {
    let cursorDate = entry.date!;
    // Start generating from the next occurrence
    cursorDate = getNextDate(cursorDate, entry.recurrence!);
    
    // Safety cap
    let safetyCounter = 0;
    
    while (cursorDate <= endISO && safetyCounter < 50) {
      // Check bounds
      if (cursorDate >= startISO) {
        // Check if user specified an end date for recurrence
        if (entry.recurrenceEnd && cursorDate > entry.recurrenceEnd) break;

        ghosts.push({
          ...entry,
          id: `ghost-${entry.id}-${cursorDate}`,
          date: cursorDate,
          isGhost: true,
          status: 'todo' // Ghosts are always todo
        });
      }
      
      cursorDate = getNextDate(cursorDate, entry.recurrence!);
      safetyCounter++;
    }
  });

  return ghosts;
};

export const getPriorityLabel = (level: number) => {
  switch (level) {
    case 4: return '!!!!';
    case 3: return '!!!';
    case 2: return '!!';
    default: return '!';
  }
};

export const getPriorityColor = (level: number) => {
  switch (level) {
    case 4: return 'text-red-600 font-black';
    case 3: return 'text-yellow-500 font-bold'; // Changed from orange to yellow
    case 2: return 'text-blue-500 font-medium';
    default: return 'text-stone-400 font-normal';
  }
};
