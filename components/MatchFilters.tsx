import React from 'react';

export type View = 'tournaments' | 'overview' | 'fixtures' | 'teams' | 'stats' | 'points' | 'schedule' | 'history' | 'semifinals' | 'final';

export interface MatchFiltersProps {
    tabs: { id: View; label: string }[];
    currentView: View;
    onViewChange: (view: View) => void;
}

const MatchFilters: React.FC<MatchFiltersProps> = ({ tabs, currentView, onViewChange }) => {
    if (tabs.length <= 1) return null;

    return (
        <div className="border-b border-brand-blue/15 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id as View)}
                    className={`flex-shrink-0 py-2 px-1 transition-colors duration-300 text-tab ${currentView === tab.id ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default MatchFilters;
