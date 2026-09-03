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
  /** In-game hour, 0 to 24. */
  timeOfDayHours: number;
  /** The mini-map only exists in first person. */
  firstPerson: boolean;
};

export type OverlayCommand = "toggle-inspector";

let stats: GameStats = {
  backend: "unknown",
  fps: 0,
  drawCalls: 0,
  frameTimeMs: 0,
  timeOfDayHours: 0,
  firstPerson: true,
};

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

/**
 * React owns the mini-map's decoration canvas; the render loop paints it.
 * Kept out of React state on purpose: it is written every frame, and putting it
 * in state would re-render the overlay 170 times a second.
 */
let miniMapCanvas: HTMLCanvasElement | null = null;

export function setMiniMapCanvas(canvas: HTMLCanvasElement | null): void {
  miniMapCanvas = canvas;
}

export function readMiniMapCanvas(): HTMLCanvasElement | null {
  return miniMapCanvas;
}
