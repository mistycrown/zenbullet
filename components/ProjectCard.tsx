
import React, { useState } from 'react';
import { Entry, Tag } from '../types';
import { ChevronDown, ChevronRight, FolderKanban, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EntryRow from './EntryRow';
import { getTagStyles, TAG_COLORS } from '../utils';

interface ProjectCardProps {
  project: Entry;
  subtasks: Entry[];
  tags: Tag[];
  onAddSubtask: (projectId: string, content: string) => void;
  onUpdateEntry: (id: string, updates: Partial<Entry>) => void;
  onToggleEntry: (id: string) => void;
  onSelectEntry: (id: string) => void;
  currentDate: Date;
  isSortable?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  subtasks,
  tags,
  onAddSubtask,
  onUpdateEntry,
  onToggleEntry,
  onSelectEntry,
  currentDate,
  isSortable = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  const completedCount = subtasks.filter(e => e.status === 'done').length;
  const totalCount = subtasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // DnD Hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id, disabled: !isSortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    onAddSubtask(project.id, newSubtask);
    setNewSubtask('');
  };

  // Determine colors
  const iconColorClass = project.color ? TAG_COLORS[project.color].split(' ')[1] : 'text-blue-600';
  const iconBgClass = project.color ? TAG_COLORS[project.color].split(' ')[0] : 'bg-blue-50';
  const progressColorClass = project.color ? TAG_COLORS[project.color].split(' ')[1].replace('text-', 'bg-') : 'bg-blue-500';
  const borderColorClass = isDragging ? 'border-stone-400' : 'border-stone-200';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${borderColorClass} shadow-sm mb-3 transition-all overflow-hidden`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
            {/* Drag Handle & Toggle */}
            <div className="flex items-center gap-2 mt-0.5" {...attributes} {...listeners}>
               <button className="text-stone-400 hover:text-stone-600">
                 {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
               </button>
               <div className={`p-1.5 rounded-lg ${iconBgClass} ${iconColorClass}`}>
                 <FolderKanban size={18} />
               </div>
            </div>

            <div className="flex-1 min-w-0">
               {/* Header: Title and Tags */}
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                     <h3 className="font-bold text-ink text-lg truncate">{project.content.split('\n')[0]}</h3>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getTagStyles(project.tag, tags)}`}>
                        #{project.tag}
                     </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectEntry(project.id); }}
                    className="text-xs font-medium text-stone-400 hover:text-ink px-2 py-1 rounded hover:bg-stone-200 transition-colors"
                  >
                    Edit
                  </button>
               </div>

               {/* Progress Section */}
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-serif">Progress</span>
                  <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-400 font-mono">
                     <span>{progress}%</span>
                     <span className="w-px h-3 bg-stone-200 mx-1"></span>
                     <span>{completedCount} / {totalCount}</span>
                  </div>
               </div>
            </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50/30 p-3 pl-4 space-y-2 animate-in slide-in-from-top-1 duration-200">
            {subtasks.length === 0 && (
                <div className="text-xs text-stone-400 italic pl-10 py-2">No subtasks yet.</div>
            )}
            <div className="pl-2">
                {subtasks.map(task => (
                  <EntryRow 
                    key={task.id}
                    entry={task}
                    tags={tags}
                    isSelected={false}
                    onToggle={onToggleEntry}
                    onSelect={onSelectEntry}
                    onMoveToTomorrow={() => {}}
                    onUpdate={onUpdateEntry}
                    currentDate={currentDate}
                    compact={true}
                    enableQuickSchedule={true}
                  />
                ))}
            </div>
            
            <form onSubmit={handleAdd} className="flex gap-2 mt-2 pl-4">
              <input 
                type="text" 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs focus:border-stone-400 outline-none"
              />
              <button type="submit" className="p-2 bg-white border border-stone-200 rounded-lg text-stone-500 hover:text-ink hover:border-stone-400">
                <Plus size={14} />
              </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
