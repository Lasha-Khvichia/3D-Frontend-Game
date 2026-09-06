import { EMPTY_STATS, type GameStats, type OverlayCommand } from "./bridgeMessages";

export type { GameStats, OverlayCommand } from "./bridgeMessages";

/**
 * The only seam between the game and React.
 *
 * React never calls into the render loop and the loop never touches React
 * state. Break that and you get the classic Babylon/React bug: a state change
 * restarts the render loop and the frame rate halves.
 */

let stats: GameStats = { ...EMPTY_STATS };

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
 * React owns the mini-map's decoration canvas and the render loop paints it.
 * Out of React state on purpose: in state it would re-render at frame rate.
 */
let miniMapCanvas: HTMLCanvasElement | null = null;

export function setMiniMapCanvas(canvas: HTMLCanvasElement | null): void {
  miniMapCanvas = canvas;
}

export function readMiniMapCanvas(): HTMLCanvasElement | null {
  return miniMapCanvas;
}

/** Compared before publishing, or React re-renders at frame rate to say the
 * same words. */
export function publishPrompt(text: string): void {
  if (stats.interactionPrompt !== text) publishStats({ interactionPrompt: text });
}

/** Out of GameStats because the loop reads it every frame; mirrored in for React. */
let paused = true;

export function publishPaused(next: boolean): void {
  if (paused === next) return;
  paused = next;
  publishStats({ paused: next });
}

export function readPaused(): boolean {
  return paused;
}
