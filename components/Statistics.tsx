import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';
import CrickIQCard from './CrickIQCard';
import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import { calculatePlayerCareerStats } from "../utils/cricketLogic";
import PlayerStatsModal from "./PlayerStatsModal";
import type { Player, Match, Team } from "../types";
import { ChartPieIcon } from "../constants";
import WagonWheelModal from "./WagonWheelModal";


interface StatisticsProps extends UseCrickIQStateReturn {
  tournamentId?: string;
}

const Statistics: React.FC<StatisticsProps> = ({
  matches,
  teams,
  tournaments,
  tournamentId,
}) => {
  const [viewingPlayer, setViewingPlayer] = useState<
    (Player & { teamName?: string; teamId?: string }) | null
  >(null);
  const [viewingWagonWheel, setViewingWagonWheel] = useState<{
    player: Player;
    type: "batting" | "bowling";
  } | null>(null);
  const [isBattingExpanded, setIsBattingExpanded] = useState(false);
  const [isBowlingExpanded, setIsBowlingExpanded] = useState(false);

  const isEmbedded = !!tournamentId;
  const [statsSource, setStatsSource] = useState<"tournaments" | "quick">(
    isEmbedded ? "tournaments" : "tournaments",
  );
  const tournamentOptions = useMemo(
    () => tournaments.filter((t) => t.id !== "t_quick_matches"),
    [tournaments],
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | "all"
  >(tournamentId || "all");

  // State for swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

  React.useEffect(() => {
    if (isEmbedded) return; // This logic is for the standalone stats page only.
    if (statsSource === "tournaments") {
      if (
        !selectedTournamentId ||
        (selectedTournamentId !== "all" &&
          !tournamentOptions.find((t) => t.id === selectedTournamentId))
      ) {
        setSelectedTournamentId(tournamentOptions[0]?.id || "all");
      }
    }
  }, [statsSource, tournamentOptions, selectedTournamentId, isEmbedded]);

  const { playerStats, filteredMatches } = useMemo(() => {
    let filteredMatches: Match[];
    let relevantTeams: Team[];

    if (isEmbedded) {
      const tournament = tournaments.find((t) => t.id === tournamentId);
      filteredMatches = matches.filter((m) => m.tournamentId === tournamentId);
      relevantTeams = tournament
        ? teams.filter((t) => tournament.teamIds.includes(t.id))
        : [];
    } else if (statsSource === "quick") {
      filteredMatches = matches.filter((m) => m.isQuickMatch);
      relevantTeams = teams.filter((t) => {
        return filteredMatches.some(
          (m) => m.team1Id === t.id || m.team2Id === t.id,
        );
      });
    } else {
      // tournaments
      if (selectedTournamentId === "all") {
        filteredMatches = matches.filter((m) => !m.isQuickMatch);
        const allTournamentTeamIds = tournaments
          .filter((t) => t.id !== "t_quick_matches")
          .flatMap((t) => t.teamIds);
        const uniqueTeamIds = [...new Set(allTournamentTeamIds)];
        relevantTeams = teams.filter((t) => uniqueTeamIds.includes(t.id));
      } else {
        const tournament = tournaments.find(
          (t) => t.id === selectedTournamentId,
        );
        filteredMatches = matches.filter(
          (m) => m.tournamentId === selectedTournamentId,
        );
        relevantTeams = tournament
          ? teams.filter((t) => tournament.teamIds.includes(t.id))
          : [];
      }
    }

    const completedMatches = filteredMatches.filter(
      (m) => m.status === "completed",
    );

    const allPlayers = relevantTeams.flatMap((t) => {
      const teamName = t.name;
      const teamId = t.id;
      const logo = t.logo;
      return t.players.map((p) => ({ ...p, teamName, teamId, logo }));
    });

    const playerStats = allPlayers
      .map((player) => {
        const careerStats = calculatePlayerCareerStats(
          player.id,
          completedMatches,
        );
        return {
          ...player,
          ...careerStats,
        };
      })
      .filter((p) => p.matches > 0);

    return { playerStats, filteredMatches: completedMatches };
  }, [
    matches,
    teams,
    tournaments,
    statsSource,
    selectedTournamentId,
    tournamentId,
    isEmbedded,
  ]);

  const topScorer = useMemo(() => {
    if (playerStats.length === 0) return null;
    return [...playerStats].sort((a, b) => b.runsScored - a.runsScored)[0];
  }, [playerStats]);

  const topBowler = useMemo(() => {
    if (playerStats.length === 0) return null;
    return [...playerStats].sort((a, b) => b.wicketsTaken - a.wicketsTaken)[0];
  }, [playerStats]);

  const topBattersData = useMemo(() => {
    return [...playerStats]
      .filter((p) => p.runsScored > 0)
      .sort((a, b) => b.runsScored - a.runsScored)
      .slice(0, 5)
      .map((p) => ({ name: p.name.split(" ")[0], runs: p.runsScored }));
  }, [playerStats]);

  const topBowlersData = useMemo(() => {
    return [...playerStats]
      .filter((p) => p.wicketsTaken > 0)
      .sort((a, b) => b.wicketsTaken - a.wicketsTaken)
      .slice(0, 5)
      .map((p) => ({ name: p.name.split(" ")[0], wickets: p.wicketsTaken }));
  }, [playerStats]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEmbedded) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'button, a, input, select, textarea, [role="button"], .recharts-surface, .no-swipe, .overflow-x-auto, [data-no-swipe="true"]',
      )
    ) {
      return;
    }
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchCurrentX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEmbedded || touchStartX === null) return;
    setTouchCurrentX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isEmbedded || touchStartX === null || touchCurrentX === null) {
      return;
    }

    const diffX = touchStartX - touchCurrentX;
    const SWIPE_THRESHOLD = 75;

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      const tabs: ("tournaments" | "quick")[] = ["tournaments", "quick"];
      const currentIndex = tabs.indexOf(statsSource);

      if (diffX > 0) {
        // Swiped left
        if (currentIndex < tabs.length - 1) {
          e.stopPropagation(); // Local swipe success, prevent workspace swipe
          setStatsSource(tabs[currentIndex + 1]);
        }
      } else {
        // Swiped right
        if (currentIndex > 0) {
          e.stopPropagation(); // Local swipe success, prevent workspace swipe
          setStatsSource(tabs[currentIndex - 1]);
        }
      }
    }

    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  return (
    <div className="space-y-4 pb-8">
      {!isEmbedded && (
        <CrickIQCard  className="!">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex bg-primary/50 p-1 rounded-2xl flex-shrink-0">
              <button
                onClick={() => setStatsSource("tournaments")}
                className={`w-full sm:w-auto py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 text-body ${statsSource === "tournaments" ? "bg-brand-blue text-white shadow-sm" : "hover:bg-white dark:hover:bg-black/20"}`}
              >
                Tournaments
              </button>
              <button
                onClick={() => setStatsSource("quick")}
                className={`w-full sm:w-auto py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 text-body ${statsSource === "quick" ? "bg-brand-blue text-white shadow-sm" : "hover:bg-white dark:hover:bg-black/20"}`}
              >
                Quick Matches
              </button>
            </div>
            {statsSource === "tournaments" && tournamentOptions.length > 0 && (
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-body font-semibold"
              >
                <option value="all">All Tournaments</option>
                {tournamentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CrickIQCard>
      )}

      <div
        className="flex flex-col gap-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {filteredMatches.length === 0 ? (
          <CrickIQCard>
            <p className="text-center text-text-secondary py-8">
              No completed matches for this selection.
            </p>
          </CrickIQCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <CrickIQCard
                onClick={() =>
                  topScorer &&
                  topScorer.runsScored > 0 &&
                  setViewingWagonWheel({ player: topScorer, type: "batting" })
                }
                className={`w-full text-left group transition-all duration-300 relative overflow-hidden  ${topScorer && topScorer.runsScored > 0 ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5" : ""}`}
              >
                <div
                  className="absolute top-2 right-2 p-1.5 rounded-2xl text-text-secondary/50 group-hover:text-brand-blue group-hover:bg-primary/50 transition-colors"
                  title="View Scoring Areas"
                >
                  <ChartPieIcon />
                </div>
                <h2 className="text-h3 text-text-primary mb-4">
                  Top Scorer
                </h2>
                {topScorer && topScorer.runsScored > 0 ? (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body"
                      style={{ backgroundColor: topScorer.logo }}
                    >
                      {topScorer.teamName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary flex items-center gap-2">
                        {topScorer.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {topScorer.teamName}
                      </p>
                    </div>
                    <div className="ml-auto text-right selectable-text">
                      <p className="text-3xl text-brand-blue">
                        {topScorer.runsScored}
                      </p>
                      <p className="text-sm text-text-secondary">
                        SR: {topScorer.strikeRate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary">No data yet.</p>
                )}
              </CrickIQCard>
              <CrickIQCard
                onClick={() =>
                  topBowler &&
                  topBowler.wicketsTaken > 0 &&
                  setViewingWagonWheel({ player: topBowler, type: "bowling" })
                }
                className={`w-full text-left group transition-all duration-300 relative overflow-hidden  ${topBowler && topBowler.wicketsTaken > 0 ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5" : ""}`}
              >
                <div
                  className="absolute top-2 right-2 p-1.5 rounded-2xl text-text-secondary/50 group-hover:text-brand-blue group-hover:bg-primary/50 transition-colors"
                  title="View Dismissal Analysis"
                >
                  <ChartPieIcon />
                </div>
                <h2 className="text-h3 text-text-primary mb-4">
                  Top Wicket Taker
                </h2>
                {topBowler && topBowler.wicketsTaken > 0 ? (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body"
                      style={{ backgroundColor: topBowler.logo }}
                    >
                      {topBowler.teamName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary flex items-center gap-2">
                        {topBowler.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {topBowler.teamName}
                      </p>
                    </div>
                    <div className="ml-auto text-right selectable-text">
                      <p className="text-3xl text-brand-blue">
                        {topBowler.wicketsTaken}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Econ: {topBowler.economyRate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary">No data yet.</p>
                )}
              </CrickIQCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <CrickIQCard  className="flex flex-col --color">
                <div className="px-2 pt-2 pb-6">
                  <h3 className="text-h3 text-text-primary mb-1">
                    Top Run Scorers
                  </h3>
                  <p className="text-caption text-text-secondary">
                    Most runs in current selection
                  </p>
                </div>
                
        <div className="flex-1 w-full min-h-[300px]" style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBattersData || topBattersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topBattersData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis stroke="var(--color-text-secondary)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-secondary)",
                          border: "1px solid var(--color-border)",
                          borderRadius: '0.25rem',
                        }}
                      />
                      <Bar
                        dataKey="runs"
                        fill="var(--color-brand-lavender)"
                        name="Runs"
                      />
                    </BarChart>
                  </ResponsiveContainer>
            )}
        </div>
        
              </CrickIQCard>
              <CrickIQCard  className="flex flex-col --color">
                <div className="px-2 pt-2 pb-6">
                  <h3 className="text-h3 text-text-primary mb-1">
                    Top Wicket Takers
                  </h3>
                  <p className="text-caption text-text-secondary">
                    Most wickets in current selection
                  </p>
                </div>
                
        <div className="flex-1 w-full min-h-[300px]" style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBowlersData || topBowlersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topBowlersData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-secondary)",
                          border: "1px solid var(--color-border)",
                          borderRadius: '0.25rem',
                        }}
                      />
                      <Bar
                        dataKey="wickets"
                        fill="var(--color-warning)"
                        name="Wickets"
                      />
                    </BarChart>
                  </ResponsiveContainer>
            )}
        </div>
        
              </CrickIQCard>
            </div>

            <CrickIQCard  className="overflow-hidden ">
              <div className="p-6 sm:p-8 pb-4   border-b border-brand-blue/15/50">
                <h2 className="text-h2 text-text-primary mb-1 flex items-center gap-2">
                  <span className="text-brand-lavender text-h3">🏏</span> Batting
                  Leaderboard
                </h2>
                <p className="text-caption text-text-secondary pl-8">
                  Top run scorers across matches.
                </p>
              </div>
              <Table >
                  <Thead>
                    <Tr className="border-b border-brand-blue/15/50 bg-black/5 dark:bg-white/5">
                      <Th className="w-full sm:px-6 font-bold tracking-wider">Player</Th>
                      <Th className="text-right font-bold tracking-wider">
                        Runs
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        HS
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        Avg
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        SR
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        100s
                      </Th>
                      <Th className="px-6 text-right font-bold tracking-wider">
                        50s
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(() => {
                      const batters = [...playerStats]
                        .filter((p) => p.inningsBatted > 0)
                        .sort((a, b) => b.runsScored - a.runsScored);

                      const displayBatters = batters.slice(
                        0,
                        isBattingExpanded ? 10 : 5,
                      );

                      return (
                        <>
                          {displayBatters.map((p, index) => (
                            <Tr
                              key={p.id}
                              onClick={() => setViewingPlayer(p)}
                              className="border-b border-brand-blue/15 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors duration-200"
                            >
                              <Td className="sm:px-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 text-center text-body font-bold text-text-secondary">
                                    {index === 0
                                      ? "🥇"
                                      : index === 1
                                        ? "🥈"
                                        : index === 2
                                          ? "🥉"
                                          : `${index + 1}`}
                                  </div>
                                  <div>
                                    <p className="font-bold text-text-primary text-body sm:text-base">
                                      {p.name}
                                    </p>
                                    <div className="text-[10px] sm:text-caption text-text-secondary uppercase tracking-wider font-bold mt-0.5">
                                      {p.teamName}
                                    </div>
                                  </div>
                                </div>
                              </Td>
                              <Td className="text-right text-brand-blue">
                                {p.runsScored}
                              </Td>
                              <Td className="text-right">
                                {p.highScore}
                              </Td>
                              <Td className="text-right">
                                {p.battingAverage}
                              </Td>
                              <Td className="text-right">
                                {p.strikeRate}
                              </Td>
                              <Td className="text-right">
                                {p.hundreds}
                              </Td>
                              <Td className="px-8 text-right">
                                {p.fifties}
                              </Td>
                            </Tr>
                          ))}
                          {batters.length > 5 && (
                            <Tr>
                              <Td
                                colSpan={7}
                                className="p-0 border-t border-brand-blue/15/50"
                              >
                                <button
                                  onClick={() =>
                                    setIsBattingExpanded(!isBattingExpanded)
                                  }
                                  className="w-full py-6 text-body font-bold text-brand-blue hover:bg-black/5 dark:hover:bg-white/5 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                  {isBattingExpanded
                                    ? "▲ Show Less"
                                    : "▼ Show More"}
                                </button>
                              </Td>
                            </Tr>
                          )}
                        </>
                      );
                    })()}
                  </Tbody>
                </Table>
            </CrickIQCard>

            <CrickIQCard  className="overflow-hidden -teal-500/10">
              <div className="p-6 sm:p-8 pb-4   border-b border-brand-blue/15/50">
                <h2 className="text-h2 text-text-primary mb-1 flex items-center gap-2">
                  <span className="text-teal-500 text-h3">🥎</span> Bowling
                  Leaderboard
                </h2>
                <p className="text-caption text-text-secondary pl-8">
                  Top wicket takers across matches.
                </p>
              </div>
              <Table >
                  <Thead>
                    <Tr className="border-b border-brand-blue/15/50 bg-black/5 dark:bg-white/5">
                      <Th className="w-full sm:px-6 font-bold tracking-wider">Player</Th>
                      <Th className="text-right font-bold tracking-wider">
                        Wickets
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        Runs
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        Econ
                      </Th>
                      <Th className="text-right font-bold tracking-wider">
                        Avg
                      </Th>
                      <Th className="px-6 text-right font-bold tracking-wider">
                        Best
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(() => {
                      const bowlers = [...playerStats]
                        .filter((p) => p.inningsBowled > 0)
                        .sort(
                          (a, b) =>
                            b.wicketsTaken - a.wicketsTaken ||
                            a.runsConceded - b.runsConceded,
                        );

                      const displayBowlers = bowlers.slice(
                        0,
                        isBowlingExpanded ? 10 : 5,
                      );

                      return (
                        <>
                          {displayBowlers.map((p, index) => (
                            <Tr
                              key={p.id}
                              onClick={() => setViewingPlayer(p)}
                              className="border-b border-brand-blue/15/30 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors duration-200"
                            >
                              <Td className="sm:px-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 text-center text-body font-bold text-text-secondary">
                                    {index === 0
                                      ? "🥇"
                                      : index === 1
                                        ? "🥈"
                                        : index === 2
                                          ? "🥉"
                                          : `${index + 1}`}
                                  </div>
                                  <div>
                                    <p className="font-bold text-text-primary text-body sm:text-base">
                                      {p.name}
                                    </p>
                                    <div className="text-[10px] sm:text-caption text-text-secondary uppercase tracking-wider font-bold mt-0.5">
                                      {p.teamName}
                                    </div>
                                  </div>
                                </div>
                              </Td>
                              <Td className="text-right text-brand-blue">
                                {p.wicketsTaken}
                              </Td>
                              <Td className="text-right">
                                {p.runsConceded}
                              </Td>
                              <Td className="text-right">
                                {p.economyRate}
                              </Td>
                              <Td className="text-right">
                                {p.bowlingAverage}
                              </Td>
                              <Td className="px-8 text-right">
                                {p.bestBowlingInnings}
                              </Td>
                            </Tr>
                          ))}
                          {bowlers.length > 5 && (
                            <Tr>
                              <Td
                                colSpan={6}
                                className="p-0 border-t border-brand-blue/15/50"
                              >
                                <button
                                  onClick={() =>
                                    setIsBowlingExpanded(!isBowlingExpanded)
                                  }
                                  className="w-full py-6 text-body font-bold text-brand-blue hover:bg-black/5 dark:hover:bg-white/5 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                  {isBowlingExpanded
                                    ? "▲ Show Less"
                                    : "▼ Show More"}
                                </button>
                              </Td>
                            </Tr>
                          )}
                        </>
                      );
                    })()}
                  </Tbody>
                </Table>
            </CrickIQCard>
          </>
        )}
      </div>

      {viewingPlayer && (
        <PlayerStatsModal
          player={viewingPlayer}
          matches={filteredMatches}
          teams={teams}
          onClose={() => setViewingPlayer(null)}
        />
      )}
      {viewingWagonWheel && (
        <WagonWheelModal
          player={viewingWagonWheel.player}
          matches={filteredMatches}
          teams={teams}
          type={viewingWagonWheel.type}
          onClose={() => setViewingWagonWheel(null)}
        />
      )}
    </div>
  );
};

export default Statistics;
