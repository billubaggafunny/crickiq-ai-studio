/* eslint-disable react-hooks/set-state-in-effect */
import { Table, Thead, Tbody, Tr, Th, Td } from "./CrickIQTable";
import CrickIQCard from "./CrickIQCard";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import type { Match, Ball, BowlerScore, Innings } from "../types";
import { BattingStatus, WicketType, PlayerRole } from "../types";
import {
  calculateStrikeRate,
  getDismissalText,
  calculateRunRate,
  generateCommentaryData,
  getBallDisplay,
  getBallOutcomeChipClass,
} from "../utils/cricketLogic";
import CommentaryFeedDisplay from "./CommentaryFeedDisplay";
import { getEffectiveSquadPlayers } from "../utils/matchConfig";
import { getRoleEmoji, SwapIcon, PlusIcon, MinusIcon } from "../constants";
import ConfirmationModal from "./ConfirmationModal";
import { useNotification } from "../hooks/useNotification";
import ImpactPlayerModal from "./ImpactPlayerModal";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatScore, formatOvers } from "../utils/scoreFormatters";

// FIX: Define LiveScoringProps interface to resolve TypeScript error.
interface LiveScoringProps extends UseCrickIQStateReturn {
  match: Match;
  onEndMatch: () => void;
  onStartDrinksBreak: () => void;
  onBack?: () => void;
}

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props,
) => (
  <select
    {...props}
    className={`w-full p-1.5 text-body bg-tertiary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-primary/35 dark:border-border/25 dark:text-text-primary focus:dark:border-accent focus:dark:ring-2 focus:dark:ring-accent/20 ${props.className}`}
  />
);

