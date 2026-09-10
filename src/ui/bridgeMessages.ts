import type { RenderBackend } from "../core/createEngine";
import { dateAt, type CalendarDate } from "../world/calendar/calendar";

/** Everything the game publishes to React. Game -> React, one way. */
export type GameStats = {
  backend: RenderBackend | "unknown";
  fps: number;
  drawCalls: number;
  frameTimeMs: number;
  /** Share of the chosen resolution being drawn: below 1 while auto resolution holds the frame rate. */
  resolutionShare: number;
  /** In-game hour, 0 to 24. */
  timeOfDayHours: number;
  date: CalendarDate;
  /** Degrees Celsius where the player stands: the season's, before weather. */
  airTemperature: number;
  /** The mini-map only exists in first person. */
  firstPerson: boolean;
  /** True while the pause menu is up and the world is frozen. */
  paused: boolean;
  /** What the player can do with whatever they are standing next to. */
  interactionPrompt: string;
  /** A message the world has for the player, shown large for a few seconds. */
  notice: string;
  /** Where the player stands and faces, published when the world map opens. */
  playerPose: { readonly x: number; readonly z: number; readonly yaw: number } | null;
};

/** Everything React asks the game to do. React -> game, one way. */
export type OverlayCommand =
  | { readonly type: "toggle-inspector" }
  | { readonly type: "set-time-of-day"; readonly hour: number }
  | { readonly type: "set-date"; readonly dayOfYear: number }
  | { readonly type: "resume" }
  | { readonly type: "open-map" };

export const EMPTY_STATS: GameStats = {
  backend: "unknown",
  fps: 0,
  drawCalls: 0,
  frameTimeMs: 0,
  resolutionShare: 1,
  timeOfDayHours: 0,
  date: dateAt(0),
  airTemperature: 0,
  firstPerson: true,
  paused: true,
  interactionPrompt: "",
  notice: "",
  playerPose: null,
};
