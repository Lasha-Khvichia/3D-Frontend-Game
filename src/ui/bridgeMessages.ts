import type { RenderBackend } from "../core/createEngine";

/** Everything the game publishes to React. Game -> React, one way. */
export type GameStats = {
  backend: RenderBackend | "unknown";
  fps: number;
  drawCalls: number;
  frameTimeMs: number;
  /** In-game hour, 0 to 24. */
  timeOfDayHours: number;
  /** The mini-map only exists in first person. */
  firstPerson: boolean;
  /** True while the pause menu is up and the world is frozen. */
  paused: boolean;
  /** What the player can do with whatever they are standing next to. */
  interactionPrompt: string;
  /** A message the world has for the player, shown large for a few seconds. */
  notice: string;
};

/** Everything React asks the game to do. React -> game, one way. */
export type OverlayCommand =
  | { readonly type: "toggle-inspector" }
  | { readonly type: "set-time-of-day"; readonly hour: number }
  | { readonly type: "resume" };

export const EMPTY_STATS: GameStats = {
  backend: "unknown",
  fps: 0,
  drawCalls: 0,
  frameTimeMs: 0,
  timeOfDayHours: 0,
  firstPerson: true,
  paused: true,
  interactionPrompt: "",
  notice: "",
};
