import {
  coverageFrom,
  SHADOW_ALTITUDE,
  SHADOW_BODY,
  SHADOW_HEIGHT,
  SHAPE_TILE,
  WEATHER_TILE,
} from "./cloudLayer";
import { SHAPE_SIZE, WEATHER_SIZE, type CloudNoise } from "./noise/buildCloudNoise";
import { sampleWrapped } from "./noise/sampleNoise";

/** The weather at this moment: how much cloud overall, and how far the wind has moved it. */
export type CloudState = {
  readonly cover: number;
  readonly drift: { readonly x: number; readonly z: number };
  readonly rise: number;
};

const weatherTexel = [0, 0, 0, 0];
const shapeTexel = [0, 0, 0, 0];

/**
 * How much cloud stands over a point at the height shadows are taken from, 0
 * to 1 — the CPU's copy of `cloudShadowAt` in the shadow shader, formula for
 * formula, reading the same bytes the GPU was given.
 *
 * The halo, the glare and the god rays dim by this, so they fade exactly
 * when the shadow of a visible cloud reaches the player.
 */
export function cloudShadeAt(noise: CloudNoise, state: CloudState, x: number, z: number): number {
  const [coverage, tall] = sampleWrapped(
    noise.weather,
    WEATHER_SIZE,
    2,
    [(x + state.drift.x) / WEATHER_TILE, (z + state.drift.z) / WEATHER_TILE, 0],
    weatherTexel,
  );
  const cover = coverageFrom(coverage!, state.cover);
  if (cover < 0.001) return 0;
  const [r, g, b, a] = sampleWrapped(
    noise.shape,
    SHAPE_SIZE,
    3,
    [
      (x + state.drift.x + SHADOW_HEIGHT * 500) / SHAPE_TILE,
      (SHADOW_ALTITUDE - state.rise) / SHAPE_TILE,
      (z + state.drift.z) / SHAPE_TILE,
    ],
    shapeTexel,
  );
  const lowFbm = g! * 0.625 + b! * 0.25 + a! * 0.125;
  const top = 0.35 + 0.65 * tall!;
  const fade = smoothStep(top * 0.55, top, SHADOW_HEIGHT);
  const shaped = ((r! - lowFbm + 1) / (2 - lowFbm)) * (1 - fade);
  const body = Math.min(1, Math.max(0, (shaped - 1 + cover) / cover)) * cover;
  return 1 - Math.exp(-body * SHADOW_BODY);
}

function smoothStep(from: number, to: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}
