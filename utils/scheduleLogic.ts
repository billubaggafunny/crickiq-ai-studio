import type {
  ScheduleMatch,
  ScheduleRound,
  Match,
  Tournament,
  Team,
} from "../types";
import { calculatePointsTable } from "./cricketLogic";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateRoundRobinSchedule(teamIds: string[]): ScheduleRound[] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) {
    teams.push("bye"); // Add a dummy team for odd number of teams
  }

  const schedule: ScheduleRound[] = [];
  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  // Create a working copy of teams we can mutate
  const teamList = teams.slice();

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: ScheduleMatch[] = [];
    for (let i = 0; i < half; i++) {
      const team1 = teamList[i];
      const team2 = teamList[numTeams - 1 - i];
      if (team1 !== "bye" && team2 !== "bye") {
        // Alternate home/away for fairness
        if (i === 0 && round % 2 !== 0) {
          roundMatches.push({ team1Id: team2, team2Id: team1 });
        } else {
          roundMatches.push({ team1Id: team1, team2Id: team2 });
        }
      }
    }
    schedule.push({ round: round + 1, matches: roundMatches });

    // Rotate teams for the next round, keeping the first team fixed
    const last = teamList.pop();
    if (last) {
      teamList.splice(1, 0, last);
    }
  }

  return schedule;
}

export function generateKnockoutSchedule(teamIds: string[]): ScheduleRound[] {
  const teams = shuffleArray(teamIds);
  const schedule: ScheduleRound[] = [];
  const roundMatches: ScheduleMatch[] = [];

  while (teams.length >= 2) {
    const team1 = teams.pop() as string;
    const team2 = teams.pop() as string;
    roundMatches.push({ team1Id: team1, team2Id: team2 });
  }

  // The remaining team gets a bye if there's an odd number of teams.
  // This is implicitly handled as they are just left in the `teams` array.

  if (roundMatches.length > 0) {
    // Reverse to get a more intuitive order since we pop from the end
    schedule.push({ round: 1, matches: roundMatches.reverse() });
  }

  return schedule;
}

export function generateRoundRobinPlusKnockoutSchedule(
  teamIds: string[],
  splitIntoGroups: boolean,
): { schedule: ScheduleRound[]; groups?: { a: string[]; b: string[] } } {
  if (splitIntoGroups) {
    // Two groups
    const shuffledTeams = shuffleArray(teamIds);
    const midPoint = Math.ceil(shuffledTeams.length / 2);
    const groupA = shuffledTeams.slice(0, midPoint);
    const groupB = shuffledTeams.slice(midPoint);

    const groupASchedule = generateRoundRobinSchedule(groupA).map((round) => ({
      ...round,
      groupName: "Group A",
      matches: round.matches.map((match) => ({
        ...match,
        groupId: "a" as const,
      })),
    }));

    const groupBSchedule = generateRoundRobinSchedule(groupB).map((round) => ({
      ...round,
      groupName: "Group B",
      matches: round.matches.map((match) => ({
        ...match,
        groupId: "b" as const,
      })),
    }));

    return {
      schedule: [...groupASchedule, ...groupBSchedule],
      groups: { a: groupA, b: groupB },
    };
  } else {
    // Single group round-robin
    return { schedule: generateRoundRobinSchedule(teamIds) };
  }
}

export function canGenerateKnockouts(
  tournament: Tournament,
  matches: Match[]
) {
  if (tournament.format !== "Round Robin + Knockout") {
    return {
      canGenerate: false,
      reason: "Tournament format does not support automatic knockouts.",
      mode: null,
    };
  }

  const tournamentMatches = matches.filter(
    (m) => m.tournamentId === tournament.id,
  );
  const leagueMatches = tournamentMatches.filter((m) => !m.knockoutType);
  const completedLeagueMatches = leagueMatches.filter(
    (m) => m.status === "completed",
  );

  if (leagueMatches.length === 0) {
    return {
      canGenerate: false,
      reason: "No league matches found.",
      mode: null,
    };
  }

  if (completedLeagueMatches.length < leagueMatches.length) {
    return {
      canGenerate: false,
      reason: "League stage is not complete yet.",
      mode: null,
    };
  }

  const knockoutMatches = tournamentMatches.filter((m) => !!m.knockoutType);
  if (knockoutMatches.length > 0) {
    return {
      canGenerate: false,
      reason: "Knockouts already generated.",
      mode: null,
    };
  }

  const mode = tournament.groups ? "groups" : "single-table";

  if (mode === "single-table") {
    if (tournament.teamIds.length < 4) {
      return {
        canGenerate: false,
        reason: "At least 4 teams are required.",
        mode: null,
      };
    }
  } else if (mode === "groups" && tournament.groups) {
    if (tournament.groups.a.length < 2 || tournament.groups.b.length < 2) {
      return {
        canGenerate: false,
        reason: "At least 2 teams required per group.",
        mode: null,
      };
    }
  }

  return { canGenerate: true, mode };
}

