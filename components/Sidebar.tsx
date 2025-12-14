import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox, LayoutGrid, Calendar as CalendarIcon, Search, Settings, ChevronLeft, ChevronRight, Sparkles, FolderKanban, BookOpen, Upload, Download } from 'lucide-react';
import { getTagStyles } from '../utils';
import DynamicIcon from './DynamicIcon';
import { useZenContext } from '../contexts/ZenContext';

interface SidebarProps {
  onOpenAIModal?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenAIModal
}) => {
  const { tags, entries, upload, download, isSyncing } = useZenContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const inboxCount = entries.filter(e => e.tag === 'Inbox' && e.status === 'todo' && e.type !== 'weekly-review' && !e.parentId).length;

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentTag = location.pathname.startsWith('/collection/') ? decodeURIComponent(location.pathname.split('/collection/')[1]) : null;

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-paper z-20 shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20 px-2' : 'w-64 px-6'
        } py-6 pt-safe`}
    >
      <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <img src="/icon.png" alt="ZenBullet" className="w-8 h-8 rounded-lg shrink-0" />
        {!isCollapsed && <h1 className="text-xl font-bold tracking-tight text-ink whitespace-nowrap overflow-hidden">ZenBullet</h1>}
      </div>

      <div className="mb-6">
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Views</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={upload}
                disabled={isSyncing}
                className={`p-1 rounded hover:bg-blue-50 transition-colors ${isSyncing ? 'text-blue-400' : 'text-stone-400 hover:text-blue-600'}`}
                title="上传到云端"
              >
                <Upload size={14} />
              </button>
              <button
                onClick={download}
                disabled={isSyncing}
                className={`p-1 rounded hover:bg-stone-100 transition-colors ${isSyncing ? 'text-blue-400' : 'text-stone-400 hover:text-ink'}`}
                title="从云端下载"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        )}
        <nav className="space-y-1">
          <button
            onClick={() => navigate('/collection/Inbox')}
            className={`w-full flex items-center rounded-xl transition-colors text-sm font-medium ${isActive('/collection/Inbox')
              ? 'bg-white shadow-sm text-ink'
              : 'text-stone-500 hover:bg-white/60 hover:text-stone-700'
              } ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5 justify-between'}`}
            title="Inbox"
          >
            <div className="flex items-center gap-3">
              <Inbox size={18} />
              {!isCollapsed && <span>Inbox</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                {inboxCount > 0 && <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full">{inboxCount}</span>}
                {onOpenAIModal && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenAIModal(); }}
                    className="p-1 rounded hover:bg-purple-50 text-purple-600 hover:text-purple-700 transition-colors"
                    title="Smart Add"
                  >
                    <Sparkles size={16} />
                  </button>
                )}
              </div>
            )}
            {isCollapsed && inboxCount > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full"></div>
            )}
          </button>

          {[
            { path: '/', icon: LayoutGrid, label: 'Today', exact: true },
            { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
            { path: '/projects', icon: FolderKanban, label: 'Projects' },
            { path: '/reviews', icon: BookOpen, label: 'Weekly' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 rounded-xl transition-colors text-sm font-medium ${isActive(item.path, item.exact) && !currentTag
                ? 'bg-white shadow-sm text-ink'
                : 'text-stone-500 hover:bg-white/60 hover:text-stone-700'
                } ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'}`}
              title={item.label}
            >
              <item.icon size={18} />
              {!isCollapsed && item.label}
            </button>
          ))}


        </nav>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Collection</h3>
            <button
              onClick={() => navigate('/search')}
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
                onClick={() => navigate(`/collection/${encodeURIComponent(tag.name)}`)}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors text-sm ${currentTag === tag.name ? 'bg-white shadow-sm text-ink font-medium' : 'text-stone-500 hover:bg-white/60'
                  } ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'}`}
                title={tag.name}
              >
                <DynamicIcon name={tag.icon} size={16} className={currentTag === tag.name ? 'text-ink' : iconColorClass.replace('text-', 'text-opacity-60 text-')} />
                {!isCollapsed && tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 flex flex-col gap-2">
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 transition-colors w-full ${isCollapsed ? 'justify-center' : 'px-3'} ${isActive('/settings') ? 'text-ink font-bold' : 'text-stone-400 hover:text-ink'}`}
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
