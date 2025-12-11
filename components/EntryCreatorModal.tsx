
import React, { useState, useEffect } from 'react';
import { X, Square, Circle, Minus, AlertCircle } from 'lucide-react';
import { Entry, EntryType, Tag } from '../types';
import CalendarSelect from './CalendarSelect';
import { getPriorityLabel, getPriorityColor } from '../utils';

interface EntryCreatorModalProps { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
  activeDate: string;
  tags: Tag[];
}

const EntryCreatorModal: React.FC<EntryCreatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  activeDate,
  tags
}) => {
  const [type, setType] = useState<EntryType>('task');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('Inbox');
  const [date, setDate] = useState(''); 
  const [priority, setPriority] = useState(2); // Default to Normal (2)

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setDate(''); 
      setPriority(2);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit({
      date: date || null,
      type,
      content,
      status: 'todo',
      tag,
      priority
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-end justify-center sm:p-6">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg font-hand">New Entry</h3>
          <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-ink" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(['task', 'event', 'note'] as EntryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  type === t 
                    ? 'bg-ink text-white' 
                    : 'bg-paper text-stone-500 hover:bg-stone-200'
                }`}
              >
                {t === 'task' && <Square size={16} />}
                {t === 'event' && <Circle size={16} />}
                {t === 'note' && <Minus size={16} />}
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <CalendarSelect 
                  value={date || null}
                  onChange={(d) => setDate(d || '')}
                  placeholder="No Date (Inbox)"
              />
            </div>
            
            <div className="flex bg-stone-50 rounded-lg p-1 border border-stone-200">
              {[1, 2, 3, 4].map((p) => (
                 <button
                   key={p}
                   type="button"
                   onClick={() => setPriority(p)}
                   className={`px-3 rounded text-xs font-bold transition-all ${priority === p ? 'bg-white shadow text-ink' : 'text-stone-400 hover:text-stone-600'}`}
                   title={`Priority ${p}`}
                 >
                    <span className={priority === p ? getPriorityColor(p) : ''}>{getPriorityLabel(p)}</span>
                 </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind?`}
            autoFocus
            className="w-full text-lg border-b-2 border-stone-100 pb-2 focus:border-stone-400 outline-none bg-transparent placeholder:text-stone-300 min-h-[80px] resize-none"
          />

          <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
            <button
                key="Inbox"
                type="button"
                onClick={() => setTag('Inbox')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  tag === 'Inbox'
                    ? 'bg-stone-800 text-white border-stone-800' 
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                }`}
              >
                #Inbox
            </button>
            {tags.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setTag(t.name)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  tag === t.name 
                    ? 'bg-stone-800 text-white border-stone-800' 
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>

          <button 
            type="submit" 
            className="w-full bg-ink text-white py-3.5 rounded-xl font-medium mt-4 active:scale-[0.98] transition-transform"
          >
            Add to Journal
          </button>
        </form>
      </div>
    </div>
  );
};

export default EntryCreatorModal;
