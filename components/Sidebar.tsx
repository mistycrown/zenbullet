
import React, { useState } from 'react';
import { Sun, Inbox, LayoutGrid, Calendar as CalendarIcon, Search, Settings, ChevronLeft, ChevronRight, Sparkles, FolderKanban, BookOpen } from 'lucide-react';
import { getTagStyles } from '../utils';
import DynamicIcon from './DynamicIcon';
import { useZenContext } from '../contexts/ZenContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (t: string) => void;
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  onOpenAIModal?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  activeTag, 
  onTagChange,
  onOpenAIModal
}) => {
  const { tags, entries } = useZenContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const inboxCount = entries.filter(e => e.tag === 'Inbox' && e.status === 'todo' && e.type !== 'weekly-review' && !e.parentId).length;

  return (
    <aside 
      className={`hidden md:flex flex-col h-full bg-white border-r border-stone-200 z-20 shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-20 px-2' : 'w-64 px-6'
      } py-6`}
    >
      <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center shrink-0">
          <Sun size={18} className="text-white" />
        </div>
        {!isCollapsed && <h1 className="text-xl font-bold tracking-tight text-ink whitespace-nowrap overflow-hidden">ZenBullet</h1>}
      </div>

      <div className="mb-6">
        {!isCollapsed && <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-3">Views</h3>}
        <nav className="space-y-1">
          <button
            onClick={() => { onTabChange('today'); onTagChange('Inbox'); }}
            className={`w-full flex items-center rounded-xl transition-colors text-sm font-medium ${
              activeTag === 'Inbox'
                ? 'bg-paper text-ink' 
                : 'text-stone-500 hover:bg-paper/50 hover:text-stone-700'
            } ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5 justify-between'}`}
            title="Inbox"
          >
            <div className="flex items-center gap-3">
               <Inbox size={18} />
               {!isCollapsed && <span>Inbox</span>}
            </div>
            {!isCollapsed && inboxCount > 0 && <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full">{inboxCount}</span>}
            {isCollapsed && inboxCount > 0 && (
               <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full"></div>
            )}
          </button>

          {[
            { id: 'today', icon: LayoutGrid, label: 'Today' },
            { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
            { id: 'projects', icon: FolderKanban, label: 'Projects' },
            { id: 'reviews', icon: BookOpen, label: 'Weekly' }, 
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); onTagChange(null); }}
              className={`w-full flex items-center gap-3 rounded-xl transition-colors text-sm font-medium ${
                activeTab === item.id && activeTag !== 'Inbox'
                  ? 'bg-paper text-ink' 
                  : 'text-stone-500 hover:bg-paper/50 hover:text-stone-700'
              } ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'}`}
              title={item.label}
            >
              <item.icon size={18} />
              {!isCollapsed && item.label}
            </button>
          ))}
          
          {/* AI Smart Add Button */}
          {onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className={`w-full flex items-center gap-3 rounded-xl transition-colors text-sm font-medium text-purple-600 hover:bg-purple-50 hover:text-purple-700 ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'}`}
              title="Smart Add"
            >
              <Sparkles size={18} />
              {!isCollapsed && <span>Smart Add</span>}
            </button>
          )}

        </nav>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-3 mb-2">
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Collection</h3>
             <button 
                onClick={() => { onTabChange('search'); onTagChange(null); }}
                className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-ink transition-colors"
                title="Search"
             >
                <Search size={14} />
             </button>
          </div>
        ) : (
          <div className="h-px w-full bg-stone-100 mb-4"></div>
        )}
        
        <div className="space-y-1">
          {tags.map(tag => {
            const styles = getTagStyles(tag.name, tags);
            const iconColorClass = styles.split(' ')[1]; // Extract text color
            
            return (
              <button
                key={tag.name}
                onClick={() => { onTabChange('today'); onTagChange(tag.name); }}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors text-sm ${
                  activeTag === tag.name ? 'bg-paper text-ink font-medium' : 'text-stone-500 hover:bg-stone-50'
                } ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'}`}
                title={tag.name}
              >
                <DynamicIcon name={tag.icon} size={16} className={activeTag === tag.name ? 'text-ink' : iconColorClass.replace('text-', 'text-opacity-60 text-')} />
                {!isCollapsed && tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-stone-100 flex flex-col gap-2">
        <button 
          onClick={() => { onTabChange('settings'); onTagChange(null); }}
          className={`flex items-center gap-3 transition-colors w-full ${isCollapsed ? 'justify-center' : 'px-3'} ${activeTab === 'settings' ? 'text-ink font-bold' : 'text-stone-400 hover:text-ink'}`}
        >
          <Settings size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 text-stone-300 hover:text-stone-500 transition-colors w-full mt-2 ${isCollapsed ? 'justify-center' : 'px-3'}`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
