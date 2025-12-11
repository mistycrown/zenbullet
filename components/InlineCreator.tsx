
import React, { useState } from 'react';
import { Square, Circle, Minus, Plus } from 'lucide-react';
import { Entry, EntryType } from '../types';
import { extractDateFromText, formatDate } from '../utils';

interface InlineCreatorProps {
  onSubmit: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
  activeDate: string;
  activeTag: string | null;
}

const InlineCreator: React.FC<InlineCreatorProps> = ({
  onSubmit,
  activeDate,
  activeTag
}) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<EntryType>('task');
  const [detectedDate, setDetectedDate] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const contextTag = (activeTag && activeTag !== 'Inbox') ? activeTag : 'Inbox';

    // Logic: 
    // If activeTag is 'Inbox', date is null.
    // If activeTag is set (e.g. 'Work'), date is null (User requested "from list... default to no date").
    // If activeTag is null (Day View), use activeDate.
    // If activeTag is null (Day View), use activeDate.
    // However, if detectedDate (smart parse) is set, use it.
    const entryDate = detectedDate || (activeTag ? null : activeDate);

    onSubmit({
      date: entryDate,
      type,
      content,
      status: 'todo',
      tag: contextTag
    });
    setContent('');
    setDetectedDate(null);
  };

  const placeholderText = (activeTag && activeTag !== 'Inbox')
    ? `Add a new entry to #${activeTag}...`
    : (activeTag === 'Inbox' ? "Add to Inbox (Unscheduled)..." : "Add a new entry...");

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-stone-200 transition-colors focus-within:border-stone-400">
      <button
        type="button"
        onClick={() => setType(prev => prev === 'task' ? 'event' : prev === 'event' ? 'note' : 'task')}
        className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
        title="Click to toggle type"
      >
        {type === 'task' && <Square size={20} />}
        {type === 'event' && <Circle size={20} />}
        {type === 'note' && <Minus size={20} />}
      </button>
      <input
        type="text"
        value={content}
        onChange={(e) => {
          const val = e.target.value;
          const extracted = extractDateFromText(val);
          if (extracted && extracted.dateStr !== detectedDate) {
            setDetectedDate(extracted.dateStr);
            setContent(extracted.cleanText);
          } else {
            setContent(val);
          }
        }}
        placeholder={placeholderText}
        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-base placeholder:text-stone-300"
      />
      {detectedDate && (
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold whitespace-nowrap">
          📅 {formatDate(new Date(detectedDate))}
        </span>
      )}
      <button
        type="submit"
        disabled={!content.trim()}
        className="p-2 bg-ink text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors"
      >
        <Plus size={20} />
      </button>
    </form>
  );
}

export default InlineCreator;
