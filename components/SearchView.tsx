
import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useZenContext } from '../contexts/ZenContext';
import EntryRow from './EntryRow';

interface SearchViewProps {
  onSelect: (id: string) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onSelect }) => {
  const { entries, tags, updateEntry } = useZenContext();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();
    
    // Search priority: Title/Content match -> Tag match
    return entries.filter(e => {
        // Exclude ghosts/virtual entries from search if necessary, 
        // but checking e.id usually handles real entries. 
        // We filter mainly on content and type.
        if (e.type === 'weekly-review' && !e.content) return false;
        
        return e.content.toLowerCase().includes(lowerQ) || 
               e.tag.toLowerCase().includes(lowerQ) ||
               e.type.toLowerCase().includes(lowerQ);
    }).sort((a, b) => {
        // Sort by date (newest first) or created time
        const dateA = a.date || a.createdAt;
        const dateB = b.date || b.createdAt;
        return dateB.localeCompare(dateA);
    });
  }, [entries, query]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 h-full flex flex-col animate-in fade-in duration-200">
       <div className="relative mb-6 shrink-0">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
         <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, notes, projects..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 text-lg transition-all shadow-sm placeholder:text-stone-400"
            autoFocus
         />
         {query && (
           <button 
             onClick={() => setQuery('')} 
             className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
           >
             <X size={18} />
           </button>
         )}
       </div>
       
       <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-20 md:pb-0">
         {results.map(entry => (
           <EntryRow 
             key={entry.id} 
             entry={entry} 
             tags={tags} 
             isSelected={false} 
             onToggle={(id) => updateEntry(id, { status: entry.status === 'todo' ? 'done' : 'todo' })}
             onSelect={onSelect}
             onMoveToTomorrow={() => {}} // No-op for search view
             onUpdate={updateEntry}
           />
         ))}
         
         {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-stone-400 space-y-2">
               <Search size={40} className="opacity-20" />
               <p>No results found for "{query}"</p>
            </div>
         )}
         
         {!query && (
            <div className="flex flex-col items-center justify-center mt-20 text-stone-300 space-y-2">
               <Search size={40} className="opacity-10" />
               <p>Type to search your journal...</p>
            </div>
         )}
       </div>
    </div>
  );
};

export default SearchView;
