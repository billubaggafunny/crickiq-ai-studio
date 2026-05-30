import type { ScheduleMatch, ScheduleRound } from '../types';

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
    teams.push('bye'); // Add a dummy team for odd number of teams
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
      if (team1 !== 'bye' && team2 !== 'bye') {
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
    if(last) {
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

export function generateRoundRobinPlusKnockoutSchedule(teamIds: string[], splitIntoGroups: boolean): { schedule: ScheduleRound[], groups?: { a: string[], b: string[] } } {
    if (splitIntoGroups) {
        // Two groups
        const shuffledTeams = shuffleArray(teamIds);
        const midPoint = Math.ceil(shuffledTeams.length / 2);
        const groupA = shuffledTeams.slice(0, midPoint);
        const groupB = shuffledTeams.slice(midPoint);

        const groupASchedule = generateRoundRobinSchedule(groupA).map(round => ({
            ...round,
            groupName: 'Group A',
            matches: round.matches.map(match => ({ ...match, groupId: 'a' as const }))
        }));
        
        const groupBSchedule = generateRoundRobinSchedule(groupB).map(round => ({
            ...round,
            groupName: 'Group B',
            matches: round.matches.map(match => ({ ...match, groupId: 'b' as const }))
        }));

        return {
            schedule: [...groupASchedule, ...groupBSchedule],
            groups: { a: groupA, b: groupB }
        };
    } else {
        // Single group round-robin
        return { schedule: generateRoundRobinSchedule(teamIds) };
    }
}