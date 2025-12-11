
export type EntryType = 'task' | 'event' | 'note' | 'project' | 'weekly-review';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | null;
export type EntryStatus = 'todo' | 'done' | 'canceled';

export interface Entry {
  id: string;
  createdAt: string; // ISO Timestamp
  date: string | null; // YYYY-MM-DD or null for unscheduled
  type: EntryType;
  content: string; // Combined Title and Details
  status: EntryStatus;
  tag: string;
  recurrence?: RecurrenceType;
  recurrenceEnd?: string | null; // YYYY-MM-DD
  priority?: number; // 1 (Low) to 4 (Critical). Default 2.
  isGhost?: boolean; // Virtual entry for future recurring instances
  parentId?: string; // ID of the parent project if this is a subtask
  color?: TagColor; // Custom color for projects
  customTitle?: string; // User-defined title for special entries like Weekly Review
}

export type TagColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'stone' | 'teal' | 'pink';

export interface Tag {
  name: string;
  color: TagColor;
  icon?: string; // Icon name from Lucide library
}
