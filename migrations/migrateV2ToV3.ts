import { EnvelopedData } from './migrationRunner';
import { generateEntityId } from '../utils/idGenerator';

export const migrateV2ToV3 = (currentData: EnvelopedData): EnvelopedData => {
    const nextData = structuredClone(currentData);
    
    // Add missing globalPlayerId to all players in all teams
    if (nextData.data && Array.isArray(nextData.data.teams)) {
        nextData.data.teams.forEach(team => {
            if (Array.isArray(team.players)) {
                team.players.forEach(player => {
                    if (!player.globalPlayerId) {
                        player.globalPlayerId = `gp_${generateEntityId()}`;
                    }
                });
            }
        });
    }

    if (!nextData._migrationHistory) {
        nextData._migrationHistory = [];
    }

    nextData._migrationHistory.push({
        from: 2,
        to: 3,
        appliedAt: new Date().toISOString()
    });

    nextData.schemaVersion = 3;
    return nextData;
};
