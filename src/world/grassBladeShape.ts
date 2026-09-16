/** Blade height in metres. Shin high, so the field has depth to walk into. */
export const BLADE_HEIGHT = 0.46;
const BASE_WIDTH = 0.042;
const MID_WIDTH = 0.024;
/** The blade curves forward, so a field of them is not a bed of nails. */
const MID_LEAN = 0.035;
const TIP_LEAN = 0.135;
/** Share of the blade's height where the middle pair of vertices sits. */
const MID_RISE = 0.55;
/** How much of the tip's drift the middle pair follows: the base stays planted. */
const MID_BEND = 0.32;

/**
 * Writes the five vertices of one blade, three numbers each: two at the root,
 * two part way up, one at the tip.
 *
 * `forward` and `sideways` are metres the tip drifts in the breeze. `showing`
 * is the share of the blade above the snow: what is left standing is shorter
 * and leans less, until at 0 there is nothing left to see.
 */
export function placeBladeVertices(
  forward: number,
  sideways: number,
  showing: number,
  out: number[] | Float32Array,
): void {
  const halfBase = BASE_WIDTH / 2;
  const halfMid = MID_WIDTH / 2;
  const midHeight = BLADE_HEIGHT * MID_RISE * showing;
  const midForward = (MID_LEAN + forward * MID_BEND) * showing;
  const midSide = sideways * MID_BEND * showing;
  out[0] = -halfBase;
  out[1] = 0;
  out[2] = 0;
  out[3] = halfBase;
  out[4] = 0;
  out[5] = 0;
  out[6] = -halfMid + midSide;
  out[7] = midHeight;
  out[8] = midForward;
  out[9] = halfMid + midSide;
  out[10] = midHeight;
  out[11] = midForward;
  out[12] = sideways * showing;
  out[13] = BLADE_HEIGHT * showing;
  out[14] = (TIP_LEAN + forward) * showing;
}
