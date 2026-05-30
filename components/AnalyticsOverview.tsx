import CrickIQCard from './CrickIQCard';
import React, { useMemo, useState } from "react";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import MatchScorecard from "./MatchScorecard";
import QuickMatchResults from "./QuickMatchResults";
import {
  calculatePlayerCareerStats,
  calculatePointsTable,
} from "../utils/cricketLogic";
import {
  TrophyIcon,
  ChartBarIcon,
  TableIcon,
  UserGroupIcon,
  CompareIcon,
  ClockIcon,
} from "../constants";


interface AnalyticsOverviewProps extends UseCrickIQStateReturn {
  onNavigate: (
    tab: "points" | "player" | "team" | "compare" | "rankings",
  ) => void;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = (props) => {
  const { matches, teams, tournaments, onNavigate } = props;
  const [viewingScorecardMatchId, setViewingScorecardMatchId] = useState<
    string | null
  >(null);

  const safeTeamsRender = Array.isArray(teams) ? teams : [];

  const {
    topScorer,
    topBowler,
    topTeam,
    activeTournament,
    recentMatch,
    stats,
  } = useMemo(() => {
    const safeMatches = Array.isArray(matches) ? matches : [];
    const safeTeams = Array.isArray(teams) ? teams : [];
    const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

    // Find most recent completed match safely
    const completedMatches = safeMatches.filter(
      (m) => m && m.status === "completed",
    );
    const recentMatch =
      completedMatches.length > 0
        ? [...completedMatches].sort(
            (a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
          )[0]
        : null;

    let totalRuns = 0;
    let highestTeamScore: {
      teamId: string;
      score: number;
      wickets: number;
      opponentTeamId?: string;
    } | null = null;
    let highestRunChase: { teamId: string; score: number } | null = null;

    completedMatches.forEach((m) => {
      if (m.innings1) {
        totalRuns += m.innings1.score || 0;
        if (
          !highestTeamScore ||
          (m.innings1.score || 0) > highestTeamScore.score
        ) {
          highestTeamScore = {
            teamId: m.innings1.battingTeamId,
            score: m.innings1.score || 0,
            wickets: m.innings1.wickets || 0,
            opponentTeamId: m.innings2
              ? m.innings2.battingTeamId
              : m.team1Id === m.innings1.battingTeamId
                ? m.team2Id
                : m.team1Id,
          };
        }
      }
      if (m.innings2) {
        totalRuns += m.innings2.score || 0;
        if (
          !highestTeamScore ||
          (m.innings2.score || 0) > highestTeamScore.score
        ) {
          highestTeamScore = {
            teamId: m.innings2.battingTeamId,
            score: m.innings2.score || 0,
            wickets: m.innings2.wickets || 0,
            opponentTeamId: m.innings1
              ? m.innings1.battingTeamId
              : m.team1Id === m.innings2.battingTeamId
                ? m.team2Id
                : m.team1Id,
          };
        }
        if (m.winnerId === m.innings2.battingTeamId && m.innings2.score) {
          if (!highestRunChase || m.innings2.score > highestRunChase.score) {
            highestRunChase = {
              teamId: m.innings2.battingTeamId,
              score: m.innings2.score,
            };
          }
        }
      }
    });

    // Find top team safely
    const activeTournament =
      safeTournaments.length > 0
        ? safeTournaments[safeTournaments.length - 1]
        : null;
    let topTeam = null;
    let bestWinStreak = 0;
    let streakTeamId = null;

    if (activeTournament && activeTournament.id) {
      const tournamentMatches = completedMatches.filter(
        (m) => m && m.tournamentId === activeTournament.id,
      );
      try {
        const pointsTable = calculatePointsTable(safeTeams, tournamentMatches);
        if (
          pointsTable &&
          Array.isArray(pointsTable) &&
          pointsTable.length > 0
        ) {
          topTeam = pointsTable[0];

          // crude streak calc: sort matches by date ascending
          const sortedTMatches = [...tournamentMatches].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          const streaks: Record<string, number> = {};
          sortedTMatches.forEach((m) => {
            if (m.winnerId && m.winnerId !== "draw") {
              streaks[m.winnerId] = (streaks[m.winnerId] || 0) + 1;
              const loserId = m.winnerId === m.team1Id ? m.team2Id : m.team1Id;
              streaks[loserId] = 0;
              if (streaks[m.winnerId] > bestWinStreak) {
                bestWinStreak = streaks[m.winnerId];
                streakTeamId = m.winnerId;
              }
            }
          });
        }
      } catch (error) {
        console.warn(
          "Silently caught error calculating points table for overview:",
          error,
        );
      }
    }

    // Find top scorer across all matches safely
    const allPlayers = safeTeams.flatMap((t) => {
      if (!t) return [];
      const players = Array.isArray(t.players) ? t.players : [];
      return players
        .filter((p) => !!p)
        .map((p) => ({ ...p, teamId: t.id, teamName: t.name }));
    });

    let bestScorer: {
      name: string;
      runsScored: number;
      matches: number;
      strikeRate: string | number;
      teamName?: string;
    } | null = null;
    let bestWicketTaker: {
      name: string;
      wicketsTaken: number;
      matches: number;
      teamName?: string;
    } | null = null;
    let maxRuns = -1;
    let maxWickets = -1;

    if (Array.isArray(allPlayers)) {
      allPlayers.forEach((player) => {
        if (!player || !player.id) return;
        try {
          const stats = calculatePlayerCareerStats(player.id, completedMatches);
          if (stats) {
            if (
              typeof stats.runsScored === "number" &&
              stats.runsScored > maxRuns
            ) {
              maxRuns = stats.runsScored;
              bestScorer = {
                ...player,
                runsScored: stats.runsScored,
                matches: stats.matches,
                strikeRate:
                  stats.ballsFaced > 0
                    ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(1)
                    : "-",
              };
            }
            if (
              typeof stats.wicketsTaken === "number" &&
              stats.wicketsTaken > maxWickets
            ) {
              maxWickets = stats.wicketsTaken;
              bestWicketTaker = {
                ...player,
                wicketsTaken: stats.wicketsTaken,
                matches: stats.matches,
              };
            }
          }
        } catch {
          // Ignore corrupted player stat calculation in overview
        }
      });
    }

    return {
      topScorer: bestScorer,
      topBowler: bestWicketTaker,
      topTeam,
      activeTournament,
      recentMatch,
      stats: {
        totalMatches: completedMatches.length,
        totalTeams: safeTeams.length,
        totalRuns,
        activeTournaments: safeTournaments.length,
        highestTeamScore,
        highestRunChase,
        bestWinStreak,
        streakTeamId,
      },
    };
  }, [matches, teams, tournaments]);

  return (
    <div className="space-y-6">
      {/* Hero Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CrickIQCard  className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            Matches
          </p>
          <p className="text-h1 text-text-primary">
            {stats.totalMatches}
          </p>
        </CrickIQCard>
        <CrickIQCard  className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            Teams
          </p>
          <p className="text-h1 text-text-primary">
            {stats.totalTeams}
          </p>
        </CrickIQCard>
        <CrickIQCard  className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            Total Runs
          </p>
          <p className="text-h1 text-text-primary">
            {stats.totalRuns}
          </p>
        </CrickIQCard>
        <CrickIQCard  className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            Active
          </p>
          <p className="text-h1 text-text-primary">
            {stats.activeTournaments} Trn
          </p>
        </CrickIQCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Team Spotlight */}
        <CrickIQCard  className="animate-fade-in flex flex-col overflow-hidden">
          <div className=" p-4 relative overflow-hidden text-white flex items-center gap-4">
            <div className="absolute top-0 right-0 opacity-20 transform translate-x-4 -translate-y-4">
              <TrophyIcon className="w-24 h-24" />
            </div>
            <div className="relative z-10 w-12 h-12 bg-primary rounded-full flex items-center justify-center border border-[#DCE3F0] dark:border-brand-blue/15 shadow-md shrink-0">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/90 mb-0.5">
                Top Tournament Team
              </h3>
              <p className="text-xl truncate">
                {topTeam ? topTeam.teamName : "Not Available"}
              </p>
              <p className="text-xs text-white/80 truncate mt-0.5">
                {activeTournament
                  ? activeTournament.name
                  : "No Active Tournament"}
              </p>
            </div>
          </div>
          <div className="p-4 flex justify-between items-center bg-white/5 dark:bg-black/10">
            {topTeam ? (
              <>
                <div>
                  <p className="text-h1 text-text-primary">
                    {topTeam.points}
                  </p>
                  <p className="text-caption text-text-secondary uppercase font-bold tracking-wider">
                    Points
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-lg text-caption font-bold bg-success/100/10 text-success dark:text-green-400 border border-green-500/20">
                    {topTeam.won} Wins
                  </span>
                  <span className="px-2 py-1 rounded-lg text-caption font-bold border border-brand-blue/15 bg-white/5 dark:bg-black/20 text-text-secondary">
                    NRR{" "}
                    {(() => {
                      const nrrRaw = topTeam.nrr as unknown;
                      const nrrNum =
                        typeof nrrRaw === "number"
                          ? nrrRaw
                          : parseFloat(String(nrrRaw));
                      const safeNrr = Number.isFinite(nrrNum) ? nrrNum : 0;
                      return (safeNrr > 0 ? "+" : "") + safeNrr.toFixed(3);
                    })()}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-text-secondary">
                Complete matches to rank
              </p>
            )}
          </div>
        </CrickIQCard>

        {/* Top Scorer Spotlight */}
        <CrickIQCard
           className="animate-fade-in flex flex-col overflow-hidden"
          style={{ animationDelay: "50ms" }}
        >
          <div className=" p-4 relative overflow-hidden text-white flex items-center gap-4">
            <div className="absolute top-0 right-0 opacity-20 transform translate-x-4 -translate-y-4">
              <span className="text-6xl">🏏</span>
            </div>
            <div className="relative z-10 w-12 h-12 bg-primary rounded-full flex items-center justify-center border border-[#DCE3F0] dark:border-brand-blue/15 shadow-md shrink-0">
              <span className="text-xl leading-none">🏏</span>
            </div>
            <div className="relative z-10 shrink min-w-0">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/90 mb-0.5">
                Top Scorer
              </h3>
              <p className="text-xl truncate">
                {topScorer ? topScorer.name : "Not Available"}
              </p>
              {topScorer?.teamName && (
                <p className="text-xs text-white/80 truncate mt-0.5">
                  {topScorer.teamName}
                </p>
              )}
            </div>
          </div>
          <div className="p-4 flex justify-between items-center bg-white/5 dark:bg-black/10">
            {topScorer ? (
              <>
                <div>
                  <p className="text-3xl text-text-primary leading-none">
                    {topScorer.runsScored}
                  </p>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-1">
                    Runs
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-lg text-caption font-bold border border-brand-blue/15 bg-white/5 dark:bg-black/20 text-text-secondary">
                    {topScorer.matches} M
                  </span>
                  <span className="px-2 py-1 rounded-lg text-caption font-bold border border-brand-blue/15 bg-white/5 dark:bg-black/20 text-text-secondary">
                    SR {topScorer.strikeRate}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-text-secondary">
                Complete matches to score
              </p>
            )}
          </div>
        </CrickIQCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Match Insights */}
        <CrickIQCard
           className="animate-fade-in overflow-hidden flex flex-col h-full"
          style={{ animationDelay: "100ms" }}
        >
          <div className="p-4 px-4 border-b border-brand-blue/15/50 flex justify-between items-center bg-secondary">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Recent Match
              </h3>
            </div>
            {recentMatch && (
              <span className="text-xs font-bold text-text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-2xl">
                {new Date(recentMatch.date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            {recentMatch ? (
              <div className="space-y-4">
                {(() => {
                  const team1 = safeTeamsRender.find(
                    (t) => t.id === recentMatch.team1Id,
                  );
                  const team2 = safeTeamsRender.find(
                    (t) => t.id === recentMatch.team2Id,
                  );

                  let winnerMessage = "";
                  if (recentMatch.wasAbandoned) {
                    winnerMessage = "Match Abandoned";
                  } else if (recentMatch.winnerId === "draw") {
                    winnerMessage = "Match Ended in a Draw";
                  } else if (recentMatch.winnerId) {
                    const winner = safeTeamsRender.find(
                      (t) => t.id === recentMatch.winnerId,
                    );
                    if (winner) {
                      if (
                        recentMatch.innings2 &&
                        winner.id === recentMatch.innings2.battingTeamId
                      ) {
                        const wicketsLeft =
                          (winner.players.length || 11) -
                          1 -
                          (recentMatch.innings2.wickets || 0);
                        winnerMessage = `${winner.name} won by ${wicketsLeft} wickets`;
                      } else if (
                        recentMatch.innings1 &&
                        winner.id === recentMatch.innings1.battingTeamId
                      ) {
                        const runsMargin =
                          (recentMatch.innings1.score || 0) -
                          (recentMatch.innings2?.score || 0);
                        winnerMessage = `${winner.name} won by ${runsMargin} runs`;
                      } else {
                        winnerMessage = `${winner.name} won`;
                      }
                    } else {
                      winnerMessage = "Unknown Team won";
                    }
                  } else {
                    winnerMessage = "Result unknown";
                  }

                  let momName = null;
                  if (recentMatch.manOfTheMatchId) {
                    for (const team of safeTeamsRender) {
                      const player = team.players.find(
                        (p) => p.id === recentMatch.manOfTheMatchId,
                      );
                      if (player) {
                        momName = player.name;
                        break;
                      }
                    }
                  }

                  const t1Innings =
                    recentMatch.innings1?.battingTeamId === recentMatch.team1Id
                      ? recentMatch.innings1
                      : recentMatch.innings2?.battingTeamId ===
                          recentMatch.team1Id
                        ? recentMatch.innings2
                        : undefined;
                  const t2Innings =
                    recentMatch.innings1?.battingTeamId === recentMatch.team2Id
                      ? recentMatch.innings1
                      : recentMatch.innings2?.battingTeamId ===
                          recentMatch.team2Id
                        ? recentMatch.innings2
                        : undefined;

                  const formatScore = (innings?: {
                    score: number;
                    wickets: number;
                  }) =>
                    innings ? `${innings.score}/${innings.wickets}` : "DNB";

                  return (
                    <div className="flex flex-col h-full gap-6">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 flex flex-col items-center bg-primary p-4 rounded-xl border border-[#DCE3F0] dark:border-brand-blue/15 shadow-md">
                          <span className="text-[11px] text-text-secondary uppercase mb-1">
                            {team1?.name?.substring(0, 3) || "UNK"}
                          </span>
                          <span className="text-xl text-text-primary leading-none">
                            {formatScore(t1Innings)}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-text-secondary px-1">
                          vs
                        </span>
                        <div className="flex-1 flex flex-col items-center bg-primary p-4 rounded-xl border border-[#DCE3F0] dark:border-brand-blue/15 shadow-md">
                          <span className="text-[11px] text-text-secondary uppercase mb-1">
                            {team2?.name?.substring(0, 3) || "UNK"}
                          </span>
                          <span className="text-xl text-text-primary leading-none">
                            {formatScore(t2Innings)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-center">
                        <p className="text-text-primary text-body text-center bg-brand-blue/10 px-4 py-1.5 rounded-lg border border-brand-blue/20 w-full">
                          {winnerMessage}
                        </p>
                        {momName && (
                          <p className="text-brand-blue text-[11px] font-bold text-center uppercase tracking-wider mt-1">
                            🌟 MOM: {momName}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-2">
                        <button
                          onClick={() =>
                            setViewingScorecardMatchId(recentMatch.id)
                          }
                          className="w-full py-4 bg-brand-blue text-white text-button rounded-xl hover:bg-brand-blue/90 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          Score Card
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-text-secondary py-8 text-center flex-1 flex items-center justify-center">
                No completed matches yet.
              </p>
            )}
          </div>
        </CrickIQCard>

        {/* Quick Analytics Highlights */}
        <div className="flex flex-col gap-4">
          <CrickIQCard  className="flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex-1 min-w-0 pr-4 relative z-10">
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                Highest Team Score
              </p>
              <p className="text-lg text-text-primary">
                {stats.highestTeamScore
                  ? `${stats.highestTeamScore.score}/${stats.highestTeamScore.wickets}`
                  : "N/A"}
              </p>
              {stats.highestTeamScore && (
                <p className="text-caption text-text-secondary leading-tight mt-1.5 truncate">
                  <span className="font-bold text-text-primary">
                    {safeTeamsRender.find(
                      (t) => t.id === stats.highestTeamScore?.teamId,
                    )?.name || "Unknown Team"}
                  </span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase mx-1">
                    {" "}
                    vs{" "}
                  </span>
                  <span className="font-semibold text-text-primary/80">
                    {safeTeamsRender.find(
                      (t) => t.id === stats.highestTeamScore?.opponentTeamId,
                    )?.name || "Unknown Team"}
                  </span>
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 shadow-sm border border-indigo-500/10 relative z-10">
              🎯
            </div>
          </CrickIQCard>
          <CrickIQCard  className="flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lavender/100/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex-1 min-w-0 pr-4 relative z-10">
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                Most Wickets
              </p>
              <p className="text-lg text-text-primary truncate">
                {topBowler
                  ? `${topBowler.name} (${topBowler.wicketsTaken})`
                  : "N/A"}
              </p>
              {topBowler?.teamName && (
                <p className="text-caption text-text-secondary mt-1.5 truncate font-bold">
                  {topBowler.teamName}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/40 flex items-center justify-center text-brand-lavender text-brand-lavender font-bold shrink-0 shadow-sm border border relative z-10">
              🥎
            </div>
          </CrickIQCard>
          <CrickIQCard  className="flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex-1 min-w-0 pr-4 relative z-10">
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                Best Win Streak
              </p>
              <p className="text-lg text-text-primary">
                {stats.bestWinStreak > 0
                  ? `${stats.bestWinStreak} Matches`
                  : "N/A"}
              </p>
              {stats.bestWinStreak > 0 && (
                <p className="text-caption text-text-secondary mt-1.5 truncate font-bold">
                  Team{" "}
                  {safeTeamsRender.find((t) => t.id === stats.streakTeamId)
                    ?.name || ""}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 shadow-sm border border-indigo-500/10 relative z-10">
              🔥
            </div>
          </CrickIQCard>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="animate-fade-in pb-4" style={{ animationDelay: "150ms" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4 pl-2">
          Quick Navigation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CrickIQCard
            onClick={() => onNavigate("points")}
            className="flex items-center justify-center gap-2 py-4"
          >
            <TableIcon className="w-4 h-4 text-brand-blue" />
            <span className="text-button text-text-primary">
              Points Table
            </span>
          </CrickIQCard>
          <CrickIQCard
            onClick={() => onNavigate("player")}
            className="flex items-center justify-center gap-2 py-4"
          >
            <UserGroupIcon className="w-4 h-4 text-brand-blue" />
            <span className="text-button text-text-primary">
              Player Stats
            </span>
          </CrickIQCard>
          <CrickIQCard
            onClick={() => onNavigate("team")}
            className="flex items-center justify-center gap-2 py-4"
          >
            <ChartBarIcon className="w-4 h-4 text-brand-blue" />
            <span className="text-button text-text-primary">
              Team Stats
            </span>
          </CrickIQCard>
          <CrickIQCard
            onClick={() => onNavigate("compare")}
            className="flex items-center justify-center gap-2 py-4"
          >
            <CompareIcon className="w-4 h-4 text-brand-blue" />
            <span className="text-button text-text-primary">Compare</span>
          </CrickIQCard>
        </div>
      </div>

      {/* Scorecard Overlay Layer */}
      {viewingScorecardMatchId &&
        (() => {
          const match = Array.isArray(matches)
            ? matches.find((m) => m.id === viewingScorecardMatchId)
            : null;
          if (!match) return null;

          const renderScorecard = () => {
            if (match.isQuickMatch) {
              return (
                <QuickMatchResults
                  {...props}
                  matchId={viewingScorecardMatchId}
                  onClose={() => setViewingScorecardMatchId(null)}
                />
              );
            } else {
              const tournament = Array.isArray(tournaments)
                ? tournaments.find((t) => t.id === match.tournamentId)
                : null;
              if (!tournament) return null;
              return (
                <MatchScorecard
                  match={match}
                  tournament={tournament}
                  onClose={() => setViewingScorecardMatchId(null)}
                  teams={safeTeamsRender}
                  setManOfTheMatch={props.setManOfTheMatch}
                  hideHeader={true}
                />
              );
            }
          };

          const scorecardContent = renderScorecard();
          if (!scorecardContent) return null;

          return (
            <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 lg:p-12 animate-fade-in">
              {/* Responsive Modal Container */}
              <div className="w-full h-full md:h-auto md:max-h-[90vh] max-w-5xl bg-secondary md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden border border-white/10 md:border-white/5">
                {/* Scorecard Scrollable Wrapper */}
                <div className="flex-1 overflow-y-auto w-full [&>div]:!relative [&>div]:!inset-auto [&>div]:!h-auto [&>div]:!min-h-full [&>div]:!w-full [&>div]:!bg-white [&>div]:!max-w-none [&>div]:!rounded-none [&>div]:!shadow-none">
                  {scorecardContent}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default AnalyticsOverview;
