
import React, { useState } from 'react';
import { Square, Circle, Minus, Plus } from 'lucide-react';
import { Entry, EntryType } from '../types';

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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const contextTag = (activeTag && activeTag !== 'Inbox') ? activeTag : 'Inbox';
    
    // Logic: 
    // If activeTag is 'Inbox', date is null.
    // If activeTag is set (e.g. 'Work'), date is null (User requested "from list... default to no date").
    // If activeTag is null (Day View), use activeDate.
    const entryDate = activeTag ? null : activeDate;
    
    onSubmit({
      date: entryDate,
      type,
      content,
      status: 'todo',
      tag: contextTag
    });
    setContent('');
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
         onChange={(e) => setContent(e.target.value)}
         placeholder={placeholderText}
         className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-base placeholder:text-stone-300"
       />
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
