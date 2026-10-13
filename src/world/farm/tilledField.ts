/** Metres along one side of a tilled square: one swing of a hoe. */
export const SOIL_CELL = 1;

/** Cells are keyed by packing both indices into one number, as the grass blockers are. */
function keyOf(cellX: number, cellZ: number): number {
  return (cellX + 32768) * 65536 + (cellZ + 32768);
}

export function cellXOf(key: number): number {
  return Math.floor(key / 65536) - 32768;
}

export function cellZOf(key: number): number {
  return (key % 65536) - 32768;
}

/** The square a world position falls in. */
export function cellAt(place: number): number {
  return Math.floor(place / SOIL_CELL);
}

/** The middle of a square, where its soil is drawn. */
export function middleOf(cell: number): number {
  return (cell + 0.5) * SOIL_CELL;
}

/**
 * Every square of ground that has been broken, for the whole island.
 *
 * A module-level store, like `roadField`: the terrain, the grass and the
 * drawn soil all ask the same question from different places, and none of
 * them owns the answer.
 *
 * This is the first thing in the game that the clock cannot work out again.
 * The weather, the snow and the seasons are all functions of the date, so
 * they are never stored. A square is tilled because somebody tilled it, so
 * every key here goes into the save.
 */
const broken = new Set<number>();

export function isTilled(x: number, z: number): boolean {
  return broken.has(keyOf(cellAt(x), cellAt(z)));
}

/** Breaks one square. False if it was already broken. */
export function till(cellX: number, cellZ: number): boolean {
  const key = keyOf(cellX, cellZ);
  if (broken.has(key)) return false;
  broken.add(key);
  return true;
}

/** Every broken square, as packed keys. */
export function tilledKeys(): readonly number[] {
  return [...broken];
}

/** Replaces the whole field, for loading a save. */
export function restoreTilled(keys: readonly number[]): void {
  broken.clear();
  for (const key of keys) broken.add(key);
}
