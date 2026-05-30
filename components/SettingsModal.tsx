
import React, { useState, useRef } from 'react';
import type { Theme, FontSize, Tournament, Team, Match } from '../types';
import HowToUseGuide from './HowToUseGuide';
import { exportData, processImportFile } from '../utils/exportImport';
import { DownloadIcon, UploadIcon, HistoryIcon, HardDriveIcon } from '../constants';
import { localStorageAdapter } from '../storage/localStorageAdapter';
import CrickIQCard from './CrickIQCard';

interface SettingsModalProps {
    onClose: () => void;
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
    currentFontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
    notificationPermission: NotificationPermission;
    data: {
        tournaments: Tournament[];
        teams: Team[];
        matches: Match[];
    };
    onRestore: (data: { tournaments: Tournament[]; teams: Team[]; matches: Match[] }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, 
    currentTheme, 
    setTheme, 
    currentFontSize, 
    setFontSize, 
    notificationsEnabled, 
    onToggleNotifications, 
    notificationPermission,
    data,
    onRestore
}) => {
    const [view, setView] = useState<'main' | 'howToUse' | 'dataManagement'>('main');
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const snapshotsStr = localStorageAdapter.load('crickiq_snapshots') as string | null;
    const snapshots = snapshotsStr ? JSON.parse(snapshotsStr) : [];

    const handleExport = () => {
        exportData(data.tournaments, data.teams, data.matches);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            setImportError("Please select a valid JSON backup file.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            setImportError("Backup file size is too large (max 10MB).");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setImportError(null);
        setIsImporting(true);

        const result = await processImportFile(file);
        
        if (result.success && result.data) {
            if (window.confirm("This will replace all current data. Are you sure?")) {
                onRestore(result.data);
                onClose();
            }
        } else {
            setImportError(result.error || 'Unknown error');
        }
        
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRestoreSnapshot = (snapshotData: { tournaments: Tournament[]; teams: Team[]; matches: Match[] }) => {
        if (window.confirm("This will restore data to this point in time and replace current data. Are you sure?")) {
            onRestore(snapshotData);
            onClose();
        }
    };

    const themeOptions: { id: Theme, label: string }[] = [
        { id: 'light', label: 'Light' },
        { id: 'dark', label: 'Dark' },
        { id: 'system', label: 'System' },
    ];

    const fontSizeOptions: { id: FontSize, label: string }[] = [
        { id: 'small', label: 'Small' },
        { id: 'medium', label: 'Medium' },
        { id: 'standard', label: 'Standard' },
    ];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 safe-pad-t safe-pad-b safe-pad-l safe-pad-r"
            onClick={onClose}
        >
            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <CrickIQCard className="max-h-[85vh] flex flex-col overflow-hidden" noPadding>
                    <div className="flex justify-between items-center px-4 py-3 bg-brand-gradient text-white sticky top-0 z-20 shrink-0">
                        <h2 className="text-lg font-bold">
                            {view === "main" ? "Settings" : view === "howToUse" ? "How to Use CrickIQ" : "Data Management"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-2xl transition-colors flex items-center justify-center">
                            ✕
                        </button>
                    </div>

                    <div className="px-6 py-4 flex-grow overflow-y-auto min-h-0 space-y-4">
                        {view === 'main' ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-h3 text-text-primary mb-2">Theme</h3>
                                <div className="flex space-x-2 bg-primary/50 p-1 rounded-2xl">
                                    {themeOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => setTheme(option.id)}
                                            className={`w-full py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 flex items-center justify-center gap-2 text-body ${currentTheme === option.id ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-secondary'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-h3 text-text-primary mb-2">Font Size</h3>
                                <div className="flex space-x-2 bg-primary/50 p-1 rounded-2xl">
                                    {fontSizeOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => setFontSize(option.id)}
                                            className={`w-full py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 flex items-center justify-center gap-2 text-body ${currentFontSize === option.id ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-secondary'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-h3 text-text-primary mb-2">Notifications</h3>
                                <div className="flex items-center justify-between bg-primary/50 p-2 rounded-2xl">
                                    <label htmlFor="notif-toggle" className="font-semibold text-body cursor-pointer pl-2 text-text-primary">
                                        Match Reminders
                                    </label>
                                    <button
                                        id="notif-toggle"
                                        role="switch"
                                        aria-checked={notificationsEnabled}
                                        onClick={onToggleNotifications}
                                        disabled={notificationPermission === 'denied'}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed ${
                                            notificationsEnabled ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                {notificationPermission === 'denied' && (
                                    <p className="text-xs text-highlight mt-2 px-2">
                                        Notification permissions are blocked by your browser. You need to enable them in your browser settings.
                                    </p>
                                )}
                            </div>
                             <div>
                                <h3 className="text-h3 text-text-primary mb-2">Help & Data</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setView('howToUse')}
                                        className="w-full text-left p-3 rounded-lg bg-primary/50 hover:bg-primary transition-colors flex items-center justify-between font-semibold text-text-primary text-body"
                                    >
                                        <span>How to Use the App</span>
                                        <span className="text-lg">&rarr;</span>
                                    </button>
                                    <button
                                        onClick={() => setView('dataManagement')}
                                        className="w-full text-left p-3 rounded-lg bg-primary/50 hover:bg-primary transition-colors flex items-center justify-between font-semibold text-text-primary text-body"
                                    >
                                        <div className="flex items-center gap-2">
                                            <HardDriveIcon className="w-4 h-4" />
                                            <span>Backup & Restore</span>
                                        </div>
                                        <span className="text-lg">&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : view === 'howToUse' ? (
                        <div className="flex-grow overflow-y-auto no-scrollbar pr-2">
                             <button onClick={() => setView('main')} className="mb-4 font-semibold text-body text-brand-blue hover:underline">
                                &larr; Back to Settings
                            </button>
                            <HowToUseGuide />
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto no-scrollbar pr-2 space-y-6">
                            <button onClick={() => setView('main')} className="mb-2 font-semibold text-body text-brand-blue hover:underline">
                                &larr; Back to Settings
                            </button>

                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cloud-Free Backup</h4>
                                <p className="text-caption text-text-secondary leading-relaxed">
                                    CrickIQ is private and local-first. Export your data to a file to move it between devices or keep long-term backups.
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    <button 
                                        onClick={handleExport}
                                        className="flex items-center justify-center gap-2 py-4 px-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/90 transition-all text-body"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        Export JSON Backup
                                    </button>
                                    <button 
                                        onClick={handleImportClick}
                                        disabled={isImporting}
                                        className="flex items-center justify-center gap-2 py-4 px-4 bg-primary/50 text-text-primary rounded-xl font-bold hover:bg-primary transition-all text-body disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        {isImporting ? 'Processing...' : 'Import JSON Backup'}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept=".json"
                                    />
                                </div>
                                {importError && (
                                    <p className="text-xs text-danger font-semibold bg-danger/10 p-2 rounded border border-red-100">
                                        Import Error: {importError}
                                    </p>
                                )}
                            </section>

                            {snapshots.length > 0 && (
                                <section className="space-y-4">
                                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                        <HistoryIcon className="w-4 h-4" />
                                        Local Snapshots
                                    </h4>
                                    <p className="text-caption text-text-secondary">
                                        Auto-saved before major changes.
                                    </p>
                                    <div className="space-y-2">
                                        {snapshots.map((s: { timestamp: string, tournaments: Tournament[]; teams: Team[]; matches: Match[] }, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleRestoreSnapshot({ tournaments: s.tournaments, teams: s.teams, matches: s.matches })}
                                                className="w-full text-left p-4 rounded-xl bg-primary/30 hover:bg-primary/50 flex justify-between items-center transition-colors border border-transparent hover:border-brand-blue/20"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-text-primary">Snapshot {idx + 1}</p>
                                                    <p className="text-[10px] text-text-secondary">{new Date(s.timestamp).toLocaleString()}</p>
                                                </div>
                                                <span className="text-[10px] px-2 py-1 bg-primary rounded font-bold text-brand-blue">Restore</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                    </div>
                </CrickIQCard>
            </div>
        </div>
    );
};

export default SettingsModal;
