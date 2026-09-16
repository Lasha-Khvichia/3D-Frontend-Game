import { FOOT_BYTES, FOOT_TEXELS } from "./footprintStamps";

/**
 * How trodden one texel of the print map is now: 1 a fresh, deep print, 0
 * untouched snow or a print long filled in. The same sum the ground shader
 * does (`snowTrodden`), so the trail the player sees is the trail that is firm.
 */
export function troddenShare(
  data: Uint8Array,
  column: number,
  row: number,
  nowShare: number,
  printLife: number,
): number {
  if (column < 0 || row < 0 || column >= FOOT_TEXELS || row >= FOOT_TEXELS) return 0;
  const at = (row * FOOT_TEXELS + column) * FOOT_BYTES;
  const when = data[at]! / 255;
  if (when <= 0) return 0;
  const depth = data[at + 1]! / 255;
  return depth * Math.min(1, Math.max(0, 1 - (nowShare - when) * printLife));
}
