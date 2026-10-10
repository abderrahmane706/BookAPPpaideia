import type { DashboardStats } from "@/lib/utils/library";
import { StatTile } from "./StatTile";

export interface ReadingStatsProps {
  stats: DashboardStats;
}

/** Reading statistics band — a responsive grid of library metrics. */
export function ReadingStats({ stats }: ReadingStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile label="In library" value={stats.totalBooks} />
      <StatTile
        label="Reading"
        value={stats.currentlyReading}
        hint="in progress"
        accent
      />
      <StatTile label="Completed" value={stats.completed} />
      <StatTile label="Paused" value={stats.paused} />
      <StatTile label="Want to read" value={stats.wantToRead} />
      <StatTile
        label="Avg rating"
        value={stats.averageRating ?? "—"}
        hint={
          stats.averageRating !== null
            ? `${stats.completionRate}% finished`
            : "no ratings yet"
        }
      />
    </div>
  );
}
