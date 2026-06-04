export interface PlayerNavigationPayload {
    sourceScreen: 'QuickMatchSetup' | 'TournamentTeamSetup' | 'TeamDetailsPage' | 'MatchManager';
    sourceTeamSide?: 'team1' | 'team2';
    teamId: string;
    playerId?: string;
    matchId?: string;
    tournamentId?: string;
    returnTo: string;
    mode: 'add' | 'edit' | 'view';
}
