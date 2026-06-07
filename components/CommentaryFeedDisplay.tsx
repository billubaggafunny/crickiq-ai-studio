import React, { useState } from "react";
import { generateCommentaryData, getBallDisplay } from "../utils/cricketLogic";
import { MinusIcon, PlusIcon } from "../constants"; // Assumes you have these, adjust imports if not

const CommentaryFeedDisplay: React.FC<{
  data: ReturnType<typeof generateCommentaryData>;
}> = ({ data }) => {
  const [expandedOver, setExpandedOver] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-text-secondary text-center py-8">
        Commentary will appear here as the match progresses.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(({ over, balls }) => {
        const isExpanded = expandedOver === over;
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
                      className={`${ballClass} flex-shrink-0 shadow-sm`}
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
                        <div className={`${ballClass} flex-shrink-0`}>
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
      })}
    </div>
  );
};

export default CommentaryFeedDisplay;
