
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Entry, Tag } from '../types';
import EntryDetails from './EntryDetails';
import WeeklyView from './WeeklyView';
import { addDays } from '../utils';
import { PanelRightOpen } from 'lucide-react';

interface ResizableRightSidebarProps {
  entry: Entry | null;
  entries: Entry[];
  tags: Tag[];
  currentDate: Date;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Entry>) => void;
  onDelete: (id: string, mode?: 'single' | 'series') => void;
  onDateChange: (date: Date) => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddGoal: () => void;
  onNavigateToReviews: (entryId: string) => void;
  onCreate?: (entry: Omit<Entry, 'id' | 'createdAt'>) => void; // Added for creating subtasks via batch edit
  onDateClick?: (date: Date) => void;
}

const ResizableRightSidebar: React.FC<ResizableRightSidebarProps> = ({
  entry,
  entries,
  tags,
  currentDate,
  onClose,
  onUpdate,
  onDelete,
  onDateChange,
  onToggle,
  onSelect,
  onAddGoal,
  onNavigateToReviews,
  onCreate,
  onDateClick
}) => {
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-expand if an entry is selected to view details
  useEffect(() => {
    if (entry) {
      setIsCollapsed(false);
    }
  }, [entry]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <aside
      ref={sidebarRef}
      style={{ width: isCollapsed ? '3rem' : `${width}px` }}
      className={`hidden md:flex flex-col h-full bg-white border-l border-stone-200 shadow-xl lg:shadow-none relative shrink-0 transition-all duration-300 ${isCollapsed ? 'items-center py-4' : ''
        }`}
    >
      {/* Resizer Handle - Hide when collapsed */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-50 transition-colors group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-stone-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Expand Toggle Button - Only visible when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="z-40 text-stone-400 hover:text-ink transition-colors p-2 rounded-lg hover:bg-stone-100 mt-2"
          title="Expand Sidebar"
        >
          <PanelRightOpen size={20} />
        </button>
      )}

      {/* Content Container */}
      <div className={`flex-1 w-full overflow-hidden ${isCollapsed ? 'hidden' : 'block'}`}>
        {entry ? (
          <EntryDetails
            entry={entry}
            entries={entries} // Pass full list for batch editing context
            tags={tags}
            onClose={onClose}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreate={onCreate} // Pass create handler
            onToggleSidebar={() => setIsCollapsed(true)}
          />
        ) : (
          <div className={`h-full overflow-hidden ${width < 600 ? 'p-4' : 'p-8'}`}>
            <WeeklyView
              entries={entries}
              tags={tags}
              currentDate={currentDate}
              onDateClick={onDateClick || onDateChange}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddGoal={onAddGoal}
              onPrevWeek={() => onDateChange(addDays(currentDate, -7))}
              onNextWeek={() => onDateChange(addDays(currentDate, 7))}
              onToggleSidebar={() => setIsCollapsed(true)}
              onNavigateToReviews={onNavigateToReviews}
              onAddEntry={onCreate}
              onUpdateEntry={onUpdate}
              onDeleteEntry={onDelete}
              isCompact={width < 600}
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default ResizableRightSidebar;
