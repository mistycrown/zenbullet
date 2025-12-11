
import React from 'react';
import { LayoutGrid, CalendarDays, Plus, Calendar as CalendarIcon, List } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (t: string) => void;
  onAdd: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onAdd }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-2 flex justify-between items-center z-40 pb-safe">
    <button 
      onClick={() => onTabChange('today')}
      className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'today' ? 'text-ink' : 'text-stone-400'}`}
    >
      <LayoutGrid size={22} />
      <span className="text-[10px] font-medium">Day</span>
    </button>
    <button 
      onClick={() => onTabChange('week')}
      className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'week' ? 'text-ink' : 'text-stone-400'}`}
    >
      <CalendarDays size={22} />
      <span className="text-[10px] font-medium">Week</span>
    </button>
    
    <button 
      onClick={onAdd}
      className="bg-ink text-white w-14 h-14 rounded-full -mt-8 shadow-lg shadow-stone-300 hover:scale-105 transition-transform active:scale-95 border-4 border-paper flex items-center justify-center z-50"
    >
      <Plus size={26} />
    </button>

    <button 
      onClick={() => onTabChange('calendar')}
      className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'calendar' ? 'text-ink' : 'text-stone-400'}`}
    >
      <CalendarIcon size={22} />
      <span className="text-[10px] font-medium">Month</span>
    </button>
    <button 
      onClick={() => onTabChange('lists')}
      className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'lists' ? 'text-ink' : 'text-stone-400'}`}
    >
      <List size={22} />
      <span className="text-[10px] font-medium">Lists</span>
    </button>
  </div>
);

export default MobileNav;
