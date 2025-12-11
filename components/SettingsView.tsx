
import React, { useState, useEffect } from 'react';
import { Tag, TagColor } from '../types';
import { TAG_COLORS } from '../utils';
import { Plus, Trash2, Tag as TagIcon, Cpu, Key, Globe, Save, CheckCircle, ChevronRight, GripVertical, Settings as SettingsIcon, Cloud, FileText, Book, ArrowUp, ArrowDown, Download, Upload, ExternalLink, RefreshCw, Loader, AlertCircle, Trash, AlertTriangle, RotateCcw } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DynamicIcon from './DynamicIcon';
import { useZenContext } from '../contexts/ZenContext';

type ViewState = 'root' | 'ai' | 'tags' | 'prefs' | 'data' | 'sync';

interface SettingsViewProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI Compatible' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'siliconflow', label: 'SiliconFlow (硅基流动)' },
];

const DEFAULT_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  deepseek: 'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
};

import ConfirmDialog from './ConfirmDialog';

// Sortable Tag Item Component
const SortableTagItem: React.FC<{
  tag: Tag;
  onRemove: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
}> = ({
  tag,
  onRemove,
  onRename,
  index,
  isFirst,
  isLast,
  onMove
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.name });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(tag.name);

    // Sync state if prop changes
    useEffect(() => {
      setEditName(tag.name);
    }, [tag.name]);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 'auto',
      opacity: isDragging ? 0.5 : 1,
    };

    const handleBlur = () => {
      setIsEditing(false);
      if (editName.trim() && editName !== tag.name) {
        onRename(tag.name, editName.trim());
      } else {
        setEditName(tag.name);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur();
      }
      if (e.key === 'Escape') {
        setEditName(tag.name);
        setIsEditing(false);
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-100 shadow-sm group hover:border-stone-200 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing touch-none">
            <GripVertical size={16} />
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TAG_COLORS[tag.color].split(' ')[0]} ${TAG_COLORS[tag.color].split(' ')[1]}`}>
            <DynamicIcon name={tag.icon} size={16} />
          </div>

          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="font-medium text-ink bg-stone-50 px-2 py-1 rounded outline-none border border-stone-300 w-full max-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className="font-medium text-ink cursor-text hover:bg-stone-50 px-2 py-1 rounded border border-transparent hover:border-stone-100 transition-colors truncate"
              title="Click to rename"
            >
              {tag.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="p-2 text-stone-300 hover:text-ink disabled:opacity-30 disabled:hover:text-stone-300"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="p-2 text-stone-300 hover:text-ink disabled:opacity-30 disabled:hover:text-stone-300"
          >
            <ArrowDown size={16} />
          </button>
          <button
            onClick={() => onRemove(tag.name)}
            className="text-stone-300 hover:text-red-500 transition-colors p-2 ml-1"
            title="Delete Collection"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

const SettingsView: React.FC<SettingsViewProps> = ({
  currentView,
  onViewChange
}) => {
  const { entries, tags, addTag, removeTag, renameTag, reorderTags, importData, isSyncing, lastSyncTime, syncError, syncConfig, sync, upload, download, updateSyncConfig, clearData, restoreDefaults, showToast } = useZenContext();

  // -- AI Config State --
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [syncUser, setSyncUser] = useState('');
  const [syncPass, setSyncPass] = useState('');
  const [isSyncSaved, setIsSyncSaved] = useState(false);

  useEffect(() => {
    if (syncConfig) {
      setSyncUrl(syncConfig.url);
      setSyncUser(syncConfig.username);
    }
  }, [syncConfig]);

  const handleSaveSync = () => {
    updateSyncConfig(syncUrl, syncUser, syncPass);
    setIsSyncSaved(true);
    setTimeout(() => setIsSyncSaved(false), 2000);
  };


  // -- Tag State --
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('stone');
  const [newTagIcon, setNewTagIcon] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load settings on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('llm_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setProvider(config.provider || 'openai');
      setApiKey(config.apiKey || '');
      setBaseUrl(config.baseUrl || '');
      setModelName(config.modelName || '');
    } else {
      setBaseUrl(DEFAULT_URLS['openai']);
    }
  }, []);

  const handleProviderChange = (val: string) => {
    setProvider(val);
    if (DEFAULT_URLS[val]) {
      setBaseUrl(DEFAULT_URLS[val]);
    }
  };

  const handleSaveApi = () => {
    const config = { provider, apiKey, baseUrl, modelName };
    localStorage.setItem('llm_config', JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    if (tags.some(t => t.name === newTagName.trim())) {
      showToast('Collection name already exists');
      return;
    }
    addTag({
      name: newTagName.trim(),
      color: newTagColor,
      icon: newTagIcon.trim() || undefined
    });
    setNewTagName('');
    setNewTagColor('stone');
    setNewTagIcon('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tags.findIndex((t) => t.name === active.id);
      const newIndex = tags.findIndex((t) => t.name === over?.id);
      reorderTags(arrayMove(tags, oldIndex, newIndex));
    }
  };

  const handleMoveTag = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tags.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTags = arrayMove(tags, index, newIndex);
    reorderTags(newTags);
  };

  const handleExport = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      tags,
      entries
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenbullet - backup - ${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Simple validation
        if (data.entries && Array.isArray(data.entries) && data.tags && Array.isArray(data.tags)) {
          if (window.confirm(`Found ${data.entries.length} entries and ${data.tags.length} collections.Overwrite current data ? `)) {
            importData(data.entries, data.tags);
          }
        } else {
          showToast('Invalid data format: Missing entries or tags array.');
        }
      } catch (err) {
        showToast('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // -- Dialog State --
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '' as React.ReactNode,
    confirmLabel: 'Confirm',
    isDestructive: false
  });
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });

  const openConfirm = (
    title: string,
    message: React.ReactNode,
    action: () => void,
    isDestructive = false,
    confirmLabel = 'Confirm'
  ) => {
    setDialogConfig({ title, message, isDestructive, confirmLabel });
    setConfirmAction(() => action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    confirmAction();
    setDialogOpen(false);
  };

  // --- Render Views ---

  const renderRoot = () => (
    <div className="space-y-6">

      <div className="space-y-3">
        <p className="px-1 text-xs font-bold text-stone-400 uppercase tracking-wider">General</p>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-50">
          <button onClick={() => onViewChange('ai')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Cpu size={18} /></div>
              <span className="font-medium">AI API</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
          <button onClick={() => onViewChange('tags')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><TagIcon size={18} /></div>
              <span className="font-medium">Collection Management</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
          <button onClick={() => onViewChange('prefs')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-stone-100 text-stone-600 rounded-lg"><SettingsIcon size={18} /></div>
              <span className="font-medium">Preferences</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-xs font-bold text-stone-400 uppercase tracking-wider">Data & Sync</p>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-50">
          <button onClick={() => onViewChange('data')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-stone-100 text-stone-600 rounded-lg"><FileText size={18} /></div>
              <span className="font-medium">Import / Export</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
          <button onClick={() => onViewChange('sync')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Cloud size={18} /></div>
              <span className="font-medium">WebDAV Sync</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-xs font-bold text-stone-400 uppercase tracking-wider">About</p>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3 text-ink">
              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Book size={18} /></div>
              <span className="font-medium">User Guide</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
        </div>
        <p className="text-center text-xs text-stone-300 pt-4">Version 1.0.1 (WebDAV Build)</p>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-5">
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Provider</label>
          <CustomSelect
            value={provider}
            onChange={handleProviderChange}
            options={PROVIDERS}
            placeholder="Select Provider"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Base URL</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
                placeholder="https://api..."
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Model Name</label>
            <div className="relative">
              <Cpu size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
                placeholder="e.g. gpt-4o"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">API Key</label>
          <div className="relative">
            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
              placeholder="sk-..."
            />
          </div>
        </div>

        <button
          onClick={handleSaveApi}
          className={`w - full flex items - center justify - center gap - 2 px - 6 py - 3 rounded - xl font - medium text - sm transition - all active: scale - 95 ${isSaved ? 'bg-green-500 text-white' : 'bg-ink text-white hover:bg-stone-700'
            } `}
        >
          {isSaved ? <CheckCircle size={16} /> : <Save size={16} />}
          {isSaved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );

  const renderTags = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <form onSubmit={handleAddTag} className="mb-8">
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Add New Collection</label>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Collection Name"
              className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all placeholder:text-stone-300"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Icon (Name)</span>
                <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1">
                  Browse Icons <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="text"
                value={newTagIcon}
                onChange={(e) => setNewTagIcon(e.target.value)}
                placeholder="e.g. Briefcase, Heart, Zap"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all placeholder:text-stone-300"
              />
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Select Color</span>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TAG_COLORS) as TagColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  className={`w - 8 h - 8 rounded - full transition - all border - 2 ${TAG_COLORS[c].split(' ')[0]} ${newTagColor === c ? 'border-stone-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110 hover:shadow-sm'} `}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="w-full bg-ink text-white py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-stone-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} /> Add Collection
          </button>
        </form>

        <div className="border-t border-stone-100 pt-6">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Current Collections (Drag to Reorder)</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tags.map(t => t.name)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {tags.map((tag, index) => (
                  <SortableTagItem
                    key={tag.name}
                    tag={tag}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === tags.length - 1}
                    onRemove={removeTag}
                    onRename={renameTag}
                    onMove={handleMoveTag}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-ink mb-2">Export Data</h3>
          <p className="text-sm text-stone-500 mb-4">
            Download a JSON file containing all your entries and collections. Useful for backups.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-ink rounded-lg font-medium text-sm transition-colors"
          >
            <Download size={16} />
            Download Backup
          </button>
        </div>

        <div className="border-t border-stone-100 pt-6">
          <h3 className="text-lg font-bold text-ink mb-2">Import Data</h3>
          <p className="text-sm text-stone-500 mb-4">
            Restore from a previously exported JSON file. <strong className="text-red-500">Warning: This will overwrite your current data.</strong>
          </p>
          <label className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-ink rounded-lg font-medium text-sm transition-colors cursor-pointer w-fit">
            <Upload size={16} />
            <span>Select File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="border-t border-stone-100 pt-6">
          <h3 className="text-lg font-bold text-ink mb-2 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Data Management (Danger Zone)
          </h3>
          <p className="text-sm text-stone-500 mb-4">
            Irreversible actions to clear or reset your data.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openConfirm(
                'Clear All Entries?',
                'Are you sure you want to clear ALL entries? This will delete all tasks and events. Your collections (tags) will be preserved.\n\nThis action cannot be undone.',
                () => clearData('entries'),
                true,
                'Clear Entries'
              )}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors border border-red-100"
            >
              <Trash size={16} />
              Clear All Entries
            </button>

            <button
              onClick={() => openConfirm(
                'Restore Default Data?',
                'Are you sure you want to RESTORE DEFAULT DATA?\n\nThis will completely wipe all your current entries and collections and replace them with the sample data.\n\nThis action cannot be undone.',
                restoreDefaults,
                true,
                'Restore Defaults'
              )}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-ink rounded-lg font-medium text-sm transition-colors"
            >
              <RotateCcw size={16} />
              Restore Default Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrefs = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between py-2 border-b border-stone-100 mb-2">
          <span className="text-sm font-medium">Dark Mode</span>
          <div className="w-10 h-6 bg-stone-200 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div></div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-stone-100">
          <span className="text-sm font-medium">Notifications</span>
          <div className="w-10 h-6 bg-stone-200 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div></div>
        </div>
        <p className="text-xs text-stone-400 mt-4 italic">More preferences coming soon.</p>
      </div>
    </div>
  );

  const renderSync = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-5">
        <h3 className="text-lg font-bold text-ink mb-4">WebDAV Synchronization</h3>
        <p className="text-sm text-stone-500">
          Synchronize your data across devices using a WebDAV server.
          Your data will be stored as an encrypted JSON file on the server.
        </p>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">WebDAV URL</label>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
              placeholder="https://your-webdav-server.com/path/"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Username</label>
          <div className="relative">
            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={syncUser}
              onChange={(e) => setSyncUser(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
              placeholder="Your WebDAV username"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Password</label>
          <div className="relative">
            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              value={syncPass}
              onChange={(e) => setSyncPass(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
              placeholder="Your WebDAV password"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSync}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${isSyncSaved ? 'bg-green-500 text-white' : 'bg-ink text-white hover:bg-stone-700'
            }`}
        >
          {isSyncSaved ? <CheckCircle size={16} /> : <Save size={16} />}
          {isSyncSaved ? 'Saved!' : 'Save Sync Configuration'}
        </button>

        <div className="border-t border-stone-100 pt-6 space-y-4">
          <h4 className="text-md font-bold text-ink">Sync Status</h4>
          {syncConfig?.url ? (
            <>
              <p className="text-sm text-stone-500">
                Status: {isSyncing ? <span className="text-blue-500 flex items-center gap-1"><Loader size={14} className="animate-spin" /> Syncing...</span> : 'Idle'}
              </p>
              {lastSyncTime && (
                <p className="text-sm text-stone-500">Last Sync: {new Date(lastSyncTime).toLocaleString()}</p>
              )}
              {syncError && (
                <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Error: {syncError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={upload}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  title="Upload local data to the cloud (overwrites cloud)"
                >
                  {isSyncing ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isSyncing ? 'Syncing...' : 'Upload to Cloud'}
                </button>
                <button
                  onClick={download}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-ink rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  title="从云端下载并完全替换本地数据（警告：本地未上传的数据将丢失）"
                >
                  {isSyncing ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                  {isSyncing ? '同步中...' : '从云端下载'}
                </button>
              </div>
              <button
                onClick={() => openConfirm(
                  'Clear Sync Configuration?',
                  'Are you sure you want to clear your WebDAV sync configuration? This will disconnect your sync.',
                  () => updateSyncConfig('', '', ''),
                  true,
                  'Clear Config'
                )}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors border border-red-100"
              >
                <Trash size={16} />
                Clear Sync Config
              </button>
            </>
          ) : (
            <p className="text-sm text-stone-500">No WebDAV configuration found. Please set up your server details above.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24 md:pb-6 animate-in fade-in duration-300">
      {currentView === 'root' && renderRoot()}
      {currentView === 'ai' && renderAI()}
      {currentView === 'tags' && renderTags()}
      {currentView === 'data' && renderData()}
      {currentView === 'sync' && renderSync()}
      {currentView === 'prefs' && renderPrefs()}

      <ConfirmDialog
        isOpen={dialogOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        isDestructive={dialogConfig.isDestructive}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
};

export default SettingsView;
