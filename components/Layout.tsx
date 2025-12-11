import React from 'react';
import Sidebar from './Sidebar';
import ResizableRightSidebar from './ResizableRightSidebar';
import MobileNav from './MobileNav';
import { ToastDisplay } from '../contexts/ZenContext';

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
    return (
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
        </div>
    );
};
