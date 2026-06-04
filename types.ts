

import type { SyncStatus } from './utils/idGenerator';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'standard';

export interface BowlerLimitException {
    type: "BOWLER_LIMIT_EXCEPTION";
    bowlerId: string;
    limit: number;
    timestamp: number;
}

export type MatchException = BowlerLimitException;

export enum PlayerRole {
    BATSMAN = 'Batsman',
    BOWLER = 'Bowler',
    ALL_ROUNDER = 'All-Rounder',
    WICKET_KEEPER = 'Wicket Keeper'
}

export enum BattingStatus {
    NOT_OUT = 'Not Out',
    OUT = 'Out',
    RETIRED_HURT = 'Retired Hurt',
}

export enum WicketType {
    BOWLED = 'Bowled',
    CAUGHT = 'Caught',
    LBW = 'LBW',
    STUMPED = 'Stumped',
    HIT_WICKET = 'Hit Wicket',
    RUN_OUT = 'Run Out',
}

export interface Player {
    id: string;
    originalId?: string;
    globalPlayerId?: string;
    number: number;
    name: string;
    role: PlayerRole;
}

export interface Team {
    id: string;
    ownerId?: string;
    name: string;
    logo: string;
    players: Player[];
    captainId: string | null;
    viceCaptainId: string | null;
    createdAt?: string;
    updatedAt?: string;
    syncStatus?: SyncStatus;
}

export interface ScheduleMatch {
  team1Id: string;
  team2Id: string;
  groupId?: 'a' | 'b';
}

export interface ScheduleRound {
  round: number;
  matches: ScheduleMatch[];
  groupName?: string;
}

export interface Tournament {
    id: string;
    ownerId?: string;
    name: string;
    location: string;
    defaultOvers?: number;
    createdDate?: string; // Legacy
    numberOfPlayers?: number;
    startDate?: string;
    endDate?: string;
    teamIds: string[];
    stage?: 'group' | 'semifinals' | 'final';
    format?: 'Round Robin' | 'Knockout' | 'Round Robin + Knockout';
    draftSchedule?: ScheduleRound[];
    groups?: { a: string[], b: string[] };
    createdAt?: string;
    updatedAt?: string;
    syncStatus?: SyncStatus;
}

export type TossWinner = 'team1' | 'team2';
export type TossDecision = 'bat' | 'bowl';

export interface Toss {
    winner: Team['id'];
    decision: TossDecision;
}

export interface Ball {
    ballId?: string;
    timestamp?: string;
    syncStatus?: SyncStatus;
    ballNumber: number; // 1-6
    overNumber: number;
    bowlerId: Player['id'];
    batsmanId: Player['id']; // Always the striker for the delivery
    runs: number;
    isWide: boolean;
    isNoBall: boolean;
    isBye: boolean;
    isLegBye: boolean;
    isWicket: boolean;
    wicket?: {
        type: WicketType;
        playerId: Player['id']; // The player who is out
        fielderIds?: Player['id'][];
    };
}

export interface Over {
    overNumber: number;
    balls: Ball[];
}

export interface BatsmanScore {
    playerId: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    status: BattingStatus;
    outDetails?: {
        bowlerId: Player['id'];
        type: WicketType;
        fielders?: Player['id'][];
    };
}

export interface BowlerScore {
    playerId: string;
    overs: number;
    maidens: number;
    runsConceded: number;
    wickets: number;
}

export interface Innings {
    battingTeamId: Team['id'];
    bowlingTeamId: Team['id'];
    score: number;
    wickets: number;
    overs: number;
    balls: Ball[];
    batsmanScores: Record<Player['id'], BatsmanScore>;
    bowlerScores: Record<Player['id'], BowlerScore>;
    currentBatsmen: [Player['id'], Player['id'] | null];
    currentBowler: Player['id'] | null;
    lastBowlerId?: Player['id'] | null;
    initialBatsmen?: [Player['id'], Player['id'] | null];
    initialBowler?: Player['id'] | null;
    isFreeHit?: boolean;
    exceptions?: (string | MatchException)[];
    manualOverrides?: {
        ballIndex: number;
        batsmen: [string, string | null];
        bowler: string | null;
    }[];
}

export interface Match {
    id: string;
    ownerId?: string;
    matchId?: string; // Stable metadata
    createdAt?: string;
    updatedAt?: string;
    syncStatus?: SyncStatus;
    tournamentId: string;
    team1Id: Team['id'];
    team2Id: Team['id'];
    date: string;
    time?: string;
    oversPerInnings: number;
    maxOversPerBowler?: number;
    status: 'scheduled' | 'live' | 'completed';
    toss?: Toss;
    innings1?: Innings;
    innings2?: Innings;
    winnerId?: Team['id'] | 'draw';
    manOfTheMatchId?: Player['id'];
    isQuickMatch?: boolean;
    numberOfPlayers?: number;
    team1SquadIds?: string[]; // Match Squad separation (Step 1)
    team2SquadIds?: string[]; // Match Squad separation (Step 1)
    isDraft?: boolean;
    wasAbandoned?: boolean;
    knockoutType?: 'semifinal' | 'final';
    groupId?: 'a' | 'b';
    replacements?: PlayerReplacement[];
}

export interface PlayerReplacement {
    teamId: string;
    outgoingPlayerId: string;
    incomingPlayerId: string;
    replacedAt: string;
    reason?: string;
}

export interface PlayerCareerStats {
    matches: number;
    // Batting
    inningsBatted: number;
    notOuts: number;
    runsScored: number;
    ballsFaced: number;
    highScore: number;
    battingAverage: string;
    strikeRate: string;
    hundreds: number;
    fifties: number;
    thirties: number;
    fours: number;
    sixes: number;
    // Bowling
    inningsBowled: number;
    ballsBowled: number;
    oversBowled: string;
    runsConceded: number;
    wicketsTaken: number;
    maidens: number;
    bowlingAverage: string;
    economyRate: string;
    bestBowlingInnings: string; 
}

export interface Performance {
    playerId: string;
    name: string;
    teamName: string;
    score: number;
    battingStats: string;
    bowlingStats: string;
}

export interface PointsTableData {
    teamId: string;
    teamName: string;
    logo: string;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    points: number;
    nrr: string;
}