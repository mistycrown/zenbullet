import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useZenContext } from './contexts/ZenContext';
import { getISODate, addDays, getStartOfWeek } from './utils';

// Components
import { Layout } from './components/Layout';
import CalendarView from './components/CalendarView';
import WeeklyView from './components/WeeklyView';
import ProjectView from './components/ProjectView';
import SearchView from './components/SearchView';
import EntryCreatorModal from './components/EntryCreatorModal';
import AIEntryCreatorModal from './components/AIEntryCreatorModal';

// Pages
import { TodayPage } from './pages/TodayPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { CollectionMenuPage } from './pages/CollectionMenuPage';

// --- Wrapper Components for Routes to handle params & props ---

const TodayRoute = ({
  currentDate,
  onDateChange,
  onSelectEntry,
  onOpenAIModal
}: any) => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const activeTagFilter = tag ? decodeURIComponent(tag) : null;

  return (
    <TodayPage
      currentDate={currentDate}
      onDateChange={onDateChange}
      activeTagFilter={activeTagFilter}
      onClearTagFilter={() => navigate('/')}
      onSelectEntry={onSelectEntry}
      onOpenAIModal={onOpenAIModal}
      // These handlers now just navigate
      onOpenSettings={() => navigate('/settings')}
      onOpenSearch={() => navigate('/search')}
      onBack={() => navigate('/')}
      onNavigate={(tab, t) => {
        if (tab === 'today') navigate(t ? `/collection/${t}` : '/');
        else if (tab === 'projects') navigate('/projects');
        else if (tab === 'reviews') navigate('/reviews');
      }}
      isMobileListsView={false} // Handled by /collection route
    />
  );
};

const SettingsRoute = () => {
  const navigate = useNavigate();
  // Simple state handling for inner view could be sub-routes, 
  // but for simplicity let's keep internal state or map sub-routes.
  // Let's implement sub-routes for settings to be truly "routed".
  // /settings, /settings/ai, /settings/tags, etc.
  const location = useLocation();

  let view: 'root' | 'ai' | 'tags' | 'prefs' | 'data' = 'root';
  if (location.pathname.includes('/ai')) view = 'ai';
  else if (location.pathname.includes('/tags')) view = 'tags';
  else if (location.pathname.includes('/prefs')) view = 'prefs';
  else if (location.pathname.includes('/data')) view = 'data';

  const handleViewChange = (v: string) => {
    if (v === 'root') navigate('/settings');
    else navigate(`/settings/${v}`);
  };

  return (
    <SettingsPage
      currentView={view}
      onViewChange={handleViewChange}
      onBack={() => navigate('/settings')}
      isMobile={window.innerWidth < 768}
    />
  );
};

export default function App() {
  const {
    entries,
    tags,
    addEntry,
    updateEntry,
    deleteEntry,
    batchAddEntries
  } = useZenContext();

  const navigate = useNavigate();

  // Global State (Persistent UI State)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Selection
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Weekly Review State
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Computed
  const dateKey = getISODate(currentDate);
  const selectedEntry = useMemo(() => {
    return selectedEntryId ? entries.find(e => e.id === selectedEntryId) || null : null;
  }, [entries, selectedEntryId]);


  const handleCreateWeeklyReview = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const dateStr = getISODate(startOfWeek);
    const exists = entries.find(e => e.type === 'weekly-review' && e.date === dateStr);
    if (!exists) {
      addEntry({
        date: dateStr, type: 'weekly-review', content: '', status: 'todo', tag: 'Inbox', priority: 2
      });
    }
  };

  const handleNavigateToReviews = (entryId: string) => {
    navigate('/reviews');
    setExpandedReviewId(entryId);
  };

  const rightSidebarProps = {
    entry: selectedEntry,
    entries,
    tags,
    currentDate,
    onClose: () => setSelectedEntryId(null),
    onUpdate: updateEntry,
    onDelete: deleteEntry,
    onDateChange: setCurrentDate,
    onToggle: (id: string) => {
      const e = entries.find(x => x.id === id);
      if (e) updateEntry(id, { status: e.status === 'todo' ? 'done' : 'todo' });
    },
    onSelect: setSelectedEntryId,
    onAddGoal: handleCreateWeeklyReview,
    onNavigateToReviews: handleNavigateToReviews,
    onCreate: addEntry
  };

  const globalModals = (
    <>
      <EntryCreatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addEntry}
        activeDate={dateKey}
        tags={tags}
      />
      <AIEntryCreatorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onBatchAdd={batchAddEntries}
        tags={tags}
        currentDate={currentDate}
      />
    </>
  );

  return (
    <Layout
      onOpenAIModal={() => setIsAIModalOpen(true)}
      onAddEntry={() => setIsModalOpen(true)}
      rightSidebarProps={rightSidebarProps}
      modals={globalModals}
    >
      <Routes>
        <Route path="/" element={
          <TodayRoute
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSelectEntry={setSelectedEntryId}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        } />

        <Route path="/collection/:tag" element={
          <TodayRoute
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSelectEntry={setSelectedEntryId}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        } />

        <Route path="/collection" element={<CollectionMenuPage />} />

        <Route path="/calendar" element={
          <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10 hidden md:flex">
              <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Calendar</h1>
            </header>
            <div className="flex-1 overflow-hidden">
              <CalendarView
                currentDate={currentDate}
                entries={entries}
                tags={tags}
                onChangeMonth={(inc) => {
                  const d = new Date(currentDate);
                  d.setMonth(d.getMonth() + inc);
                  setCurrentDate(d);
                }}
                onSelectDate={(d) => { setCurrentDate(d); navigate('/'); }}
                onSetDate={setCurrentDate}
              />
            </div>
          </div>
        } />

        <Route path="/week" element={
          <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10 hidden md:flex">
              <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Weekly</h1>
            </header>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0">
              <WeeklyView
                entries={entries}
                tags={tags}
                currentDate={currentDate}
                onDateClick={(d) => { setCurrentDate(d); navigate('/'); }}
                onToggle={(id) => {
                  const e = entries.find(x => x.id === id);
                  if (e) updateEntry(id, { status: e.status === 'todo' ? 'done' : 'todo' });
                }}
                onSelect={setSelectedEntryId}
                onAddGoal={handleCreateWeeklyReview}
                onPrevWeek={() => setCurrentDate(addDays(currentDate, -7))}
                onNextWeek={() => setCurrentDate(addDays(currentDate, 7))}
                onUpdateEntry={updateEntry}
                onNavigateToReviews={handleNavigateToReviews}
                onDeleteEntry={deleteEntry}
                onAddEntry={addEntry}
              />
            </div>
          </div>
        } />

        <Route path="/projects" element={
          <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
              <button onClick={() => navigate('/collection')} className="md:hidden p-2 -ml-2 rounded-lg text-stone-600">Back</button>
              <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Projects</h1>
            </header>
            <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
              <ProjectView currentDate={currentDate} />
            </div>
          </div>
        } />

        <Route path="/reviews" element={
          <ReviewsPage
            entries={entries}
            onUpdate={updateEntry}
            expandedId={expandedReviewId}
            setExpandedId={setExpandedReviewId}
            onBack={() => navigate('/collection')}
          />
        } />

        <Route path="/search" element={
          <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
              <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Search</h1>
            </header>
            <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
              <SearchView onSelect={setSelectedEntryId} />
            </div>
          </div>
        } />

        <Route path="/settings/*" element={<SettingsRoute />} />
      </Routes>
    </Layout>
  );
}
