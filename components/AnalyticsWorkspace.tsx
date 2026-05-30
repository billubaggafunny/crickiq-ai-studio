import React, { useState } from "react";
import {
  AnalyticsIcon,
  ChartBarIcon,
  TableIcon,
  UserGroupIcon,
  CompareIcon,
} from "../constants";
import type { UseCrickIQStateReturn } from "../hooks/useCrickIQState";
import PointsTable from "./PointsTable";
import Statistics from "./Statistics";
import TournamentStats from "./TournamentStats";
import Comparison from "./Comparison";
import AnalyticsOverview from "./AnalyticsOverview";
import Rankings from "./Rankings";

const AnalyticsWorkspace: React.FC<UseCrickIQStateReturn> = (props) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "points" | "player" | "team" | "compare" | "rankings"
  >("overview");

  const TABS = [
    {
      id: "overview",
      label: "Overview",
      icon: <AnalyticsIcon className="w-5 h-5" />,
    },
    {
      id: "points",
      label: "Points Table",
      icon: <TableIcon className="w-5 h-5" />,
    },
    {
      id: "player",
      label: "Player Stats",
      icon: <UserGroupIcon className="w-5 h-5" />,
    },
    {
      id: "team",
      label: "Team Stats",
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      id: "compare",
      label: "Compare",
      icon: <CompareIcon className="w-5 h-5" />,
    },
    {
      id: "rankings",
      label: "Rankings",
      icon: <TableIcon className="w-5 h-5" />,
    },
  ] as const;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .recharts-surface, .overflow-x-auto, [data-no-swipe="true"]')) {
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

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 50) {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      if (distanceX > 0 && currentIndex < TABS.length - 1) {
        setActiveTab(
          TABS[currentIndex + 1].id as
            | "overview"
            | "points"
            | "player"
            | "team"
            | "compare"
            | "rankings",
        );
      } else if (distanceX < 0 && currentIndex > 0) {
        setActiveTab(
          TABS[currentIndex - 1].id as
            | "overview"
            | "points"
            | "player"
            | "team"
            | "compare"
            | "rankings",
        );
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AnalyticsOverview
            {...props}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case "points":
        return <PointsTable {...props} />;
      case "player":
        return <Statistics {...props} />;
      case "team":
        return <TournamentStats {...props} />;
      case "compare":
        return <Comparison {...props} />;
      case "rankings":
        return <Rankings {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="space-y-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      

      <div 
        className="flex bg-secondary dark:bg-black/20 rounded-lg p-1 space-x-1 border border-light-border dark:border-brand-blue/15 overflow-x-auto no-scrollbar"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-1.5 text-body font-semibold rounded-md transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-primary text-brand-blue dark:text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

export default AnalyticsWorkspace;
