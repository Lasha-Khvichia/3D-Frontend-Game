import { useGameStats } from "./useGameStats";

export function StatsPanel() {
  const stats = useGameStats();

  return (
    <dl className="overlay__stats">
      <dt>Time</dt>
      <dd>{formatClock(stats.timeOfDayHours)}</dd>
      <dt>Backend</dt>
      <dd>{stats.backend}</dd>
      <dt>FPS</dt>
      <dd>{stats.fps}</dd>
      <dt>Draw calls</dt>
      <dd>{stats.drawCalls}</dd>
      <dt>Frame</dt>
      <dd>{stats.frameTimeMs} ms</dd>
    </dl>
  );
}

function formatClock(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.floor((hours - wholeHours) * 60);
  return `${pad(wholeHours)}:${pad(minutes)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
