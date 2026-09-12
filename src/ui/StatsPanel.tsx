import { useGameStats } from "./useGameStats";
import { formatClock, formatDate, formatSeason, formatTemperature } from "./formatCalendar";
import { SeasonDot } from "./SeasonDot";

export function StatsPanel() {
  const stats = useGameStats();

  return (
    <dl className="overlay__stats">
      <dt>Season</dt>
      <dd>
        <SeasonDot season={stats.date.season} />
        {formatSeason(stats.date.season)}
      </dd>
      <dt>Date</dt>
      <dd>{formatDate(stats.date)}</dd>
      <dt>Time</dt>
      <dd>{formatClock(stats.timeOfDayHours)}</dd>
      <dt>Weather</dt>
      <dd>{stats.weather}</dd>
      <dt>Air</dt>
      <dd>{formatTemperature(stats.airTemperature)}</dd>
      <dt>Backend</dt>
      <dd>{stats.backend}</dd>
      <dt>FPS</dt>
      <dd>{stats.fps}</dd>
      <dt>Draw calls</dt>
      <dd>{stats.drawCalls}</dd>
      <dt>Frame</dt>
      <dd>{stats.frameTimeMs} ms</dd>
      <dt>Resolution</dt>
      <dd>{Math.round(stats.resolutionShare * 100)}%</dd>
    </dl>
  );
}
