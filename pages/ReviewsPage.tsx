import React, { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Entry } from '../types';

const REVIEW_SEPARATOR = '\n\n--- REVIEW SECTION ---\n\n';

interface ReviewsPageProps {
    entries: Entry[];
    onUpdate: (id: string, updates: Partial<Entry>) => void;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    onBack?: () => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
    entries,
    onUpdate,
    expandedId,
    setExpandedId,
    onBack
}) => {
    const reviewsList = useMemo(() => {
        return entries
            .filter(e => e.type === 'weekly-review')
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }, [entries]);

    const expandedReview = useMemo(() =>
        reviewsList.find(r => r.id === expandedId),
        [reviewsList, expandedId]);

    const [reviewPlan, reviewSummary] = useMemo(() => {
        if (!expandedReview) return ['', ''];
        const parts = (expandedReview.content || '').split(REVIEW_SEPARATOR);
        return [parts[0] || '', parts[1] || ''];
    }, [expandedReview]);

    const handleUpdateReviewContent = (type: 'plan' | 'summary', text: string) => {
        if (!expandedReview) return;

        // Re-read current content just in case, but using props relies on parent update
        // We reconstruct based on current split. 
        // Note: If using separated text areas, simpler to just join.
        const currentPlan = type === 'plan' ? text : reviewPlan;
        const currentSummary = type === 'summary' ? text : reviewSummary;

        const newContent = `${currentPlan}${REVIEW_SEPARATOR}${currentSummary}`;
        onUpdate(expandedReview.id, { content: newContent });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-paper">
            <header className="shrink-0 flex items-center justify-between px-6 py-5 bg-paper z-10">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-stone-200 text-stone-600">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-ink font-hand tracking-wide">Weekly Reviews</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-24 md:pb-0 px-6">
                <div className="max-w-4xl mx-auto min-h-full">
                    {!expandedId ? (
                        // List View
                        <div className="grid gap-4 animate-in fade-in duration-300">
                            {reviewsList.length === 0 && (
                                <div className="text-center py-10 text-stone-400 italic">No reviews recorded yet.</div>
                            )}
                            {reviewsList.map(r => (
                                <div key={r.id} onClick={() => setExpandedId(r.id)} className="bg-white p-4 rounded-xl border border-stone-100 hover:border-stone-300 cursor-pointer shadow-sm group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg text-ink group-hover:text-blue-600 transition-colors flex-1">
                                            {r.customTitle || `Week of ${r.date}`}
                                        </div>
                                        {r.customTitle && (
                                            <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                                Week of {r.date}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-stone-500 line-clamp-2 whitespace-pre-wrap text-sm">{r.content ? r.content.split(REVIEW_SEPARATOR)[0] : 'No content'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Expanded Editor View
                        <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-right duration-300">
                            <button
                                onClick={() => setExpandedId(null)}
                                className="flex items-center gap-2 text-stone-500 hover:text-ink mb-4 font-medium self-start"
                            >
                                <ChevronLeft size={18} /> Back to List
                            </button>

                            {expandedReview && (
                                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-stone-100 bg-stone-50">
                                        <input
                                            type="text"
                                            value={expandedReview.customTitle || ''}
                                            onChange={(e) => onUpdate(expandedReview.id, { customTitle: e.target.value })}
                                            placeholder={`Focus for Week of ${expandedReview.date}`}
                                            className="text-lg font-bold font-hand text-ink bg-transparent border-none outline-none placeholder:text-stone-300 w-full"
                                        />
                                        {!expandedReview.customTitle && <p className="text-xs text-stone-400 mt-1">Tap title to rename</p>}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-6">
                                        {/* Plan Section */}
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Plan / Focus</label>
                                            <textarea
                                                value={reviewPlan}
                                                onChange={(e) => handleUpdateReviewContent('plan', e.target.value)}
                                                placeholder="What are your main goals this week?"
                                                className="w-full flex-1 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-300 resize-none font-sans"
                                            />
                                        </div>
                                        {/* Review Section */}
                                        <div className="space-y-2 flex flex-col">
                                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Review / Summary</label>
                                            <textarea
                                                value={reviewSummary}
                                                onChange={(e) => handleUpdateReviewContent('summary', e.target.value)}
                                                placeholder="How did it go? Wins? Improvements?"
                                                className="w-full flex-1 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-300 resize-none font-sans"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
