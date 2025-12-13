import React from 'react';
import { ChevronLeft } from 'lucide-react';
import SettingsView from '../components/SettingsView';

interface SettingsPageProps {
    currentView: 'root' | 'ai' | 'tags' | 'prefs' | 'data' | 'sync';
    onViewChange: (view: 'root' | 'ai' | 'tags' | 'prefs' | 'data' | 'sync') => void;
    onBack: () => void; // To go back to root settings or main app
    isMobile: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    currentView,
    onViewChange,
    onBack,
    isMobile
}) => {
    const getTitle = () => {
        switch (currentView) {
            case 'ai': return 'AI Configuration';
            case 'tags': return 'Collection Management';
            case 'prefs': return 'Preferences';
            case 'data': return 'Import / Export';
            case 'sync': return 'WebDAV Sync';
            default: return 'Settings';
        }
    };

    const isNested = currentView !== 'root';

    return (
        <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center gap-4 px-4 md:px-6 bg-paper z-10 pt-safe md:py-5">
                {(isNested || isMobile) && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-stone-200 text-stone-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                <h1 className="text-2xl font-bold text-ink font-hand tracking-wide">
                    {getTitle()}
                </h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
                <SettingsView currentView={currentView} onViewChange={onViewChange} />
            </div>
        </div>
    );
}
