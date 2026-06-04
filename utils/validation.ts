export interface ValidationResult {
    valid: boolean;
    message?: string;
}

export function validatePositiveInteger(value: string | number | undefined, fieldName: string = 'Value'): ValidationResult {
    if (value === undefined || value === null || value === '') {
        return { valid: false, message: `${fieldName} is required.` };
    }
    const num = Number(value);
    if (!Number.isInteger(num)) {
        return { valid: false, message: `${fieldName} must be a whole number.` };
    }
    if (num <= 0) {
        return { valid: false, message: `${fieldName} must be greater than 0.` };
    }
    return { valid: true };
}

export function validateMatchOvers(overs: string | number): ValidationResult {
    const num = Number(overs);
    if (!Number.isInteger(num) || num < 1 || num > 100) {
        return { valid: false, message: "Overs must be a valid number between 1 and 100." };
    }
    return { valid: true };
}

export function validateMaxOversPerBowler(maxOvers: string | number | undefined, matchOvers: string | number): ValidationResult {
    if (maxOvers === undefined || maxOvers === null || maxOvers === '') {
        return { valid: true }; // It's optional, so valid if not provided
    }
    const maxOversNum = Number(maxOvers);
    const matchOversNum = Number(matchOvers);
    
    // We already validate match overs elsewhere, but need to check it here too just in case
    if (!Number.isInteger(maxOversNum) || maxOversNum < 1 || (Number.isInteger(matchOversNum) && maxOversNum > matchOversNum)) {
        return { valid: false, message: "Maximum Overs Per Bowler must be a whole number between 1 and Match Overs." };
    }
    return { valid: true };
}

export function validateTeamSelection(team1Id: string | undefined, team2Id: string | undefined): ValidationResult {
    if (!team1Id || !team2Id) {
        return { valid: false, message: "Both teams must be selected." };
    }
    if (team1Id === team2Id) {
        return { valid: false, message: "A team cannot play against itself." };
    }
    return { valid: true };
}

