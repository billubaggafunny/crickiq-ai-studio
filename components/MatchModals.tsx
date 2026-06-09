import React from 'react';
import CrickIQCard from './CrickIQCard';
import TimeScroller from './TimeScroller';
import type { Match, Team } from '../types';

export interface EditMatchModalProps {
    editingMatch: Match | null;
    editFormData: {
        team1Id: string;
        team2Id: string;
        date: string;
        time: string;
        oversPerInnings: number | '';
        maxOversPerBowler: number | '';
    };
    setEditFormData: React.Dispatch<React.SetStateAction<{
        team1Id: string;
        team2Id: string;
        date: string;
        time: string;
        oversPerInnings: number | '';
        maxOversPerBowler: number | '';
    }>>;
    editTeam1Options: Team[];
    editTeam2Options: Team[];
    editError: string | null;
    isEditFormValid: boolean;
    setEditingMatch: (match: Match | null) => void;
    handleUpdateMatch: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
    editingMatch,
    editFormData,
    setEditFormData,
    editTeam1Options,
    editTeam2Options,
    editError,
    isEditFormValid,
    setEditingMatch,
    handleUpdateMatch
}) => {
    if (!editingMatch) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <CrickIQCard  className="w-full max-w-md">
                <h3 className="text-xl font-bold text-text-primary mb-4">Edit Match</h3>
                <div className="space-y-4">
                     <select value={editFormData.team1Id} onChange={e => setEditFormData(f => ({...f, team1Id: e.target.value}))} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                        <option value="" disabled>Select Team 1</option>
                        {editTeam1Options.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                     <select value={editFormData.team2Id} onChange={e => setEditFormData(f => ({...f, team2Id: e.target.value}))} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                        <option value="" disabled>Select Team 2</option>
                        {editTeam2Options.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                    <input type="date" value={editFormData.date} onChange={e => setEditFormData(f => ({...f, date: e.target.value}))} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <TimeScroller value={editFormData.time} onChange={newTime => setEditFormData(f => ({...f, time: newTime}))} />
                    <input type="number" value={editFormData.oversPerInnings} onChange={e => setEditFormData(f => ({...f, oversPerInnings: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))} placeholder="Overs" className="w-full p-2 mb-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <input type="number" value={editFormData.maxOversPerBowler} onChange={e => setEditFormData(f => ({...f, maxOversPerBowler: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))} placeholder="Max Overs/Bowler" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    {editError && <p className="text-highlight text-body text-center">{editError}</p>}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setEditingMatch(null)} className="py-1.5 px-4 bg-primary border border-brand-blue/15 rounded-2xl hover:bg-border-color font-semibold text-body">Cancel</button>
                    <button onClick={handleUpdateMatch} disabled={!isEditFormValid} className="py-1.5 px-4 bg-brand-blue text-white font-bold rounded-2xl hover:bg-opacity-90 text-body disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400">Update</button>
                </div>
            </CrickIQCard>
        </div>
    );
};

export default EditMatchModal;