function usePrevious<T>(value: T): T | undefined {
  // FIX: Changed useRef<T>() to useRef<T | undefined>() to be more explicit about the ref's type,
  // which can hold either a value of type T or undefined. This helps resolve obscure tooling errors.
  // FIX: Provide an initial value to `useRef` to satisfy TypeScript's requirement for at least one argument.
  const ref = useRef<T | undefined>(undefined);
  // FIX: Add dependency array to useEffect to resolve a build error.
  useEffect(() => {
    ref.current = value;
  }, [value]);
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

const getRunButtonDarkClasses = (r: number, isSelected: boolean): string => {
  if (!isSelected) {
    return "dark:bg-tertiary/60 dark:text-text-primary dark:border-transparent dark:shadow-none";
  }
  switch (r) {
    case 0:
      return "dark:bg-white dark:text-black dark:shadow-md";
    case 1:
    case 2:
    case 3:
      return "dark:bg-accent dark:text-black dark:shadow-md";
    case 4:
      return "dark:bg-info dark:text-white dark:shadow-md";
    case 6:
      return "dark:bg-purple dark:text-white dark:shadow-md";
    default:
      return "dark:bg-tertiary/60 dark:text-text-primary dark:border-transparent dark:shadow-none";
  }
};

const LiveScoring: React.FC<LiveScoringProps> = ({
  match,
  recordBall,
  getTeamById,
  updateLivePlayers,
  onEndMatch,
  retireBatsman,
  undoLastBall,
  endInnings,
  toggleFreeHit,
  onStartDrinksBreak,
  addPlayerReplacement,
  updateTeam,
  teams,
  onBack,
}) => {
  const { showNotification } = useNotification();
  const [activeScoringTab, setActiveScoringTab] = useState<
    "scoring" | "players" | "scoreboard" | "commentary"
  >("scoring");

  // Impact Player Modal State
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactModalTeamId, setImpactModalTeamId] = useState<string | null>(
    null,
  );
  const [runs, setRuns] = useState(0);
  const [isWide, setIsWide] = useState(false);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isBye, setIsBye] = useState(false);
  const [isLegBye, setIsLegBye] = useState(false);
  const [isWicket, setIsWicket] = useState(false);

  const [wicketDetails, setWicketDetails] = useState<{
    type: WicketType | "";
    fielderId: string;
    outPlayerId: string;
  }>({ type: "", fielderId: "", outPlayerId: "" });

  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: "danger" | "primary";
  } | null>(null);
  const [emergencyBowlerChange, setEmergencyBowlerChange] = useState(false);
  const [emergencyBatsmanChange, setEmergencyBatsmanChange] = useState(false);
  const [expandedScorecards, setExpandedScorecards] = useState<Set<string>>(
    new Set(),
  );
  const [
    isFirstInningsCommentaryExpanded,
    setIsFirstInningsCommentaryExpanded,
  ] = useState(false);

  // State for swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

  const isMatchOver = match.status === "completed";

  useEffect(() => {
    if (isMatchOver) {
      // Automatically navigate to the scorecard after a short delay
      // to allow the user to see the "Match Finished" message.
      const timer = setTimeout(() => {
        onEndMatch();
      }, 2000); // 2-second delay

      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [isMatchOver, onEndMatch]);

  const currentInnings = useMemo(
    () => match.innings2 || match.innings1,
    [match],
  );

  const [showOverCompleteSheet, setShowOverCompleteSheet] = useState(false);
  const [showInningsCompleteSheet, setShowInningsCompleteSheet] = useState(false);

  const [lastShownCompletedOver, setLastShownCompletedOver] = useState<number | null>(() => {
    if (currentInnings && currentInnings.overs > 0 && currentInnings.overs % 1 === 0 && currentInnings.currentBowler === null && currentInnings.lastBowlerId) {
      return Math.round(currentInnings.overs);
    }
    return null;
  });

  const prevInnings2Exist = usePrevious(!!match.innings2);
  const battingTeam = useMemo(
    () => getTeamById(currentInnings?.battingTeamId || ""),
    [currentInnings, getTeamById],
  );
  const bowlingTeam = useMemo(
    () => getTeamById(currentInnings?.bowlingTeamId || ""),
    [currentInnings, getTeamById],
  );

  const battingSquadTeam = useMemo(() => {
    if (!battingTeam) return battingTeam;
    const isTeam1 = battingTeam.id === match.team1Id;
    const squadIds = isTeam1 ? match.team1SquadIds : match.team2SquadIds;
    if (squadIds && squadIds.length > 0) {
      return {
        ...battingTeam,
        players: getEffectiveSquadPlayers(battingTeam, match),
      };
    }
    return battingTeam;
  }, [battingTeam, match]);

  const bowlingSquadTeam = useMemo(() => {
    if (!bowlingTeam) return bowlingTeam;
    const isTeam1 = bowlingTeam.id === match.team1Id;
    const squadIds = isTeam1 ? match.team1SquadIds : match.team2SquadIds;
    if (squadIds && squadIds.length > 0) {
      return {
        ...bowlingTeam,
        players: getEffectiveSquadPlayers(bowlingTeam, match),
      };
    }
    return bowlingTeam;
  }, [bowlingTeam, match]);

  // Rule enforcement for Byes/Leg Byes
  useEffect(() => {
    if ((isBye || isLegBye) && wicketDetails.type) {
      const invalidForByes = [
        WicketType.CAUGHT,
        WicketType.LBW,
        WicketType.BOWLED,
      ];
      if (invalidForByes.includes(wicketDetails.type as WicketType)) {
        setWicketDetails((prev) => ({ ...prev, type: "" }));
        showNotification(
          "Dismissal type reset (invalid for Byes/Leg Byes).",
          "info",
        );
      }
    }
  }, [isBye, isLegBye, wicketDetails.type, showNotification]);

  // Rule enforcement for wide ball dismissals
  useEffect(() => {
    if (isWide && wicketDetails.type) {
      const invalidForWide = [
        WicketType.BOWLED,
        WicketType.CAUGHT,
        WicketType.LBW,
      ];
      if (invalidForWide.includes(wicketDetails.type as WicketType)) {
        setWicketDetails((prev) => ({ ...prev, type: "" }));
        showNotification(
          "Dismissal type reset (Invalid for a Wide delivery).",
          "info",
        );
      }
    }
  }, [isWide, wicketDetails.type, showNotification]);

  // Rule enforcement for Stumped dismissal
  useEffect(() => {
    if (wicketDetails.type === WicketType.STUMPED && bowlingSquadTeam) {
      const keeper = bowlingSquadTeam.players.find(
        (p) => p.role === PlayerRole.WICKET_KEEPER,
      );
      if (keeper) {
        // Only update if it's not already set, to avoid loops
        if (wicketDetails.fielderId !== keeper.id) {
          setWicketDetails((prev) => ({ ...prev, fielderId: keeper.id }));
          showNotification(
            `${keeper.name} automatically selected as keeper.`,
            "info",
          );
        }
      }
    }
  }, [
    wicketDetails.type,
    bowlingSquadTeam,
    wicketDetails.fielderId,
    showNotification,
  ]);

  // Rule enforcement: Reset runs for dismissals where runs off the bat are not possible.
  useEffect(() => {
    const nonRunWicketTypes = [
      WicketType.BOWLED,
      WicketType.CAUGHT,
      WicketType.LBW,
      WicketType.STUMPED,
      WicketType.HIT_WICKET,
    ];
    if (
      isWicket &&
      nonRunWicketTypes.includes(wicketDetails.type as WicketType)
    ) {
      if (runs > 0) {
        setRuns(0);
        showNotification("Runs set to 0 for this dismissal type.", "info");
      }
    }
  }, [wicketDetails.type, isWicket, runs, showNotification]);

  const wasLastBallNoBall = useMemo(() => {
    if (!currentInnings || currentInnings.balls.length === 0) return false;
    const lastBall = currentInnings.balls[currentInnings.balls.length - 1];
    return lastBall.isNoBall;
  }, [currentInnings]);

  const onStrikeId = currentInnings?.currentBatsmen[0];
  const nonStrikerId = currentInnings?.currentBatsmen[1];
  const currentBowlerId = currentInnings?.currentBowler;
  const isFreeHit = currentInnings?.isFreeHit;

  const completedOverNumber = currentInnings ? Math.round(currentInnings.overs) : 0;

  const overStats = useMemo(() => {
    if (!currentInnings || completedOverNumber === 0) return { runs: 0, wickets: 0 };
    const ballsInOver = currentInnings.balls.filter(
      (b) => b.overNumber === completedOverNumber
    );
    const runs = ballsInOver.reduce(
      (sum, b) => sum + b.runs + (b.isWide || b.isNoBall ? 1 : 0),
      0
    );
    const wickets = ballsInOver.filter((b) => b.isWicket).length;
    return { runs, wickets };
  }, [currentInnings, completedOverNumber]);

  const innings1Stats = useMemo(() => {
    if (!match.innings1) return null;
    const score = match.innings1.score;
    const wickets = match.innings1.wickets;
    const overs = match.innings1.overs;
    const runRate = calculateRunRate(score, overs);
    const target = score + 1;
    return { score, wickets, overs, runRate, target };
  }, [match.innings1]);

  const handleStartNextOver = () => {
    setShowOverCompleteSheet(false);
    if (!currentInnings?.currentBowler) {
      setActiveScoringTab("players");
    } else {
      setActiveScoringTab("scoring");
    }
  };

  const handleStartSecondInnings = () => {
    setShowInningsCompleteSheet(false);
    if (!onStrikeId || !nonStrikerId || !currentBowlerId) {
      setActiveScoringTab("players");
    } else {
      setActiveScoringTab("scoring");
    }
  };

  const arePlayersSelected = !!(onStrikeId && nonStrikerId);

  useEffect(() => {
    // If either batsman is not selected, force the view to the players tab,
    // but only if the match is NOT over.
    if (!isMatchOver && !arePlayersSelected) {
      setActiveScoringTab("players");
    }
  }, [arePlayersSelected, isMatchOver]);

  // Player lock logic
  const areBatsmenLocked =
    !!(onStrikeId && nonStrikerId) && !emergencyBatsmanChange;
  const batsmanLockTooltip = areBatsmenLocked
    ? "A batsman must be out or retired to change the selection"
    : undefined;

  const legalBallsSoFar = useMemo(() => {
    return (
      currentInnings?.balls.filter((b) => !b.isWide && !b.isNoBall).length || 0
    );
  }, [currentInnings]);

  const isOverInProgress = legalBallsSoFar > 0 && legalBallsSoFar % 6 !== 0;
  const isBowlerLocked = isOverInProgress && !emergencyBowlerChange;
  const bowlerLockTooltip = isBowlerLocked
    ? "Bowler cannot be changed mid-over unless for an emergency."
    : undefined;

  const currentOverNumberForEffect = Math.floor(currentInnings?.overs || 0);
  useEffect(() => {
    setEmergencyBowlerChange(false);
    setEmergencyBatsmanChange(false);
  }, [currentOverNumberForEffect]);

  useEffect(() => {
    if (!isWicket) {
      setWicketDetails({ type: "", fielderId: "", outPlayerId: "" });
    } else {
      // Default dismissed player to the striker when wicket is toggled on
      setWicketDetails((prev) => ({ ...prev, outPlayerId: onStrikeId || "" }));
    }
  }, [isWicket, onStrikeId]);

  // FIX: Wrapped getPlayerName in useCallback to stabilize the function reference for dependent hooks.
  const getPlayerName = useCallback(
    (id: string) => {
      return (
        bowlingTeam?.players.find((p) => p.id === id)?.name ||
        battingTeam?.players.find((p) => p.id === id)?.name ||
        "Unknown"
      );
    },
    [battingTeam, bowlingTeam],
  );

  const firstInningsCommentaryData = useMemo(
    () => generateCommentaryData(match.innings1, getPlayerName),
    [match.innings1, getPlayerName],
  );
  const currentInningsCommentaryData = useMemo(
    () => generateCommentaryData(currentInnings, getPlayerName),
    [currentInnings, getPlayerName],
  );

  const prevOnStrikeId = usePrevious(onStrikeId);
  const prevCurrentBowlerId = usePrevious(currentBowlerId);

  useEffect(() => {
    if (prevOnStrikeId !== onStrikeId && onStrikeId) {
      const playerName = getPlayerName(onStrikeId);
      showNotification(`${playerName} on strike`, "info");
    }
  }, [onStrikeId, prevOnStrikeId, getPlayerName, showNotification]);

  useEffect(() => {
    if (prevCurrentBowlerId !== currentBowlerId && currentBowlerId) {
      const bowlerName = getPlayerName(currentBowlerId);
      showNotification(`New bowler: ${bowlerName}`, "info");
    }
  }, [currentBowlerId, prevCurrentBowlerId, getPlayerName, showNotification]);

  useEffect(() => {
    if (
      !isMatchOver &&
      currentInnings &&
      currentInnings.overs > 0 &&
      currentInnings.overs % 1 === 0 &&
      currentInnings.currentBowler === null &&
      currentInnings.lastBowlerId &&
      lastShownCompletedOver !== completedOverNumber
    ) {
      setLastShownCompletedOver(completedOverNumber);
      setShowOverCompleteSheet(true);
      showNotification(`Over ${completedOverNumber} complete!`, "info");
    }
  }, [
    isMatchOver,
    currentInnings,
    currentInnings?.overs,
    currentInnings?.currentBowler,
    currentInnings?.lastBowlerId,
    completedOverNumber,
    lastShownCompletedOver,
    showNotification,
  ]);

  // Show Innings Complete Sheet when match.innings2 is created (i.e., first innings finished)
  useEffect(() => {
    if (prevInnings2Exist === false && !!match.innings2) {
      setShowInningsCompleteSheet(true);
    }
  }, [prevInnings2Exist, match.innings2]);

  // Auto Dismiss Sheets on undo/state-change
  useEffect(() => {
    if (showOverCompleteSheet) {
      const isOverCompleteNow = 
        !isMatchOver &&
        currentInnings &&
        currentInnings.overs > 0 &&
        currentInnings.overs % 1 === 0 &&
        currentInnings.currentBowler === null;
      if (!isOverCompleteNow) {
        setShowOverCompleteSheet(false);
      }
    }
  }, [showOverCompleteSheet, isMatchOver, currentInnings, currentInnings?.overs, currentInnings?.currentBowler]);

  useEffect(() => {
    if (showInningsCompleteSheet && !match.innings2) {
      setShowInningsCompleteSheet(false);
    }
  }, [showInningsCompleteSheet, match.innings2]);

  const handlePlayerSelectionChange = (
    type: "onStrike" | "nonStriker" | "bowler",
    playerId: string,
  ) => {
    let newOnStrike = onStrikeId || "";
    let newNonStriker = nonStrikerId || null;
    let newBowler = currentBowlerId || null;

    if (type === "onStrike") newOnStrike = playerId;
    if (type === "nonStriker") newNonStriker = playerId;
    if (type === "bowler") newBowler = playerId;

    updateLivePlayers(match.id, newOnStrike, newNonStriker, newBowler);
  };

  const handleSwapBatsmen = () => {
    if (onStrikeId && nonStrikerId) {
      updateLivePlayers(match.id, nonStrikerId, onStrikeId, currentBowlerId);
    }
  };

  const handleRecordBall = () => {
    if (!currentInnings) return;

    const missing = [];
    if (!onStrikeId) missing.push("a striker");
    if (!nonStrikerId) missing.push("a non-striker");
    if (!currentBowlerId) missing.push("a bowler");

    if (missing.length > 0) {
      const missingText = missing.join(", ").replace(/, ([^,]*)$/, " and $1");
      showNotification(`Please select ${missingText}`, "error");
      return;
    }

    if (isWicket && !wicketDetails.type) {
      showNotification("Select a dismissal type", "error");
      return;
    }
    if (
      isWicket &&
      wicketDetails.type === WicketType.RUN_OUT &&
      !wicketDetails.outPlayerId
    ) {
      showNotification("Select batsman who was out", "error");
      return;
    }

    // --- Start of New Validation ---
    // Rule: On a No Ball, only Run Out dismissals are valid.
    if (isNoBall && isWicket && wicketDetails.type !== WicketType.RUN_OUT) {
      showNotification(
        'Invalid dismissal. Only "Run Out" is allowed on a No Ball.',
        "error",
      );
      return;
    }

    // Rule: On a Wide, only Run Out, Stumped, or Hit Wicket are valid.
    if (isWide && isWicket) {
      const validWideDismissals = [
        WicketType.RUN_OUT,
        WicketType.STUMPED,
        WicketType.HIT_WICKET,
      ];
      if (!validWideDismissals.includes(wicketDetails.type as WicketType)) {
        showNotification(
          `Invalid dismissal on a wide. Allowed types: Run Out, Stumped, Hit Wicket.`,
          "error",
        );
        return;
      }
    }

    // Rule: For certain dismissals, no runs can be scored off the bat.
    // This reinforces the useEffect logic at the time of submission.
    if (isWicket) {
      const nonRunWicketTypes = [
        WicketType.BOWLED,
        WicketType.CAUGHT,
        WicketType.LBW,
        WicketType.STUMPED,
        WicketType.HIT_WICKET,
      ];
      if (
        nonRunWicketTypes.includes(wicketDetails.type as WicketType) &&
        runs > 0
      ) {
        showNotification(
          `Runs must be 0 for a "${wicketDetails.type}" dismissal.`,
          "error",
        );
        return;
      }
    }
    // --- End of New Validation ---

    const ball: Omit<Ball, "ballNumber" | "overNumber"> = {
      batsmanId: onStrikeId,
      bowlerId: currentBowlerId,
      runs,
      isWide,
      isNoBall,
      isBye,
      isLegBye,
      isWicket,
    };

    if (isWicket) {
      const dismissedPlayerId =
        wicketDetails.type === WicketType.RUN_OUT && wicketDetails.outPlayerId
          ? wicketDetails.outPlayerId
          : onStrikeId;

      ball.wicket = {
        type: wicketDetails.type as WicketType,
        playerId: dismissedPlayerId,
        fielderIds: wicketDetails.fielderId
          ? [wicketDetails.fielderId]
          : undefined,
      };
    }

    recordBall(match.id, ball);

    // --- Notification Logic ---
    if (isWicket) {
      showNotification("WICKET!", "wicket", 5000);
    } else if (runs === 4) {
      showNotification("FOUR!", "boundary", 3000);
    } else if (runs === 6) {
      showNotification("SIX!", "boundary", 3000);
    }

    // Reset form
    setRuns(0);
    setIsWide(false);
    setIsNoBall(false);
    setIsBye(false);
    setIsLegBye(false);
    setIsWicket(false);
  };

  const handleRetireBatsman = () => {
    if (onStrikeId && battingSquadTeam) {
      const batsmanName =
        battingSquadTeam.players.find((p) => p.id === onStrikeId)?.name ||
        "the current batsman";
      setConfirmation({
        title: "Retire Batsman",
        message: (
          <>
            Are you sure you want to retire <strong>{batsmanName}</strong>?
            <br />
            <span className="text-sm mt-2 block">
              They will be marked as "Retired Hurt" and can return to bat later.
            </span>
          </>
        ),
        onConfirm: () => {
          retireBatsman(match.id, onStrikeId);
          setConfirmation(null);
        },
        confirmText: "Confirm Retire",
        confirmVariant: "primary",
      });
    }
  };

  const handleUndo = () => {
    undoLastBall(match.id);
    showNotification("Last ball undone", "info");
  };

  const handleEndInnings = () => {
    const isSecondInnings = !!match.innings2;
    const actionText = isSecondInnings
      ? "end the match"
      : "start the next innings";

    setConfirmation({
      title: "End Current Innings?",
      message: `Are you sure you want to end the current innings? This action cannot be undone and will ${actionText}.`,
      onConfirm: () => {
        endInnings(match.id);
        setConfirmation(null);
      },
      confirmText: "End Innings",
      confirmVariant: "danger",
    });
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'button, a, input, select, textarea, [role="button"], .no-swipe, .overflow-x-auto, [data-no-swipe="true"]',
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
    if (touchStartX === null || touchCurrentX === null) {
      return;
    }

    const diffX = touchStartX - touchCurrentX;
    const SWIPE_THRESHOLD = 75;
    const tabs: ("scoring" | "players" | "scoreboard" | "commentary")[] = [
      "scoring",
      "players",
      "scoreboard",
      "commentary",
    ];

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      const currentIndex = tabs.indexOf(activeScoringTab);

      if (diffX > 0) {
        // Swiped left
        if (currentIndex < tabs.length - 1) {
          const nextTab = tabs[currentIndex + 1];
          setActiveScoringTab(nextTab);
        }
      } else {
        // Swiped right
        if (currentIndex > 0) {
          const prevTab = tabs[currentIndex - 1];
          if (prevTab === "scoring" && !arePlayersSelected && !isMatchOver) {
            // Don't switch to scoring tab if it's disabled
          } else {
            setActiveScoringTab(prevTab);
          }
        }
      }
    }

    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  const ballsThisOver = useMemo(() => {
    if (!currentInnings) return [];
    const currentOverNumber = Math.floor(currentInnings.overs) + 1;
    const legalBalls = currentInnings.balls.filter(
      (b) => !b.isWide && !b.isNoBall,
    ).length;
    if (legalBalls > 0 && legalBalls % 6 === 0) {
      return [];
    }
    return currentInnings.balls.filter(
      (b) => b.overNumber === currentOverNumber,
    );
  }, [currentInnings]);

  const extras = useMemo(() => {
    if (!currentInnings)
      return { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0 };

    let wides = 0;
    let noBalls = 0;
    let byes = 0;
    let legByes = 0;

    currentInnings.balls.forEach((ball) => {
      if (ball.isWide) {
        wides += 1 + ball.runs;
      }
      if (ball.isNoBall) {
        noBalls += 1 + ball.runs;
      }
      if (ball.isBye) {
        byes += ball.runs;
      }
      if (ball.isLegBye) {
        legByes += ball.runs;
      }
    });

    return {
      total: wides + noBalls + byes + legByes,
      wides,
      noBalls,
      byes,
      legByes,
    };
  }, [currentInnings]);

  const replacedPlayerIds = useMemo(
    () => match.replacements?.map((r) => r.outgoingPlayerId) || [],
    [match.replacements],
  );

  const availableBatsmen = useMemo(
    () =>
      battingSquadTeam.players.filter(
        (p) =>
          !replacedPlayerIds.includes(p.id) &&
          currentInnings.batsmanScores[p.id]?.status !== BattingStatus.OUT,
      ),
    [battingSquadTeam.players, replacedPlayerIds, currentInnings.batsmanScores],
  );

  const maxOvers = match.maxOversPerBowler;
  const baseEligibleBowlers = bowlingSquadTeam.players.filter(
    (p) =>
      !replacedPlayerIds.includes(p.id) && p.id !== currentInnings.lastBowlerId,
  );
  const atLimitIds = baseEligibleBowlers
    .filter((p) => {
      if (!maxOvers) return false;
      const stats = currentInnings.bowlerScores[p.id];
      return stats && Math.floor(stats.overs) >= maxOvers;
    })
    .map((p) => p.id);
  const isExceptionActive =
    !!maxOvers &&
    atLimitIds.length === baseEligibleBowlers.length &&
    baseEligibleBowlers.length > 0;
  const availableBowlers = baseEligibleBowlers.map((p) => {
    const isAtLimit = atLimitIds.includes(p.id);
    const isDisabled = isAtLimit && !isExceptionActive;
    return { ...p, isDisabled, isAtLimit };
  });

  const onStrikeOptions = useMemo(() => {
    return availableBatsmen.filter(
      (p) => !nonStrikerId || p.id !== nonStrikerId,
    );
  }, [availableBatsmen, nonStrikerId]);

  const nonStrikerOptions = useMemo(() => {
    return availableBatsmen.filter((p) => !onStrikeId || p.id !== onStrikeId);
  }, [availableBatsmen, onStrikeId]);

  const canToggleFreeHit = isFreeHit || wasLastBallNoBall;

  const fallOfWickets = useMemo(() => {
    if (!currentInnings) return [];

    const wicketEvents: {
      wicketNumber: number;
      score: number;
      over: string;
      playerName: string;
    }[] = [];

    const ballsWithWickets = currentInnings.balls
      .map((ball, index) => ({ ball, index }))
      .filter(({ ball }) => ball.isWicket && ball.wicket);

    let wicketsSoFar = 0;
    for (const { ball, index } of ballsWithWickets) {
      wicketsSoFar++;

      const ballsUpToWicket = currentInnings.balls.slice(0, index + 1);
      const scoreAtWicket = ballsUpToWicket.reduce((acc, b) => {
        return acc + b.runs + (b.isWide || b.isNoBall ? 1 : 0);
      }, 0);

      const legalBallsAtWicket = ballsUpToWicket.filter(
        (b) => !b.isWide && !b.isNoBall,
      ).length;
      const overNumber = Math.floor((legalBallsAtWicket - 1) / 6);
      const ballInOver = ((legalBallsAtWicket - 1) % 6) + 1;
      const formattedOver = `${overNumber}.${ballInOver}`;

      const dismissedPlayerName = getPlayerName(ball.wicket!.playerId);

      wicketEvents.push({
        wicketNumber: wicketsSoFar,
        score: scoreAtWicket,
        over: formattedOver,
        playerName: dismissedPlayerName,
      });
    }
    return wicketEvents;
  }, [currentInnings, getPlayerName]);

  const chaseProgress = useMemo(() => {
    if (!match.innings2 || !match.innings1) return null;
    const target = match.innings1.score + 1;
    const runsNeeded = target - match.innings2.score;

    if (runsNeeded <= 0) return null; // Target achieved

    const totalBalls = match.oversPerInnings * 6;
    const ballsBowled = match.innings2.balls.filter(
      (b) => !b.isWide && !b.isNoBall,
    ).length;
    const ballsRemaining = totalBalls - ballsBowled;

    if (ballsRemaining <= 0) return null; // Overs finished

    return `Need ${runsNeeded} runs in ${ballsRemaining} balls`;
  }, [match]);

  const striker = onStrikeId
    ? battingSquadTeam.players.find((p) => p.id === onStrikeId)
    : null;
  const nonStriker = nonStrikerId
    ? battingSquadTeam.players.find((p) => p.id === nonStrikerId)
    : null;
  const strikerStats = onStrikeId
    ? currentInnings.batsmanScores[onStrikeId]
    : null;
  const nonStrikerStats = nonStrikerId
    ? currentInnings.batsmanScores[nonStrikerId]
    : null;

  const bowler = currentBowlerId
    ? bowlingSquadTeam.players.find((p) => p.id === currentBowlerId)
    : null;
  const bowlerStats = currentBowlerId
    ? currentInnings.bowlerScores[currentBowlerId]
    : null;

  const wicketTypeOptions = useMemo(() => {
    const types = Object.values(WicketType);
    if (isWide) {
      return types.filter(
        (type) =>
          type === WicketType.RUN_OUT ||
          type === WicketType.STUMPED ||
          type === WicketType.HIT_WICKET,
      );
    }
    if (isBye || isLegBye) {
      return types.filter(
        (type) => type === WicketType.RUN_OUT || type === WicketType.STUMPED,
      );
    }
    return types;
  }, [isWide, isBye, isLegBye]);

  if (!currentInnings || !battingTeam || !bowlingTeam) {
    return <div className="text-center p-8">Setting up match...</div>;
  }

  const isSecondInnings = !!match.innings2;

  const toggleScorecard = (inningsKey: string) => {
    setExpandedScorecards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inningsKey)) {
        newSet.delete(inningsKey);
      } else {
        newSet.add(inningsKey);
      }
      return newSet;
    });
  };

  const renderFullScorecardDetails = (innings: Innings) => {
    const scorecardBattingTeam = getTeamById(innings.battingTeamId);
    const scorecardBowlingTeam = getTeamById(innings.bowlingTeamId);

    if (!scorecardBattingTeam || !scorecardBowlingTeam) return null;

    const inningsFallOfWickets = (() => {
      const wicketEvents: {
        wicketNumber: number;
        score: number;
        over: string;
        playerName: string;
      }[] = [];
      const ballsWithWickets = innings.balls
        .map((ball, index) => ({ ball, index }))
        .filter(({ ball }) => ball.isWicket && ball.wicket);
      let wicketsSoFar = 0;
      for (const { ball, index } of ballsWithWickets) {
        wicketsSoFar++;
        const ballsUpToWicket = innings.balls.slice(0, index + 1);
        const scoreAtWicket = ballsUpToWicket.reduce(
          (acc, b) => acc + b.runs + (b.isWide || b.isNoBall ? 1 : 0),
          0,
        );
        const legalBallsAtWicket = ballsUpToWicket.filter(
          (b) => !b.isWide && !b.isNoBall,
        ).length;
        const overNumber = Math.floor((legalBallsAtWicket - 1) / 6);
        const ballInOver = ((legalBallsAtWicket - 1) % 6) + 1;
        const formattedOver = `${overNumber}.${ballInOver}`;
        const dismissedPlayerName = getPlayerName(ball.wicket!.playerId);
        wicketEvents.push({
          wicketNumber: wicketsSoFar,
          score: scoreAtWicket,
          over: formattedOver,
          playerName: dismissedPlayerName,
        });
      }
      return wicketEvents;
    })();

    const inningsExtras = (() => {
      let wides = 0,
        noBalls = 0,
        byes = 0,
        legByes = 0;
      innings.balls.forEach((ball) => {
        if (ball.isWide) wides += 1 + ball.runs;
        if (ball.isNoBall) noBalls += 1 + ball.runs;
        if (ball.isBye) byes += ball.runs;
        if (ball.isLegBye) legByes += ball.runs;
      });
      return {
        total: wides + noBalls + byes + legByes,
        wides,
        noBalls,
        byes,
        legByes,
      };
    })();

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
            BATTING
          </h4>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-full">Batsman</Th>
                <Th className="text-right">R</Th>
                <Th className="text-right">B</Th>
                <Th className="text-right">4s</Th>
                <Th className="text-right">6s</Th>
                <Th className="text-right">SR</Th>
              </Tr>
            </Thead>
            <Tbody>
              {scorecardBattingTeam.players
                .filter((player) => innings.batsmanScores[player.id])
                .sort(
                  (a, b) =>
                    Object.keys(innings.batsmanScores).indexOf(a.id) -
                    Object.keys(innings.batsmanScores).indexOf(b.id),
                )
                .map((player) => {
                  const stats = innings.batsmanScores[player.id];
                  if (!stats) return null;
                  return (
                    <Tr key={player.id}>
                      <Td className="font-semibold text-text-primary">
                        {player.name}
                        {stats.status === BattingStatus.OUT &&
                          stats.outDetails && (
                            <span className="block text-[11px] text-text-secondary font-normal mt-0.5">
                              {getDismissalText(
                                stats.outDetails,
                                getPlayerName,
                              )}
                            </span>
                          )}
                        {stats.status !== BattingStatus.OUT && (
                          <span className="block text-[11px] text-text-secondary font-normal mt-0.5">
                            {stats.status}
                          </span>
                        )}
                      </Td>
                      <Td className="text-right font-semibold">{stats.runs}</Td>
                      <Td className="text-right text-text-secondary">
                        {stats.balls}
                      </Td>
                      <Td className="text-right text-text-secondary">
                        {stats.fours}
                      </Td>
                      <Td className="text-right text-text-secondary">
                        {stats.sixes}
                      </Td>
                      <Td className="text-right text-text-secondary">
                        {calculateStrikeRate(stats.runs, stats.balls)}
                      </Td>
                    </Tr>
                  );
                })}
            </Tbody>
          </Table>
        </div>
        <div className="space-y-1 mt-6">
          <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
            BOWLING
          </h4>
          <Table>
            <Thead>
              <Tr>
                <Th className="w-full">Bowler</Th>
                <Th className="text-right">O</Th>
                <Th className="text-right">M</Th>
                <Th className="text-right">R</Th>
                <Th className="text-right">W</Th>
                <Th className="text-right">Econ</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.values(innings.bowlerScores).map((stats: BowlerScore) => {
                const bowler = scorecardBowlingTeam.players.find(
                  (p) => p.id === stats.playerId,
                );
                return (
                  <Tr key={stats.playerId}>
                    <Td className="font-semibold text-text-primary">{bowler?.name}</Td>
                    <Td className="text-right text-text-secondary">
                      {stats.overs}
                    </Td>
                    <Td className="text-right text-text-secondary">
                      {stats.maidens}
                    </Td>
                    <Td className="text-right text-text-secondary">
                      {stats.runsConceded}
                    </Td>
                    <Td className="text-right font-semibold">
                      {stats.wickets}
                    </Td>
                    <Td className="text-right text-text-secondary">
                      {calculateRunRate(stats.runsConceded, stats.overs)}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
              EXTRAS
            </h4>
            <div className="p-3 bg-primary/30 rounded-lg flex justify-between items-center border border-black/5 dark:border-white/5">
              <span className="font-semibold text-body text-text-primary">
                {inningsExtras.total}
              </span>
              <p className="text-xs text-text-secondary leading-tight text-right">
                (wd {inningsExtras.wides}, nb {inningsExtras.noBalls}, b{" "}
                {inningsExtras.byes}, lb {inningsExtras.legByes})
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
              FALL OF WICKETS
            </h4>
            <div className="text-xs text-text-secondary p-3 bg-primary/30 rounded-lg h-full overflow-x-auto no-scrollbar border border-black/5 dark:border-white/5">
              {inningsFallOfWickets.length > 0
                ? inningsFallOfWickets.map((fow) => (
                    <span
                      key={fow.wicketNumber}
                      className="mr-2 whitespace-nowrap"
                    >
                      {fow.score}-{fow.wicketNumber} (
                      {fow.playerName.split(" ")[0]}, {fow.over})
                    </span>
                  ))
                : "No wickets fell."}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInningsSummary = (
    innings: Innings,
    inningsKey: "innings1" | "innings2",
  ) => {
    const team = getTeamById(innings.battingTeamId);
    if (!team) return null;
    const isExpanded = expandedScorecards.has(inningsKey);

    return (
      <div className="bg-white/30 dark:bg-black/20 rounded-xl overflow-hidden border border-brand-blue/15">
        <button
          onClick={() => toggleScorecard(inningsKey)}
          className="w-full flex justify-between items-center p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body"
              style={{ backgroundColor: team.logo }}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-text-primary">{team.name}</h4>
              <p className="text-sm text-text-secondary">
                {innings.score}/{innings.wickets} ({innings.overs} Overs)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">
              {isExpanded ? "Hide" : "View"}
            </span>
            {isExpanded ? (
              <MinusIcon className="w-5 h-5 text-text-secondary" />
            ) : (
              <PlusIcon className="w-5 h-5 text-text-secondary" />
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="p-4 border-t border-brand-blue/15 bg-primary/30">
            {renderFullScorecardDetails(innings)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">
      {isMatchOver && (
        <div className="absolute -inset-4 bg-secondary/90 backdrop-blur-sm flex justify-center items-center z-50 rounded-2xl">
          <div className="text-center p-4">
            <svg
              className="h-10 w-10 text-brand-blue mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Match Finished</h2>
            <p className="text-text-secondary mt-1">
              Generating final scorecard...
            </p>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 z-10 pt-2 flex flex-col gap-2 relative">
        <CrickIQCard className={isFreeHit ? "pt-12" : ""}>
          {isFreeHit && (
            <div className="absolute top-0 left-0 right-0 bg-highlight text-white text-caption font-bold py-2 text-center animate-pulse z-10 rounded-t-3xl uppercase tracking-wider">
              FREE HIT
            </div>
          )}

          {/* Back Arrow & Live Match Status Bar */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => onBack?.()}
              className="p-1.5 -ml-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors duration-200 flex items-center justify-center text-text-secondary"
              aria-label="Go Back"
            >
              <ChevronLeft className="w-5 h-5 text-inherit" />
            </button>
            {!isMatchOver && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>
                LIVE
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-md text-white font-bold text-[10px] shadow-sm"
                  style={{ backgroundColor: battingTeam.logo }}
                >
                  {battingTeam.name.substring(0, 2).toUpperCase()}
                </div>
                {battingTeam.name}
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="font-mono font-bold text-4xl sm:text-5xl tracking-tighter text-text-primary">
                  {formatScore(currentInnings.score, currentInnings.wickets)}
                </p>
                <p className="font-mono text-sm text-text-secondary font-bold mb-1">
                  ({formatOvers(currentInnings.overs)})
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-text-primary flex items-center justify-end gap-2">
                {bowlingTeam.name}
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body shadow-sm"
                  style={{ backgroundColor: bowlingTeam.logo }}
                >
                  {bowlingTeam.name.substring(0, 2).toUpperCase()}
                </div>
              </h2>
              {match.innings1 && currentInnings !== match.innings1 && (
                <p className="text-sm text-text-secondary mt-1">
                  Target:
                  <span className="text-lg font-bold text-text-primary ml-2">
                    {match.innings1.score + 1}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-table-header text-text-secondary mr-2">
              This Over:
            </span>
            {ballsThisOver.map((ball, index) => {
              const isCurrent = index === ballsThisOver.length - 1;
              const { text, className, title } = getBallDisplay(ball, isCurrent);
              return (
                <div key={index} className={`${className} ${getBallOutcomeChipClass(ball)} over-chip`} title={title}>
                  {text}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-blue/15 space-y-4">
            {/* Batsmen */}
            <div className="space-y-1 selectable-text">
              <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-x-2 text-caption text-text-secondary font-semibold">
                <div className="text-left">Batsman</div>
                <div className="text-right">R</div>
                <div className="text-right">B</div>
                <div className="text-right">4s</div>
                <div className="text-right">6s</div>
                <div className="text-right text-success dark:text-green-400">
                  SR
                </div>
              </div>
              {striker && strikerStats && (
                <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-x-2 text-body font-bold text-text-primary items-center dark:bg-accent/5 dark:shadow-[0_0_12px_rgba(0,196,154,0.1)] px-2 -mx-2 rounded-lg py-1">
                  <div className="text-left truncate dark:text-accent">{striker.name}*</div>
                  <div className="text-right dark:text-accent">{strikerStats.runs}</div>
                  <div className="text-right">{strikerStats.balls}</div>
                  <div className="text-right">{strikerStats.fours}</div>
                  <div className="text-right">{strikerStats.sixes}</div>
                  <div className="text-right dark:text-accent font-extrabold">
                    {calculateStrikeRate(strikerStats.runs, strikerStats.balls)}
                  </div>
                </div>
              )}
              {nonStriker && nonStrikerStats && (
                <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-x-2 text-body text-text-primary items-center px-2 -mx-2 rounded-lg py-1 border border-transparent">
                  <div className="text-left truncate">{nonStriker.name}</div>
                  <div className="text-right">{nonStrikerStats.runs}</div>
                  <div className="text-right">{nonStrikerStats.balls}</div>
                  <div className="text-right">{nonStrikerStats.fours}</div>
                  <div className="text-right">{nonStrikerStats.sixes}</div>
                  <div className="text-right">
                    {calculateStrikeRate(
                      nonStrikerStats.runs,
                      nonStrikerStats.balls,
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bowler */}
            <div className="space-y-1 selectable-text">
              <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-x-2 text-caption text-text-secondary font-semibold">
                <div className="text-left">Bowler</div>
                <div className="text-right">O</div>
                <div className="text-right">M</div>
                <div className="text-right">R</div>
                <div className="text-right text-danger">W</div>
                <div className="text-right">ER</div>
              </div>
              {bowler && bowlerStats && (
                <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-x-2 text-body text-text-primary items-center">
                  <div className="text-left truncate">{bowler.name}</div>
                  <div className="text-right">{bowlerStats.overs}</div>
                  <div className="text-right">{bowlerStats.maidens}</div>
                  <div className="text-right">{bowlerStats.runsConceded}</div>
                  <div className="text-right">{bowlerStats.wickets}</div>
                  <div className="text-right">
                    {calculateRunRate(
                      bowlerStats.runsConceded,
                      bowlerStats.overs,
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chase info */}
            {isSecondInnings &&
              match.innings1 &&
              (() => {
                const target = match.innings1.score + 1;
                const runsNeeded = target - currentInnings.score;

                if (runsNeeded <= 0 || isMatchOver) return null;

                const totalBalls = match.oversPerInnings * 6;
                const ballsBowled = currentInnings.balls.filter(
                  (b) => !b.isWide && !b.isNoBall,
                ).length;
                const ballsRemaining = totalBalls - ballsBowled;

                if (ballsRemaining <= 0) return null;

                return (
                  <div className="mt-2 text-center font-bold text-brand-blue text-lg bg-brand-blue/10 p-2 rounded-lg">
                    Need {runsNeeded} to win in {ballsRemaining} balls
                  </div>
                );
              })()}
          </div>
        </CrickIQCard>

        <CrickIQCard noPadding>
          <div className="flex border-b border-transparent overflow-x-auto no-scrollbar px-2">
            <button
              onClick={() => setActiveScoringTab("scoring")}
              disabled={!arePlayersSelected && !isMatchOver}
              title={
                !arePlayersSelected && !isMatchOver
                  ? "Select on-strike and non-striker batsmen first"
                  : undefined
              }
              className={`flex-shrink-0 py-3 px-5 font-bold text-sm transition-colors duration-200 whitespace-nowrap ${activeScoringTab === "scoring" ? "border-b-2 border-accent text-accent bg-accent/5" : "border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"} ${!arePlayersSelected && !isMatchOver ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Scoring
            </button>
            <button
              onClick={() => setActiveScoringTab("players")}
              className={`flex-shrink-0 py-3 px-5 font-bold text-sm transition-colors duration-200 whitespace-nowrap ${activeScoringTab === "players" ? "border-b-2 border-accent text-accent bg-accent/5" : "border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              Players
            </button>
            <button
              onClick={() => setActiveScoringTab("scoreboard")}
              className={`flex-shrink-0 py-3 px-5 font-bold text-sm transition-colors duration-200 whitespace-nowrap ${activeScoringTab === "scoreboard" ? "border-b-2 border-accent text-accent bg-accent/5" : "border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              Scoreboard
            </button>
            <button
              onClick={() => setActiveScoringTab("commentary")}
              className={`flex-shrink-0 py-3 px-5 font-bold text-sm transition-colors duration-200 whitespace-nowrap ${activeScoringTab === "commentary" ? "border-b-2 border-accent text-accent bg-accent/5" : "border-b-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              Commentary
            </button>
          </div>
        </CrickIQCard>
      </div>

      <div
        className="flex-1 overflow-y-auto min-h-0 no-scrollbar pb-28 mt-2 safe-pad-b"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CrickIQCard>
          {activeScoringTab === "scoring" && (
            <div>
              {!isMatchOver ? (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-text-primary uppercase tracking-wider">
                    Scoring Input
                  </h3>
                  <div className="flex justify-center flex-wrap gap-2 mb-4">
                    {["Wide", "No Ball", "Byes", "Leg Byes"].map((extra) => (
                      <button
                        key={extra}
                        onClick={() => {
                          if (extra === "Wide") {
                            setIsWide(!isWide);
                            if (!isWide) setIsNoBall(false);
                          }
                          if (extra === "No Ball") {
                            setIsNoBall(!isNoBall);
                            if (!isNoBall) setIsWide(false);
                          }
                          if (extra === "Byes") {
                            setIsBye(!isBye);
                            if (!isBye) setIsLegBye(false);
                          }
                          if (extra === "Leg Byes") {
                            setIsLegBye(!isLegBye);
                            if (!isLegBye) setIsBye(false);
                          }
                        }}
                        className={`px-4 py-1.5 rounded-2xl font-semibold text-caption transition-all duration-200 ${
                          (extra === "Wide" && isWide) ||
                          (extra === "No Ball" && isNoBall) ||
                          (extra === "Byes" && isBye) ||
                          (extra === "Leg Byes" && isLegBye)
                            ? "bg-highlight text-white"
                            : "bg-brand-blue text-white hover:opacity-90"
                        }`}
                      >
                        {extra}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[0, 1, 2, 3, 4, 6].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRuns(r)}
                        disabled={
                          isWicket && wicketDetails.type === WicketType.RUN_OUT
                        }
                        className={`aspect-square rounded-full font-bold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${runs === r && !isWicket ? "bg-brand-blue text-white shadow-lg" : "bg-primary/50 hover:bg-primary text-text-primary"} ${getRunButtonDarkClasses(r, runs === r && !isWicket)} ${isWicket && wicketDetails.type === WicketType.RUN_OUT ? "opacity-50 cursor-not-allowed" : ""} scoring-btn`}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => toggleFreeHit(match.id)}
                      disabled={!canToggleFreeHit}
                      title={
                        canToggleFreeHit
                          ? "Toggle Free Hit"
                          : "Free Hit can only be set after a no ball."
                      }
                      className={`aspect-square rounded-full font-bold text-caption transition-all duration-200 flex items-center justify-center text-center p-1 leading-tight border border-transparent ${isFreeHit ? "bg-highlight text-white shadow-lg animate-pulse dark:border dark:bg-danger/10 dark:text-danger dark:border-danger/50 dark:shadow-[0_0_16px_rgba(255,77,79,0.25)]" : "bg-primary/50 text-text-secondary dark:bg-tertiary/40 dark:text-text-muted dark:border-transparent"} ${!canToggleFreeHit ? "opacity-50 cursor-not-allowed" : ""} scoring-btn`}
                    >
                      Free Hit
                    </button>
                    <button
                      onClick={() => setIsWicket(!isWicket)}
                      className={`aspect-square rounded-full font-bold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${isWicket ? "bg-highlight text-white shadow-lg dark:bg-danger dark:text-white dark:shadow-md" : "bg-primary/50 hover:bg-primary text-text-primary dark:bg-tertiary/60 dark:text-text-primary dark:border-transparent dark:shadow-none"} scoring-btn`}
                    >
                      W
                    </button>
                  </div>
                  {isWicket && (
                    <div className="p-4 bg-primary/50 rounded-lg mb-4 space-y-4">
                      <h4 className="font-semibold text-body text-text-primary">
                        Wicket Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-caption text-text-secondary">
                            Dismissal Type
                          </label>
                          <Select
                            value={wicketDetails.type}
                            onChange={(e) => {
                              setWicketDetails((prev) => ({
                                ...prev,
                                type: e.target.value as WicketType,
                                fielderId: "",
                              }));
                            }}
                          >
                            <option value="">Select Type</option>
                            {wicketTypeOptions.map((type) => (
                              <option
                                key={type}
                                value={type}
                                disabled={
                                  (isFreeHit || isNoBall) &&
                                  type !== WicketType.RUN_OUT
                                }
                              >
                                {type}
                              </option>
                            ))}
                          </Select>
                        </div>
                        {[
                          WicketType.CAUGHT,
                          WicketType.STUMPED,
                          WicketType.RUN_OUT,
                        ].includes(wicketDetails.type as WicketType) && (
                          <div>
                            <label className="text-caption text-text-secondary">
                              {wicketDetails.type === WicketType.CAUGHT &&
                                "Fielder (Catcher)"}
                              {wicketDetails.type === WicketType.STUMPED &&
                                "Wicket Keeper"}
                              {wicketDetails.type === WicketType.RUN_OUT &&
                                "Fielder"}
                            </label>
                            <Select
                              value={wicketDetails.fielderId}
                              onChange={(e) =>
                                setWicketDetails((prev) => ({
                                  ...prev,
                                  fielderId: e.target.value,
                                }))
                              }
                              disabled={
                                wicketDetails.type === WicketType.STUMPED &&
                                bowlingSquadTeam.players.some(
                                  (p) => p.role === PlayerRole.WICKET_KEEPER,
                                )
                              }
                              title={
                                wicketDetails.type === WicketType.STUMPED &&
                                bowlingSquadTeam.players.some(
                                  (p) => p.role === PlayerRole.WICKET_KEEPER,
                                )
                                  ? "Wicket keeper is automatically selected for stumping."
                                  : undefined
                              }
                            >
                              <option value="">Select Player</option>
                              {bowlingSquadTeam.players.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        )}
                      </div>
                      {wicketDetails.type === WicketType.RUN_OUT && (
                        <div className="space-y-4 pt-2 border-t border-brand-blue/15">
                          <div>
                            <label className="text-caption text-text-secondary mb-1 block">
                              Runs Completed Before Dismissal
                            </label>
                            <div className="flex gap-2">
                              {[0, 1, 2, 3, 4].map((r) => (
                                <button
                                  key={r}
                                  onClick={() => setRuns(r)}
                                  className={`w-8 h-8 rounded-full text-button transition-colors ${runs === r ? "bg-brand-blue text-white" : "bg-secondary hover:bg-border-color"}`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-caption text-text-secondary mb-1 block">
                              Batsman Out
                            </label>
                            <div className="flex gap-2 text-body">
                              {onStrikeId && (
                                <button
                                  onClick={() =>
                                    setWicketDetails((prev) => ({
                                      ...prev,
                                      outPlayerId: onStrikeId,
                                    }))
                                  }
                                  className={`px-2 py-1 rounded-2xl ${wicketDetails.outPlayerId === onStrikeId ? "bg-brand-blue text-white" : "bg-secondary"}`}
                                >
                                  {getPlayerName(onStrikeId)} (S)
                                </button>
                              )}
                              {nonStrikerId && (
                                <button
                                  onClick={() =>
                                    setWicketDetails((prev) => ({
                                      ...prev,
                                      outPlayerId: nonStrikerId,
                                    }))
                                  }
                                  className={`px-2 py-1 rounded-2xl ${wicketDetails.outPlayerId === nonStrikerId ? "bg-brand-blue text-white" : "bg-secondary"}`}
                                >
                                  {getPlayerName(nonStrikerId)} (NS)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4 items-stretch">
                    {/* Left buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleUndo}
                        disabled={currentInnings.balls.length === 0}
                        title="Undo Last Ball"
                        className="flex-1 bg-brand-teal text-white font-bold rounded-2xl border border-transparent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-body active:scale-95 transition-all dark:bg-secondary dark:text-accent dark:border-accent/40 dark:hover:bg-accent/10 dark:hover:border-accent/60"
                      >
                        Undo
                      </button>
                      <button
                        onClick={handleEndInnings}
                        className="flex-1 bg-danger text-white font-bold rounded-2xl hover:opacity-90 text-body active:scale-95 transition-all"
                      >
                        End Inn.
                      </button>
                    </div>

                    {/* Center Record button */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={handleRecordBall}
                        disabled={
                          !onStrikeId || !nonStrikerId || !currentBowlerId
                        }
                        className="bg-brand-blue text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-center p-2 text-2xl w-28 h-28 aspect-square active:scale-95 transform transition-all shadow-lg shadow-brand-blue/30"
                      >
                        Record
                      </button>
                    </div>

                    {/* Right buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleRetireBatsman}
                        disabled={!onStrikeId}
                        className="flex-1 bg-warning text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-body active:scale-95 transition-all"
                      >
                        Retire
                      </button>
                      <button
                        onClick={onStartDrinksBreak}
                        className="flex-1 bg-info text-white font-bold rounded-2xl hover:opacity-90 text-body active:scale-95 transition-all"
                      >
                        Drinks
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {activeScoringTab === "players" && (
            <div className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h3 className="font-semibold text-sm text-text-primary uppercase tracking-wider">
                    Live Player Selection
                  </h3>
                  {!isMatchOver && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setImpactModalTeamId(battingTeam.id);
                          setIsImpactModalOpen(true);
                        }}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800/40 dark:hover:bg-red-800/60 text-red-800 dark:text-red-200 text-xs font-bold rounded border border-red-300 dark:border-red-700 transition-colors"
                      >
                        {battingTeam
                          ? `${battingTeam.name}: Replace Player`
                          : "Replace Player"}
                      </button>
                      <button
                        onClick={() => {
                          setImpactModalTeamId(bowlingTeam.id);
                          setIsImpactModalOpen(true);
                        }}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800/40 dark:hover:bg-red-800/60 text-red-800 dark:text-red-200 text-xs font-bold rounded border border-red-300 dark:border-red-700 transition-colors"
                      >
                        {bowlingTeam
                          ? `${bowlingTeam.name}: Replace Player`
                          : "Replace Player"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1" title={batsmanLockTooltip}>
                        <label className="text-sm text-text-secondary">
                          On Strike
                        </label>
                        <Select
                          disabled={isMatchOver || areBatsmenLocked}
                          value={onStrikeId || ""}
                          onChange={(e) =>
                            handlePlayerSelectionChange(
                              "onStrike",
                              e.target.value,
                            )
                          }
                          className={
                            areBatsmenLocked
                              ? "cursor-not-allowed opacity-70"
                              : ""
                          }
                        >
                          <option value="">Select Batsman</option>
                          {onStrikeOptions.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              title={p.role}
                            >{`${getRoleEmoji(p.role)} ${p.name}`}</option>
                          ))}
                        </Select>
                      </div>

                      <button
                        onClick={handleSwapBatsmen}
                        disabled={
                          !onStrikeId ||
                          !nonStrikerId ||
                          isMatchOver ||
                          areBatsmenLocked
                        }
                        className="p-2 h-9 w-9 flex items-center justify-center bg-primary/80 rounded-full text-text-secondary hover:bg-primary disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        title="Swap Batsmen"
                      >
                        <SwapIcon />
                      </button>

                      <div className="flex-1" title={batsmanLockTooltip}>
                        <label className="text-sm text-text-secondary">
                          Non Striker
                        </label>
                        <Select
                          disabled={isMatchOver || areBatsmenLocked}
                          value={nonStrikerId || ""}
                          onChange={(e) =>
                            handlePlayerSelectionChange(
                              "nonStriker",
                              e.target.value,
                            )
                          }
                          className={
                            areBatsmenLocked
                              ? "cursor-not-allowed opacity-70"
                              : ""
                          }
                        >
                          <option value="">Select Batsman</option>
                          {nonStrikerOptions.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              title={p.role}
                            >{`${getRoleEmoji(p.role)} ${p.name}`}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    {!!(onStrikeId && nonStrikerId) && (
                      <div className="mt-2">
                        <label className="flex items-center gap-2 text-caption text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emergencyBatsmanChange}
                            onChange={(e) =>
                              setEmergencyBatsmanChange(e.target.checked)
                            }
                            className="accent-accent w-4 h-4"
                          />
                          Emergency Batsman Change
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <div title={bowlerLockTooltip}>
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-text-secondary">
                          Bowler
                        </label>
                        {maxOvers ? (
                          <span className="text-xs text-text-secondary font-medium">
                            Max {maxOvers} {maxOvers === 1 ? "Over" : "Overs"}
                            /Bowler
                          </span>
                        ) : null}
                      </div>
                      <Select
                        disabled={isMatchOver || isBowlerLocked}
                        value={currentBowlerId || ""}
                        onChange={(e) =>
                          handlePlayerSelectionChange("bowler", e.target.value)
                        }
                        className={
                          isBowlerLocked ? "cursor-not-allowed opacity-70" : ""
                        }
                      >
                        <option value="">Select Bowler</option>
                        {isExceptionActive && (
                          <option
                            disabled
                            className="text-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          >
                            Additional overs allowed due to insufficient
                            available bowlers.
                          </option>
                        )}
                        {availableBowlers.map((p) => (
                          <option
                            key={p.id}
                            disabled={p.isDisabled}
                            value={p.id}
                            title={p.role}
                          >
                            {`${getRoleEmoji(p.role)} ${p.name}`}
                            {p.isDisabled ? " (Max Overs Reached)" : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                    {!!currentBowlerId && (
                      <div className="mt-2">
                        <label
                          className={`flex items-center gap-2 text-caption text-text-secondary ${!isOverInProgress ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          title={
                            !isOverInProgress
                              ? "Can only be used mid-over"
                              : "Check to change bowler mid-over"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={emergencyBowlerChange}
                            // FIX: Corrected a copy-paste error where the emergency bowler checkbox was updating batsman state.
                            onChange={(e) =>
                              setEmergencyBowlerChange(e.target.checked)
                            }
                            className="accent-accent w-4 h-4"
                            disabled={!isOverInProgress}
                          />
                          Emergency Bowler Change
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeScoringTab === "scoreboard" && (
            <div className="space-y-6 pt-2">
              {isSecondInnings && match.innings1 && (
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text-primary">First Innings</h3>
                  {renderInningsSummary(match.innings1, "innings1")}
                </div>
              )}

              <div className="space-y-6">
                {isSecondInnings && (
                  <h3 className="text-xl font-bold text-text-primary">Current Innings</h3>
                )}
                {/* Team Totals & Chase */}
                <div className="flex justify-between items-baseline p-4 bg-primary/50 rounded-xl">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                      <div
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body"
                        style={{ backgroundColor: battingTeam.logo }}
                      >
                        {battingTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                      {battingTeam.name}
                    </h3>
                    <p className="text-3xl text-brand-blue">
                      {currentInnings.score}/{currentInnings.wickets}
                      <span className="text-lg text-text-secondary ml-2">
                        ({currentInnings.overs})
                      </span>
                    </p>
                  </div>
                  {match.innings2 && match.innings1 && (
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">Target</p>
                      <p className="text-h1 text-text-primary">
                        {match.innings1.score + 1}
                      </p>
                    </div>
                  )}
                </div>

                {/* Batting Scorecard */}
                <div className="space-y-1 mt-2">
                  <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
                    BATTING
                  </h4>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th className="w-full">Batsman</Th>
                        <Th className="text-right">R</Th>
                        <Th className="text-right">B</Th>
                        <Th className="text-right">4s</Th>
                        <Th className="text-right">6s</Th>
                        <Th className="text-right">SR</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {battingSquadTeam.players
                        .filter((player) => {
                          const stats = currentInnings.batsmanScores[player.id];
                          if (!stats) {
                            return false;
                          }
                          // A player should appear on the scorecard if they are currently batting,
                          // or if they have faced a ball, scored a run, or are out/retired.
                          // This prevents players who were selected by mistake but never batted from showing up.
                          const isCurrentlyBatting =
                            onStrikeId === player.id ||
                            nonStrikerId === player.id;
                          const hasActed =
                            stats.balls > 0 ||
                            stats.runs > 0 ||
                            stats.status !== BattingStatus.NOT_OUT;
                          return isCurrentlyBatting || hasActed;
                        })
                        .sort((a, b) => {
                          const aIndex = Object.keys(
                            currentInnings.batsmanScores,
                          ).indexOf(a.id);
                          const bIndex = Object.keys(
                            currentInnings.batsmanScores,
                          ).indexOf(b.id);
                          return aIndex - bIndex;
                        })
                        .map((player) => {
                          const stats = currentInnings.batsmanScores[player.id];
                          if (!stats) return null;
                          const isBatting =
                            onStrikeId === player.id ||
                            nonStrikerId === player.id;
                          const isStrike = onStrikeId === player.id;

                          return (
                            <Tr
                              key={player.id}
                              className={`${isBatting ? "bg-primary/50" : "opacity-80 hover:bg-primary/30"} ${isStrike ? "border-l-[3px] border-l-brand-blue" : "border-l-[3px] border-l-transparent"}`}
                            >
                              <Td className="p-2">
                                <div className="flex gap-2 items-start">
                                  <div className="flex-1">
                                    <span
                                      className={`font-medium text-text-primary ${isStrike ? "font-bold text-brand-blue" : ""}`}
                                    >
                                      {player.name} {isBatting && "*"}
                                    </span>
                                    {stats.status === BattingStatus.OUT &&
                                      stats.outDetails && (
                                        <span className="block text-[11px] text-text-secondary font-normal mt-0.5">
                                          {getDismissalText(
                                            stats.outDetails,
                                            getPlayerName,
                                          )}
                                        </span>
                                      )}
                                    {stats.status !== BattingStatus.OUT &&
                                      !isBatting && (
                                        <span className="block text-[11px] text-text-secondary font-normal mt-0.5">
                                          {stats.status}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </Td>
                              <Td className="text-right font-semibold">
                                {stats.runs}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.balls}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.fours}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.sixes}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {calculateStrikeRate(stats.runs, stats.balls)}
                              </Td>
                            </Tr>
                          );
                        })}
                    </Tbody>
                  </Table>
                </div>

                {/* Bowling Scorecard */}
                <div className="space-y-1 mt-6">
                  <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
                    BOWLING
                  </h4>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th className="w-full">Bowler</Th>
                        <Th className="text-right">O</Th>
                        <Th className="text-right">M</Th>
                        <Th className="text-right">R</Th>
                        <Th className="text-right">W</Th>
                        <Th className="text-right">Econ</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.values(currentInnings.bowlerScores).map(
                        (stats: BowlerScore) => {
                          const bowler = bowlingSquadTeam.players.find(
                            (p) => p.id === stats.playerId,
                          );
                          const isBowling = currentBowlerId === stats.playerId;
                          return (
                            <Tr
                              key={stats.playerId}
                              className={`${isBowling ? "bg-primary/50 border-l-[3px] border-l-brand-blue" : "hover:bg-primary/30 border-l-[3px] border-l-transparent"}`}
                            >
                              <Td
                                className={`p-2 font-medium text-text-primary ${isBowling ? "font-bold text-brand-blue" : ""}`}
                              >
                                {bowler?.name} {isBowling && "*"}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.overs}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.maidens}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {stats.runsConceded}
                              </Td>
                              <Td className="text-right font-semibold">
                                {stats.wickets}
                              </Td>
                              <Td className="text-right text-text-secondary">
                                {calculateRunRate(
                                  stats.runsConceded,
                                  stats.overs,
                                )}
                              </Td>
                            </Tr>
                          );
                        },
                      )}
                    </Tbody>
                  </Table>
                </div>

                {/* Extras & FOW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
                      EXTRAS
                    </h4>
                    <div className="p-3 bg-primary/30 rounded-lg flex justify-between items-center border border-black/5 dark:border-white/5">
                      <span className="font-semibold text-body text-text-primary">
                        {extras.total}
                      </span>
                      <p className="text-xs text-text-secondary leading-tight text-right">
                        (wd {extras.wides}, nb {extras.noBalls}, b {extras.byes}
                        , lb {extras.legByes})
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-secondary px-1 text-[11px] uppercase tracking-wider mb-1">
                      FALL OF WICKETS
                    </h4>
                    <div className="text-xs text-text-secondary p-3 bg-primary/30 rounded-lg h-full overflow-x-auto no-scrollbar border border-black/5 dark:border-white/5">
                      {fallOfWickets.length > 0
                        ? fallOfWickets.map((fow) => (
                            <span
                              key={fow.wicketNumber}
                              className="mr-2 whitespace-nowrap"
                            >
                              {fow.score}-{fow.wicketNumber} (
                              {fow.playerName.split(" ")[0]}, {fow.over})
                            </span>
                          ))
                        : "No wickets yet."}
                    </div>
                  </div>
                </div>

                {/* Chase Progress */}
                {chaseProgress && (
                  <div className="p-4 bg-brand-blue/20 rounded-xl text-center">
                    <p className="font-bold text-brand-blue">{chaseProgress}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeScoringTab === "commentary" && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2 animate-fade-in">
              {isSecondInnings && match.innings1 && (
                <CrickIQCard className="! overflow-hidden">
                  <button
                    onClick={() =>
                      setIsFirstInningsCommentaryExpanded(
                        !isFirstInningsCommentaryExpanded,
                      )
                    }
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <h4 className="font-bold text-text-primary">
                      First Innings Commentary
                    </h4>
                    {isFirstInningsCommentaryExpanded ? (
                      <MinusIcon className="w-5 h-5 text-text-secondary" />
                    ) : (
                      <PlusIcon className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                  {isFirstInningsCommentaryExpanded && (
                    <div className="p-4 border-t border-brand-blue/15 bg-primary/30 space-y-4">
                      <CommentaryFeedDisplay
                        data={firstInningsCommentaryData}
                      />
                    </div>
                  )}
                </CrickIQCard>
              )}

              {isSecondInnings && match.innings1 && (
                <h3 className="text-xl font-bold text-text-primary pt-2">
                  Current Innings
                </h3>
              )}
              <CommentaryFeedDisplay data={currentInningsCommentaryData} />
            </div>
          )}
        </CrickIQCard>
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

      <ImpactPlayerModal
        isOpen={isImpactModalOpen}
        onClose={() => {
          setIsImpactModalOpen(false);
          setImpactModalTeamId(null);
        }}
        match={match}
        team={impactModalTeamId ? getTeamById(impactModalTeamId) : undefined}
        teams={teams}
        updateTeam={updateTeam}
        addPlayerReplacement={addPlayerReplacement}
      />

      {/* Over Complete Sheet */}
      <AnimatePresence>
        {showOverCompleteSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOverCompleteSheet(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Sheet Container */}
            <motion.div
              id="over-complete-sheet-container"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-primary border-t md:border border-brand-blue/15 w-full md:max-w-md md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-6 pb-8 z-10"
            >
              {/* Drag Handle on Mobile */}
              <div className="flex md:hidden justify-center pb-4">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="text-center space-y-1 mb-6">
                <h3 className="text-2xl font-black text-text-primary tracking-tight">Over Complete</h3>
                <p className="text-sm text-text-secondary font-medium">Over {completedOverNumber} completed</p>
              </div>

              {/* Over Summary */}
              <div className="bg-tertiary/40 border border-border/40 dark:bg-secondary/40 rounded-2xl p-5 mb-6 text-center space-y-4">
                <div>
                  <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{battingTeam?.name}</p>
                  <p className="text-4xl font-extrabold text-text-primary mt-1">
                    {currentInnings ? `${currentInnings.score}/${currentInnings.wickets}` : '0/0'}
                  </p>
                  <p className="text-xs text-text-secondary font-medium mt-1">
                    Run Rate: {currentInnings ? calculateRunRate(currentInnings.score, currentInnings.overs) : '0.00'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{overStats.runs}</p>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">Runs This Over</p>
                  </div>
                  <div className="text-center border-l border-border/30">
                    <p className="text-2xl font-bold text-danger">{overStats.wickets}</p>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">Wickets This Over</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  id="over-complete-start-next bg-accent"
                  onClick={handleStartNextOver}
                  className="w-full py-4 px-6 bg-accent hover:opacity-90 active:scale-98 transition-all text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 group text-base shadow-lg shadow-accent/20 cursor-pointer"
                >
                  <span>Start Next Over</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  id="over-complete-dismiss"
                  onClick={() => setShowOverCompleteSheet(false)}
                  className="w-full py-3 px-6 text-sm text-text-secondary hover:text-text-primary font-bold transition-colors text-center cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Innings Complete Sheet */}
      <AnimatePresence>
        {showInningsCompleteSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInningsCompleteSheet(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Sheet Container */}
            <motion.div
              id="innings-complete-sheet-container"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-primary border-t md:border border-brand-blue/15 w-full md:max-w-md md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-6 pb-8 z-10"
            >
              {/* Drag Handle on Mobile */}
              <div className="flex md:hidden justify-center pb-4">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="text-center space-y-1 mb-6">
                <h3 className="text-2xl font-black text-text-primary tracking-tight">First Innings Complete</h3>
              </div>

              {/* Innings Summary */}
              <div className="bg-tertiary/40 border border-border/40 dark:bg-secondary/40 rounded-2xl p-5 mb-6 text-center space-y-4">
                <div>
                  <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
                    {getTeamById(match.innings1?.battingTeamId || '')?.name}
                  </p>
                  <p className="text-4xl font-extrabold text-text-primary mt-1">
                    {match.innings1 ? `${match.innings1.score}/${match.innings1.wickets}` : '0/0'}
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-text-secondary font-medium mt-2">
                    <span>Overs: {match.innings1?.overs}</span>
                    <span>•</span>
                    <span>Run Rate: {innings1Stats?.runRate || '0.00'}</span>
                  </div>
                </div>

                {innings1Stats && (
                  <div className="bg-tertiary border border-border/50 dark:bg-secondary rounded-xl p-3.5 text-center">
                    <p className="text-xs text-text-secondary font-medium">Target to Win</p>
                    <p className="text-3xl font-black text-accent mt-0.5">{innings1Stats.target}</p>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  id="innings-complete-start-second bg-accent"
                  onClick={handleStartSecondInnings}
                  className="w-full py-4 px-6 bg-accent hover:opacity-90 active:scale-98 transition-all text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 group text-base shadow-lg shadow-accent/20 cursor-pointer"
                >
                  <span>Start Second Innings</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  id="innings-complete-dismiss"
                  onClick={() => setShowInningsCompleteSheet(false)}
                  className="w-full py-3 px-6 text-sm text-text-secondary hover:text-text-primary font-bold transition-colors text-center cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveScoring;
