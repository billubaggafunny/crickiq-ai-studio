import React, { useMemo, useCallback } from "react";
import { Innings, Team, Match } from "../types";
import { generateCommentaryData } from "../utils/cricketLogic";
import { getPlayerDisplayFromSnapshot } from "../utils/playerSnapshots";
import CommentaryFeedDisplay from "./CommentaryFeedDisplay";
import { formatScore, formatOvers } from "../utils/scoreFormatters";

interface MatchCommentaryProps {
 innings: Innings;
 battingTeam: Team;
 bowlingTeam: Team;
 match: Match;
 teams: Team[];
}

const MatchCommentary: React.FC<MatchCommentaryProps> = ({
 innings,
 battingTeam: propBattingTeam,
 match,
 teams,
}) => {
 const battingTeam = useMemo(() => {
    if (propBattingTeam) return propBattingTeam;
    // Derive from match/innings
    if (match) {
        if (match.team1Id === innings.battingTeamId) {
            return teams.find((t) => t.id === match.team1Id);
        }
        if (match.team2Id === innings.battingTeamId) {
            return teams.find((t) => t.id === match.team2Id);
        }
    }
    return undefined;
 }, [propBattingTeam, match, innings, teams]);

 const getPlayerName = useCallback(
 (id: string) => {
 return getPlayerDisplayFromSnapshot(match, id, teams);
 },
 [match, teams],
 );

 const commentaryData = useMemo(
 () => generateCommentaryData(innings, getPlayerName),
 [innings, getPlayerName],
 );

 const getBattingTeamName = () => {
 if (battingTeam?.name) return battingTeam.name;

 // Try finding by team1Id / team2Id
 if (match) {
 if (match.team1Id === innings.battingTeamId) {
 const t = teams.find((t) => t.id === match.team1Id);
 if (t) return t.name;
 return "Team 1";
 }
 if (match.team2Id === innings.battingTeamId) {
 const t = teams.find((t) => t.id === match.team2Id);
 if (t) return t.name;
 return "Team 2";
 }
 }
 return "Batting Team";
 };

 const getBattingTeamLogo = () => {
 if (battingTeam?.logo) return battingTeam.logo;
 return "#3b82f6"; // Default brand blue
 };

 const safeBattingTeamName = getBattingTeamName();
 const safeBattingTeamLogo = getBattingTeamLogo();

 return (
 <div className="bg-secondary shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 border border-border overflow-hidden">
 <div className="p-4 bg-tertiary flex items-center justify-between border-b border-black/5 dark:border-white/5">
 <div className="flex items-center gap-3 overflow-hidden mr-3">
 <div
 className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
 style={{ backgroundColor: safeBattingTeamLogo }}
 >
 {safeBattingTeamName.substring(0, 2).toUpperCase()}
 </div>
 <div className="flex flex-col overflow-hidden">
 <div className="flex items-center gap-2">
 <span className="text-sm md:text-base font-semibold truncate text-text-primary">
 {safeBattingTeamName}
 </span>
 {match.status === 'live' && (
 <span className="flex items-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
 <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>
 LIVE
 </span>
 )}
 </div>
 <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">
 Innings
 </span>
 </div>
 </div>
 <div className="flex items-baseline gap-1.5 shrink-0 text-right">
 <span className="font-mono font-bold text-xl md:text-2xl tracking-tighter text-text-primary">
 {formatScore(innings.score, innings.wickets)}
 </span>
 <span className="font-mono text-sm text-text-secondary">
 ({formatOvers(innings.overs)})
 </span>
 </div>
 </div>
 <div className="p-4 md:p-6 bg-secondary overflow-y-auto max-h-[600px] relative">
 <CommentaryFeedDisplay data={commentaryData} />
 </div>
 </div>
 );
};

export default MatchCommentary;
