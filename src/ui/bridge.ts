import type { RenderBackend } from "../core/createEngine";

/**
 * The only seam between the game and React.
 *
 * Rule: React never calls into the render loop, and the render loop never
 * touches React state directly. Everything crosses through here. Break this
 * and you get the classic Babylon/React bug — a state change restarts the
 * render loop and the frame rate halves.
 */

export type GameStats = {
  backend: RenderBackend | "unknown";
  fps: number;
  drawCalls: number;
  frameTimeMs: number;
};

export type OverlayCommand = "toggle-inspector";

let stats: GameStats = { backend: "unknown", fps: 0, drawCalls: 0, frameTimeMs: 0 };

const statsListeners = new Set<() => void>();
const commandListeners = new Set<(command: OverlayCommand) => void>();

/** Game -> React. Called from the loop, throttled by StatsReporter. */
export function publishStats(patch: Partial<GameStats>): void {
  stats = { ...stats, ...patch };
  for (const listener of statsListeners) listener();
}

export function readStats(): GameStats {
  return stats;
}

export function subscribeToStats(listener: () => void): () => void {
  statsListeners.add(listener);
  return () => {
    statsListeners.delete(listener);
  };
}

/** React -> game. Never runs game code on the React render pass. */
export function sendCommand(command: OverlayCommand): void {
  for (const listener of commandListeners) listener(command);
}

export function subscribeToCommands(listener: (command: OverlayCommand) => void): () => void {
  commandListeners.add(listener);
  return () => {
    commandListeners.delete(listener);
  };
}
