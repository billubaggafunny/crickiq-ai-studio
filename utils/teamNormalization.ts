import { Team, Player } from '../types';
import { ensurePlayerHasGlobalId } from './idGenerator';

/**
 * Team identity must always be based on team.id.
 * Team name is display metadata only and must never be used as the permanent identity.
 */

/**
 * Generates 2-3 meaningful uppercase letters from a team name.
 */
export const generateTeamInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'TM';
    
    // Split by spaces, hyphens, underscores
    const words = trimmed.split(/[\s-_]+/);
    if (words.length > 1) {
        // Take initials of first 3 words
        return words
            .slice(0, 3)
            .map(w => w.charAt(0))
            .join('')
            .toUpperCase();
    }
    
    // If only 1 word, take first 3 chars
    return trimmed.substring(0, Math.min(3, trimmed.length)).toUpperCase();
};

/**
 * Safely returns a complete Team object with defaults.
 * Used when loading, creating, or importing/migrating teams.
 */
export const normalizeTeam = (team: Partial<Team> & { name: string }): Team => {
    const now = new Date().toISOString();
    
    // Get existing basic fields safely
    const id = team.id || '';
    const ownerId = team.ownerId;
    const name = team.name ? team.name.trim() : 'Unnamed Team';
    const logo = team.logo || '#3B82F6';
    const players = Array.isArray(team.players) ? team.players.map(ensurePlayerHasGlobalId) : [];
    const captainId = team.captainId === undefined ? null : team.captainId;
    const viceCaptainId = team.viceCaptainId === undefined ? null : team.viceCaptainId;
    const createdAt = team.createdAt || now;
    const updatedAt = team.updatedAt || now;
    const syncStatus = team.syncStatus;

    // Defaulting logic for new or future-ready fields
    const shortName = team.shortName || name;
    const teamInitials = team.teamInitials || generateTeamInitials(name);
    const logoColor = team.logoColor || logo;
    const logoUrl = team.logoUrl || '';
    const teamType = team.teamType || 'custom';
    const scope = team.scope || 'global';
    const tournamentId = team.tournamentId !== undefined ? team.tournamentId : null;
    const isArchived = team.isArchived !== undefined ? team.isArchived : false;
    const archivedAt = team.archivedAt !== undefined ? team.archivedAt : null;

    return {
        id,
        ownerId,
        name,
        logo,
        players,
        captainId,
        viceCaptainId,
        createdAt,
        updatedAt,
        syncStatus,
        shortName,
        teamType,
        logoColor,
        logoUrl,
        teamInitials,
        homeGround: team.homeGround || '',
        city: team.city || '',
        state: team.state || '',
        country: team.country || '',
        scope,
        tournamentId,
        isArchived,
        archivedAt,
    };
};

/**
 * Detects possible duplicate teams in teamsList by comparing normalized names.
 * Punctuation and extra whitespaces are removed to facilitate duplicate recommendation matches.
 */
export const detectDuplicateTeams = (name: string, teamsList: Team[]): Team[] => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = clean(name);
    if (!cleanName) return [];
    
    return teamsList.filter(t => t.name && clean(t.name) === cleanName);
};

/**
 * Sorting-safe team pair identity key maker using team.id.
 * Team identity must be based on team.id. Team name is display-only.
 * India vs Australia and Australia vs India produce the same key.
 */
export const makeTeamPairKey = (team1Id: string, team2Id: string): string => {
    if (!team1Id || !team2Id) return '';
    const sorted = [team1Id, team2Id].sort();
    return `${sorted[0]}_${sorted[1]}`;
};

/**
 * Gets legacy name-based rivalry key for backward compatibility.
 */
export const makeLegacyNameRivalryKey = (team1Name: string, team2Name: string): string => {
    const t1 = team1Name ? team1Name.trim().toLowerCase() : '';
    const t2 = team2Name ? team2Name.trim().toLowerCase() : '';
    if (!t1 || !t2) return '';
    const sorted = [t1, t2].sort();
    return `${sorted[0]}_${sorted[1]}`;
};

/**
 * Checks if a given match belongs to the specified rivalry search key
 * (supports either ID-based rivalry key or name-based legacy rivalry key fallback).
 */
export const matchBelongsToRivalry = (match: Match, searchRivalryKey: string, allTeams: Team[]): boolean => {
    if (!searchRivalryKey) return false;
    
    // Direct match on current field
    if (match.rivalryKey === searchRivalryKey) {
        return true;
    }
    
    // Check ID-based comparison
    const t1Id = match.team1Id;
    const t2Id = match.team2Id;
    if (t1Id && t2Id) {
        const idKey = makeTeamPairKey(t1Id, t2Id);
        if (idKey === searchRivalryKey) {
            return true;
        }
        
        // Check name-based fallback if matches or teams have names
        const t1 = allTeams.find(t => t.id === t1Id);
        const t2 = allTeams.find(t => t.id === t2Id);
        if (t1 && t2) {
            const legacyKey = makeLegacyNameRivalryKey(t1.name, t2.name);
            if (legacyKey === searchRivalryKey) {
                return true;
            }
        }
    }
    
    return false;
};
