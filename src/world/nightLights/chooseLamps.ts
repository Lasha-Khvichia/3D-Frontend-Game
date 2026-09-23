import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Footprint } from "../footprint";
import { LAMP_SLOTS, lampField } from "./lampField";

/** A lamp the shaders may be given: a lantern, or the light spilling from a lit window. */
export type LampSource = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Metres its light reaches. */
  readonly range: number;
  /** For a lamp on a wall: out of the wall, and metres back to its face. Zero for a free one. */
  readonly outX: number;
  readonly outZ: number;
  readonly gap: number;
  /** Metres added to its distance when choosing, so a window's spill gives way to a lantern. */
  readonly giveWay: number;
  /** The house whose wall holds it, or -1. */
  readonly house: number;
  /** Its colour and strength this step; black when out. */
  readonly glow: Color3;
};

/** Metres from the eye to the edge of a lamp's light past which it is not given to the shaders. */
const REACH = 40;
/** Metres over which a lamp fades out before that edge, or before the nearest one left out. */
const FADE = 6;

const chosen: { source: LampSource; score: number }[] = [];

/**
 * Picks the lamps nearest the eye into `lampField`. Each fades out as it nears
 * the edge of what is chosen, so one swapping in or out as the player walks
 * does so at no strength rather than with a jump. Inside a house, light from
 * any lamp not on its own walls stops at the wall facing that lamp.
 */
export function chooseLamps(
  sources: readonly LampSource[],
  eye: Vector3,
  inside: Footprint | null,
  home: number,
) {
  chosen.length = 0;
  for (const source of sources) {
    if (source.glow.r + source.glow.g + source.glow.b <= 0) continue;
    const away = Math.hypot(source.x - eye.x, source.y - eye.y, source.z - eye.z);
    const score = away - source.range + source.giveWay;
    if (score < REACH) chosen.push({ source, score });
  }
  chosen.sort((a, b) => a.score - b.score);
  const cut = chosen.length > LAMP_SLOTS ? chosen[LAMP_SLOTS]!.score : REACH;
  lampField.count = Math.min(chosen.length, LAMP_SLOTS);
  const { places, glows, walls } = lampField;
  for (let slot = 0; slot < lampField.count; slot += 1) {
    const { source, score } = chosen[slot]!;
    const t = Math.min(1, Math.max(0, (cut - score) / FADE));
    const at = slot * 4;
    [places[at], places[at + 1], places[at + 2], places[at + 3]] = [
      source.x,
      source.y,
      source.z,
      source.range,
    ];
    [glows[at], glows[at + 1], glows[at + 2]] = [
      source.glow.r * t,
      source.glow.g * t,
      source.glow.b * t,
    ];
    const own = source.house === home || !inside;
    const [outX, outZ, gap] = own
      ? [source.outX, source.outZ, source.gap]
      : faceToward(inside, source);
    [walls[at], walls[at + 1], walls[at + 2], walls[at + 3]] = [outX, outZ, gap, gap > 0 ? 1 : 0];
  }
}

/** The wall of a house that faces a lamp outside it: out of it, and metres back to its face. */
function faceToward(walls: Footprint, lamp: LampSource): [number, number, number] {
  const sides: [number, number, number][] = [
    [1, 0, lamp.x - walls.maxX],
    [-1, 0, walls.minX - lamp.x],
    [0, 1, lamp.z - walls.maxZ],
    [0, -1, walls.minZ - lamp.z],
  ];
  const [outX, outZ, past] = sides.reduce((best, side) => (side[2] > best[2] ? side : best));
  return past > 0 ? [outX, outZ, past] : [0, 0, 0];
}
