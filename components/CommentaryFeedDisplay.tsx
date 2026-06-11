import React, { useState, useMemo } from "react";
import { generateCommentaryData, getBallDisplay, getBallOutcomeChipClass } from "../utils/cricketLogic";
import { MinusIcon, PlusIcon } from "../constants"; // Assumes you have these, adjust imports if not

const CommentaryFeedDisplay: React.FC<{
  data: ReturnType<typeof generateCommentaryData>;
}> = ({ data }) => {
  const [expandedOver, setExpandedOver] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "fours" | "sixes" | "wickets" | "extras">("all");

  const filteredData = useMemo(() => {
    if (filter === "all") return data;

    return data
      .map(({ over, balls }) => {
        const matchingBalls = balls.filter(({ ball }) => {
          if (filter === "fours") {
            return ball.runs === 4 && !ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye;
          }
          if (filter === "sixes") {
            return ball.runs === 6 && !ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye;
          }
          if (filter === "wickets") {
            return ball.isWicket;
          }
          if (filter === "extras") {
            return ball.isWide || ball.isNoBall || ball.isBye || ball.isLegBye;
          }
          return true;
        });

        return { over, balls: matchingBalls };
      })
      .filter(({ balls }) => balls.length > 0);
  }, [data, filter]);

  if (data.length === 0) {
    return (
      <p className="text-text-secondary text-center py-8">
        Commentary will appear here as the match progresses.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search / Filter header */}
      <div className="flex justify-between items-center bg-tertiary/20 px-3 py-2 rounded-xl border border-border/40 mb-2">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Filter Events
        </span>
        <div className="relative">
          <select
            id="commentary-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "fours" | "sixes" | "wickets" | "extras")}
            className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-lg border bg-tertiary transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent ${
              filter !== "all"
                ? "border-accent text-accent"
                : "border-border text-text-primary hover:border-accent hover:text-accent"
            }`}
          >
            <option value="all">All</option>
            <option value="fours">Fours</option>
            <option value="sixes">Sixes</option>
            <option value="wickets">Wickets</option>
            <option value="extras">Extras</option>
          </select>
          <div
            className={`absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none ${
              filter !== "all" ? "text-accent" : "text-text-secondary"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-10 bg-primary/30 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl">
          <p className="text-sm text-text-secondary font-medium">
            No matching commentary entries found.
          </p>
        </div>
      ) : (
        filteredData.map(({ over, balls }) => {
          const isExpanded = expandedOver === over || filter !== "all";
          const overRuns = balls.reduce((sum, { ball }) => {
            let r = ball.runs;
            if (ball.isWide || ball.isNoBall) r += 1;
            return sum + r;
          }, 0);

          return (
            <div
              key={`over-${over}`}
              className="bg-primary/30 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setExpandedOver(isExpanded ? null : over)}
                className="w-full flex flex-col p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex justify-between items-center w-full mb-3">
                  <h4 className="font-semibold text-text-primary text-body">
                    Over {over}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-secondary">
                      {overRuns} Runs
                    </span>
                    {isExpanded ? (
                      <MinusIcon className="w-5 h-5 text-text-secondary" />
                    ) : (
                      <PlusIcon className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {balls.map(({ ball }, idx) => {
                    const { className: ballClass, text: ballText } =
                      getBallDisplay(ball);
                    return (
                      <div
                        key={idx}
                        className={`${ballClass} ${getBallOutcomeChipClass(ball)} over-chip flex-shrink-0 shadow-sm`}
                        title={ballText}
                      >
                        {ballText}
                      </div>
                    );
                  })}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 space-y-4">
                  {balls.map(({ ball, text, displayBallNumber }, index) => {
                    const { className: ballClass, text: ballText } =
                      getBallDisplay(ball);
                    return (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`${ballClass} ${getBallOutcomeChipClass(ball)} over-chip flex-shrink-0`}>
                            {ballText}
                          </div>
                          <span className="text-caption text-text-secondary font-mono mt-1">
                            {displayBallNumber}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary pt-1 leading-relaxed">
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default CommentaryFeedDisplay;
