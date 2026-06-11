import {
 canGenerateKnockouts,
 getQualifiedTeamsFromStandings,
} from "../utils/scheduleLogic";
import CrickIQCard from "./CrickIQCard";
import React, {
 useState,
 useMemo,
 useEffect,
 useRef,
 useCallback,
} from "react";
import ReactDOMServer from "react-dom/server";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import type { Match, TossDecision, Team, Tournament, Player } from "../types";
import { PlayerRole } from "../types";
import {
 PlusIcon,
 TrophyIcon,
 ClockIcon,
 TrashIcon,
 EditIcon,
 UserGroupIcon,
 BallIcon,
 CalendarIcon,
 CheckIcon,
} from "../constants";
import ConfirmationModal from "./ConfirmationModal";
import MatchCreationForm from "./MatchCreationForm";
import MatchTable from "./MatchTable";
import MatchFilters from "./MatchFilters";
import { TournamentProgressTracker } from "./TournamentProgressTracker";
import { UpcomingMatchWidget } from "./UpcomingMatchWidget";
import { EditMatchModal } from "./MatchModals";
import MatchShareCard from "./MatchShareCard";
import { useNotification } from "../hooks/useNotification";
import { TeamEditorModal } from "./TeamEditorModal";
import TournamentList from "./TournamentList";
import Statistics from "./Statistics";
import LineupPreview from "./LineupPreview";
import ScheduleGenerator from "./ScheduleGenerator";
import { calculatePlayerCareerStats, calculatePointsTable } from "../utils/cricketLogic";
import {
 validateTournamentMatch,
 validateMaxOversPerBowler,
} from "../utils/validation";
import { getMaxPlayers } from "../utils/matchConfig";
import TossModal from "./TossModal";
import PointsTable from "./PointsTable";
import { CreateTeamSheet } from "./CreateTeamSheet";
import { TournamentTeamManagementSheet } from "./TournamentTeamManagementSheet";

const Button: React.FC<
 React.ButtonHTMLAttributes<HTMLButtonElement> & {
 variant?: "primary" | "secondary" | "blue";
 }
> = ({ children, className, variant = "primary", ...props }) => {
 const baseClasses =
 "px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md";
 const variantClasses =
 variant === "secondary"
 ? "bg-brand-lightblue text-white border-0"
 : variant === "blue"
 ? "bg-brand-blue text-white border-0"
 : "bg-brand-gradient text-white border-0"; // primary is default

 return (
 <button
 {...props}
 className={`${baseClasses} ${variantClasses} ${className}`}
 >
 {children}
 </button>
 );
};

const adjustColor = (color: string, amount: number) => {
 if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
 return "#4A5568";
 }
 return (
 "#" +
 color
 .replace(/^#/, "")
 .replace(/../g, (color) =>
 (
 "0" +
 Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
 ).substr(-2),
 )
 );
};

interface MatchManagerProps extends UseCrickIQStateReturn {
 onStartMatch: (match: Match) => void;
 onContinueMatch: (match: Match) => void;
 isMatchLive: boolean;
 selectedTournamentId: string | null;
 onBack: () => void;
 onViewTournament: (tournamentId: string) => void;
 onViewMatchResult: (matchId: string) => void;
 onOpenMatchHub?: (
 matchId: string,
 returnLocation?: Record<string, unknown>,
 ) => void;
 initialView?: string;
 initialTab?: string;
 focusTeamId?: string;
 originatingTeamId?: string;
}

