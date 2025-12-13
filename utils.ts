
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

export const INITIAL_ENTRIES: Entry[] = [
  { id: '1', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'event', content: '10:00 AM Team Sync\n\nDiscuss Q2 Roadmap', status: 'todo', tag: 'Work', recurrence: 'weekly', priority: 3 },
  { id: '2', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Finalize Q1 Financial Report', status: 'done', tag: 'Work', priority: 4 },
  { id: '3', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Printer is out of ink', status: 'todo', tag: 'Office', priority: 1 },
  { id: '4', createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], type: 'task', content: 'Leg day at gym', status: 'todo', tag: 'Health', recurrence: 'daily', priority: 2 },
  { id: '5', createdAt: new Date().toISOString(), date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'task', content: 'Send contract draft to client', status: 'todo', tag: 'Work', priority: 3 },
  { id: '6', createdAt: new Date().toISOString(), date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'event', content: 'Lunch with Sarah', status: 'todo', tag: 'Life', priority: 2 },
  { id: '7', createdAt: new Date().toISOString(), date: new Date(Date.now() - 86400000).toISOString().split('T')[0], type: 'task', content: 'Buy groceries', status: 'done', tag: 'Life', priority: 2 },
  { id: '8', createdAt: new Date().toISOString(), date: new Date(Date.now() - 172800000).toISOString().split('T')[0], type: 'task', content: 'Old overdue task', status: 'todo', tag: 'Work', priority: 4 },
  { id: '10', createdAt: new Date().toISOString(), date: null, type: 'task', content: 'Read that new book', status: 'todo', tag: 'Inbox', priority: 1 },
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


export const getStartOfWeek = (date: Date, startOnMonday = false): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // If startOnMonday is true: Mon(1)-Sun(0). We want to go back to Monday.
  // diff = d.getDate() - day + (day === 0 ? -6 : 1); // This logic was for Monday start? Wait.
  // If day is Monday (1), diff should be 0.
  // d.getDate() - day + 1. 1 - 1 + 1 = 1. Correct.
  // If day is Sunday (0), diff should be -6.
  // d.getDate() - 0 + (-6) = d.getDate() - 6. Correct.
  // So the OLD logic "day === 0 ? -6 : 1" was ALREADY assuming Monday start?
  // Let's re-verify.
  // Standard getDay(): Sun 0, Mon 1, ... Sat 6.
  // To get Sunday start:
  // We want to subtract 'day'. Sun(0) -> -0. Mon(1) -> -1.

  if (startOnMonday) {
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  } else {
    // Sunday start
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
};

export const getWeekDays = (date: Date, startOnMonday = false) => {
  const start = getStartOfWeek(date, startOnMonday);
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
};

export const getMonthDays = (date: Date, startOnMonday = false) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  // Calculate padding days
  // If startOnMonday: Mon(1) needs 0 padding. Sun(0) needs 6 padding.
  // If startOnSunday: Sun(0) needs 0 padding. Mon(1) needs 1 padding.

  let paddingCount = 0;
  const dayOfWeek = firstDay.getDay(); // 0-6 Sun-Sat

  if (startOnMonday) {
    paddingCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  } else {
    paddingCount = dayOfWeek;
  }

  for (let i = 0; i < paddingCount; i++) {
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
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

export const parseNaturalLanguageDate = (input: string): string | null => {
  const text = input.trim();
  const today = new Date();

  // 1. Relative Days
  if (text === '今天') return getISODate(today);
  if (text === '明天') return getISODate(addDays(today, 1));
  if (text === '后天') return getISODate(addDays(today, 2));

  // 2. Weekdays
  const weekDayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };

  // Match "周X" or "星期X" (This week / Next coming)
  const weekMatch = text.match(/^(?:周|星期)([一二三四五六日天])$/);
  if (weekMatch) {
    const targetDay = weekDayMap[weekMatch[1]];
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7; // If today is Tuesday (2) and target is Monday (1), diff is -1. Next Monday is +6. If today is Monday(1) and target is Monday(1), diff is 0, assume next week (+7) or today? "周一" strictly usually means "This coming Monday". If today is Monday, "周一" might mean "Next Monday" or "Today". Let's assume "This coming" (so if passed, next week).
    // Actually common usage: If today is Mon, "周一" is today. If today is Tue, "周一" is next Mon? Or was it yesterday? "周一" usually implies future in todo apps.
    // Logic: Find the *next* occurrence of this day.
    if (diff < 0) diff += 7; // If target < current, add 7.
    // If diff == 0, it is today.
    return getISODate(addDays(today, diff));
  }

  // Match "下周X" or "下星期X"
  const nextWeekMatch = text.match(/^下(?:周|星期)([一二三四五六日天])$/);
  if (nextWeekMatch) {
    const targetDay = weekDayMap[nextWeekMatch[1]];
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    // Add 7 more days for "Next Week"
    return getISODate(addDays(today, diff + 7));
  }

  // 3. Specific Date "M月D日"
  const dateMatch = text.match(/^(\d+)月(\d+)日$/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const currentYear = today.getFullYear();

    // Create date for current year
    const targetDate = new Date(currentYear, month - 1, day);

    // If date has passed, assume next year? Or stick to current year?
    // Todo apps usually assume "future".
    if (targetDate < today && getISODate(targetDate) !== getISODate(today)) {
      targetDate.setFullYear(currentYear + 1);
    }
    return getISODate(targetDate);
  }

  return null;
};

export const extractDateFromText = (text: string): { dateStr: string, cleanText: string } | null => {
  const today = new Date();
  let dateStr = '';
  let matchedString = '';

  // Helper to get date string
  const getISO = getISODate;

  // 1. Specific Date "M月D日"
  const dateRegex = /(\d+)月(\d+)日/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const currentYear = today.getFullYear();
    const targetDate = new Date(currentYear, month - 1, day);
    if (targetDate < today && getISO(targetDate) !== getISO(today)) {
      targetDate.setFullYear(currentYear + 1);
    }
    dateStr = getISO(targetDate);
    matchedString = dateMatch[0];
  }

  // 2. Relative Days
  if (!dateStr) {
    const relRegex = /(今天|明天|后天)/;
    const relMatch = text.match(relRegex);
    if (relMatch) {
      matchedString = relMatch[0];
      if (matchedString === '今天') dateStr = getISO(today);
      else if (matchedString === '明天') dateStr = getISO(addDays(today, 1));
      else if (matchedString === '后天') dateStr = getISO(addDays(today, 2));
    }
  }

  // 3. Weekdays
  if (!dateStr) {
    const weekRegex = /(下)?(?:周|星期)([一二三四五六日天])/;
    const weekMatch = text.match(weekRegex);
    if (weekMatch) {
      matchedString = weekMatch[0];
      const isNextWeek = !!weekMatch[1]; // "下"
      const dayChar = weekMatch[2];
      const weekDayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
      const targetDay = weekDayMap[dayChar];

      const currentDay = today.getDay();
      let diff = targetDay - currentDay;

      let forwardDiff = (targetDay - currentDay + 7) % 7;
      if (forwardDiff === 0) forwardDiff = 7;

      if (isNextWeek) {
        forwardDiff += 7;
      }

      diff = forwardDiff;

      dateStr = getISO(addDays(today, diff));
    }
  }

  if (dateStr && matchedString) {
    const cleanText = text.replace(matchedString, '').replace(/\s{2,}/g, ' ').trim();
    return { dateStr, cleanText };
  }

  return null;
};
