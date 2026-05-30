import { Tournament, Team, Match } from '../types';
import { BackupData, validateBackup } from './backupValidator';

const BACKUP_VERSION = 1;

/**
 * Generates a JSON backup of the current app state and triggers a browser download.
 */
export const exportData = (tournaments: Tournament[], teams: Team[], matches: Match[]) => {
    try {
        const backup: BackupData = {
            version: BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            data: {
                tournaments,
                teams,
                matches
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const link = document.createElement('a');
        link.href = url;
        link.download = `crickiq-backup-${timestamp}.json`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        return false;
    }
};

/**
 * Reads a JSON file, validates it, and returns the data for restoration.
 */
export const processImportFile = async (file: File): Promise<{ success: boolean; data?: BackupData['data']; error?: string }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const json = JSON.parse(content);
                
                const validation = validateBackup(json);
                if (!validation.isValid) {
                    resolve({ success: false, error: validation.error });
                    return;
                }

                resolve({ success: true, data: json.data });
            } catch (error) {
                console.error('Import processing failed:', error);
                resolve({ success: false, error: 'Failed to parse JSON file. The file might be corrupted.' });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read file from disk.' });
        };

        reader.readAsText(file);
    });
};
