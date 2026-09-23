import type { WeatherKind } from "../world/weather/weatherKinds";

/** Bumped when a save from an older build can no longer be trusted. */
const STORAGE_KEY = "game.save.v1";

/** Everything about a game that the date cannot work out again. */
export type SaveFile = {
  /** Hours since midnight on 1 January, Year 1: the whole clock. */
  readonly totalHours: number;
  /** A weather held from the menu, or "auto". */
  readonly held: WeatherKind | "auto";
  readonly player: { readonly x: number; readonly z: number; readonly yaw: number };
};

/**
 * The saved game, kept in the browser beside the settings but on its own key.
 *
 * It is four numbers, because the weather, the snow, the wet ground and the
 * sky are all functions of the clock: restore the hour and they come back by
 * themselves. What cannot be worked out is where the player stood and what
 * the menu was holding.
 *
 * Reading and writing are wrapped: a private window, or storage turned off,
 * throws rather than returning null, and a game that cannot save must still
 * run.
 */
export function readSave(): SaveFile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SaveFile) : null;
  } catch {
    return null;
  }
}

export function writeSave(save: SaveFile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // No storage: the game runs, it just will not come back where it left off.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // As above.
  }
}
