import React from 'react';
import { ChevronLeft } from 'lucide-react';
import SettingsView from '../components/SettingsView';

interface SettingsPageProps {
    currentView: 'root' | 'ai' | 'tags' | 'prefs' | 'data';
    onViewChange: (view: 'root' | 'ai' | 'tags' | 'prefs' | 'data') => void;
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
            default: return 'Settings';
        }
    };

    const isNested = currentView !== 'root';

    return (
        <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center gap-4 px-6 py-5 bg-paper z-10">
                {(isNested || isMobile) && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-stone-200 text-stone-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">
                    {getTitle()}
                </h1>
            </header>

            <div className="flex-1 overflow-hidden">
                <SettingsView currentView={currentView} onViewChange={onViewChange} />
            </div>
        </div>
    );
}
