import { useGameStats } from "./useGameStats";

export function StatsPanel() {
  const stats = useGameStats();

  return (
    <dl className="overlay__stats">
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