export function validateMatchDate(matchDate: string | undefined): ValidationResult {
    if (!matchDate) {
        return { valid: false, message: "Match date is required." };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(matchDate.replace(/-/g, '/'));
    if (selectedDateObj < today) {
        return { valid: false, message: "Cannot schedule a match for a past date." };
    }
    return { valid: true };
}

export function validateTournamentMatch(
    tournamentId: string | undefined,
    team1Id: string | undefined,
    team2Id: string | undefined,
    matchDate: string | undefined,
    matchTime: string | undefined,
    overs: string | number,
    maxOvers?: string | number
): ValidationResult {
    if (!tournamentId) return { valid: false, message: "Tournament is required." };
    
    const teamVal = validateTeamSelection(team1Id, team2Id);
    if (!teamVal.valid) return teamVal;

    const dateVal = validateMatchDate(matchDate);
    if (!dateVal.valid) return dateVal;
    
    if (!matchTime) return { valid: false, message: "Match time is required." };
    
    const oversVal = validateMatchOvers(overs);
    if (!oversVal.valid) return oversVal;
    
    const maxOversVal = validateMaxOversPerBowler(maxOvers, overs);
    if (!maxOversVal.valid) return maxOversVal;
    
    return { valid: true };
}

export function validateQuickMatch(
    team1Name: string,
    team2Name: string,
    overs: string | number,
    players: string | number,
    maxOvers?: string | number
): ValidationResult {
    if (!team1Name || !team1Name.trim() || !team2Name || !team2Name.trim()) {
        return { valid: false, message: 'Team names are required.' };
    }

    if (team1Name.trim().length > 30 || team2Name.trim().length > 30) {
        return { valid: false, message: 'Team names cannot exceed 30 characters.' };
    }

    if (team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase()) {
        return { valid: false, message: 'Team names cannot be the same.' };
    }

    const oversVal = validateMatchOvers(overs);
    if (!oversVal.valid) return oversVal;

    const playersNum = Number(players);
    if (!Number.isInteger(playersNum) || playersNum < 2 || playersNum > 11) {
        return { valid: false, message: 'Players per team must be between 2 and 11.' };
    }

    const maxOversVal = validateMaxOversPerBowler(maxOvers, overs);
    if (!maxOversVal.valid) return maxOversVal;

    return { valid: true };
}

export function validatePlayer(
    playerName: string,
    playerNumber: string | number,
    playerRole: string,
    existingPlayers: { name: string; number: number; id?: string }[],
    currentPlayerId?: string
): { valid: boolean, errors: { name: string | null; number: string | null; role: string | null; } } {
    const errors = { name: null as string | null, number: null as string | null, role: null as string | null };
    const num = Number(playerNumber);
    const trimmedName = playerName.trim();

    if (!trimmedName) errors.name = "Name required.";
    else if (trimmedName.length > 30) errors.name = "Name too long.";
    else if (existingPlayers.some(p => p.id !== currentPlayerId && p.name.trim().toLowerCase() === trimmedName.toLowerCase())) errors.name = "Name taken.";
    
    if (playerNumber === '') errors.number = "Number required.";
    else if (!Number.isInteger(num) || num <= 0) errors.number = "Positive # required.";
    else if (existingPlayers.some(p => p.id !== currentPlayerId && p.number === num)) errors.number = "# taken.";
    
    if (!playerRole) errors.role = "Role required.";

    return { 
        valid: !Object.values(errors).some(Boolean),
        errors
    };
}

export function validatePlayerData(player: { id?: string; name: string; number: string | number; role: string }, teamPlayers: { name: string; number: number; id?: string }[]) {
    return validatePlayer(player.name, player.number, player.role, teamPlayers, player.id);
}

import type { Team } from '../types';

export function validateTeamRoster(team: Team, maxPlayers: number) {
    const minPlayersRequired = 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const hasMinimumPlayers = team.players.length >= minPlayersRequired;
    const withinMaxPlayers = team.players.length <= maxPlayers;
    const hasCaptain = !!team.captainId && team.players.some(p => p.id === team.captainId);
    const hasViceCaptain = !!team.viceCaptainId && team.players.some(p => p.id === team.viceCaptainId);
    const hasWicketKeeper = team.players.some(p => p.role === 'Wicket Keeper');

    const numbers = new Set<number>();
    const names = new Set<string>();
    let noDuplicateNumbers = true;
    let noDuplicateNames = true;

    team.players.forEach(player => {
        if (!player.name || !player.name.trim()) errors.push(`Player without a name found.`);
        if (!player.role) errors.push(`Player ${player.name} is missing a role.`);
        
        if (numbers.has(player.number)) {
            noDuplicateNumbers = false;
        }
        numbers.add(player.number);

        const lowerName = player.name.trim().toLowerCase();
        if (names.has(lowerName)) {
            noDuplicateNames = false;
        }
        names.add(lowerName);
    });

    if (!noDuplicateNumbers) errors.push('Duplicate jersey numbers found.');
    if (!noDuplicateNames) errors.push('Duplicate player names found.');

    if (!hasCaptain && team.players.length > 0) errors.push('A team must have a captain.');
    if (!hasViceCaptain && team.players.length > 0) errors.push('A team must have a vice-captain.');
    
    // According to existing logic, if it's full it MUST have a keeper
    if (team.players.length === maxPlayers && !hasWicketKeeper) {
        errors.push(`A team of ${maxPlayers} must have one designated Wicket Keeper.`);
    }

    if (team.captainId && team.captainId === team.viceCaptainId) {
        errors.push('Captain and Vice-Captain cannot be the same player.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        checks: {
            hasMinimumPlayers,
            withinMaxPlayers,
            hasCaptain,
            hasViceCaptain,
            hasWicketKeeper,
            noDuplicateNumbers,
            noDuplicateNames
        }
    };
}

export function canEnableSetToss(team1: Team | undefined, team2: Team | undefined, defaultOvers: number | string, maxPlayersA: number = 11, maxPlayersB: number = 11) {
    if (!team1 || !team2) return { canEnable: false, teamAValid: false, teamBValid: false, teamAErrors: [], teamBErrors: [] };

    const t1Val = validateTeamRoster(team1, maxPlayersA);
    const t2Val = validateTeamRoster(team2, maxPlayersB);

    const hasEqualPlayers = team1.players.length === team2.players.length;
    
    const oversVal = validatePositiveInteger(defaultOvers, 'match');
    
    // Note: To match existing QuickMatchSetup code closely, we verify if they have equal players and equal to maxPlayers
    const teamAHasEnough = team1.players.length === maxPlayersA;
    const teamBHasEnough = team2.players.length === maxPlayersB;
    const canEnable = t1Val.isValid && t2Val.isValid && teamAHasEnough && teamBHasEnough && hasEqualPlayers && oversVal.valid;

    return {
        canEnable,
        teamAValid: t1Val.isValid,
        teamBValid: t2Val.isValid,
        teamAErrors: t1Val.errors,
        teamBErrors: t2Val.errors
    };
}