const MatchManager: React.FC<MatchManagerProps> = (props) => {
 const {
 tournaments,
 teams,
 matches,
 addMatch,
 addMatchesBatch,
 deleteMatch,
 updateToss,
 onStartMatch,
 onContinueMatch,
 getTeamById,
 getTournamentById,
 updateMatch,
 isMatchLive,
 selectedTournamentId,
 addTeamToTournament,
 removeTeamFromTournament,
 onViewTournament,
 onViewMatchResult,
 onOpenMatchHub,
 initialView,
 addPlayerReplacement,
 initialTab,
 focusTeamId,
 createGlobalTeam,
 } = props;
 const { showNotification } = useNotification();
 type View =
 | "tournaments"
 | "overview"
 | "fixtures"
 | "teams"
 | "stats"
 | "points"
 | "schedule"
 | "history"
 | "semifinals"
 | "final";

 const resolvedInitialView =
 initialTab === "fixtures" ? "fixtures" : initialView;
 
 const [viewState, setView] = useState<View>(
 (resolvedInitialView as View) ||
 (selectedTournamentId ? "overview" : "tournaments"),
 );

 const [isTeamManagementSheetOpen, setIsTeamManagementSheetOpen] = useState(false);
 const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);


 const view = useMemo(() => {
 if (viewState === "tournaments") return "tournaments";
 if (viewState === "teams") return "teams";
 if (viewState === "points") return "points";
 if (viewState === "stats") return "stats";
 if (viewState === "fixtures" || viewState === "schedule" || viewState === "history" || viewState === "semifinals" || viewState === "final") return "fixtures";
 if (viewState === "overview") return "overview";
 return "overview";
 }, [viewState]);

 const tournament = useMemo(
 () => getTournamentById(selectedTournamentId || ""),
 [getTournamentById, selectedTournamentId],
 );

 const dashboardSummary = useMemo(() => {
 if (!tournament) return null;
 const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
 const completedMatches = tournamentMatches.filter(m => m.status === 'completed' || m.status === 'abandoned').length;
 const liveMatches = tournamentMatches.filter(m => m.status === 'live').length;
 const knockoutMatches = tournamentMatches.filter(m => !!m.knockoutType).length;
 const upcomingMatches = tournamentMatches.filter(m => !m.knockoutType && m.status !== 'live' && m.status !== 'completed' && m.status !== 'abandoned').length;
 
 let currentStageLabel = "League Stage";
 if (tournamentMatches.some(m => m.knockoutType === 'final' && (m.status === 'live' || m.status === 'completed'))) currentStageLabel = "Finals";
 else if (tournamentMatches.some(m => m.knockoutType === 'final')) currentStageLabel = "Finals Setup";
 else if (tournamentMatches.some(m => m.knockoutType === 'semifinal' && (m.status === 'live' || m.status === 'completed'))) currentStageLabel = "Knockouts";
 else if (tournament.status === 'completed') currentStageLabel = "Tournament Finished";
 else if (tournament.status === 'scheduled') currentStageLabel = "Upcoming";

 return {
 teamsCount: tournament.teamIds?.length || 0,
 totalMatches: tournamentMatches.length,
 completedMatches,
 liveMatches,
 upcomingMatches,
 knockoutMatches,
 currentStageLabel
 };
 }, [tournament, matches]);

 const tournamentHighlights = useMemo(() => {
 if (!tournament) return null;
 const completedMatches = matches.filter(
 (m) => m.tournamentId === tournament.id && m.status === 'completed'
 );
 if (completedMatches.length === 0) return null;

 let champion = null;
 const finalMatch = completedMatches.find(m => m.knockoutType === 'final');
 if (finalMatch && finalMatch.winnerId && finalMatch.winnerId !== 'draw') {
 const teamA = teams.find(t => t.id === finalMatch.team1Id);
 const teamB = teams.find(t => t.id === finalMatch.team2Id);
 champion = {
 teamId: finalMatch.winnerId,
 teamName: teams.find(t => t.id === finalMatch.winnerId)?.name || 'Unknown Team',
 opponentTeamName: finalMatch.winnerId === finalMatch.team1Id ? teamB?.name || 'Unknown Team' : teamA?.name || 'Unknown Team',
 resultSummary: finalMatch.result || 'Won the tournament'
 };
 }

 const tournamentTeams = teams.filter(t => tournament.teamIds.includes(t.id));
 const tableData = calculatePointsTable(tournamentTeams, completedMatches);

 let mostWins = null;
 let bestNRR = null;

 if (tableData && tableData.length > 0) {
 let maxWins = -1;
 for (const t of tableData) {
 if (t.won > maxWins) {
 maxWins = t.won;
 mostWins = { teamId: t.teamId, teamName: t.teamName, value: `${t.won} Wins` };
 }
 }
 
 let maxNRR = -Infinity;
 for (const t of tableData) {
 const nrrVal = parseFloat(t.nrr);
 if (!isNaN(nrrVal) && nrrVal > maxNRR) {
 maxNRR = nrrVal;
 bestNRR = { teamId: t.teamId, teamName: t.teamName, value: t.nrr };
 }
 }
 }

 let highestTeamScore = null;
 for (const match of completedMatches) {
 if (match.team1Score !== undefined) {
 if (!highestTeamScore || match.team1Score > highestTeamScore.score) {
 highestTeamScore = {
 teamId: match.team1Id,
 teamName: teams.find(t => t.id === match.team1Id)?.name || 'Unknown Team',
 score: match.team1Score,
 wickets: match.team1Wickets || 0
 };
 }
 }
 if (match.team2Score !== undefined) {
 if (!highestTeamScore || match.team2Score > highestTeamScore.score) {
 highestTeamScore = {
 teamId: match.team2Id,
 teamName: teams.find(t => t.id === match.team2Id)?.name || 'Unknown Team',
 score: match.team2Score,
 wickets: match.team2Wickets || 0
 };
 }
 }
 }

 const hTeamScoreFormatted = highestTeamScore ? {
 teamId: highestTeamScore.teamId,
 teamName: highestTeamScore.teamName,
 value: `${highestTeamScore.score}/${highestTeamScore.wickets}`
 } : null;

 return { champion, achievements: { mostWins, bestNRR, highestTeamScore: hTeamScoreFormatted } };

 }, [tournament, matches, teams]);

 const topPerformers = useMemo(() => {
 if (!tournament) return null;
 const completedMatches = matches.filter(
 (m) => m.tournamentId === tournament.id && m.status === 'completed'
 );
 if (completedMatches.length === 0) return null;

 const allPlayers = teams.flatMap((t) =>
 t.players.map((p) => ({ ...p, teamId: t.id, teamName: t.name }))
 );

 let topRScorer = { id: '', runs: -1 };
 let topWTaker = { id: '', wickets: -1 };
 let hScore = { id: '', runs: -1, notOut: false };
 let bBowling = { id: '', wickets: -1, runs: Infinity };

 const runStats = new Map<string, number>();
 const wktStats = new Map<string, number>();

 for (const match of completedMatches) {
 const inningsList = [match.innings1, match.innings2].filter((i) => !!i);
 
 for (const inning of inningsList) {
 if (!inning) continue;
 for (const [playerId, perf] of Object.entries(inning.batsmanScores)) {
 runStats.set(playerId, (runStats.get(playerId) || 0) + perf.runs);
 
 if (perf.runs > hScore.runs) {
 hScore = { id: playerId, runs: perf.runs, notOut: perf.status !== 'Out' };
 } else if (perf.runs === hScore.runs && hScore.runs > -1) {
 const isNotOut = perf.status !== 'Out';
 // prefer not out
 if (isNotOut && !hScore.notOut) {
 hScore = { id: playerId, runs: perf.runs, notOut: true };
 } else if (isNotOut === hScore.notOut) {
 // tie-breaker by name
 const nameA = allPlayers.find(p => p.id === playerId)?.name || '';
 const nameB = allPlayers.find(p => p.id === hScore.id)?.name || '';
 if (nameA.localeCompare(nameB) < 0) {
 hScore = { id: playerId, runs: perf.runs, notOut: isNotOut };
 }
 }
 }
 }

 for (const [playerId, perf] of Object.entries(inning.bowlerScores)) {
 wktStats.set(playerId, (wktStats.get(playerId) || 0) + perf.wickets);
 
 if (perf.wickets > bBowling.wickets) {
 bBowling = { id: playerId, wickets: perf.wickets, runs: perf.runsConceded };
 } else if (perf.wickets === bBowling.wickets && bBowling.wickets > -1) {
 if (perf.runsConceded < bBowling.runs) {
 bBowling = { id: playerId, wickets: perf.wickets, runs: perf.runsConceded };
 } else if (perf.runsConceded === bBowling.runs) {
 const nameA = allPlayers.find(p => p.id === playerId)?.name || '';
 const nameB = allPlayers.find(p => p.id === bBowling.id)?.name || '';
 if (nameA.localeCompare(nameB) < 0) {
 bBowling = { id: playerId, wickets: perf.wickets, runs: perf.runsConceded };
 }
 }
 }
 }
 }
 }

 const sortedRuns = Array.from(runStats.entries()).map(([id, runs]) => ({ id, runs })).sort((a, b) => {
 if (b.runs !== a.runs) return b.runs - a.runs;
 const nameA = allPlayers.find(p => p.id === a.id)?.name || '';
 const nameB = allPlayers.find(p => p.id === b.id)?.name || '';
 return nameA.localeCompare(nameB);
 });
 if (sortedRuns.length > 0) topRScorer = sortedRuns[0];

 const sortedWkts = Array.from(wktStats.entries()).map(([id, wickets]) => ({ id, wickets })).sort((a, b) => {
 if (b.wickets !== a.wickets) return b.wickets - a.wickets;
 const nameA = allPlayers.find(p => p.id === a.id)?.name || '';
 const nameB = allPlayers.find(p => p.id === b.id)?.name || '';
 return nameA.localeCompare(nameB);
 });
 if (sortedWkts.length > 0) topWTaker = sortedWkts[0];

 const getPlayerInfo = (id: string) => {
 const p = allPlayers.find((p) => p.id === id);
 if (!p) return { playerName: 'Unknown Player', teamId: '', teamName: 'Unknown Team' };
 return { playerName: p.name, teamId: p.teamId, teamName: p.teamName };
 };

 return {
 topRunScorer: topRScorer.id && topRScorer.runs > 0 ? {
 ...getPlayerInfo(topRScorer.id),
 runs: topRScorer.runs,
 } : null,
 topWicketTaker: topWTaker.id && topWTaker.wickets > 0 ? {
 ...getPlayerInfo(topWTaker.id),
 wickets: topWTaker.wickets,
 } : null,
 highestScore: hScore.id && hScore.runs > 0 ? {
 ...getPlayerInfo(hScore.id),
 runs: hScore.runs,
 notOut: hScore.notOut,
 } : null,
 bestBowling: bBowling.id && bBowling.wickets > 0 ? {
 ...getPlayerInfo(bBowling.id),
 wickets: bBowling.wickets,
 runsConceded: bBowling.runs,
 } : null,
 };
 }, [tournament, matches, teams]);

 const handleOpenMatchHub = (matchId: string) => {
 onOpenMatchHub?.(matchId, { matchManagerView: viewState });
 };
 const [fixtureView, setFixtureView] = useState<"manual" | "automation">(
 "manual",
 );

 const [touchStartX, setTouchStartX] = useState<number | null>(null);
 const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

 const today = useMemo(() => {
 const d = new Date();
 d.setHours(0, 0, 0, 0);
 return d;
 }, []);

 useEffect(() => {
 if (selectedTournamentId) {
 const timeoutId = setTimeout(() => {
 setView((v) => (v === "tournaments" ? "overview" : v));
 }, 0);
 return () => clearTimeout(timeoutId);
 } else {
 const timeoutId = setTimeout(() => {
 setView("tournaments");
 }, 0);
 return () => clearTimeout(timeoutId);
 }
 }, [selectedTournamentId]);

 const [selectedTournamentForForm, setSelectedTournamentForForm] = useState(
 tournaments.filter((t) => t.id !== "t_quick_matches")[0]?.id || "",
 );
 const [team1Id, setTeam1Id] = useState("");
 const [team2Id, setTeam2Id] = useState("");
 const [matchDate, setMatchDate] = useState("");
 const [matchTime, setMatchTime] = useState("10:00");
 const [matchOvers, setMatchOvers] = useState<number | "">(20);
 const [matchMaxOvers, setMatchMaxOvers] = useState<number | "">(4);
 const [isOversEditable, setIsOversEditable] = useState(false);
 const [scheduleError, setScheduleError] = useState<string | null>(null);

 const [tossMatch, setTossMatch] = useState<Match | null>(null);

 const [confirmation, setConfirmation] = useState<{
 title: string;
 message: React.ReactNode;
 onConfirm: () => void;
 confirmText?: string;
 confirmVariant?: "danger" | "primary";
 } | null>(null);

 const [editingMatch, setEditingMatch] = useState<Match | null>(null);
 const [editFormData, setEditFormData] = useState({
 team1Id: "",
 team2Id: "",
 date: "",
 time: "",
 oversPerInnings: "" as number | "",
 maxOversPerBowler: "" as number | "",
 });
 const [editError, setEditError] = useState<string | null>(null);

 const [isCalendarOpen, setIsCalendarOpen] = useState(false);
 const [calendarPosition, setCalendarPosition] = useState<"down" | "up">(
 "down",
 );
 const calendarContainerRef = useRef<HTMLDivElement>(null);

 const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
 const [previewingTeam, setPreviewingTeam] = useState<Team | null>(null);

 const maxPlayers = useMemo(
 () => getMaxPlayers(undefined, tournament),
 [tournament],
 );

 const knockoutEligibility = useMemo(() => {
 if (!tournament) return null;
 return canGenerateKnockouts(tournament, matches);
 }, [tournament, matches]);

 const tournamentMatches = useMemo(() => {
 if (!selectedTournamentId) return [];
 return matches.filter((m) => m.tournamentId === selectedTournamentId);
 }, [matches, selectedTournamentId]);

 const getPlayerStatsMap = useCallback(
 (team: Team | null) => {
 const statsMap = new Map<
 string,
 { matches: number; runsScored: number; wicketsTaken: number }
 >();
 if (team) {
 team.players.forEach((player) => {
 const stats = calculatePlayerCareerStats(
 player.id,
 tournamentMatches.filter((m) => m.status === "completed"),
 );
 statsMap.set(player.id, {
 matches: stats.matches,
 runsScored: stats.runsScored,
 wicketsTaken: stats.wicketsTaken,
 });
 });
 }
 return statsMap;
 },
 [tournamentMatches],
 );

 const previewingTeamStats = useMemo(() => {
 if (!previewingTeam) return new Map();
 return getPlayerStatsMap(previewingTeam);
 }, [previewingTeam, getPlayerStatsMap]);

 const liveMatches = useMemo(() => {
 return tournamentMatches
 .filter((m) => m.status === "live")
 .sort((a, b) => {
 if (a.matchNumber && b.matchNumber) return a.matchNumber - b.matchNumber;
 return new Date(a.date).getTime() - new Date(b.date).getTime();
 });
 }, [tournamentMatches]);

 const upcomingMatches = useMemo(() => {
 return tournamentMatches
 .filter(
 (m) =>
 !m.knockoutType &&
 m.status !== "live" &&
 m.status !== "completed" &&
 m.status !== "abandoned",
 )
 .sort((a, b) => {
 const timeA = new Date(`${a.date}T${a.time || "00:00:00"}`).getTime();
 const timeB = new Date(`${b.date}T${b.time || "00:00:00"}`).getTime();
 if (timeA !== timeB) return timeA - timeB;
 if (a.matchNumber && b.matchNumber) return a.matchNumber - b.matchNumber;
 return 0;
 });
 }, [tournamentMatches]);

 const knockoutMatches = useMemo(() => {
 return tournamentMatches
 .filter(
 (m) =>
 !!m.knockoutType &&
 m.status !== "live" &&
 m.status !== "completed" &&
 m.status !== "abandoned",
 )
 .sort((a, b) => {
 const priorityA = a.knockoutType === "final" ? 2 : 1;
 const priorityB = b.knockoutType === "final" ? 2 : 1;
 if (priorityA !== priorityB) return priorityA - priorityB;
 if (a.matchNumber && b.matchNumber) return a.matchNumber - b.matchNumber;
 return 0;
 });
 }, [tournamentMatches]);

 const completedMatches = useMemo(() => {
 return tournamentMatches
 .filter((m) => m.status === "completed" || m.status === "abandoned")
 .sort((a, b) => {
 return new Date(b.date).getTime() - new Date(a.date).getTime();
 });
 }, [tournamentMatches]);
 useEffect(() => {
 const val = validateMaxOversPerBowler(matchMaxOvers, matchOvers);
 if (!val.valid) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setScheduleError(val.message || null);
 } else {
 setScheduleError((prev) =>
 prev && prev.includes("Maximum Overs") ? null : prev,
 );
 }
 }, [matchOvers, matchMaxOvers]);

 useEffect(() => {
 const val = validateMaxOversPerBowler(
 editFormData.maxOversPerBowler === ""
 ? undefined
 : editFormData.maxOversPerBowler,
 editFormData.oversPerInnings,
 );
 if (!val.valid) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setEditError(val.message || null);
 } else {
 setEditError((prev) =>
 prev && prev.includes("Maximum Overs") ? null : prev,
 );
 }
 }, [editFormData.oversPerInnings, editFormData.maxOversPerBowler]);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (
 calendarContainerRef.current &&
 !calendarContainerRef.current.contains(event.target as Node)
 ) {
 setIsCalendarOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, [calendarContainerRef]);

 useEffect(() => {
 if (editingMatch) {
 const timeoutId = setTimeout(() => {
 setEditFormData({
 team1Id: editingMatch.team1Id,
 team2Id: editingMatch.team2Id,
 date: editingMatch.date,
 time: editingMatch.time || "10:00",
 oversPerInnings: editingMatch.oversPerInnings,
 maxOversPerBowler: editingMatch.maxOversPerBowler || "",
 });
 setEditError(null);
 }, 0);
 return () => clearTimeout(timeoutId);
 }
 }, [editingMatch]);

 useEffect(() => {
 const tournamentIdToUse = selectedTournamentId || selectedTournamentForForm;
 if (tournamentIdToUse) {
 const tournament = getTournamentById(tournamentIdToUse);
 const timeoutId = setTimeout(() => {
 if (tournament && tournament.defaultOvers) {
 setMatchOvers(tournament.defaultOvers);
 setIsOversEditable(!!selectedTournamentId);
 } else {
 setMatchOvers(20);
 setIsOversEditable(true);
 }
 }, 0);
 return () => clearTimeout(timeoutId);
 } else {
 const timeoutId = setTimeout(() => {
 setIsOversEditable(true);
 }, 0);
 return () => clearTimeout(timeoutId);
 }
 }, [selectedTournamentId, selectedTournamentForForm, getTournamentById]);

 const effectiveTournamentId =
 selectedTournamentId || selectedTournamentForForm;
 const effectiveTournament = useMemo(
 () => getTournamentById(effectiveTournamentId),
 [getTournamentById, effectiveTournamentId],
 );

 const checkTeamReadiness = useCallback(
 (team: Team): boolean => {
 if (!team || !effectiveTournament) return false;

 const maxPlayers = getMaxPlayers(undefined, effectiveTournament);

 if (team.players.length < maxPlayers) return false;
 if (team.players.some((p) => !p.name.trim())) return false;

 const numbers = team.players.map((p) => p.number);
 if (new Set(numbers).size !== numbers.length) return false;

 if (
 team.players.length >= maxPlayers &&
 !team.players.some((p) => p.role === PlayerRole.WICKET_KEEPER)
 ) {
 return false;
 }

 if (team.players.length > 0 && !team.captainId) return false;
 if (team.players.length > 0 && !team.viceCaptainId) return false;

 return true;
 },
 [effectiveTournament],
 );

 const allTournamentTeams = useMemo(() => {
 if (!effectiveTournament) return [];
 return teams.filter((t) => effectiveTournament.teamIds.includes(t.id));
 }, [teams, effectiveTournament]);

 const availableTeams = useMemo(() => {
 return allTournamentTeams.filter(checkTeamReadiness);
 }, [allTournamentTeams, checkTeamReadiness]);

 const team1Options = useMemo(() => {
 return allTournamentTeams.filter((t) => t.id !== team2Id);
 }, [allTournamentTeams, team2Id]);

 const team2Options = useMemo(() => {
 return allTournamentTeams.filter((t) => t.id !== team1Id);
 }, [allTournamentTeams, team1Id]);

 const teamsForEditingMatch = useMemo(() => {
 if (!editingMatch) return [];
 const matchTournament = getTournamentById(editingMatch.tournamentId);
 if (!matchTournament) return [];
 return teams.filter((t) => matchTournament.teamIds.includes(t.id));
 }, [teams, editingMatch, getTournamentById]);

 const editTeam1Options = useMemo(() => {
 return teamsForEditingMatch.filter((t) => t.id !== editFormData.team2Id);
 }, [teamsForEditingMatch, editFormData.team2Id]);

 const editTeam2Options = useMemo(() => {
 return teamsForEditingMatch.filter((t) => t.id !== editFormData.team1Id);
 }, [teamsForEditingMatch, editFormData.team1Id]);

 const scheduleValidation = useMemo(() => {
 const tournamentId = selectedTournamentId || selectedTournamentForForm;
 return validateTournamentMatch(
 tournamentId,
 team1Id,
 team2Id,
 matchDate,
 matchTime,
 matchOvers,
 matchMaxOvers,
 );
 }, [
 selectedTournamentId,
 selectedTournamentForForm,
 team1Id,
 team2Id,
 matchDate,
 matchTime,
 matchOvers,
 matchMaxOvers,
 ]);
 const isScheduleFormValid = scheduleValidation.valid;

 const editValidation = useMemo(() => {
 return validateTournamentMatch(
 "valid-tournament",
 editFormData.team1Id,
 editFormData.team2Id,
 editFormData.date,
 editFormData.time,
 editFormData.oversPerInnings,
 editFormData.maxOversPerBowler,
 );
 }, [editFormData]);
 const isEditFormValid = editValidation.valid;

 const teamReadinessError = useMemo(() => {
 if (!team1Id && !team2Id) return null;

 const team1 = allTournamentTeams.find((t) => t.id === team1Id);
 const team2 = allTournamentTeams.find((t) => t.id === team2Id);

 const team1Ready = team1 ? checkTeamReadiness(team1) : true;
 const team2Ready = team2 ? checkTeamReadiness(team2) : true;

 if (!team1Ready && !team2Ready && team1Id && team2Id) {
 return "Team 1 and Team 2 are not ready for a match.";
 }
 if (!team1Ready && team1Id) {
 return `${team1?.name || "Team 1"} is not ready for a match.`;
 }
 if (!team2Ready && team2Id) {
 return `${team2?.name || "Team 2"} is not ready for a match.`;
 }

 return null;
 }, [team1Id, team2Id, allTournamentTeams, checkTeamReadiness]);

 const formatTime = (timeString: string | undefined) => {
 if (!timeString) return "";
 const [hourString, minute] = timeString.split(":");
 const hour = +hourString % 24;
 return new Date(1970, 0, 1, hour, +minute).toLocaleTimeString("en-US", {
 hour: "2-digit",
 minute: "2-digit",
 hour12: true,
 });
 };

 const handleAddMatch = () => {
 setScheduleError(null);

 if (teamReadinessError) {
 setConfirmation({
 title: "Team Not Ready",
 message: (
 <>
 {teamReadinessError}
 <p className="mt-2 text-body">
 Please visit the 'Teams' tab to finalize the lineup, and select a
 captain and vice-captain.
 </p>
 </>
 ),
 onConfirm: () => setConfirmation(null),
 confirmText: "OK",
 confirmVariant: "primary",
 });
 return;
 }

 const tournamentId = selectedTournamentId || selectedTournamentForForm;

 if (!scheduleValidation.valid) {
 const error =
 scheduleValidation.message || "Please complete all fields correctly.";

 setScheduleError(error);
 showNotification(error, "error");
 return;
 }

 const tournamentName = getTournamentById(tournamentId)?.name;
 const team1 = getTeamById(team1Id);
 const team2 = getTeamById(team2Id);

 const confirmationMessage = (
 <div className="space-y-4 text-left text-body">
 <p className="text-text-secondary text-center">
 Please review and confirm the match details below.
 </p>

 <div className="bg-primary/50 dark:bg-black/20 p-4 rounded-xl flex items-center justify-around gap-2 text-center">
 <div className="flex flex-col items-center gap-2 w-28">
 <div
 className="w-14 h-14 flex items-center justify-center rounded-lg text-white text-2xl font-bold shadow-md"
 style={{ backgroundColor: team1?.logo }}
 >
 {team1?.name.substring(0, 3).toUpperCase()}
 </div>
 <h3 className="text-base font-bold text-text-primary truncate w-full">
 {team1?.name}
 </h3>
 </div>

 <span className="text-2xl text-text-secondary">VS</span>

 <div className="flex flex-col items-center gap-2 w-28">
 <div
 className="w-14 h-14 flex items-center justify-center rounded-lg text-white text-2xl font-bold shadow-md"
 style={{ backgroundColor: team2?.logo }}
 >
 {team2?.name.substring(0, 3).toUpperCase()}
 </div>
 <h3 className="text-base font-bold text-text-primary truncate w-full">
 {team2?.name}
 </h3>
 </div>
 </div>

 <div className="space-y-2 pt-2">
 <div className="flex items-center gap-4 text-body">
 <CalendarIcon className="w-5 h-5 text-text-secondary" />
 <span className="font-semibold text-text-primary">
 {new Date(matchDate.replace(/-/g, "/")).toDateString()}
 </span>
 </div>
 <div className="flex items-center gap-4 text-body">
 <ClockIcon className="w-5 h-5 text-text-secondary" />
 <span className="font-semibold text-text-primary">
 {formatTime(matchTime)}
 </span>
 </div>
 <div className="flex items-center gap-4 text-body">
 <TrophyIcon className="w-5 h-5 text-text-secondary" />
 <span className="font-semibold text-text-primary">
 {tournamentName}
 </span>
 </div>
 <div className="flex items-center gap-4 text-body">
 <BallIcon className="w-5 h-5 text-text-secondary" />
 <span className="font-semibold text-text-primary">
 {matchOvers} Overs per Innings
 </span>
 </div>
 </div>
 </div>
 );

 setConfirmation({
 title: "Confirm Fixture",
 message: confirmationMessage,
 onConfirm: () => {
 addMatch(
 tournamentId,
 team1Id,
 team2Id,
 matchDate,
 matchTime,
 matchOvers as number,
 matchMaxOvers === "" ? undefined : matchMaxOvers,
 );
 setTeam1Id("");
 setTeam2Id("");
 setMatchDate("");
 setMatchTime("10:00");
 showNotification("Fixture added successfully!", "success");
 setConfirmation(null);
 },
 confirmText: "Add Fixture",
 confirmVariant: "primary",
 });
 };

 const handleGenerateKnockouts = () => {
 if (!selectedTournamentId) return;
 const tournament = tournaments.find((t) => t.id === selectedTournamentId);
 if (!tournament) return;

 setConfirmation({
 title: "Generate Knockouts?",
 message: (
 <p>
 This will create semi-final matches from the current standings.
 Existing teams, players, scores, and completed league matches will not
 be changed.
 </p>
 ),
 onConfirm: () => {
 const qualifiedTeams = getQualifiedTeamsFromStandings(
 tournament,
 matches,
 teams,
 );

 if (!qualifiedTeams) {
 showNotification(
 "Unable to generate knockouts because standings are incomplete.",
 "error",
 );
 setConfirmation(null);
 return;
 }

 const matchesToAdd = [
 {
 tournamentId: tournament.id,
 team1Id: qualifiedTeams.semifinal1.team1Id,
 team2Id: qualifiedTeams.semifinal1.team2Id,
 date: tournament.endDate || new Date().toISOString().split("T")[0],
 time: "10:00",
 oversPerInnings: tournament.defaultOvers || 20,
 knockoutType: "semifinal" as const,
 numberOfPlayers: tournament.numberOfPlayers || 11,
 },
 {
 tournamentId: tournament.id,
 team1Id: qualifiedTeams.semifinal2.team1Id,
 team2Id: qualifiedTeams.semifinal2.team2Id,
 date: tournament.endDate || new Date().toISOString().split("T")[0],
 time: "14:00",
 oversPerInnings: tournament.defaultOvers || 20,
 knockoutType: "semifinal" as const,
 numberOfPlayers: tournament.numberOfPlayers || 11,
 },
 ];

 addMatchesBatch(matchesToAdd, tournament.ownerId);

 showNotification("Semi-finals generated successfully", "success");
 setConfirmation(null);
 },
 confirmText: "Generate",
 confirmVariant: "primary",
 });
 };

 const handleDeleteMatch = (matchId: string) => {
 setConfirmation({
 title: "Delete Match?",
 message:
 "Are you sure you want to delete this scheduled match? This action cannot be undone.",
 onConfirm: () => {
 deleteMatch(matchId);
 showNotification("Match deleted", "delete");
 setConfirmation(null);
 },
 });
 };

 const handleUpdateMatch = () => {
 setEditError(null);
 if (!editingMatch || !editValidation.valid) {
 setEditError(
 editValidation.message || "Please fill all fields correctly.",
 );
 return;
 }

 const maxOvers = editFormData.maxOversPerBowler
 ? Number(editFormData.maxOversPerBowler)
 : undefined;

 updateMatch(editingMatch.id, {
 ...editFormData,
 oversPerInnings: overs,
 maxOversPerBowler: maxOvers,
 });
 showNotification("Match updated successfully!", "success");
 setEditingMatch(null);
 };

 const handleDeleteTeam = (team: Team) => {
 const teamHasMatches = matches.some(
 (m) =>
 m.tournamentId === selectedTournamentId &&
 (m.team1Id === team.id || m.team2Id === team.id),
 );
 if (teamHasMatches) {
 showNotification(
 `Cannot remove "${team.name}" as it's in a match in this tournament.`,
 "error",
 );
 return;
 }
 setConfirmation({
 title: `Remove ${team.name}?`,
 message: `Are you sure you want to remove "${team.name}" from this tournament? The team itself will not be deleted.`,
 onConfirm: () => {
 if (selectedTournamentId) {
 removeTeamFromTournament(team.id, selectedTournamentId);
 showNotification(
 `Team "${team.name}" removed from tournament.`,
 "delete",
 );
 }
 setConfirmation(null);
 },
 confirmText: "Confirm Remove",
 });
 };

 const handleShareMatch = async (match: Match) => {
 const team1 = getTeamById(match.team1Id);
 const team2 = getTeamById(match.team2Id);
 const tournament = getTournamentById(match.tournamentId);

 if (!team1 || !team2 || !tournament) {
 showNotification("Could not generate match card data.", "error");
 return;
 }

 const componentString = ReactDOMServer.renderToStaticMarkup(
 <MatchShareCard
 match={match}
 team1={team1}
 team2={team2}
 tournament={tournament as Tournament}
 />,
 );

 const svgString = `
 <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
 <foreignObject width="100%" height="100%">
 <div xmlns="http://www.w3.org/1999/xhtml">
 ${componentString}
 </div>
 </foreignObject>
 </svg>
 `;

 const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

 const canvas = document.createElement("canvas");
 canvas.width = 400;
 canvas.height = 500;
 const ctx = canvas.getContext("2d");
 if (!ctx) {
 showNotification("Could not generate image.", "error");
 return;
 }

 const img = new Image();
 img.onload = () => {
 ctx.drawImage(img, 0, 0);
 canvas.toBlob(async (blob) => {
 if (!blob) {
 showNotification("Could not generate image.", "error");
 return;
 }

 const file = new File([blob], `match-card-${match.id}.png`, {
 type: "image/png",
 });

 if (navigator.canShare && navigator.canShare({ files: [file] })) {
 try {
 await navigator.share({
 title: `${team1.name} vs ${team2.name}`,
 text: `Upcoming match in the ${tournament.name}!`,
 files: [file],
 });
 } catch (error) {
 if ((error as DOMException)?.name !== "AbortError") {
 showNotification("Sharing failed.", "error");
 }
 }
 } else {
 showNotification(
 "Web Share not supported. Downloading image.",
 "info",
 );
 const link = document.createElement("a");
 link.href = URL.createObjectURL(blob);
 link.download = `match-card-${match.id}.png`;
 link.click();
 URL.revokeObjectURL(link.href);
 }
 }, "image/png");
 };
 img.onerror = () => {
 showNotification("Failed to load image for sharing.", "error");
 };
 img.src = svgDataUrl;
 };

 const handleConfirmToss = (winnerId: string, decision: TossDecision) => {
 if (tossMatch) {
 updateToss(tossMatch.id, { winner: winnerId, decision });
 }
 setTossMatch(null);
 };

 const handleViewTournament = (tournamentId: string) => {
 onViewTournament(tournamentId);
 setView("overview");
 };

 const TABS = useMemo(() => {
 if (!selectedTournamentId)
 return [{ id: "tournaments", label: "Tournaments" }];

 const tabs: { id: View; label: string }[] = [
 { id: "overview", label: "Overview" },
 { id: "fixtures", label: "Fixtures" },
 { id: "points", label: "Points" },
 { id: "teams", label: "Teams" },
 { id: "stats", label: "Stats" },
 ];

 return tabs;
 }, [selectedTournamentId]);

 const handleTouchStart = (e: React.TouchEvent) => {
 const target = e.target as HTMLElement;
 if (
 target.closest(
 'button, a, input, select, textarea, [role="button"], .no-swipe, .recharts-surface, .overflow-x-auto, [data-no-swipe="true"]',
 )
 ) {
 return;
 }
 setTouchStartX(e.targetTouches[0].clientX);
 setTouchCurrentX(e.targetTouches[0].clientX);
 };

 const handleTouchMove = (e: React.TouchEvent) => {
 if (touchStartX === null) return;
 setTouchCurrentX(e.targetTouches[0].clientX);
 };

 const handleTouchEnd = () => {
 if (touchStartX === null || touchCurrentX === null || TABS.length <= 1) {
 return;
 }

 const diffX = touchStartX - touchCurrentX;
 const SWIPE_THRESHOLD = 75;

 if (Math.abs(diffX) > SWIPE_THRESHOLD) {
 const tabIds = TABS.map((t) => t.id) as View[];
 const currentIndex = tabIds.indexOf(view);

 if (diffX > 0) {
 // Swiped left
 if (currentIndex < tabIds.length - 1) {
 setView(tabIds[currentIndex + 1]);
 }
 } else {
 // Swiped right
 if (currentIndex > 0) {
 setView(tabIds[currentIndex - 1]);
 }
 }
 }

 setTouchStartX(null);
 setTouchCurrentX(null);
 };

 const tossMatchTeam1 = tossMatch ? getTeamById(tossMatch.team1Id) : null;
 const tossMatchTeam2 = tossMatch ? getTeamById(tossMatch.team2Id) : null;

 const matchTableProps = {
 today,
 getTeamById,
 getTournamentById,
 isMatchLive,
 handleShareMatch,
 setEditingMatch,
 handleDeleteMatch,
 onViewMatchResult,
 onContinueMatch,
 onStartMatch,
 setTossMatch,
 onOpenMatchHub: handleOpenMatchHub,
 focusTeamId,
 };

 const getStageTag = (match: Match) => {
 if (match.knockoutType === "final") {
 return (
 <span className="text-[10px] font-bold text-warning bg-warning/20 dark:bg-warning/20 px-2 py-0.5 rounded-2xl uppercase">
 Final
 </span>
 );
 }
 if (match.knockoutType === "semifinal") {
 return (
 <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/20 dark:bg-blue-900/30 px-2 py-0.5 rounded-2xl uppercase">
 Semifinal
 </span>
 );
 }
 if (tournament?.format === "Knockout" && !match.knockoutType) {
 return (
 <span className="text-[10px] font-bold text-brand-lavender bg-brand-lavender/20 dark:bg-brand-lavender/30 px-2 py-0.5 rounded-2xl uppercase">
 Qualifier
 </span>
 );
 }
 if (match.groupId) {
 return (
 <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-2xl uppercase">
 Group {match.groupId.toUpperCase()}
 </span>
 );
 }
 if (
 (tournament?.format === "Round Robin" ||
 tournament?.format === "Round Robin + Knockout") &&
 !match.knockoutType
 ) {
 return (
 <span className="text-[10px] font-bold text-success bg-success/20 dark:bg-green-900/30 px-2 py-0.5 rounded-2xl uppercase">
 Group Stage
 </span>
 );
 }
 return null;
 };

 const focusedTeam = focusTeamId ? getTeamById(focusTeamId) : null;

 return (
 <div className="space-y-6">
 {focusedTeam && (
 <div className="bg-brand-blue/5 border border-brand-blue/20 p-3 rounded-xl flex items-center justify-between text-sm shadow-sm">
 <div className="flex items-center gap-2 text-brand-blue dark:text-blue-400">
 <svg
 className="w-5 h-5 text-brand-blue/70"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
 />
 </svg>
 <span className="font-semibold">
 Viewing fixtures for {focusedTeam.name}
 </span>
 </div>
 </div>
 )}

 <MatchFilters tabs={TABS} currentView={view} onViewChange={setView} />

 {knockoutEligibility?.canGenerate &&
 (view === "points" || view === "fixtures") && (
 <CrickIQCard className="bg-brand-blue/5 border-brand-blue/20">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h3 className="font-semibold text-text-primary text-lg">
 League Stage Complete
 </h3>
 <p className="text-sm text-text-secondary">
 Top teams are ready. Generate semi-final fixtures
 automatically from standings.
 </p>
 </div>
 <button
 onClick={handleGenerateKnockouts}
 className="bg-brand-blue text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors whitespace-nowrap"
 >
 Generate Knockouts
 </button>
 </div>
 </CrickIQCard>
 )}

 <div
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 >
 {view === "overview" && selectedTournamentId && tournament && dashboardSummary && (
 <div className="space-y-6">
 
 {tournamentHighlights?.champion && (
 <div className="bg-gradient-to-r from-brand-blue to-blue-600 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
 <div className="relative z-10 space-y-2">
 <span className="flex items-center gap-2 text-sm uppercase tracking-wider font-bold text-blue-100">
 🏆 Champions
 </span>
 <h2 className="text-xl font-bold tracking-tight">{tournamentHighlights.champion.teamName}</h2>
 <p className="text-blue-50/90 text-sm md:text-base">
 {tournamentHighlights.champion.opponentTeamName ? 
 `${tournamentHighlights.champion.resultSummary || 'Won the Final'} vs ${tournamentHighlights.champion.opponentTeamName}` :
 tournamentHighlights.champion.resultSummary || 'Won the tournament'
 }
 </p>
 </div>
 <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4">
 <svg className="h-full w-auto" viewBox="0 0 24 24" fill="currentColor">
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.1 1.64-1.74 0-2.38-.98-2.44-2z"/>
 </svg>
 </div>
 </div>
 )}

 <div className="bg-primary/20 p-5 rounded-2xl border border-brand-blue/15 space-y-4">
 <h2 className="text-xl font-semibold text-text-primary tracking-tight">{tournament.name || "Tournament"}</h2>
 <div className="flex flex-wrap gap-2 text-sm">
 <span className="bg-brand-blue text-white px-3 py-1 rounded-full font-medium">
 {tournament.format || "Standard Format"}
 </span>
 {tournament.location && (
 <span className="bg-black/5 dark:bg-white/5 text-text-primary px-3 py-1 rounded-full flex items-center gap-1">
 <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 {tournament.location}
 </span>
 )}
 <span className="bg-black/5 dark:bg-white/5 text-text-primary px-3 py-1 rounded-full flex items-center gap-1">
 {dashboardSummary.currentStageLabel}
 </span>
 </div>
 </div>

 <TournamentProgressTracker tournament={tournament} matches={matches} teams={teams} />
 
 <UpcomingMatchWidget 
 tournament={tournament} 
 matches={matches} 
 teams={teams}
 onStartMatch={onStartMatch}
 onSetToss={setTossMatch}
 onContinueMatch={onContinueMatch}
 onOpenMatchHub={handleOpenMatchHub}
 />

 <CrickIQCard>
 <h3 className="font-semibold text-text-primary text-lg mb-4">Quick Stats Summary</h3>
 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Teams</span>
 <span className="font-bold text-lg text-text-primary">{dashboardSummary.teamsCount}</span>
 </div>
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Total Matches</span>
 <span className="font-bold text-lg text-text-primary">{dashboardSummary.totalMatches}</span>
 </div>
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Completed</span>
 <span className="font-bold text-lg text-text-primary">{dashboardSummary.completedMatches}</span>
 </div>
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Live</span>
 <span className="font-bold text-lg text-brand-blue">{dashboardSummary.liveMatches}</span>
 </div>
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Upcoming</span>
 <span className="font-bold text-lg text-text-primary">{dashboardSummary.upcomingMatches}</span>
 </div>
 <div className="bg-tertiary flex flex-col justify-center">
 <span className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Knockouts</span>
 <span className="font-bold text-lg text-text-primary">{dashboardSummary.knockoutMatches}</span>
 </div>
 </div>
 </CrickIQCard>

 <div className="space-y-4">
 <h3 className="font-semibold text-text-primary text-lg">Top Performers</h3>
 {!topPerformers || (!topPerformers.topRunScorer && !topPerformers.topWicketTaker && !topPerformers.highestScore && !topPerformers.bestBowling) ? (
 <CrickIQCard className="text-center py-6">
 <p className="text-text-secondary">Stats will appear after completed matches.</p>
 </CrickIQCard>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {topPerformers.topRunScorer && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">Top Run Scorer</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.topRunScorer.playerName}</div>
 <div className="text-sm text-text-secondary truncate">{topPerformers.topRunScorer.teamName} <span className="mx-1">•</span> <span className="text-brand-blue font-semibold whitespace-nowrap">{topPerformers.topRunScorer.runs} Runs</span></div>
 </CrickIQCard>
 )}
 {topPerformers.topWicketTaker && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">Top Wicket Taker</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.topWicketTaker.playerName}</div>
 <div className="text-sm text-text-secondary truncate">{topPerformers.topWicketTaker.teamName} <span className="mx-1">•</span> <span className="text-brand-blue font-semibold whitespace-nowrap">{topPerformers.topWicketTaker.wickets} Wickets</span></div>
 </CrickIQCard>
 )}
 {topPerformers.highestScore && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">Highest Score</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.highestScore.playerName}</div>
 <div className="text-sm text-text-secondary truncate">{topPerformers.highestScore.teamName} <span className="mx-1">•</span> <span className="text-brand-blue font-semibold whitespace-nowrap">{topPerformers.highestScore.runs}{topPerformers.highestScore.notOut ? '*' : ''}</span></div>
 </CrickIQCard>
 )}
 {topPerformers.bestBowling && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">Best Bowling</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.bestBowling.playerName}</div>
 <div className="text-sm text-text-secondary truncate">{topPerformers.bestBowling.teamName} <span className="mx-1">•</span> <span className="text-brand-blue font-semibold whitespace-nowrap">{topPerformers.bestBowling.wickets}/{topPerformers.bestBowling.runsConceded}</span></div>
 </CrickIQCard>
 )}
 </div>
 )}
 </div>

 <div className="space-y-4">
 <h3 className="font-semibold text-text-primary text-lg">Tournament Achievements</h3>
 {!tournamentHighlights || (!tournamentHighlights.achievements.mostWins && !tournamentHighlights.achievements.bestNRR && !tournamentHighlights.achievements.highestTeamScore) ? (
 <CrickIQCard className="text-center py-6">
 <p className="text-text-secondary">Achievements will appear after completed matches.</p>
 </CrickIQCard>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {tournamentHighlights.achievements.mostWins && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">💪 Most Wins</span>
 <div className="font-bold text-lg text-text-primary truncate">{tournamentHighlights.achievements.mostWins.teamName}</div>
 <div className="text-sm text-brand-blue font-semibold">{tournamentHighlights.achievements.mostWins.value}</div>
 </CrickIQCard>
 )}
 {tournamentHighlights.achievements.bestNRR && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">🔥 Best NRR</span>
 <div className="font-bold text-lg text-text-primary truncate">{tournamentHighlights.achievements.bestNRR.teamName}</div>
 <div className="text-sm text-brand-blue font-semibold">{tournamentHighlights.achievements.bestNRR.value}</div>
 </CrickIQCard>
 )}
 {tournamentHighlights.achievements.highestTeamScore && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">🚀 Highest Team Score</span>
 <div className="font-bold text-lg text-text-primary truncate">{tournamentHighlights.achievements.highestTeamScore.teamName}</div>
 <div className="text-sm text-brand-blue font-semibold">{tournamentHighlights.achievements.highestTeamScore.value}</div>
 </CrickIQCard>
 )}
 {topPerformers?.topRunScorer && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">🧢 Top Run Scorer</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.topRunScorer.playerName}</div>
 <div className="text-sm text-brand-blue font-semibold">{topPerformers.topRunScorer.runs} Runs</div>
 </CrickIQCard>
 )}
 {topPerformers?.topWicketTaker && (
 <CrickIQCard className="!p-4 bg-tertiary ">
 <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">🎯 Top Wicket Taker</span>
 <div className="font-bold text-lg text-text-primary truncate">{topPerformers.topWicketTaker.playerName}</div>
 <div className="text-sm text-brand-blue font-semibold">{topPerformers.topWicketTaker.wickets} Wickets</div>
 </CrickIQCard>
 )}
 </div>
 )}
 </div>

 </div>
 )}
 
 {view === "tournaments" && (
 <TournamentList
 tournaments={tournaments}
 teams={teams}
 matches={matches}
 isMatchLive={isMatchLive}
 deleteTournament={props.deleteTournament}
 updateTournament={props.updateTournament}
 onViewTournament={handleViewTournament}
 addTournament={props.addTournament}
 />
 )}

 {view === "fixtures" && (
 <div className="space-y-6 relative z-50">
 <div className="flex bg-secondary dark:bg-black/20 rounded-lg p-1 space-x-1 border border-[#DCE3F0] dark:border-border">
 <button
 onClick={() => setFixtureView("manual")}
 className={`flex-1 py-2 px-4 text-body font-semibold rounded-md transition-colors ${fixtureView === "manual" ? "bg-primary text-brand-blue dark:text-white shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"}`}
 >
 Manual
 </button>
 <button
 onClick={() => setFixtureView("automation")}
 className={`flex-1 py-2 px-4 text-body font-semibold rounded-md transition-colors ${fixtureView === "automation" ? "bg-primary text-brand-blue dark:text-white shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"}`}
 >
 Automation
 </button>
 </div>

 {fixtureView === "automation" ? (
 <div className="animate-fade-in">
 <ScheduleGenerator {...props} />
 </div>
 ) : (
 <div className="animate-fade-in space-y-6">
 <MatchCreationForm
 isCalendarOpen={isCalendarOpen}
 setIsCalendarOpen={setIsCalendarOpen}
 calendarPosition={calendarPosition}
 setCalendarPosition={setCalendarPosition}
 calendarContainerRef={calendarContainerRef}
 selectedTournamentId={selectedTournamentId}
 selectedTournamentForForm={selectedTournamentForForm}
 setSelectedTournamentForForm={setSelectedTournamentForForm}
 team1Id={team1Id}
 setTeam1Id={setTeam1Id}
 team2Id={team2Id}
 setTeam2Id={setTeam2Id}
 matchDate={matchDate}
 setMatchDate={setMatchDate}
 matchTime={matchTime}
 setMatchTime={setMatchTime}
 matchOvers={matchOvers}
 setMatchOvers={setMatchOvers}
 matchMaxOvers={matchMaxOvers}
 setMatchMaxOvers={setMatchMaxOvers}
 isOversEditable={isOversEditable}
 scheduleError={scheduleError}
 isScheduleFormValid={isScheduleFormValid}
 handleAddMatch={handleAddMatch}
 team1Options={team1Options}
 team2Options={team2Options}
 allTournamentTeams={allTournamentTeams}
 availableTeams={availableTeams}
 tournaments={tournaments}
 checkTeamReadiness={checkTeamReadiness}
 />
 </div>
 )}
 </div>
 )}

 {view === "fixtures" && (
 <div className="mt-8 space-y-6">
 {liveMatches.length > 0 && (
 <MatchTable
 list={liveMatches}
 title="Live Matches"
 emptyMessage=""
 {...matchTableProps}
 />
 )}
 
 {upcomingMatches.length > 0 && (
 tournament?.groups ? (
 <>
 <MatchTable
 list={upcomingMatches.filter((m) => m.groupId === "a")}
 title="Upcoming Group A Matches"
 emptyMessage=""
 {...matchTableProps}
 />
 <MatchTable
 list={upcomingMatches.filter((m) => m.groupId === "b")}
 title="Upcoming Group B Matches"
 emptyMessage=""
 {...matchTableProps}
 />
 </>
 ) : (
 <MatchTable
 list={upcomingMatches}
 title="Upcoming Matches"
 emptyMessage=""
 {...matchTableProps}
 />
 )
 )}

 {knockoutMatches.length > 0 && (
 <MatchTable
 list={knockoutMatches}
 title="Knockout Matches"
 emptyMessage=""
 {...matchTableProps}
 />
 )}

 {liveMatches.length === 0 && upcomingMatches.length === 0 && knockoutMatches.length === 0 && completedMatches.length === 0 && (
 <CrickIQCard className="text-center">
 <p className="text-text-secondary">No fixtures generated yet.</p>
 </CrickIQCard>
 )}

 {completedMatches.length > 0 && (
 <div>
 <h3 className="font-bold text-lg mb-4 ml-1">Completed Matches</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {completedMatches
 .sort(
 (a, b) =>
 new Date(b.date).getTime() - new Date(a.date).getTime(),
 )
 .map((match) => {
 const team1 = getTeamById(match.team1Id);
 const team2 = getTeamById(match.team2Id);
 if (!team1 || !team2) return null;

 let winnerMessage = "Match Drawn";
 if (match.wasAbandoned) {
 winnerMessage = "Match Abandoned";
 } else if (match.winnerId && match.winnerId !== "draw") {
 const winner = getTeamById(match.winnerId);
 if (winner) {
 if (
 match.innings2 &&
 winner.id === match.innings2.battingTeamId
 ) {
 const battingTeam = getTeamById(
 match.innings2.battingTeamId,
 );
 const maxPlayers = getMaxPlayers(match);
 const totalPlayers =
 battingTeam?.players?.length > 0
 ? battingTeam.players.length
 : maxPlayers;
 const wicketsLeft =
 totalPlayers - 1 - (match.innings2.wickets || 0);
 winnerMessage = `${winner.name} won by ${wicketsLeft} wickets`;
 } else if (
 match.innings1 &&
 winner.id === match.innings1.battingTeamId
 ) {
 const runMargin =
 (match.innings1.score || 0) -
 (match.innings2?.score || 0);
 winnerMessage = `${winner.name} won by ${runMargin} runs`;
 } else {
 winnerMessage = `${winner.name} won`;
 }
 }
 }

 const team1Score =
 match.innings1?.battingTeamId === team1.id
 ? match.innings1
 : match.innings2;
 const team2Score =
 match.innings1?.battingTeamId === team2.id
 ? match.innings1
 : match.innings2;

 let manOfTheMatchPlayer: Player | undefined;
 if (match.manOfTheMatchId) {
 const allPlayers = teams.flatMap((t) => t.players);
 manOfTheMatchPlayer = allPlayers.find(
 (p) => p.id === match.manOfTheMatchId,
 );
 }

 return (
 <CrickIQCard
            key={match.id}
            className="p-0 bg-secondary shadow-sm rounded-3xl overflow-hidden relative border border-border/20 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
            onClick={() => onViewMatchResult(match.id)}
        >
            <div className="absolute top-0 left-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: team1.logo || '#4285F4' }}></div>
            <div className="p-4 pb-0 pl-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {match.wasAbandoned ? 'Abandoned' : 'Completed'}
                        </span>
                        {getStageTag(match)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-tertiary/20 p-2 -mx-2 rounded-xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
                            <div 
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                                style={{ backgroundColor: team1.logo || '#3B82F6' }}
                            >
                                {team1.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                                {team1.name}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                            {team1Score ? (
                                <>
                                    <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                                        {team1Score.score}/{team1Score.wickets ?? 0}
                                    </span>
                                    <span className="font-mono text-xs text-text-secondary">
                                        ({team1Score.overs ?? 0})
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-tertiary/20 p-2 -mx-2 rounded-xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
                            <div 
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                                style={{ backgroundColor: team2.logo || '#EF4444' }}
                            >
                                {team2.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                                {team2.name}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                            {team2Score ? (
                                <>
                                    <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                                        {team2Score.score}/{team2Score.wickets ?? 0}
                                    </span>
                                    <span className="font-mono text-xs text-text-secondary">
                                        ({team2Score.overs ?? 0})
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-tertiary/50 border-t border-black/5 dark:border-white/5 p-3 pl-5 mt-4 text-center">
                <span className={`text-[12px] font-bold uppercase tracking-tight ${match.wasAbandoned ? 'text-red-500' : 'text-text-primary'}`}>
                    {winnerMessage}
                </span>
                {manOfTheMatchPlayer && (
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-blue mt-1">
                        🌟 Player of the Match: {manOfTheMatchPlayer.name}
                    </span>
                )}
            </div>
        </CrickIQCard>
 );
 })}
 </div>
 </div>
 )}
 </div>
 )}
 {view === "teams" && selectedTournamentId && (
 <div className="space-y-6">
 {allTournamentTeams.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {allTournamentTeams.map((team) => {
 const captain = team.captainId
 ? team.players.find((p) => p.id === team.captainId)
 : null;
 const viceCaptain = team.viceCaptainId
 ? team.players.find((p) => p.id === team.viceCaptainId)
 : null;
 const isReady = checkTeamReadiness(team);
 const cardBg = `linear-gradient(135deg, ${team.logo} 0%, ${adjustColor(team.logo, 60)} 100%)`;

 return (
 <CrickIQCard
 key={team.id}
 className="flex flex-col ! overflow-hidden hover: transition-shadow duration-300 cursor-pointer"
 onClick={() => {
 if (isReady) {
 setPreviewingTeam(team);
 } else {
 setEditingTeamId(team.id);
 }
 }}
 >
 <div className="p-4" style={{ background: cardBg }}>
 <div className="flex justify-between items-start text-white">
 <h3 className="text-2xl font-bold truncate pr-4">{team.name}</h3>
 <div className="flex items-center -mr-2 -mt-2">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setEditingTeamId(team.id);
 }}
 className="p-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
 title="Edit Team"
 >
 <EditIcon className="w-5 h-5" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleDeleteTeam(team);
 }}
 disabled={isMatchLive}
 className="p-2 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
 title={
 isMatchLive
 ? "Cannot delete team during a live match"
 : "Delete Team"
 }
 >
 <TrashIcon className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 <div className="p-4 flex-grow flex flex-col">
 <div className="space-y-4 flex-grow">
 <div className="flex items-center gap-4 text-body">
 <div className="w-6 h-6 flex items-center justify-center bg-yellow-400 text-black rounded-full font-bold text-caption flex-shrink-0">
 C
 </div>
 <span className="font-semibold truncate text-text-primary">
 {captain ? captain.name : "Not Set"}
 </span>
 </div>
 <div className="flex items-center gap-4 text-body">
 <div className="w-6 h-6 flex items-center justify-center bg-text-secondary/20 text-text-secondary rounded-full font-bold text-caption flex-shrink-0">
 VC
 </div>
 <span className="font-semibold truncate text-text-primary">
 {viceCaptain ? viceCaptain.name : "Not Set"}
 </span>
 </div>
 <div className="flex flex-col gap-1.5 justify-center">
 <div className="flex items-center gap-4 text-body">
 <UserGroupIcon className="w-6 h-6 text-text-secondary" />
 <span className="font-semibold text-text-primary">
 {team.players.length} Players in Team Pool
 </span>
 </div>
 {team.players.length < maxPlayers && (
 <div className="text-[11px] text-highlight font-medium flex items-center gap-1 leading-normal ml-10">
 <svg
 xmlns="http://www.w3.org/2000/svg"
 className="h-4 w-4 shrink-0"
 viewBox="0 0 20 20"
 fill="currentColor"
 >
 <path
 fillRule="evenodd"
 d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
 clipRule="evenodd"
 />
 </svg>
 <span>
 Roster incomplete — add at least {maxPlayers} players
 before match setup.
 </span>
 </div>
 )}
 </div>
 </div>
 <div className="mt-4 pt-4 border-t border-brand-blue/15 text-center">
 <div
 className={`flex items-center justify-center gap-1.5 text-body font-bold ${isReady ? "text-success" : "text-highlight"}`}
 >
 {isReady ? (
 <CheckIcon className="w-5 h-5" />
 ) : (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 className="h-5 w-5"
 viewBox="0 0 20 20"
 fill="currentColor"
 >
 <path
 fillRule="evenodd"
 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
 clipRule="evenodd"
 />
 </svg>
 )}
 <span>{isReady ? "Ready" : "Not Ready"}</span>
 </div>
 </div>
 </div>
 </CrickIQCard>
 );
 })}
 </div>
 ) : (
 <CrickIQCard className="text-center">
 <p className="text-text-secondary">
 No teams added to this tournament yet.
 </p>
 </CrickIQCard>
 )}
 </div>
 )}
 {view === "points" && selectedTournamentId && (
 <PointsTable {...props} tournamentId={selectedTournamentId} />
 )}
 {view === "stats" && selectedTournamentId && (
 <Statistics {...props} tournamentId={selectedTournamentId} />
 )}
 </div>
 {confirmation && (
 <ConfirmationModal
 onClose={() => setConfirmation(null)}
 onConfirm={confirmation.onConfirm}
 title={confirmation.title}
 message={confirmation.message}
 confirmText={confirmation.confirmText}
 confirmVariant={confirmation.confirmVariant}
 />
 )}
 {tossMatch && tossMatchTeam1 && tossMatchTeam2 && (
 <TossModal
 isOpen={!!tossMatch}
 onClose={() => setTossMatch(null)}
 onConfirm={handleConfirmToss}
 team1={tossMatchTeam1}
 team2={tossMatchTeam2}
 />
 )}
 {previewingTeam && (
 <div
 className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
 onClick={() => setPreviewingTeam(null)}
 >
 <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
 <CrickIQCard>
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Team Preview</h3>
 <button
 onClick={() => setPreviewingTeam(null)}
 className="text-3xl leading-none text-text-secondary hover:text-text-primary"
 >
 &times;
 </button>
 </div>
 <LineupPreview
 team={previewingTeam}
 playerStats={previewingTeamStats}
 />
 <div className="mt-4 flex justify-end gap-2">
 <Button
 onClick={() => {
 setEditingTeamId(previewingTeam.id);
 setPreviewingTeam(null);
 }}
 variant="secondary"
 >
 <EditIcon /> Edit Team
 </Button>
 </div>
 </CrickIQCard>
 </div>
 </div>
 )}
 {editingTeamId && selectedTournamentId && getTeamById(editingTeamId) && (
 <TeamEditorModal
 team={getTeamById(editingTeamId)!}
 tournamentId={selectedTournamentId}
 addPlayerReplacement={addPlayerReplacement}
 onClose={() => setEditingTeamId(null)}
 isMatchLive={isMatchLive}
 onDone={() => {
 setEditingTeamId(null);
 }}
 {...props}
 />
 )}
 <EditMatchModal
 editingMatch={editingMatch}
 editFormData={editFormData}
 setEditFormData={setEditFormData}
 editTeam1Options={editTeam1Options}
 editTeam2Options={editTeam2Options}
 editError={editError}
 isEditFormValid={isEditFormValid}
 setEditingMatch={setEditingMatch}
 handleUpdateMatch={handleUpdateMatch}
 />

 {(view === 'overview' || view === 'teams') && selectedTournamentId && (
 <button
 onClick={() => setIsTeamManagementSheetOpen(true)}
 className="fixed bottom-24 right-6 z-40 flex items-center justify-center gap-2 px-5 h-14 bg-brand-blue hover:bg-brand-blue/90 dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-black rounded-full font-bold shadow-lg shadow-brand-blue/20 dark:shadow-accent/20 transition-all active:scale-95 border border-brand-blue/10 dark:border-accent-hover/20"
 aria-label="Manage Teams"
 >
 <PlusIcon className="w-6 h-6 shrink-0" />
 <span className="text-xs font-bold uppercase tracking-wider">Team</span>
 </button>
 )}

 <TournamentTeamManagementSheet
 isOpen={isTeamManagementSheetOpen}
 onClose={() => setIsTeamManagementSheetOpen(false)}
 tournament={tournament || null}
 allTeams={teams}
 onCreateNewTeam={() => {
 setIsCreateTeamOpen(true);
 }}
 onSelectExistingTeam={(teamId) => {
 if (selectedTournamentId) {
 const teamToLink = getTeamById(teamId);
 if (teamToLink) {
 addTeamToTournament(teamToLink.name, selectedTournamentId, teamId);
 showNotification(`Added ${teamToLink.name} to tournament`, "success");
 }
 }
 }}
 onEditTeam={(teamId) => {
 setEditingTeamId(teamId);
 setView("teams");
 }}
 />

 <CreateTeamSheet
 isOpen={isCreateTeamOpen}
 onClose={() => setIsCreateTeamOpen(false)}
 teams={teams}
 createGlobalTeam={createGlobalTeam}
 onSuccess={(team) => {
 if (selectedTournamentId) {
 addTeamToTournament(team.name, selectedTournamentId, team.id);
 showNotification(`Added ${team.name} to tournament`, "success");
 setView("teams");
 }
 }}
 />
 </div>
 );
};

export default MatchManager;
