import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo } from "react";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import {
  calculatePlayerCareerStats,
  calculatePointsTable,
} from "../utils/cricketLogic";


type FilterType =
  | "a-z"
  | "most_wins"
  | "most_losses"
  | "highest_total"
  | "lowest_total"
  | "highest_innings";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "a-z", label: "A-Z" },
  { id: "most_wins", label: "Most Wins" },
  { id: "most_losses", label: "Most Losses" },
  { id: "highest_total", label: "Highest Total" },
  { id: "lowest_total", label: "Lowest Total" },
  { id: "highest_innings", label: "Highest Innings" },
];

const TournamentStats: React.FC<UseCrickIQStateReturn> = ({
  matches,
  teams,
}) => {
  const manageableTeams = useMemo(
    () => teams.filter((t) => t.name.trim() !== ""),
    [teams],
  );

  const [activeFilter, setActiveFilter] = useState<FilterType>("a-z");

  const enrichedTeams = useMemo(() => {
    const relevantMatches = matches.filter((m) => m.status === "completed");
    const pTable = calculatePointsTable(teams, relevantMatches);

    return manageableTeams.map((team) => {
      const stats = pTable.find((t) => t.teamId === team.id) || {
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        points: 0,
        nrr: "0.000",
      };
      const rankIndex = pTable.findIndex((t) => t.teamId === team.id);
      const rank = rankIndex !== -1 ? rankIndex + 1 : null;

      const teamMatches = relevantMatches.filter(
        (m) => m.team1Id === team.id || m.team2Id === team.id,
      );
      const sortedTeamMatches = [...teamMatches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const form = sortedTeamMatches
        .slice(0, 5)
        .map((m) => {
          if (m.winnerId === team.id) return "W";
          if (m.winnerId && m.winnerId !== "draw") return "L";
          return "D";
        })
        .reverse();

      let totalRuns = 0;
      let highestScore = 0;
      let totalInnings = 0;

      teamMatches.forEach((m) => {
        if (m.innings1?.battingTeamId === team.id) {
          const runs = Number.isFinite(m.innings1?.score)
            ? Number(m.innings1.score)
            : 0;
          totalRuns += runs;
          highestScore = Math.max(highestScore, runs);
          totalInnings++;
        } else if (m.innings2?.battingTeamId === team.id) {
          const runs = Number.isFinite(m.innings2?.score)
            ? Number(m.innings2.score)
            : 0;
          totalRuns += runs;
          highestScore = Math.max(highestScore, runs);
          totalInnings++;
        }
      });

      const avgScoreRaw = totalInnings > 0 ? totalRuns / totalInnings : 0;
      const avgScore =
        totalInnings > 0 && Number.isFinite(avgScoreRaw)
          ? avgScoreRaw.toFixed(1)
          : "0.0";
      const winRateRaw =
        stats.played > 0 ? (stats.won / stats.played) * 100 : 0;
      const winRate =
        Number.isFinite(winRateRaw) && !Number.isNaN(winRateRaw)
          ? winRateRaw.toFixed(1)
          : "0.0";

      const pStats = team.players.map((p) => ({
        ...p,
        ...calculatePlayerCareerStats(p.id, teamMatches),
      }));

      const topBatter = [...pStats].sort(
        (a, b) => (b.runsScored || 0) - (a.runsScored || 0),
      )[0];
      const topBowler = [...pStats].sort(
        (a, b) =>
          (b.wicketsTaken || 0) - (a.wicketsTaken || 0) ||
          (a.runsConceded || 0) - (b.runsConceded || 0),
      )[0];

      return {
        ...team,
        stats,
        rank,
        form,
        totalRuns,
        highestScore,
        avgScore,
        avgScoreRaw,
        winRate,
        topBatter: topBatter?.runsScored > 0 ? topBatter : null,
        topBowler: topBowler?.wicketsTaken > 0 ? topBowler : null,
      };
    });
  }, [teams, manageableTeams, matches]);

  const sortedTeams = useMemo(() => {
    const list = [...enrichedTeams];

    // Helper for deterministic tie-breaking (alphabetical)
    const tieBreaker = (a: { name?: string }, b: { name?: string }) =>
      (a.name || "").localeCompare(b.name || "");

    switch (activeFilter) {
      case "a-z":
        return list.sort((a, b) => tieBreaker(a, b));
      case "most_wins":
        return list.sort(
          (a, b) =>
            (b.stats?.won || 0) - (a.stats?.won || 0) || tieBreaker(a, b),
        );
      case "most_losses":
        return list.sort(
          (a, b) =>
            (b.stats?.lost || 0) - (a.stats?.lost || 0) || tieBreaker(a, b),
        );
      case "highest_total":
        return list.sort(
          (a, b) => (b.totalRuns || 0) - (a.totalRuns || 0) || tieBreaker(a, b),
        );
      case "lowest_total":
        return list.sort(
          (a, b) => (a.totalRuns || 0) - (b.totalRuns || 0) || tieBreaker(a, b),
        );
      case "highest_innings":
        return list.sort(
          (a, b) =>
            (b.highestScore || 0) - (a.highestScore || 0) || tieBreaker(a, b),
        );
      default:
        return list;
    }
  }, [enrichedTeams, activeFilter]);

  if (manageableTeams.length === 0) {
    return (
      <div className="space-y-6">
        
        <CrickIQCard>
          <p className="text-center text-text-secondary">
            No teams available yet.
          </p>
        </CrickIQCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Filters Row */}
      <div 
        className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1 -mx-2 sm:mx-0"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-2xl text-caption font-bold transition-all duration-200 border ${
              activeFilter === f.id
                ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-accent/20"
                : "bg-white/10 dark:bg-black/20 text-text-secondary border-brand-blue/15 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedTeams.map((team) => (
          <CrickIQCard
            key={team.id}
             className="gap-4 - --color hover:-accent/40 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-white text-h3 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: team.logo }}
                >
                  {team.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-h3 text-text-primary leading-tight">
                      {team.name}
                    </h3>
                    {team.rank && (
                      <span className="text-[10px] font-bold bg-brand-blue/20 text-brand-blue px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Rank #{team.rank}
                      </span>
                    )}
                  </div>
                  {team.form.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {team.form.map((res, idx) => (
                        <span
                          key={idx}
                          className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] text-button text-white shadow-sm flex-shrink-0 ${
                            res === "W"
                              ? "bg-success/100"
                              : res === "L"
                                ? "bg-danger/100"
                                : "bg-gray-500"
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-4 gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg mt-1">
              <div className="text-center">
                <p className="text-[10px] font-bold text-text-secondary uppercase">
                  Wins
                </p>
                <p className="text-sm font-bold text-success dark:text-success">
                  {Number.isFinite(team.stats?.won) ? team.stats.won : 0}
                </p>
              </div>
              <div className="text-center border-l border-brand-blue/15">
                <p className="text-[10px] font-bold text-text-secondary uppercase">
                  Losses
                </p>
                <p className="text-sm font-bold text-danger dark:text-danger">
                  {Number.isFinite(team.stats?.lost) ? team.stats.lost : 0}
                </p>
              </div>
              <div className="text-center border-l border-brand-blue/15">
                <p className="text-[10px] font-bold text-text-secondary uppercase">
                  Win %
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {team.winRate || "0.0"}%
                </p>
              </div>
              <div className="text-center border-l border-brand-blue/15">
                <p className="text-[10px] font-bold text-text-secondary uppercase">
                  NRR
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {team.stats?.nrr || "0.000"}
                </p>
              </div>
            </div>

            {/* Scoring Summary & Leaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 flex-1">
              <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-lg flex-1">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">
                    Highest
                  </p>
                  <p className="text-lg text-brand-blue">
                    {Number.isFinite(team.highestScore) ? team.highestScore : 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-text-secondary uppercase">
                    Average
                  </p>
                  <p className="text-h3 text-text-primary">
                    {team.avgScore || "0.0"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-center flex-1">
                {team.topBatter ? (
                  <div className="flex justify-between items-center text-caption bg-brand-blue/10/50 dark:bg-blue-900/10 px-2 py-1.5 rounded border border-blue-100/50 dark:border-blue-800/30">
                    <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                      <span className="text-sm">🏏</span>{" "}
                      <span className="truncate max-w-[90px]">
                        {team.topBatter.name || "Unknown"}
                      </span>
                    </span>
                    <span className="font-bold flex-shrink-0">
                      {Number.isFinite(team.topBatter.runsScored)
                        ? team.topBatter.runsScored
                        : 0}{" "}
                      r
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-caption bg-black/5 dark:bg-white/5 text-text-secondary px-2 py-1.5 rounded border border-brand-blue/15">
                    <span className="font-bold flex items-center gap-1.5 text-text-secondary/50">
                      <span className="text-sm">🏏</span> No batters yet
                    </span>
                  </div>
                )}

                {team.topBowler ? (
                  <div className="flex justify-between items-center text-caption bg-warning/10 dark:bg-warning/10 px-2 py-1.5 rounded border border-warning/30 dark:border-warning/30">
                    <span className="font-bold flex items-center gap-1.5 text-warning text-warning">
                      <span className="text-sm">🎯</span>{" "}
                      <span className="truncate max-w-[90px]">
                        {team.topBowler.name || "Unknown"}
                      </span>
                    </span>
                    <span className="font-bold flex-shrink-0">
                      {Number.isFinite(team.topBowler.wicketsTaken)
                        ? team.topBowler.wicketsTaken
                        : 0}{" "}
                      w
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-caption bg-black/5 dark:bg-white/5 text-text-secondary px-2 py-1.5 rounded border border-brand-blue/15">
                    <span className="font-bold flex items-center gap-1.5 text-text-secondary/50">
                      <span className="text-sm">🎯</span> No bowlers yet
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CrickIQCard>
        ))}
      </div>
    </div>
  );
};

export default TournamentStats;
