import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { BASE_COLOUR, TIP_COLOUR } from "../createGrassBlade";
import type { SeasonLook } from "./seasonLook";

type Rgb = readonly [number, number, number];

/** Straw at the height of a dry summer, and the dull olive of a dormant winter. */
const DRY_BASE: Rgb = [0.17, 0.17, 0.08];
const DRY_TIP: Rgb = [0.63, 0.56, 0.24];
const DORMANT_BASE: Rgb = [0.11, 0.15, 0.09];
const DORMANT_TIP: Rgb = [0.33, 0.37, 0.22];
/** New spring growth, lighter and yellower than the summer's. */
const FRESH_BASE: Rgb = [0.1, 0.24, 0.09];
const FRESH_TIP: Rgb = [0.45, 0.69, 0.23];
const FRESHNESS = 0.6;
/** A white rime, which catches on the tips of the blades far more than at their roots. */
const FROST: Rgb = [0.82, 0.86, 0.86];
const FROST_AT_ROOT = 0.15;
const FROST_AT_TIP = 0.55;

/** Colours of the five points of the shared blade, as Babylon wants them: rgba, base to tip. */
const colours = new Float32Array(20);
let written = "";

/**
 * Colours every blade of grass for the season, by writing the five vertices
 * of the shared blade mesh — the same trick the sway and the snow use. It is
 * five vertices for the whole two-hundred-thousand-blade field, so this costs
 * nothing, and it only writes when the colour has actually moved.
 */
export function tintGrass(meshes: readonly Mesh[], look: SeasonLook, frost: number): void {
  const base = dress(BASE_COLOUR, DRY_BASE, DORMANT_BASE, FRESH_BASE, look, frost * FROST_AT_ROOT);
  const tip = dress(TIP_COLOUR, DRY_TIP, DORMANT_TIP, FRESH_TIP, look, frost * FROST_AT_TIP);
  const middle = base.map((part, index) => part + (tip[index]! - part) * 0.55) as number[];
  const key = [...base, ...tip].map((part) => Math.round(part * 255)).join(",");
  if (key === written) return;
  written = key;
  for (const [at, colour] of [
    [0, base],
    [4, base],
    [8, middle],
    [12, middle],
    [16, tip],
  ] as const) {
    colours.set([...colour, 1], at);
  }
  for (const mesh of meshes) mesh.updateVerticesData(VertexBuffer.ColorKind, colours);
}

function dress(
  summer: Rgb,
  dry: Rgb,
  dormant: Rgb,
  fresh: Rgb,
  look: SeasonLook,
  frost: number,
): number[] {
  const out = [...summer];
  mix(out, fresh, look.blossom * FRESHNESS);
  mix(out, dry, look.dryness);
  mix(out, dormant, look.dormant);
  mix(out, FROST, frost);
  return out;
}

function mix(out: number[], towards: Rgb, share: number): void {
  if (share <= 0) return;
  for (let index = 0; index < 3; index += 1) {
    out[index] = out[index]! + (towards[index]! - out[index]!) * share;
  }
}
