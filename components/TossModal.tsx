import React, { useState, useEffect } from 'react';
import type { Team, TossDecision } from '../types';
import { CheckIcon } from '../constants';

interface TossModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (winnerId: string, decision: TossDecision) => void;
    team1: Team;
    team2: Team;
}

const TossModal: React.FC<TossModalProps> = ({ isOpen, onClose, onConfirm, team1, team2 }) => {
    const [winnerId, setWinnerId] = useState<string>('');
    const [decision, setDecision] = useState<TossDecision>('bat');

    useEffect(() => {
        if (isOpen && team1) {
            const timeoutId = setTimeout(() => {
                setWinnerId(team1.id);
                setDecision('bat');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, team1]);

    if (!isOpen || !team1 || !team2) return null;

    const handleConfirm = () => {
        if (winnerId) {
            onConfirm(winnerId, decision);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-xs rounded-2xl shadow-2xl p-6 space-y-6   border border-brand-blue/15"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 className="text-h2 text-text-primary">Coin Toss</h2>
                    <p className="text-caption text-text-secondary">Who won and what did they choose?</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-center text-caption font-semibold text-text-secondary uppercase tracking-wider">Toss Winner</h3>
                    <div className="relative flex bg-primary dark:bg-black/30 rounded-2xl p-1">
                        <div
                            className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-brand-blue rounded-2xl transition-transform duration-300 ease-out"
                            style={{
                                transform: winnerId === team1.id ? 'translateX(0)' : 'translateX(calc(100% + 2px))',
                            }}
                        />
                        <button
                            onClick={() => setWinnerId(team1.id)}
                            className={`relative z-10 w-1/2 px-4 py-1.5 text-button transition-colors duration-300 flex items-center justify-center gap-2 ${
                                winnerId === team1.id ? 'text-white' : 'text-text-secondary'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{backgroundColor: team1.logo}}>{team1.name.substring(0,2).toUpperCase()}</div>
                            <span className="truncate">{team1.name}</span>
                        </button>
                        <button
                            onClick={() => setWinnerId(team2.id)}
                            className={`relative z-10 w-1/2 px-4 py-1.5 text-button transition-colors duration-300 flex items-center justify-center gap-2 ${
                                winnerId === team2.id ? 'text-white' : 'text-text-secondary'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{backgroundColor: team2.logo}}>{team2.name.substring(0,2).toUpperCase()}</div>
                            <span className="truncate">{team2.name}</span>
                        </button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-center text-caption font-semibold text-text-secondary uppercase tracking-wider">Decision</h3>
                    <div className="relative flex bg-primary dark:bg-black/30 rounded-2xl p-1">
                        <div
                            className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-brand-blue rounded-2xl transition-transform duration-300 ease-out"
                            style={{
                                transform: decision === 'bat' ? 'translateX(0)' : 'translateX(calc(100% + 2px))',
                            }}
                        />
                         <button
                            onClick={() => setDecision('bat')}
                            className={`relative z-10 w-1/2 px-4 py-1.5 text-button transition-colors duration-300 flex items-center justify-center gap-2 ${
                                decision === 'bat' ? 'text-white' : 'text-text-secondary'
                            }`}
                        >
                            <CheckIcon className="w-4 h-4" />
                            <span>Bat First</span>
                        </button>
                        <button
                            onClick={() => setDecision('bowl')}
                            className={`relative z-10 w-1/2 px-4 py-1.5 text-button transition-colors duration-300 flex items-center justify-center gap-2 ${
                                decision === 'bowl' ? 'text-white' : 'text-text-secondary'
                            }`}
                        >
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            <span>Bowl First</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-2xl text-button bg-primary border border-brand-blue/15 text-text-primary hover:bg-border-color transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-2xl text-button bg-brand-blue text-white shadow-lg hover:brightness-110 transition-all"
                    >
                        Confirm Toss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TossModal;
