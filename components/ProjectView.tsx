
import React, { useState } from 'react';
import { Entry } from '../types';
import ProjectCard from './ProjectCard';
import CustomSelect from './CustomSelect';
import { Tag as TagIcon } from 'lucide-react';
import { useZenContext } from '../contexts/ZenContext';

interface ProjectViewProps {
  currentDate: Date;
}

const ProjectView: React.FC<ProjectViewProps> = ({
  currentDate
}) => {
  const { entries, tags, addEntry, updateEntry, deleteEntry } = useZenContext();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTag, setNewProjectTag] = useState<string>('Work');

  const projects = entries.filter(e => e.type === 'project');

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addEntry({
      content: newProjectName,
      type: 'project',
      status: 'todo',
      tag: newProjectTag,
      date: null,
      priority: 2,
      color: 'blue'
    });
    setNewProjectName('');
  };

  const handleAddSubtask = (projectId: string, content: string) => {
    addEntry({
      content,
      type: 'task',
      status: 'todo',
      tag: 'Work', // Subtasks inherit project context conceptually
      date: null,
      parentId: projectId,
      priority: 2
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24">
      <form onSubmit={handleAddProject} className="mb-8 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New Project Name..."
          className="flex-1 p-3 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-300 transition-colors w-full"
        />
        <div className="flex gap-3">
          <div className="w-40 flex-1 md:flex-none">
            <CustomSelect
              value={newProjectTag}
              onChange={setNewProjectTag}
              options={tags.map(t => ({ value: t.name, label: t.name }))}
              icon={TagIcon}
            />
          </div>
          <button type="submit" className="bg-ink text-white px-6 py-3 md:py-0 rounded-xl font-medium hover:bg-stone-700 transition-colors whitespace-nowrap flex-1 md:flex-none">
            Add Project
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {projects.length === 0 && (
          <div className="text-center py-10 text-stone-400 italic">
            No projects yet. Start by creating one.
          </div>
        )}

        {projects.map(project => {
          const subtasks = entries.filter(e => e.parentId === project.id);
          return (
            <ProjectCard
              key={project.id}
              project={project}
              subtasks={subtasks}
              tags={tags}
              onAddSubtask={handleAddSubtask}
              onUpdateEntry={updateEntry}
              onToggleEntry={(id) => {
                const e = entries.find(x => x.id === id);
                if (e) updateEntry(id, { status: e.status === 'todo' ? 'done' : 'todo' });
              }}
              onSelectEntry={() => { }} // Selection logic usually handled by parent for right sidebar, but ProjectView is full page
              currentDate={currentDate}
              isSortable={false}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProjectView;
