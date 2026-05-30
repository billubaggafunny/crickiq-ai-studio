import { Tournament, Team, PlayerRole, Match, Innings } from '../types';

export const generateDefaultRoles = (playerCount: number): PlayerRole[] => {
    if (playerCount <= 0) return [];

    const roles: PlayerRole[] = [];

    // Always have one Wicket Keeper
    if (playerCount > 0) {
        roles.push(PlayerRole.WICKET_KEEPER);
    }

    const remainingPlayers = playerCount - 1;
    if (remainingPlayers < 0) return roles;

    // Distribute remaining roles
    const numBatsmen = Math.round(remainingPlayers * 0.4);
    const numAllRounders = Math.round(remainingPlayers * 0.3);
    const numBowlers = remainingPlayers - numBatsmen - numAllRounders;

    for (let i = 0; i < numBatsmen; i++) roles.push(PlayerRole.BATSMAN);
    for (let i = 0; i < numAllRounders; i++) roles.push(PlayerRole.ALL_ROUNDER);
    for (let i = 0; i < numBowlers; i++) roles.push(PlayerRole.BOWLER);
    
    // In case of rounding issues, fill remaining slots with batsmen
    while (roles.length < playerCount) {
        roles.push(PlayerRole.BATSMAN);
    }
    
    // Ensure we don't exceed playerCount and sort for a consistent order
    const finalRoles = roles.slice(0, playerCount);
    const order = {
        [PlayerRole.BATSMAN]: 1,
        [PlayerRole.WICKET_KEEPER]: 2,
        [PlayerRole.ALL_ROUNDER]: 3,
        [PlayerRole.BOWLER]: 4
    };
    return finalRoles.sort((a,b) => order[a] - order[b]);
};

export const LOGO_OPTIONS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

export const initialTournaments: Tournament[] = [
    { 
        id: 't_demo_league', 
        name: 'CrickIQ Demo League', 
        location: 'Global Stadium', 
        defaultOvers: 20, 
        createdDate: '2024-07-20T10:00:00Z',
        numberOfPlayers: 11, 
        startDate: '2024-07-21', 
        endDate: '2024-08-05', 
        teamIds: ['team1', 'team2', 'team3', 'team4', 'team5', 'team6'],
        stage: 'final',
        format: 'Round Robin',
    },
    { 
        id: 't_demo_knockout', 
        name: 'CrickIQ Knockout Challenge', 
        location: 'Knockout Arena', 
        defaultOvers: 10, 
        createdDate: '2024-07-25T10:00:00Z',
        numberOfPlayers: 11, 
        startDate: '2024-08-10', 
        endDate: '2024-08-12', 
        teamIds: ['t7', 't8', 't9', 't10', 't11', 't12', 't13', 't14'],
        stage: 'final',
        format: 'Knockout',
    },
    { id: 't1', name: 'Summer Smash 2024', location: 'Green Park Stadium', defaultOvers: 20, createdDate: new Date().toISOString(), numberOfPlayers: 11, startDate: '2024-08-01', endDate: '2024-08-15', teamIds: ['team1', 'team2', 'team3', 'team4', 'team5'] }
];