export function getQualifiedTeamsFromStandings(
  tournament: Tournament,
  matches: Match[],
  teams: Team[],
) {
  const mode = tournament.groups ? "groups" : "single-table";

  const tournamentMatches = matches.filter(
    (m) =>
      m.tournamentId === tournament.id &&
      !m.knockoutType &&
      m.status === "completed",
  );

  if (mode === "single-table") {
    const tournamentTeams = teams.filter((t) =>
      tournament.teamIds.includes(t.id),
    );
    const pointsTable = calculatePointsTable(
      tournamentTeams,
      tournamentMatches,
    );

    // Sort points table
    pointsTable.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      const nrrA = parseFloat(a.nrr);
      const nrrB = parseFloat(b.nrr);
      if (nrrB !== nrrA) return nrrB - nrrA;
      return a.teamName.localeCompare(b.teamName);
    });

    if (pointsTable.length < 4) return null;

    return {
      semifinal1: {
        team1Id: pointsTable[0].teamId,
        team2Id: pointsTable[3].teamId,
      },
      semifinal2: {
        team1Id: pointsTable[1].teamId,
        team2Id: pointsTable[2].teamId,
      },
    };
  } else if (tournament.groups) {
    const groupA_Teams = teams.filter((t) =>
      tournament.groups!.a.includes(t.id),
    );
    const groupA_Matches = tournamentMatches.filter(
      (m) =>
        m.groupId === "a" ||
        (tournament.groups!.a.includes(m.team1Id) &&
          tournament.groups!.a.includes(m.team2Id)),
    );
    const groupA_Table = calculatePointsTable(groupA_Teams, groupA_Matches);

    groupA_Table.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      const nrrA = parseFloat(a.nrr);
      const nrrB = parseFloat(b.nrr);
      if (nrrB !== nrrA) return nrrB - nrrA;
      return a.teamName.localeCompare(b.teamName);
    });

    const groupB_Teams = teams.filter((t) =>
      tournament.groups!.b.includes(t.id),
    );
    const groupB_Matches = tournamentMatches.filter(
      (m) =>
        m.groupId === "b" ||
        (tournament.groups!.b.includes(m.team1Id) &&
          tournament.groups!.b.includes(m.team2Id)),
    );
    const groupB_Table = calculatePointsTable(groupB_Teams, groupB_Matches);

    groupB_Table.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      const nrrA = parseFloat(a.nrr);
      const nrrB = parseFloat(b.nrr);
      if (nrrB !== nrrA) return nrrB - nrrA;
      return a.teamName.localeCompare(b.teamName);
    });

    if (groupA_Table.length < 2 || groupB_Table.length < 2) return null;

    return {
      semifinal1: {
        team1Id: groupA_Table[0].teamId,
        team2Id: groupB_Table[1].teamId,
      },
      semifinal2: {
        team1Id: groupB_Table[0].teamId,
        team2Id: groupA_Table[1].teamId,
      },
    };
  }

  return null;
}

