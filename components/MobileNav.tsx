import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, CalendarDays, Plus, Calendar as CalendarIcon, List } from 'lucide-react';

interface MobileNavProps {
  onAdd: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onAdd }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname.startsWith('/tag/'));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-2 flex justify-between items-center z-40 pb-safe">
      <button
        onClick={() => navigate('/')}
        className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/') ? 'text-ink' : 'text-stone-400'}`}
      >
        <LayoutGrid size={22} />
        <span className="text-[10px] font-medium">Day</span>
      </button>
      <button
        onClick={() => navigate('/week')}
        className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/week') ? 'text-ink' : 'text-stone-400'}`}
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
        onClick={() => navigate('/calendar')}
        className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/calendar') ? 'text-ink' : 'text-stone-400'}`}
      >
        <CalendarIcon size={22} />
        <span className="text-[10px] font-medium">Month</span>
      </button>
      <button
        onClick={() => navigate('/collection')}
        className={`p-2 rounded-xl flex flex-col items-center gap-1 w-16 transition-colors ${isActive('/collection') ? 'text-ink' : 'text-stone-400'}`}
      >
        <List size={22} />
        <span className="text-[10px] font-medium">Lists</span>
      </button>
    </div>
  );
};

export default MobileNav;