export const initialTeams: Team[] = [
    { 
        id: 'team1', 
        name: 'Royal Challengers', 
        logo: '#3B82F6',
        players: [
            { id: 'p1', number: 7, name: 'Arjun Singh', role: PlayerRole.BATSMAN },
            { id: 'p2', number: 18, name: 'Rohan Sharma', role: PlayerRole.BATSMAN },
            { id: 'p3', number: 22, name: 'Vihaan Mehta', role: PlayerRole.WICKET_KEEPER },
            { id: 'p4', number: 5, name: 'Kabir Gupta', role: PlayerRole.BATSMAN },
            { id: 'p5', number: 99, name: 'Ishaan Patel', role: PlayerRole.BATSMAN },
            { id: 'p6', number: 33, name: 'Liam Johnson', role: PlayerRole.ALL_ROUNDER },
            { id: 'p7', number: 12, name: 'Sai Krishna', role: PlayerRole.ALL_ROUNDER },
            { id: 'p8', number: 47, name: 'Advik Reddy', role: PlayerRole.ALL_ROUNDER },
            { id: 'p9', number: 91, name: 'Ben Clark', role: PlayerRole.BOWLER },
            { id: 'p10', number: 8, name: 'Yusuf Ahmed', role: PlayerRole.BOWLER },
            { id: 'p11', number: 1, name: 'Prakash Desai', role: PlayerRole.BOWLER }
        ], 
        captainId: 'p1', 
        viceCaptainId: 'p6'
    },
    { 
        id: 'team2', 
        name: 'Super Kings', 
        logo: '#F97316',
        players: [
            { id: 'p12', number: 3, name: 'Ethan Williams', role: PlayerRole.BATSMAN },
            { id: 'p13', number: 77, name: 'Aditya Nair', role: PlayerRole.WICKET_KEEPER },
            { id: 'p14', number: 10, name: 'Finn Brown', role: PlayerRole.BATSMAN },
            { id: 'p15', number: 25, name: 'Michael Davis', role: PlayerRole.BATSMAN },
            { id: 'p16', number: 42, name: 'Dev Kumar', role: PlayerRole.BATSMAN },
            { id: 'p17', number: 55, name: 'Carlos Gomez', role: PlayerRole.ALL_ROUNDER },
            { id: 'p18', number: 11, name: 'Nikhil Varma', role: PlayerRole.ALL_ROUNDER },
            { id: 'p19', number: 2, name: 'Ravi Joshi', role: PlayerRole.ALL_ROUNDER },
            { id: 'p20', number: 88, name: 'Tom Mills', role: PlayerRole.BOWLER },
            { id: 'p21', number: 19, name: 'Imran Ali', role: PlayerRole.BOWLER },
            { id: 'p22', number: 6, name: 'Sandeep Rai', role: PlayerRole.BOWLER }
        ], 
        captainId: 'p12', 
        viceCaptainId: 'p17'
    },
    {
        id: 'team3',
        name: 'Mumbai Indians',
        logo: '#8B5CF6',
        players: [
            { id: 'p23', number: 45, name: 'Aryan Khan', role: PlayerRole.BATSMAN },
            { id: 'p24', number: 10, name: 'Samir Joshi', role: PlayerRole.BATSMAN },
            { id: 'p25', number: 8, name: 'Leo Martinez', role: PlayerRole.BATSMAN },
            { id: 'p26', number: 77, name: 'Oscar Brown', role: PlayerRole.BATSMAN },
            { id: 'p27', number: 23, name: 'Rohan Kumar', role: PlayerRole.WICKET_KEEPER },
            { id: 'p28', number: 50, name: 'Chris Green', role: PlayerRole.ALL_ROUNDER },
            { id: 'p29', number: 3, name: 'Ankit Sharma', role: PlayerRole.ALL_ROUNDER },
            { id: 'p30', number: 99, name: 'David Lee', role: PlayerRole.BOWLER },
            { id: 'p31', number: 17, name: 'Farhan Ali', role: PlayerRole.BOWLER },
            { id: 'p32', number: 21, name: 'George King', role: PlayerRole.BOWLER },
            { id: 'p33', number: 1, name: 'Henry Scott', role: PlayerRole.BOWLER },
        ],
        captainId: 'p23',
        viceCaptainId: 'p28'
    },
    {
        id: 'team4',
        name: 'Delhi Capitals',
        logo: '#EF4444',
        players: [
            { id: 'p34', number: 4, name: 'Neel Patil', role: PlayerRole.BATSMAN },
            { id: 'p35', number: 19, name: 'Omar Hassan', role: PlayerRole.BATSMAN },
            { id: 'p36', number: 28, name: 'Parth Shah', role: PlayerRole.BATSMAN },
            { id: 'p37', number: 66, name: 'Quinn Hall', role: PlayerRole.BATSMAN },
            { id: 'p38', number: 1, name: 'Ryan Taylor', role: PlayerRole.WICKET_KEEPER },
            { id: 'p39', number: 49, name: 'Steve Smith', role: PlayerRole.ALL_ROUNDER },
            { id: 'p40', number: 7, name: 'Tim Anderson', role: PlayerRole.ALL_ROUNDER },
            { id: 'p41', number: 81, name: 'Umar Farooq', role: PlayerRole.BOWLER },
            { id: 'p42', number: 12, name: 'Victor Chen', role: PlayerRole.BOWLER },
            { id: 'p43', number: 33, name: 'Walter White', role: PlayerRole.BOWLER },
            { id: 'p44', number: 9, name: 'Xavier Jones', role: PlayerRole.BOWLER },
        ],
        captainId: 'p34',
        viceCaptainId: 'p39'
    },
    {
        id: 'team5',
        name: 'Kolkata Knight Riders',
        logo: '#EAB308',
        players: [
            { id: 'p45', number: 2, name: 'Yash Verma', role: PlayerRole.BATSMAN },
            { id: 'p46', number: 93, name: 'Zayn Malik', role: PlayerRole.BATSMAN },
            { id: 'p47', number: 5, name: 'Aaron Finch', role: PlayerRole.BATSMAN },
            { id: 'p48', number: 9, name: 'Brian Lara', role: PlayerRole.BATSMAN },
            { id: 'p49', number: 41, name: 'Charlie Dean', role: PlayerRole.WICKET_KEEPER },
            { id: 'p50', number: 11, name: 'Daniel Vettori', role: PlayerRole.ALL_ROUNDER },
            { id: 'p51', number: 22, name: 'Evan Lewis', role: PlayerRole.ALL_ROUNDER },
            { id: 'p52', number: 8, name: 'Franklyn Rose', role: PlayerRole.BOWLER },
            { id: 'p53', number: 16, name: 'Gus Atkinson', role: PlayerRole.BOWLER },
            { id: 'p54', number: 88, name: 'Harry Brook', role: PlayerRole.BOWLER },
            { id: 'p55', number: 25, name: 'Ian Bell', role: PlayerRole.BOWLER },
        ],
        captainId: 'p45',
        viceCaptainId: 'p50'
    },
    { 
        id: 'team6', 
        name: 'Sunrisers', 
        logo: '#F472B6',
        players: [
            { id: 'p56', number: 27, name: 'David Warner', role: PlayerRole.BATSMAN },
            { id: 'p57', number: 7, name: 'Jonny Bairstow', role: PlayerRole.WICKET_KEEPER },
            { id: 'p58', number: 22, name: 'Kane Williamson', role: PlayerRole.BATSMAN },
            { id: 'p59', number: 9, name: 'Manish Pandey', role: PlayerRole.BATSMAN },
            { id: 'p60', number: 59, name: 'Vijay Shankar', role: PlayerRole.ALL_ROUNDER },
            { id: 'p61', number: 19, name: 'Rashid Khan', role: PlayerRole.ALL_ROUNDER },
            { id: 'p62', number: 1, name: 'Abdul Samad', role: PlayerRole.BATSMAN },
            { id: 'p63', number: 15, name: 'B. Kumar', role: PlayerRole.BOWLER },
            { id: 'p64', number: 44, name: 'T. Natarajan', role: PlayerRole.BOWLER },
            { id: 'p65', number: 16, name: 'Sandeep Sharma', role: PlayerRole.BOWLER },
            { id: 'p66', number: 2, name: 'Khaleel Ahmed', role: PlayerRole.BOWLER }
        ], 
        captainId: 'p56', 
        viceCaptainId: 'p61'
    },
    // Knockout Demo Teams
    ...Array.from({ length: 8 }, (_, i) => {
        const teamId = `t${i + 7}`;
        const teamNames = ['Lions XI', 'Panthers', 'Stallions', 'Eagles', 'Sharks', 'Tigers', 'Wolves', 'Cobras'];
        const logos = ['#D97706', '#4B5563', '#7C3AED', '#047857', '#0E7490', '#BE123C', '#57534E', '#16A34A'];
        return {
            id: teamId,
            name: teamNames[i],
            logo: logos[i],
            players: Array.from({ length: 11 }, (__, p_idx) => ({
                id: `p${67 + i * 11 + p_idx}`,
                number: p_idx + 1,
                name: `${teamNames[i].split(' ')[0]} Player ${p_idx + 1}`,
                role: p_idx < 4 ? PlayerRole.BATSMAN : p_idx === 4 ? PlayerRole.WICKET_KEEPER : p_idx < 7 ? PlayerRole.ALL_ROUNDER : PlayerRole.BOWLER
            })),
            captainId: `p${67 + i * 11}`,
            viceCaptainId: `p${67 + i * 11 + 5}`
        };
    })
];

