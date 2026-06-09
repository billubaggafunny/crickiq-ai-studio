import React, { useMemo, useCallback } from "react";
import { Innings, Team, Match } from "../types";
import { generateCommentaryData } from "../utils/cricketLogic";
import { getPlayerDisplayFromSnapshot } from "../utils/playerSnapshots";
import CommentaryFeedDisplay from "./CommentaryFeedDisplay";

interface MatchCommentaryProps {
 innings: Innings;
 battingTeam: Team;
 bowlingTeam: Team;
 match: Match;
 teams: Team[];
}

const MatchCommentary: React.FC<MatchCommentaryProps> = ({
 innings,
 battingTeam,
 match,
 teams,
}) => {
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
 <div className="bg-secondaryshadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 border border-border overflow-hidden">
 <div className="p-4 bg-tertiary border-b border-border flex items-center justify-between">
 <h3 className="font-bold text-gray-900 flex items-center gap-2">
 <div
 className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
 style={{ backgroundColor: safeBattingTeamLogo }}
 >
 {safeBattingTeamName.substring(0, 2).toUpperCase()}
 </div>
 {safeBattingTeamName} Innings
 </h3>
 <div className="text-sm font-mono font-medium text-gray-500">
 {innings.score}/{innings.wickets}
 </div>
 </div>
 <div className="p-4 md:p-6 bg-secondary overflow-y-auto max-h-[600px] relative">
 <CommentaryFeedDisplay data={commentaryData} />
 </div>
 </div>
 );
};

export default MatchCommentary;
