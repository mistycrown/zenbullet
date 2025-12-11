
import React, { useState, useEffect } from 'react';
import { X, Repeat, Trash2, Square, Circle, Minus, CheckSquare, XSquare, PanelRightClose, SkipForward, Ban, AlertCircle, Palette, ChevronLeft } from 'lucide-react';
import { Entry, EntryType, EntryStatus, Tag, TagColor } from '../types';
import CustomSelect from './CustomSelect';
import CalendarSelect from './CalendarSelect';
import { getPriorityColor, getPriorityLabel, getTagStyles, TAG_COLORS } from '../utils';

interface EntryDetailsProps {
  entry: Entry;
  entries?: Entry[]; // Full list needed for subtask batch editing
  tags: Tag[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Entry>) => void;
  onDelete: (id: string, mode?: 'single' | 'series') => void;
  onCreate?: (entry: Omit<Entry, 'id' | 'createdAt'>) => void;
  onToggleSidebar: () => void;
}

const EntryDetails: React.FC<EntryDetailsProps> = ({
  entry,
  entries = [],
  tags,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
  onToggleSidebar
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // State for batch subtask editing
  const [batchEditValue, setBatchEditValue] = useState<string | null>(null);

  // Split content into Title (first line) and Notes (rest)
  const title = entry.content.split('\n')[0] || '';
  const notes = entry.content.split('\n').slice(1).join('\n');

  const handleTitleChange = (val: string) => {
    // Keep title single line by replacing newlines with spaces
    const cleanVal = val.replace(/\n/g, ' ');
    onUpdate(entry.id, { content: `${cleanVal}\n${notes}` });
  };

  const handleNotesChange = (val: string) => {
    onUpdate(entry.id, { content: `${title}\n${val}` });
  };

  const handleStatusChange = (newStatus: EntryStatus) => {
    if (newStatus === 'canceled' && entry.recurrence && entry.status === 'todo') {
      setShowCancelConfirm(true);
      return;
    }
    onUpdate(entry.id, { status: newStatus });
  };

  const handleRecurrenceCancel = (mode: 'single' | 'series') => {
    if (mode === 'single') {
      onUpdate(entry.id, { status: 'canceled' });
    } else {
      onUpdate(entry.id, { status: 'canceled', recurrence: null });
    }
    setShowCancelConfirm(false);
  };

  const handleDelete = (mode: 'single' | 'series') => {
    onDelete(entry.id, mode);
    onClose();
  };

  // Batch Edit Logic for Subtasks
  const handleBatchEditBlur = () => {
    if (batchEditValue === null) return;

    // Get lines and filter empty ones
    const lines = batchEditValue.split('\n').filter(l => l.trim());

    // Get existing subtasks sorted by creation (assuming array order is rough creation order)
    const currentSubtasks = entries.filter(e => e.parentId === entry.id);

    const maxLen = Math.max(lines.length, currentSubtasks.length);

    for (let i = 0; i < maxLen; i++) {
      const line = lines[i];
      const subtask = currentSubtasks[i];

      if (line && subtask) {
        // Update existing if changed
        if (subtask.content !== line) {
          onUpdate(subtask.id, { content: line });
        }
      } else if (line && !subtask) {
        // Create new
        if (onCreate) {
          onCreate({
            content: line,
            type: 'task',
            status: 'todo',
            tag: entry.tag || 'Work',
            parentId: entry.id,
            date: null,
            priority: 2
          });
        }
      } else if (!line && subtask) {
        // Delete removed
        onDelete(subtask.id);
      }
    }

    setBatchEditValue(null);
  };

  const priority = entry.priority || 2;

  // Don't show certain fields for Weekly Reviews
  if (entry.type === 'weekly-review') {
    return (
      <div className="h-full flex flex-col bg-white overflow-y-auto">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="text-stone-400 hover:text-ink"><PanelRightClose size={20} /></button>
            <h3 className="font-bold text-xl font-hand text-ink">Weekly Review</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-ink" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-stone-500 mb-4">Focus for week of {entry.date}</p>
          <textarea
            value={entry.content}
            onChange={(e) => onUpdate(entry.id, { content: e.target.value })}
            className="w-full h-[400px] p-4 rounded-xl border border-stone-200 focus:border-stone-300 outline-none bg-stone-50 font-mono text-sm"
            placeholder="Write your weekly review here (Markdown supported)..."
          />
        </div>
      </div>
    );
  }

  // --- Project Details View ---
  if (entry.type === 'project') {
    // Get subtasks for display in batch editor
    const subtasks = entries.filter(e => e.parentId === entry.id);
    const batchText = batchEditValue !== null
      ? batchEditValue
      : subtasks.map(s => s.content.split('\n')[0]).join('\n');

    return (
      <div className="h-full flex flex-col bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="md:hidden text-stone-600 hover:text-ink -ml-2 p-2 rounded-full"><ChevronLeft size={24} /></button>
            <button onClick={onToggleSidebar} className="hidden md:block text-stone-400 hover:text-ink p-1 rounded hover:bg-stone-100"><PanelRightClose size={20} /></button>
            <h3 className="font-bold text-xl font-hand text-ink">Project Details</h3>
          </div>
          <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-ink" /></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Project Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-lg font-medium p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-300 transition-colors placeholder:text-stone-300"
              placeholder="Project Name"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Collection</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <button
                  key={t.name}
                  onClick={() => onUpdate(entry.id, { tag: t.name })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${entry.tag === t.name
                    ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                    }`}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap bg-stone-50 p-3 rounded-xl border border-stone-100">
              {(Object.keys(TAG_COLORS) as TagColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdate(entry.id, { color: c })}
                  className={`w-8 h-8 rounded-full transition-all border-2 ${TAG_COLORS[c].split(' ')[0]} ${entry.color === c ? 'border-stone-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110 hover:shadow-sm'}`}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Batch Subtasks */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
              Subtasks (Batch Edit)
            </label>
            <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:border-stone-300 focus-within:ring-2 focus-within:ring-stone-100 transition-all">
              <textarea
                value={batchText}
                onChange={(e) => setBatchEditValue(e.target.value)}
                onBlur={handleBatchEditBlur}
                className="w-full min-h-[150px] p-4 outline-none text-sm resize-none bg-transparent font-medium leading-relaxed"
                placeholder="Enter one task per line..."
              />
              <div className="bg-white border-t border-stone-100 px-4 py-2 text-[10px] text-stone-400 font-medium">
                Tip: One line = one subtask. Exit to save changes.
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Description / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full min-h-[150px] p-4 rounded-lg border border-stone-200 outline-none focus:border-stone-300 text-sm resize-none bg-stone-50 placeholder:text-stone-300"
              placeholder="Add project details..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 mt-auto bg-stone-50/50">
          <button
            onClick={() => { onDelete(entry.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 p-3 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <Trash2 size={18} />
            <span>Delete Project</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Standard Task/Event Details View ---

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="md:hidden text-stone-600 hover:text-ink -ml-2 p-2 rounded-full"><ChevronLeft size={24} /></button>
          <button
            onClick={onToggleSidebar}
            className="hidden md:block text-stone-400 hover:text-ink p-1 rounded hover:bg-stone-100 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelRightClose size={20} />
          </button>
          <h3 className="font-bold text-3xl font-hand text-ink">Details</h3>
        </div>
        <button onClick={onClose}><X size={20} className="text-stone-400 hover:text-ink" /></button>
      </div>

      <div className="p-6 space-y-6 flex-1">

        {/* Title Input */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-lg font-medium p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-300 transition-colors placeholder:text-stone-300"
            placeholder="Task Name"
          />
        </div>

        {/* Tag Capsules */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Collection</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onUpdate(entry.id, { tag: 'Inbox' })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${entry.tag === 'Inbox'
                ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
            >
              #Inbox
            </button>
            {tags.map(t => (
              <button
                key={t.name}
                onClick={() => onUpdate(entry.id, { tag: t.name })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${entry.tag === t.name
                  ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                  }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Status</label>

          {!showCancelConfirm ? (
            <div className="flex gap-2">
              {[
                { val: 'todo', label: 'Todo', icon: Square, color: 'bg-white text-stone-600 border-stone-200' },
                { val: 'done', label: 'Done', icon: CheckSquare, color: 'bg-green-50 text-green-700 border-green-200' },
                { val: 'canceled', label: 'Abandon', icon: XSquare, color: 'bg-red-50 text-red-700 border-red-200' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleStatusChange(opt.val as EntryStatus)}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${entry.status === opt.val
                    ? 'ring-2 ring-stone-800 border-transparent z-10'
                    : `${opt.color} hover:border-stone-300`
                    }`}
                >
                  <opt.icon size={14} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded-xl space-y-2 border border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-800 uppercase">Abandon Recurring Task</span>
                <button onClick={() => setShowCancelConfirm(false)}><X size={14} className="text-red-400 hover:text-red-800" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRecurrenceCancel('single')}
                  className="bg-white border border-red-200 text-red-700 p-2 rounded-lg text-xs font-medium hover:bg-red-100 flex flex-col items-center gap-1"
                >
                  <SkipForward size={14} />
                  <span>Skip This</span>
                  <span className="text-[9px] opacity-70 font-normal">Next one appears</span>
                </button>
                <button
                  onClick={() => handleRecurrenceCancel('series')}
                  className="bg-red-200 border border-red-300 text-red-900 p-2 rounded-lg text-xs font-medium hover:bg-red-300 flex flex-col items-center gap-1"
                >
                  <Ban size={14} />
                  <span>Stop Series</span>
                  <span className="text-[9px] opacity-70 font-normal">End recurrence</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Priority & Type Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Priority</label>
            <div className="flex bg-stone-50 rounded-lg p-1 border border-stone-200">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdate(entry.id, { priority: p })}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${priority === p ? 'bg-white shadow text-ink' : 'text-stone-400 hover:text-stone-600'}`}
                  title={`Priority ${p}`}
                >
                  <span className={priority === p ? getPriorityColor(p) : ''}>{getPriorityLabel(p)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Type</label>
            <div className="flex gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
              {(['task', 'event', 'note'] as EntryType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate(entry.id, { type: t })}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center text-xs font-medium transition-colors ${entry.type === t
                    ? 'bg-white shadow text-ink'
                    : 'text-stone-400 hover:text-stone-600'
                    }`}
                  title={t}
                >
                  {t === 'task' && <Square size={14} />}
                  {t === 'event' && <Circle size={14} />}
                  {t === 'note' && <Minus size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date & Repeat Split Rows */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Date</label>
            <CalendarSelect
              value={entry.date}
              onChange={(date) => onUpdate(entry.id, { date })}
              className="w-full"
            />
            {!entry.date && (
              <p className="text-[10px] text-stone-400 mt-1 pl-1">Inbox (Unscheduled)</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Repeat</label>
            <CustomSelect
              value={entry.recurrence || null}
              onChange={(val) => onUpdate(entry.id, { recurrence: val, recurrenceEnd: val ? entry.recurrenceEnd : null })}
              options={[
                { value: null, label: 'No Repeat' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              icon={Repeat}
            />
          </div>
        </div>

        {entry.recurrence && (
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 animate-in slide-in-from-top-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Recurrence End (Optional)</label>
            <CalendarSelect
              value={entry.recurrenceEnd || null}
              onChange={(d) => onUpdate(entry.id, { recurrenceEnd: d })}
              placeholder="Forever"
              showShortcuts={false}
            />
            <p className="text-[10px] text-stone-400 mt-2">
              Next task automatically created upon completion.
            </p>
          </div>
        )}

        {/* Notes Textarea */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="w-full min-h-[150px] p-4 rounded-lg border border-stone-200 outline-none focus:border-stone-300 text-sm resize-none bg-stone-50 placeholder:text-stone-300"
            placeholder="Add details..."
          />
        </div>
      </div>

      <div className="p-6 border-t border-stone-100 mt-auto bg-stone-50/50">
        {!showDeleteConfirm ? (
          <button
            onClick={() => {
              if (entry.recurrence) {
                setShowDeleteConfirm(true);
              } else {
                onDelete(entry.id);
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 p-3 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <Trash2 size={18} />
            <span>Delete Entry</span>
          </button>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-red-800 uppercase">Delete Recurring Task</span>
              <button onClick={() => setShowDeleteConfirm(false)}><X size={14} className="text-stone-400 hover:text-ink" /></button>
            </div>
            <p className="text-xs text-stone-500">Delete just this instance or the whole series?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDelete('single')}
                className="border border-stone-200 text-stone-700 p-2.5 rounded-lg text-xs font-medium hover:bg-stone-50 flex flex-col items-center gap-1"
              >
                <SkipForward size={16} />
                <span>Skip This</span>
              </button>
              <button
                onClick={() => handleDelete('series')}
                className="bg-red-500 text-white p-2.5 rounded-lg text-xs font-medium hover:bg-red-600 flex flex-col items-center gap-1 shadow-sm"
              >
                <Trash2 size={16} />
                <span>Delete Series</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryDetails;
