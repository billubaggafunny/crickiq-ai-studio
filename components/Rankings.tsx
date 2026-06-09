import CrickIQCard from './CrickIQCard';
import React, { useMemo, useState } from "react";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import {
 calculatePlayerCareerStats,
 calculatePointsTable,
} from "../utils/cricketLogic";
import type { Match, PlayerCareerStats, PointsTableData, Team } from "../types";

// Helpers for visual enhancement
// Trend system was removed as per analytics identity clarification

const TeamFormMatches = ({
 matches,
 teamId,
}: {
 matches: Match[];
 teamId: string;
}) => {
 const form = useMemo(() => {
 return matches
 .filter((m) => m.team1Id === teamId || m.team2Id === teamId)
 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
 .slice(0, 3)
 .map((m) => {
 if (m.winnerId === teamId) return "W";
 if (m.winnerId === "draw") return "D";
 if (m.winnerId) return "L";
 return "-";
 })
 .reverse();
 }, [matches, teamId]);

 if (form.length === 0) return null;

 return (
 <div className="flex gap-1 mt-1.5 justify-end">
 {form.map((res, i) => (
 <span
 key={i}
 className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] text-button text-white shadow-sm flex-shrink-0 ${res === "W" ? "bg-success/100" : res === "L" ? "bg-danger/100" : "bg-text-secondary"}`}
 >
 {res}
 </span>
 ))}
 </div>
 );
};

const RecentPlayerForm = ({
 player,
 matches,
 teams,
}: {
 player: PlayerCareerStats & {
 name?: string;
 teamName?: string;
 teamId?: string;
 id: string;
 };
 matches: Match[];
 teams: Team[];
}) => {
 const recentMatches = useMemo(() => {
 if (!player || !matches) return [];

 // Find matches involving the player
 const playerMatches = matches
 .filter((m) => {
 const inInnings1 =
 m.innings1?.batsmanScores[player.id] ||
 m.innings1?.bowlerScores[player.id];
 const inInnings2 =
 m.innings2?.batsmanScores[player.id] ||
 m.innings2?.bowlerScores[player.id];
 return (
 inInnings1 ||
 inInnings2 ||
 m.team1Id === player.teamId ||
 m.team2Id === player.teamId
 );
 })
 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
 .slice(0, 5);

 return playerMatches.map((m) => {
 const oppTeamId = m.team1Id === player.teamId ? m.team2Id : m.team1Id;
 const oppTeam = teams.find((t) => t.id === oppTeamId);
 const oppName = oppTeam
 ? oppTeam.name.substring(0, 3).toUpperCase()
 : "OPP";

 let runs = 0;
 let balls = 0;
 let wickets = 0;
 let runsConceded = 0;
 let didBat = false;
 let didBowl = false;

 const i1Bat = m.innings1?.batsmanScores[player.id];
 const i1Bowl = m.innings1?.bowlerScores[player.id];
 const i2Bat = m.innings2?.batsmanScores[player.id];
 const i2Bowl = m.innings2?.bowlerScores[player.id];

 if (i1Bat) {
 runs += i1Bat.runs;
 balls += i1Bat.balls;
 didBat = true;
 }
 if (i2Bat) {
 runs += i2Bat.runs;
 balls += i2Bat.balls;
 didBat = true;
 }

 if (i1Bowl) {
 wickets += i1Bowl.wickets;
 runsConceded += i1Bowl.runsConceded;
 didBowl = true;
 }
 if (i2Bowl) {
 wickets += i2Bowl.wickets;
 runsConceded += i2Bowl.runsConceded;
 didBowl = true;
 }

 return {
 matchId: m.id,
 oppName,
 runs,
 balls,
 wickets,
 runsConceded,
 didBat,
 didBowl,
 };
 });
 }, [player, matches, teams]);

 if (recentMatches.length === 0) {
 return (
 <div className="bg-tertiary text-center p-4 rounded-xl  border-dashed">
 <p className="text-table-header text-text-secondary">
 Not enough recent matches available.
 </p>
 </div>
 );
 }

 const matchesWithRuns = recentMatches.filter((rm) => rm.didBat).length;
 const totalRuns = recentMatches.reduce((acc, rm) => acc + rm.runs, 0);
 const avgRuns =
 matchesWithRuns > 0 ? (totalRuns / matchesWithRuns).toFixed(1) : 0;

 const totalBalls = recentMatches.reduce((acc, rm) => acc + rm.balls, 0);
 const strikeRate =
 totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : 0;

 const totalWickets = recentMatches.reduce((acc, rm) => acc + rm.wickets, 0);

 return (
 <div className="space-y-4 pt-2">
 <div className="flex justify-between items-center bg-tertiary px-4 py-2 rounded-xl ">
 <div className="flex items-center gap-2">
 <span className="text-xl">🔥</span>
 <div>
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Form
 </p>
 <p className="text-sm font-bold text-text-primary leading-tight mt-0.5">
 {recentMatches.length} Matches
 </p>
 </div>
 </div>
 {totalRuns > 0 && (
 <div className="text-right">
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Avg
 </p>
 <p className="text-sm font-bold text-text-primary leading-tight mt-0.5">
 🏏 {avgRuns}
 </p>
 </div>
 )}
 {totalWickets > 0 && (
 <div className="text-right">
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Wkts
 </p>
 <p className="text-sm font-bold text-text-primary leading-tight mt-0.5">
 🎯 {totalWickets}
 </p>
 </div>
 )}
 {totalRuns > 0 && totalBalls > 0 && (
 <div className="text-right">
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 SR
 </p>
 <p className="text-sm font-bold text-text-primary leading-tight mt-0.5">
 ⚡ {strikeRate}
 </p>
 </div>
 )}
 </div>

 <div>
 <h5 className="text-xs font-bold text-text-secondary uppercase mb-2">
 Last 5 Matches
 </h5>
 <div className="space-y-2">
 {recentMatches.map((rm, i) => (
 <div
 key={rm.matchId || i}
 className="flex justify-between items-center bg-tertiary px-4 py-1.5 rounded-xl "
 >
 <span className="text-xs font-bold text-text-secondary w-16 truncate">
 vs {rm.oppName}
 </span>
 <div className="flex gap-4 text-right">
 {rm.didBat ? (
 <div className="flex flex-col items-end w-14">
 <span className="text-sm font-bold text-text-primary leading-none">
 {rm.runs}{" "}
 <span className="text-[10px] text-text-secondary">
 ({rm.balls})
 </span>
 </span>
 <span className="text-[9px] uppercase text-text-secondary mt-0.5">
 Runs
 </span>
 </div>
 ) : (
 <div className="flex flex-col items-end w-14 justify-center">
 <span className="text-caption text-text-secondary">-</span>
 </div>
 )}
 {rm.didBowl ? (
 <div className="flex flex-col items-end w-14">
 <span className="text-sm font-bold text-brand-blue leading-none">
 {rm.wickets}/{rm.runsConceded}
 </span>
 <span className="text-[9px] uppercase text-text-secondary mt-0.5">
 Wickets
 </span>
 </div>
 ) : (
 <div className="flex flex-col items-end w-14 justify-center">
 <span className="text-caption text-text-secondary">-</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
};

const PlayerTags = ({
 stats,
 isColoredHeader,
}: {
 stats: PlayerCareerStats;
 isColoredHeader?: boolean;
}) => {
 const tags = [];
 if (stats.runsScored > 100) tags.push("🏏 Run Machine");
 if (stats.wicketsTaken > 5) tags.push("🎯 Wicket Hunter");
 if (stats.runsScored > 50 && stats.wicketsTaken > 3)
 tags.push("⭐ All-Rounder");
 if (parseFloat(stats.strikeRate) > 150) tags.push("💥 Explosive");
 if (tags.length === 0) {
 if (stats.runsScored > 30) tags.push("🔥 Hot Form");
 else if (stats.wicketsTaken > 1) tags.push("🎯 Sniper");
 }

 if (tags.length === 0) return null;

 return (
 <div className="flex flex-wrap gap-1 mt-1">
 {tags.slice(0, 2).map((tag, i) => (
 <span
 key={i}
 className={`text-[9px] px-1.5 py-0.5 rounded-2xl whitespace-nowrap ${
 isColoredHeader
 ? "bg-secondary/20 border border-white/12 text-white"
 : "bg-tertiary  text-text-secondary"
 }`}
 >
 {tag}
 </span>
 ))}
 </div>
 );
};

const OverlayModal = ({
 isOpen,
 onClose,
 title,
 children,
 headerContent,
 headerThemeClass,
}: {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 headerContent?: React.ReactNode;
 headerThemeClass?: string;
}) => {
 if (!isOpen) return null;
 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 shadow-inner backdrop-blur-sm"
 onClick={onClose}
 >
 <div
 className="bg-primary  rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in shadow-2xl relative"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={onClose}
 className="absolute top-3 right-3 z-20 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 p-1 rounded-full w-8 h-8 flex items-center justify-center transition-colors backdrop-blur-sm shadow-sm"
 >
 ✕
 </button>
 {headerContent ? (
 <div className={`${headerThemeClass} p-6 relative overflow-hidden`}>
 <div className="absolute inset-0 bg-secondary/5 "></div>
 <div className="relative z-10 pt-2">{headerContent}</div>
 </div>
 ) : title ? (
 <div className="flex justify-between items-center p-4 border-b border-brand-blue/15 bg-tertiary">
 <h3 className="font-bold text-text-primary text-lg">{title}</h3>
 </div>
 ) : null}
 <div className={headerContent ? "p-4" : "p-6"}>{children}</div>
 </div>
 </div>
 );
};


type RankingsProps = UseCrickIQStateReturn;

const RankingSection = <T,>({
 items,
 renderItem,
 emptyMessage = "No data available.",
 onItemClick,
}: {
 items: T[];
 renderItem: (item: T, index: number) => React.ReactNode;
 emptyMessage?: string;
 onItemClick?: (item: T, index: number) => void;
}) => {
 const [expanded, setExpanded] = useState(false);

 if (!items || items.length === 0) {
 return (
 <CrickIQCard className="mb-4 animate-fade-in text-center --color -dashed">
 <p className="text-table-header text-text-secondary">
 {emptyMessage || `No data right now.`}
 </p>
 </CrickIQCard>
 );
 }

 // Safety limit top 20
 const limitedItems = items.slice(0, 20);
 const visibleItems = expanded ? limitedItems : limitedItems.slice(0, 10);
 const hasMore = limitedItems.length > 10;

 return (
 <div className="mb-4 animate-fade-in">
 <CrickIQCard className="overflow-hidden --color">
 <div className="divide-y divide-border-color/50">
 {visibleItems.map((item, index) => (
 <div
 key={index}
 onClick={() => onItemClick && onItemClick(item, index)}
 className={`p-4 transition-colors ${
 onItemClick
 ? "cursor-pointer hover:bg-tertiary"
 : ""
 }`}
 >
 {renderItem(item, index)}
 </div>
 ))}
 </div>

 {hasMore && (
 <button
 onClick={() => setExpanded(!expanded)}
 className="w-full p-4 text-body font-bold text-brand-blue hover:bg-tertiary transition-colors flex justify-center items-center gap-2 border-t border-brand-blue/15/50 bg-tertiary"
 >
 {expanded ? (
 <>
 <span>▲</span> Show Less
 </>
 ) : (
 <>
 <span>▼</span> Show More
 </>
 )}
 </button>
 )}
 </CrickIQCard>
 </div>
 );
};

const Rankings: React.FC<RankingsProps> = ({ teams, matches }) => {
 // 1. Prepare base data safely
 const safeMatches = useMemo(
 () => (Array.isArray(matches) ? matches : []),
 [matches],
 );
 const safeTeams = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);

 // Find all completed matches
 const completedMatches = useMemo(
 () => safeMatches.filter((m) => m && m.status === "completed"),
 [safeMatches],
 );

 // 2. Calculate Top Players Data
 const playerStats = useMemo<Array<PlayerCareerStats & { name: string, teamName: string, teamId: string, logo?: string, id: string }>>(() => {
 if (completedMatches.length === 0) return [];

 const allPlayers = safeTeams.flatMap((t) =>
 t.players.map((p) => ({
 ...p,
 teamName: t.name,
 teamId: t.id,
 logo: t.logo,
 })),
 );

 return allPlayers
 .map((player) => {
 const careerStats = calculatePlayerCareerStats(
 player.id,
 completedMatches,
 );
 return { ...player, ...careerStats };
 })
 .filter((p) => p.matches > 0);
 }, [completedMatches, safeTeams]);

 const topBatsmen = useMemo<Array<PlayerCareerStats & { name: string, teamName: string, teamId: string, logo?: string, id: string }>>(
 () => [...playerStats].sort((a, b) => b.runsScored - a.runsScored),
 [playerStats],
 );
 const topBowlers = useMemo<Array<PlayerCareerStats & { name: string, teamName: string, teamId: string, logo?: string, id: string }>>(
 () => [...playerStats].sort((a, b) => b.wicketsTaken - a.wicketsTaken),
 [playerStats],
 );

 // 3. Calculate Top Teams Data
 const teamStats = useMemo<PointsTableData[]>(() => {
 if (completedMatches.length === 0) return [];

 // Calculate point table across all tournament matches
 const tournamentMatches = completedMatches.filter((m) => !m.isQuickMatch);
 // Fallback to quick matches if no tournament ones exist
 const matchesToUse =
 tournamentMatches.length > 0 ? tournamentMatches : completedMatches;

 // Use the existing calculatePointsTable helper securely
 let pointsStats: PointsTableData[] = [];
 try {
 pointsStats = calculatePointsTable(safeTeams, matchesToUse);
 } catch (error) {
 console.error("Points calculation failed:", error);
 }

 return pointsStats.sort((a, b) => b.points - a.points || b.won - a.won);
 }, [completedMatches, safeTeams]);

 // 4. Calculate Recent Form Data
 const playerForm = useMemo<Array<PlayerCareerStats & { name: string, teamName: string, teamId: string, logo?: string, id: string }>>(() => {
 if (completedMatches.length === 0) return [];

 // Just take the top performers by runs + wickets across the board to represent "Hot Form"
 const topForm = [...playerStats]
 .filter((p) => p.runsScored > 10 || p.wicketsTaken > 0) // must have scored or taken wicket
 .sort(
 (a, b) =>
 b.runsScored * 1 +
 b.wicketsTaken * 25 -
 (a.runsScored * 1 + a.wicketsTaken * 25),
 );

 return topForm;
 }, [playerStats, completedMatches]);

 const [activeTab, setActiveTab] = useState<
 "batters" | "bowlers" | "teams" | "mvp"
 >("batters");
 const [selectedPlayer, setSelectedPlayer] = useState<
 | (PlayerCareerStats & {
 name?: string;
 teamName?: string;
 teamId?: string;
 rank?: number;
 category?: string;
 })
 | null
 >(null);
 const [selectedTeam, setSelectedTeam] = useState<
 (PointsTableData & { rank?: number }) | null
 >(null);

 const RANKING_TABS = ["batters", "bowlers", "teams", "mvp"] as const;

 const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
 null,
 );
 const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
 null,
 );

 const onTouchStart = (e: React.TouchEvent) => {
 const target = e.target as HTMLElement;
 if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .overflow-x-auto, [data-no-swipe="true"]')) {
 return;
 }
 setTouchEnd(null);
 setTouchStart({
 x: e.targetTouches[0].clientX,
 y: e.targetTouches[0].clientY,
 });
 };

 const onTouchMove = (e: React.TouchEvent) => {
 setTouchEnd({
 x: e.targetTouches[0].clientX,
 y: e.targetTouches[0].clientY,
 });
 };

 const onTouchEnd = (e: React.TouchEvent) => {
 if (!touchStart || !touchEnd) return;
 const distanceX = touchStart.x - touchEnd.x;
 const distanceY = touchStart.y - touchEnd.y;

 if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 50) {
 const currentIndex = RANKING_TABS.indexOf(
 activeTab as (typeof RANKING_TABS)[number],
 );
 if (distanceX > 0 && currentIndex < RANKING_TABS.length - 1) {
 e.stopPropagation(); // Local swipe success, prevent workspace swipe
 setActiveTab(
 RANKING_TABS[currentIndex + 1] as (typeof RANKING_TABS)[number],
 );
 } else if (distanceX < 0 && currentIndex > 0) {
 e.stopPropagation(); // Local swipe success, prevent workspace swipe
 setActiveTab(
 RANKING_TABS[currentIndex - 1] as (typeof RANKING_TABS)[number],
 );
 }
 }
 };

 const renderMedal = (index: number) => {
 if (index === 0)
 return (
 <span className="text-2xl" title="Rank 1">
 🥇
 </span>
 );
 if (index === 1)
 return (
 <span className="text-2xl" title="Rank 2">
 🥈
 </span>
 );
 if (index === 2)
 return (
 <span className="text-2xl" title="Rank 3">
 🥉
 </span>
 );
 return (
 <span className="font-bold text-text-secondary w-8 text-center inline-block">
 #{index + 1}
 </span>
 );
 };

 return (
 <div
 className="space-y-6"
 onTouchStart={onTouchStart}
 onTouchMove={onTouchMove}
 onTouchEnd={onTouchEnd}
 >
 <div 
 className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1 -mx-2 sm:mx-0"
 onTouchStart={(e) => e.stopPropagation()}
 onTouchMove={(e) => e.stopPropagation()}
 onTouchEnd={(e) => e.stopPropagation()}
 >
 <button
 onClick={() => setActiveTab("batters")}
 className={`whitespace-nowrap px-4 py-1.5 rounded-2xl text-caption font-bold transition-all duration-200 ${
 activeTab === "batters"
 ? "bg-accent text-white shadow-sm"
 : "bg-tertiary text-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
 }`}
 >
 Top Batters
 </button>
 <button
 onClick={() => setActiveTab("bowlers")}
 className={`whitespace-nowrap px-4 py-1.5 rounded-2xl text-caption font-bold transition-all duration-200 ${
 activeTab === "bowlers"
 ? "bg-accent text-white shadow-sm"
 : "bg-tertiary text-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
 }`}
 >
 Top Bowlers
 </button>
 <button
 onClick={() => setActiveTab("teams")}
 className={`whitespace-nowrap px-4 py-1.5 rounded-2xl text-caption font-bold transition-all duration-200 ${
 activeTab === "teams"
 ? "bg-accent text-white shadow-sm"
 : "bg-tertiary text-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
 }`}
 >
 Top Teams
 </button>
 <button
 onClick={() => setActiveTab("mvp")}
 className={`whitespace-nowrap px-4 py-1.5 rounded-2xl text-caption font-bold transition-all duration-200 ${
 activeTab === "mvp"
 ? "bg-accent text-white shadow-sm"
 : "bg-tertiary text-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
 }`}
 >
 Recent Form (MVP)
 </button>
 </div>

 <p className="px-1 text-body text-text-secondary">
 {activeTab === "batters" && "Highest run scorers across matches"}
 {activeTab === "bowlers" && "Leading wicket-taking performers"}
 {activeTab === "teams" && "Best performing teams by points"}
 {activeTab === "mvp" && "Players currently in top form"}
 </p>

 {activeTab === "batters" && (
 <RankingSection
 items={topBatsmen}
 emptyMessage="No batting data available. Complete matches for players to rank."
 onItemClick={(p, i) =>
 setSelectedPlayer({ ...p, rank: i + 1, category: "batters" })
 }
 renderItem={(player, index) => (
 <div key={player.id} className="flex items-center w-full">
 <div className="flex-shrink-0 w-8 text-center mr-4">
 {renderMedal(index)}
 </div>
 <div className="flex-grow min-w-0">
 <p className="font-bold text-text-primary text-body truncate">
 {player.name}
 </p>
 <p className="text-caption text-text-secondary truncate">
 {player.teamName}
 </p>
 </div>
 <div className="flex-shrink-0 text-right ml-4">
 <div className="bg-tertiary px-4 py-2 rounded-xl text-center min-w-[60px]">
 <p className="text-lg text-brand-blue leading-none">
 {player.runsScored}
 </p>
 <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">
 Runs
 </p>
 </div>
 </div>
 </div>
 )}
 />
 )}

 {activeTab === "bowlers" && (
 <RankingSection
 items={topBowlers}
 emptyMessage="No bowling data available. Complete matches for bowlers to rank."
 onItemClick={(p, i) =>
 setSelectedPlayer({ ...p, rank: i + 1, category: "bowlers" })
 }
 renderItem={(player, index) => (
 <div key={player.id} className="flex items-center w-full">
 <div className="flex-shrink-0 w-8 text-center mr-4">
 {renderMedal(index)}
 </div>
 <div className="flex-grow min-w-0">
 <p className="font-bold text-text-primary text-body truncate">
 {player.name}
 </p>
 <p className="text-caption text-text-secondary truncate">
 {player.teamName}
 </p>
 </div>
 <div className="flex-shrink-0 text-right ml-4">
 <div className="bg-tertiary px-4 py-2 rounded-xl text-center min-w-[60px]">
 <p className="text-lg text-brand-blue leading-none">
 {player.wicketsTaken}
 </p>
 <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">
 Wickets
 </p>
 </div>
 </div>
 </div>
 )}
 />
 )}

 {activeTab === "teams" && (
 <RankingSection
 items={teamStats}
 emptyMessage="No team data available. Tournaments or matches must be completed."
 onItemClick={(item, index) =>
 setSelectedTeam({ ...item, rank: index + 1 })
 }
 renderItem={(team, index) => (
 <div key={team.teamId} className="flex items-center w-full">
 <div className="flex-shrink-0 w-8 text-center mr-4">
 {renderMedal(index)}
 </div>
 <div
 className="w-12 h-12 flex-shrink-0 mr-4 rounded-xl text-white text-lg shadow-sm flex items-center justify-center"
 style={{
 backgroundColor:
 safeTeams.find((t) => t.id === team.teamId)?.logo ||
 "#4a5568",
 }}
 >
 {team.teamName
 ? team.teamName.substring(0, 2).toUpperCase()
 : "TM"}
 </div>
 <div className="flex-grow min-w-0">
 <p className="font-bold text-text-primary text-body truncate">
 {team.teamName}
 </p>
 <TeamFormMatches
 matches={completedMatches}
 teamId={team.teamId}
 />
 </div>
 <div className="flex-shrink-0 text-right ml-4">
 <div className="bg-tertiary px-4 py-2 rounded-xl text-center min-w-[60px]">
 <p className="text-lg text-brand-blue leading-none">
 {team.points}
 </p>
 <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">
 Points
 </p>
 </div>
 </div>
 </div>
 )}
 />
 )}

 {activeTab === "mvp" && (
 <RankingSection
 items={playerForm}
 emptyMessage="Not enough match history."
 onItemClick={(p, i) =>
 setSelectedPlayer({ ...p, rank: i + 1, category: "mvp" })
 }
 renderItem={(player, index) => (
 <div key={player.id} className="flex items-center w-full">
 <div className="flex-shrink-0 w-10 text-center mr-2 text-2xl font-bold">
 {index === 0 ? (
 "🌟"
 ) : index === 1 ? (
 "⭐"
 ) : index === 2 ? (
 "✨"
 ) : (
 <span className="text-sm font-bold text-text-secondary">
 #{index + 1}
 </span>
 )}
 </div>
 <div className="flex-grow min-w-0">
 <p className="font-bold text-text-primary text-body truncate">
 {player.name}
 </p>
 <p className="text-caption text-text-secondary truncate">
 {player.teamName}
 </p>
 <PlayerTags stats={player} />
 </div>
 <div className="flex-shrink-0 text-right ml-4">
 <div className="flex flex-col gap-1.5">
 {player.runsScored > 0 && (
 <div className="flex justify-between items-center text-caption bg-brand-blue/10/50 dark:bg-blue-900/10 px-2 py-1 rounded border border-blue-100/50 dark:border-blue-800/30 min-w-[70px]">
 <span className="text-[10px] mr-2">🏏</span>
 <span className="font-bold flex-shrink-0 text-blue-700 dark:text-blue-400">
 {player.runsScored} r
 </span>
 </div>
 )}
 {player.wicketsTaken > 0 && (
 <div className="flex justify-between items-center text-caption bg-warning/10 dark:bg-warning/10 px-2 py-1 rounded border border-warning/30 dark:border-warning/30 min-w-[70px]">
 <span className="text-[10px] mr-2">🎯</span>
 <span className="font-bold flex-shrink-0 text-warning text-warning">
 {player.wicketsTaken} w
 </span>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 />
 )}

 {/* Player Details Modal */}
 <OverlayModal
 isOpen={!!selectedPlayer}
 onClose={() => setSelectedPlayer(null)}
 headerThemeClass=""
 headerContent={
 selectedPlayer && (
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-xl bg-secondaryshadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 flex-shrink-0">
 <span className="text-2xl">👤</span>
 </div>
 <div className="flex-grow min-w-0">
 <h4 className="text-xl text-white leading-tight truncate">
 {selectedPlayer.name}
 </h4>
 <p className="text-white/90 text-body truncate mt-0.5">
 {selectedPlayer.teamName}
 </p>
 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
 {selectedPlayer.rank !== undefined && (
 <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-white border border-white/12">
 Rank #{selectedPlayer.rank}{" "}
 {selectedPlayer.category === "batters"
 ? "Batter"
 : selectedPlayer.category === "bowlers"
 ? "Bowler"
 : "MVP"}
 </span>
 )}
 <PlayerTags
 stats={selectedPlayer as PlayerCareerStats}
 isColoredHeader={true}
 />
 </div>
 </div>
 </div>
 )
 }
 >
 {selectedPlayer && (
 <div className="space-y-4">
 <RecentPlayerForm
 player={
 selectedPlayer as PlayerCareerStats & {
 name?: string;
 teamName?: string;
 teamId?: string;
 id: string;
 }
 }
 matches={completedMatches}
 teams={safeTeams}
 />
 </div>
 )}
 </OverlayModal>

 <OverlayModal
 isOpen={!!selectedTeam}
 onClose={() => setSelectedTeam(null)}
 headerThemeClass=""
 headerContent={
 selectedTeam && (
 <div className="flex items-center gap-4">
 <div
 className="w-16 h-16 flex-shrink-0 rounded-xl text-white text-h1 shadow-sm flex items-center justify-center border border-white/12"
 style={{
 backgroundColor:
 safeTeams.find((t) => t.id === selectedTeam.teamId)?.logo ||
 "rgba(255, 255, 255, 0.2)",
 }}
 >
 {selectedTeam.teamName
 ? selectedTeam.teamName.substring(0, 2).toUpperCase()
 : "TM"}
 </div>
 <div className="flex-grow min-w-0">
 <h4 className="text-xl text-white leading-tight truncate">
 {selectedTeam.teamName}
 </h4>
 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
 {selectedTeam.rank !== undefined && (
 <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-white border border-white/12">
 Rank #{selectedTeam.rank} Team
 </span>
 )}
 <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/20 text-white rounded border border-white/12">
 {selectedTeam.won} Wins
 </span>
 <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/20 text-white rounded border border-white/12">
 {selectedTeam.lost} Losses
 </span>
 </div>
 </div>
 </div>
 )
 }
 >
 {selectedTeam && (
 <div className="space-y-4">
 <div className="space-y-4">
 <div className="flex justify-between items-center bg-tertiary px-4 py-2 rounded-xl ">
 <div className="flex items-center gap-2">
 <span className="text-xl">🔥</span>
 <div>
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Form
 </p>
 <p className="text-sm font-bold text-text-primary leading-tight mt-0.5">
 Last 3 Matches
 </p>
 </div>
 </div>
 <div className="flex justify-end flex-grow ml-4">
 <TeamFormMatches
 matches={completedMatches}
 teamId={selectedTeam.teamId}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="bg-tertiary text-center px-4 py-4 rounded-xl ">
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Total Points
 </p>
 <p className="text-2xl text-brand-blue mt-1.5">
 {selectedTeam.points}
 </p>
 </div>
 <div className="bg-tertiary text-center px-4 py-4 rounded-xl ">
 <p className="text-xs font-bold text-text-secondary uppercase leading-none">
 Net Run Rate
 </p>
 <p className="text-2xl text-brand-blue mt-1.5">
 {selectedTeam.nrr ? Number(selectedTeam.nrr).toFixed(2) : "0.00"}
 </p>
 </div>
 </div>
 </div>
 </div>
 )}
 </OverlayModal>
 </div>
 );
};

export default Rankings;
