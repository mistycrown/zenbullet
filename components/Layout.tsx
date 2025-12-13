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

        const overId = String(over.id);
        const activeIdStr = String(active.id);

        let targetDate = '';

        // Handle various drop zones
        if (overId.startsWith('day-')) {
            targetDate = overId.replace('day-', '');
        } else if (overId.startsWith('cal-day-')) {
            targetDate = overId.replace('cal-day-', '');
        } else if (overId.startsWith('week-day-')) {
            targetDate = overId.replace('week-day-', '');
        }

        if (targetDate) {
            // Parse real entry ID by stripping prefixes
            let entryId = activeIdStr;
            if (activeIdStr.startsWith('cal-entry-')) {
                entryId = activeIdStr.replace('cal-entry-', '');
            } else if (activeIdStr.startsWith('week-entry-')) {
                entryId = activeIdStr.replace('week-entry-', '');
            }

            // Update the entry date
            updateEntry(entryId, { date: targetDate });
        }
    };

    const getRealDetails = (id: string | null) => {
        if (!id) return null;
        let realId = id;
        if (id.startsWith('cal-entry-')) realId = id.replace('cal-entry-', '');
        if (id.startsWith('week-entry-')) realId = id.replace('week-entry-', '');
        return entries.find(e => e.id === realId);
    };

    const activeEntry = getRealDetails(activeId);

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
                        <div className="bg-white px-3 py-2 rounded-lg shadow-xl border border-stone-200 flex items-center gap-2 max-w-[200px] opacity-90 cursor-grabbing">
                            <div className="w-3 h-3 border-2 border-stone-400 rounded-sm shrink-0"></div>
                            <span className="font-medium text-xs text-ink truncate">{activeEntry.content}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