export function getUpcomingTournamentMatch(tournament: Tournament, matches: Match[]) {
  const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);

  const eligibleMatches = tournamentMatches.filter(
    (m) =>
      m.status === "scheduled" ||
      m.status === "upcoming" ||
      m.status === "readyToToss" ||
      m.status === "readyToStart" ||
      m.status === "live"
  );

  if (eligibleMatches.length === 0) {
    return { match: null, reason: "NO_UPCOMING_MATCH" };
  }

  // Priority order
  const liveMatch = eligibleMatches.find((m) => m.status === "live");
  if (liveMatch) return { match: liveMatch };

  const readyToStart = eligibleMatches.find((m) => m.status === "readyToStart");
  if (readyToStart) return { match: readyToStart };

  const readyToToss = eligibleMatches.find((m) => m.status === "readyToToss");
  if (readyToToss) return { match: readyToToss };

  // For scheduled/upcoming, find earliest date/time
  const pendingMatches = eligibleMatches.filter(
    (m) => m.status === "scheduled" || m.status === "upcoming"
  );
  if (pendingMatches.length > 0) {
    pendingMatches.sort((a, b) => {
      const timeA = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00:00"}`).getTime();
      const timeB = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00:00"}`).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.matchNumber || 0) - (b.matchNumber || 0);
    });
    return { match: pendingMatches[0] };
  }

  return { match: eligibleMatches[0] };
}

export function getTournamentProgress(
  tournament: Tournament,
  matches: Match[],
  teams: Team[],
) {
  const tMatches = matches.filter(m => m.tournamentId === tournament.id);
  const leagueMatches = tMatches.filter(m => !m.knockoutType);
  const semiFinalMatches = tMatches.filter(m => m.knockoutType === 'semifinal');
  const finalMatch = tMatches.find(m => m.knockoutType === 'final');

  const leagueCompleted = leagueMatches.filter(m => m.status === 'completed').length;
  const leagueTotal = leagueMatches.length;
  let leagueStatus: 'pending' | 'in-progress' | 'completed' = 'pending';
  if (leagueTotal > 0) {
    if (leagueCompleted === leagueTotal) leagueStatus = 'completed';
    else leagueStatus = 'in-progress';
  }

  const sfCompleted = semiFinalMatches.filter(m => m.status === 'completed').length;
  const sfTotal = semiFinalMatches.length;
  let sfStatus: 'pending' | 'ready' | 'in-progress' | 'completed' = 'pending';
  if (sfTotal > 0) {
    if (sfCompleted === sfTotal) sfStatus = 'completed';
    else if (semiFinalMatches.some(m => m.status === 'live' || m.status === 'in-progress')) sfStatus = 'in-progress';
    else if (sfCompleted > 0) sfStatus = 'in-progress';
    else sfStatus = 'ready';
  }

  let finalStatus: 'pending' | 'ready' | 'in-progress' | 'completed' = 'pending';
  if (finalMatch) {
    if (finalMatch.status === 'completed') finalStatus = 'completed';
    else if (finalMatch.status === 'live') finalStatus = 'in-progress';
    else finalStatus = 'ready';
  }

  let championStatus: 'not-declared' | 'declared' = 'not-declared';
  let championTeamId: string | undefined;
  let championTeamName: string | undefined;

  if (finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId && finalMatch.winnerId !== 'draw') {
    championStatus = 'declared';
    championTeamId = finalMatch.winnerId;
  } else if (tournament.format === 'Round Robin' && leagueTotal > 0 && leagueCompleted === leagueTotal) {
     const mode = tournament.groups ? "groups" : "single-table";
     if (mode === 'single-table') {
         const tournamentTeams = teams.filter(t => tournament.teamIds.includes(t.id));
         const pTable = calculatePointsTable(tournamentTeams, leagueMatches);
         pTable.sort((a, b) => {
             if (b.points !== a.points) return b.points - a.points;
             const nrrA = parseFloat(a.nrr);
             const nrrB = parseFloat(b.nrr);
             if (nrrB !== nrrA) return nrrB - nrrA;
             return a.teamName.localeCompare(b.teamName);
         });
         if (pTable.length > 0) {
             championStatus = 'declared';
             championTeamId = pTable[0].teamId;
         }
     }
  } else if (tournament.format === 'Knockout' && finalStatus === 'completed' && finalMatch && finalMatch.winnerId && finalMatch.winnerId !== 'draw') {
      championStatus = 'declared';
      championTeamId = finalMatch.winnerId;
  }

  if (championTeamId) {
    championTeamName = teams.find(t => t.id === championTeamId)?.name;
  }

  return {
    league: { status: leagueStatus, completed: leagueCompleted, total: leagueTotal },
    semifinals: { status: sfStatus, completed: sfCompleted, total: sfTotal },
    final: { status: finalStatus },
    champion: { status: championStatus, teamId: championTeamId, teamName: championTeamName }
  };
}