const createDummyInnings = (battingTeamId: string, bowlingTeamId: string, score: number, wickets: number, overs: number): Innings => ({
    battingTeamId, bowlingTeamId, score, wickets, overs, balls: [],
    batsmanScores: {}, bowlerScores: {}, currentBatsmen: ['', null], currentBowler: null
});

export const initialMatches: Match[] = [
    // --- DEMO LEAGUE MATCHES ---
    // T1 (4W, 1L)
    { id: 'm_demo_1', tournamentId: 't_demo_league', team1Id: 'team2', team2Id: 'team1', date: '2024-07-21', status: 'completed', oversPerInnings: 20, winnerId: 'team1', innings1: createDummyInnings('team2', 'team1', 180, 6, 20), innings2: createDummyInnings('team1', 'team2', 181, 4, 19.1) },
    { id: 'm_demo_2', tournamentId: 't_demo_league', team1Id: 'team1', team2Id: 'team3', date: '2024-07-22', status: 'completed', oversPerInnings: 20, winnerId: 'team1', innings1: createDummyInnings('team3', 'team1', 150, 8, 20), innings2: createDummyInnings('team1', 'team3', 151, 2, 16.4) },
    { id: 'm_demo_3', tournamentId: 't_demo_league', team1Id: 'team4', team2Id: 'team1', date: '2024-07-23', status: 'completed', oversPerInnings: 20, winnerId: 'team1', innings1: createDummyInnings('team4', 'team1', 165, 9, 20), innings2: createDummyInnings('team1', 'team4', 166, 5, 19.5) },
    { id: 'm_demo_4', tournamentId: 't_demo_league', team1Id: 'team1', team2Id: 'team5', date: '2024-07-24', status: 'completed', oversPerInnings: 20, winnerId: 'team1', innings1: createDummyInnings('team1', 'team5', 205, 4, 20), innings2: createDummyInnings('team5', 'team1', 170, 10, 19.2) },
    { id: 'm_demo_5', tournamentId: 't_demo_league', team1Id: 'team6', team2Id: 'team1', date: '2024-07-25', status: 'completed', oversPerInnings: 20, winnerId: 'team6', innings1: createDummyInnings('team6', 'team1', 175, 5, 20), innings2: createDummyInnings('team1', 'team6', 160, 10, 19.4) },
    // T2 (4W, 1L)
    { id: 'm_demo_6', tournamentId: 't_demo_league', team1Id: 'team2', team2Id: 'team3', date: '2024-07-26', status: 'completed', oversPerInnings: 20, winnerId: 'team2', innings1: createDummyInnings('team2', 'team3', 190, 5, 20), innings2: createDummyInnings('team3', 'team2', 185, 7, 20) },
    { id: 'm_demo_7', tournamentId: 't_demo_league', team1Id: 'team4', team2Id: 'team2', date: '2024-07-27', status: 'completed', oversPerInnings: 20, winnerId: 'team2', innings1: createDummyInnings('team4', 'team2', 140, 10, 18.5), innings2: createDummyInnings('team2', 'team4', 141, 3, 15.1) },
    { id: 'm_demo_8', tournamentId: 't_demo_league', team1Id: 'team2', team2Id: 'team5', date: '2024-07-28', status: 'completed', oversPerInnings: 20, winnerId: 'team2', innings1: createDummyInnings('team5', 'team2', 130, 9, 20), innings2: createDummyInnings('team2', 'team5', 133, 1, 14.0) },
    { id: 'm_demo_9', tournamentId: 't_demo_league', team1Id: 'team6', team2Id: 'team2', date: '2024-07-29', status: 'completed', oversPerInnings: 20, winnerId: 'team2', innings1: createDummyInnings('team2', 'team6', 170, 7, 20), innings2: createDummyInnings('team6', 'team2', 168, 8, 20) },
    // T3 (3W, 2L)
    { id: 'm_demo_10', tournamentId: 't_demo_league', team1Id: 'team3', team2Id: 'team4', date: '2024-07-30', status: 'completed', oversPerInnings: 20, winnerId: 'team3', innings1: createDummyInnings('team3', 'team4', 160, 6, 20), innings2: createDummyInnings('team4', 'team3', 155, 9, 20) },
    { id: 'm_demo_11', tournamentId: 't_demo_league', team1Id: 'team5', team2Id: 'team3', date: '2024-07-31', status: 'completed', oversPerInnings: 20, winnerId: 'team3', innings1: createDummyInnings('team5', 'team3', 145, 10, 19.3), innings2: createDummyInnings('team3', 'team5', 146, 6, 18.2) },
    { id: 'm_demo_12', tournamentId: 't_demo_league', team1Id: 'team3', team2Id: 'team6', date: '2024-08-01', status: 'completed', oversPerInnings: 20, winnerId: 'team3', innings1: createDummyInnings('team6', 'team3', 125, 10, 17.5), innings2: createDummyInnings('team3', 'team6', 126, 2, 13.0) },
    // T4 (2W, 3L)
    { id: 'm_demo_13', tournamentId: 't_demo_league', team1Id: 'team4', team2Id: 'team5', date: '2024-08-02', status: 'completed', oversPerInnings: 20, winnerId: 'team4', innings1: createDummyInnings('team4', 'team5', 180, 5, 20), innings2: createDummyInnings('team5', 'team4', 160, 8, 20) },
    { id: 'm_demo_14', tournamentId: 't_demo_league', team1Id: 'team6', team2Id: 'team4', date: '2024-08-03', status: 'completed', oversPerInnings: 20, winnerId: 'team4', innings1: createDummyInnings('team6', 'team4', 150, 9, 20), innings2: createDummyInnings('team4', 'team6', 154, 7, 19.4) },
    // T5 (1W, 4L)
    { id: 'm_demo_15', tournamentId: 't_demo_league', team1Id: 'team5', team2Id: 'team6', date: '2024-08-04', status: 'completed', oversPerInnings: 20, winnerId: 'team5', innings1: createDummyInnings('team5', 'team6', 195, 4, 20), innings2: createDummyInnings('team6', 'team5', 190, 6, 20) },
    // Final
    { id: 'm_demo_final', tournamentId: 't_demo_league', team1Id: 'team1', team2Id: 'team2', date: '2024-08-05', status: 'completed', oversPerInnings: 20, winnerId: 'team1', knockoutType: 'final', manOfTheMatchId: 'p6', innings1: createDummyInnings('team1', 'team2', 198, 5, 20), innings2: createDummyInnings('team2', 'team1', 182, 9, 20) },

    // --- KNOCKOUT DEMO MATCHES ---
    // Quarter-Finals
    { id: 'm_ko_qf1', tournamentId: 't_demo_knockout', team1Id: 't7', team2Id: 't8', date: '2024-08-10', status: 'completed', oversPerInnings: 10, winnerId: 't7', innings1: createDummyInnings('t8', 't7', 80, 8, 10), innings2: createDummyInnings('t7', 't8', 81, 2, 8.1) },
    { id: 'm_ko_qf2', tournamentId: 't_demo_knockout', team1Id: 't9', team2Id: 't10', date: '2024-08-10', status: 'completed', oversPerInnings: 10, winnerId: 't10', innings1: createDummyInnings('t9', 't10', 95, 6, 10), innings2: createDummyInnings('t10', 't9', 96, 5, 9.4) },
    { id: 'm_ko_qf3', tournamentId: 't_demo_knockout', team1Id: 't11', team2Id: 't12', date: '2024-08-10', status: 'completed', oversPerInnings: 10, winnerId: 't11', innings1: createDummyInnings('t11', 't12', 110, 4, 10), innings2: createDummyInnings('t12', 't11', 85, 10, 9.2) },
    { id: 'm_ko_qf4', tournamentId: 't_demo_knockout', team1Id: 't13', team2Id: 't14', date: '2024-08-10', status: 'completed', oversPerInnings: 10, winnerId: 't14', innings1: createDummyInnings('t13', 't14', 70, 9, 10), innings2: createDummyInnings('t14', 't13', 71, 1, 6.5) },
    // Semi-Finals
    { id: 'm_ko_sf1', tournamentId: 't_demo_knockout', team1Id: 't7', team2Id: 't10', date: '2024-08-11', status: 'completed', oversPerInnings: 10, winnerId: 't7', knockoutType: 'semifinal', innings1: createDummyInnings('t7', 't10', 105, 5, 10), innings2: createDummyInnings('t10', 't7', 100, 7, 10) },
    { id: 'm_ko_sf2', tournamentId: 't_demo_knockout', team1Id: 't11', team2Id: 't14', date: '2024-08-11', status: 'completed', oversPerInnings: 10, winnerId: 't14', knockoutType: 'semifinal', innings1: createDummyInnings('t11', 't14', 92, 8, 10), innings2: createDummyInnings('t14', 't11', 93, 4, 9.0) },
    // Final
    { id: 'm_ko_f1', tournamentId: 't_demo_knockout', team1Id: 't7', team2Id: 't14', date: '2024-08-12', status: 'completed', oversPerInnings: 10, winnerId: 't14', knockoutType: 'final', manOfTheMatchId: 'p148', innings1: createDummyInnings('t7', 't14', 88, 9, 10), innings2: createDummyInnings('t14', 't7', 89, 3, 8.4) },

    // --- Original Match ---
    { id: 'm1', tournamentId: 't1', team1Id: 'team1', team2Id: 'team2', date: '2024-08-15', time: '10:00', status: 'scheduled', oversPerInnings: 20 }
];
