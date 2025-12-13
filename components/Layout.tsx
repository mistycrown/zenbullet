import React from 'react';
import Sidebar from './Sidebar';
import ResizableRightSidebar from './ResizableRightSidebar';
import MobileNav from './MobileNav';
import { ToastDisplay } from '../contexts/ZenContext';

import { DndContext, DragEndEvent, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useZenContext } from '../contexts/ZenContext';

interface LayoutProps {
    children: React.ReactNode;
    onOpenAIModal: () => void;
    onAddEntry: () => void;

    // Right Sidebar Props
    rightSidebarProps: any;

    // Mobile Entry Detail Modal
    mobileEntryDetail?: React.ReactNode;

    // Global Modals
    modals?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    onOpenAIModal,
    onAddEntry,
    rightSidebarProps,
    mobileEntryDetail,
    modals
}) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const { updateEntry, entries, tags } = useZenContext();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // If dropped on a day in WeeklyView (sidebar)
        if (over.id && String(over.id).startsWith('day-')) {
            const targetDate = String(over.id).replace('day-', '');
            // Update the entry date
            updateEntry(String(active.id), { date: targetDate });
        }
    };

    const activeEntry = activeId ? entries.find(e => e.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen bg-paper overflow-hidden font-sans select-none relative">
                <Sidebar
                    onOpenAIModal={onOpenAIModal}
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Page Content */}
                    {children}

                    <ResizableRightSidebar {...rightSidebarProps} />
                </div>

                <MobileNav
                    onAdd={onAddEntry}
                />

                <ToastDisplay />

                {modals}

                {mobileEntryDetail && (
                    <div className="md:hidden fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-200">
                        {mobileEntryDetail}
                    </div>
                )}

                <DragOverlay>
                    {activeEntry ? (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-stone-200 flex items-center gap-3 w-[300px] opacity-90 cursor-grabbing">
                            <div className="w-4 h-4 border-2 border-stone-400 rounded-sm"></div>
                            <span className="font-medium text-ink truncate">{activeEntry.content}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
