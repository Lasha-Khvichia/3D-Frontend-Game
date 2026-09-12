/** 5 cm a texel over 20 m round the player: a boot print is about 5 texels by 3. */
export const FOOT_TEXELS = 384;
export const FOOT_SPAN = 20;
export const FOOT_TEXEL_METRES = FOOT_SPAN / FOOT_TEXELS;
/** Game hours a print takes to fill in. Falling snow and wind do it faster (`SnowGround`). */
export const PRINT_FADE_HOURS = 3;
/** A stamp holds its age over twice that, then every print is rebased down. */
export const PRINT_WINDOW_HOURS = PRINT_FADE_HOURS * 2;
/** A boot, in metres. */
const PRINT_LENGTH = 0.28;
const PRINT_WIDTH = 0.15;

/**
 * The prints themselves, as plain array work on the map `FootprintMap` holds.
 *
 * A texel does not hold how deep a print is; it holds **when** it was made,
 * as a share of `PRINT_WINDOW_HOURS`. The shader takes the age from that and
 * one uniform, so no print is ever redrawn as it fades.
 *
 * The map is RGBA because a one-channel raw texture sampled **black** in the
 * ground shader. The spare room is not wasted: green holds how deep the print
 * is, which is what gives it a soft rim.
 */
/** Bytes a texel: RGBA, with the stamp in red. */
export const FOOT_BYTES = 4;

/** One boot down at a texel, lying the way the player is walking. */
export function pressPrint(
  data: Uint8Array,
  column: number,
  row: number,
  towardX: number,
  towardZ: number,
  stamp: number,
): void {
  const reach = Math.ceil(PRINT_LENGTH / FOOT_TEXEL_METRES);
  for (let dr = -reach; dr <= reach; dr += 1) {
    const atRow = row + dr;
    if (atRow < 0 || atRow >= FOOT_TEXELS) continue;
    for (let dc = -reach; dc <= reach; dc += 1) {
      const atColumn = column + dc;
      if (atColumn < 0 || atColumn >= FOOT_TEXELS) continue;
      const overX = dc * FOOT_TEXEL_METRES;
      const overZ = dr * FOOT_TEXEL_METRES;
      // Along the walk and across it, so the print lies the way the foot did.
      const along = (overX * towardX + overZ * towardZ) / (PRINT_LENGTH / 2);
      const across = (overX * towardZ - overZ * towardX) / (PRINT_WIDTH / 2);
      const into = along * along + across * across;
      if (into > 1) continue;
      const at = (atRow * FOOT_TEXELS + atColumn) * FOOT_BYTES;
      // Red is when it was trodden, green how deeply: a print is deepest in
      // the middle and shallow at its rim, or it reads as a stamped square.
      data[at] = stamp;
      data[at + 1] = Math.round(255 * Math.min(1, (1 - into) * 1.8));
    }
  }
}

/** Moves every print's age down by `moved`, so the byte keeps counting from now. */
export function rebaseStamps(data: Uint8Array, moved: number): void {
  for (let at = 0; at < data.length; at += FOOT_BYTES) {
    const was = data[at]!;
    data[at] = was > moved ? was - moved : 0;
  }
}

/** Slides the map by whole texels, dropping what falls off the edge. */
export function slideStamps(
  data: Uint8Array,
  scratch: Uint8Array,
  overColumns: number,
  overRows: number,
): void {
  scratch.fill(0);
  for (let row = 0; row < FOOT_TEXELS; row += 1) {
    const from = row + overRows;
    if (from < 0 || from >= FOOT_TEXELS) continue;
    for (let column = 0; column < FOOT_TEXELS; column += 1) {
      const fromColumn = column + overColumns;
      if (fromColumn < 0 || fromColumn >= FOOT_TEXELS) continue;
      const to = (row * FOOT_TEXELS + column) * FOOT_BYTES;
      const at = (from * FOOT_TEXELS + fromColumn) * FOOT_BYTES;
      // The whole texel: when it was trodden and how deeply, or a slid print
      // keeps its age and loses its shape.
      scratch[to] = data[at]!;
      scratch[to + 1] = data[at + 1]!;
    }
  }
  data.set(scratch);
}
