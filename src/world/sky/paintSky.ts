import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { DayNightCycle } from "../DayNightCycle";
import type { CloudLighting } from "./bindCloudUniforms";
import type { SkyPaint } from "./SkyDome";
import { StarSky } from "./StarSky";

/** Moonlight is real but faint: this much of the moon's colour lights the clouds at night. */
const MOON_ON_CLOUDS = 0.12;
const MOON_COLOUR = [0.55, 0.65, 0.95] as const;
/** The deep orange of low sunlight, after the air has scattered its blue away. */
const DUSK_COLOUR = [1, 0.42, 0.16] as const;

export function createSkyPaint(): SkyPaint {
  return {
    horizon: new Color3(),
    zenith: new Color3(),
    sunDirection: new Vector3(0, 1, 0),
    sunGlow: new Color3(),
    duskGlow: new Color3(),
    stars: new StarSky(),
    cloudsShown: 1,
  };
}

/** The clouds' light, sharing the sky's colours so both change together. */
export function createCloudLighting(paint: SkyPaint): CloudLighting {
  return {
    direction: new Vector3(0, 1, 0),
    colour: new Color3(),
    zenith: paint.zenith,
    horizon: paint.horizon,
  };
}

/**
 * Copies this step's sky out of the day and night cycle: the colours for the
 * dome, and the light for the clouds.
 *
 * Clouds keep the sun after the ground has lost it. From 1.4 km up the
 * horizon is several degrees lower, so at sunset the island is in shadow
 * while the clouds overhead are still lit — from below, orange. They take
 * the moon's light only once they have lost the sun too.
 */
export function paintSky(
  dayNight: DayNightCycle,
  paint: SkyPaint,
  lighting: CloudLighting,
  seconds: number,
): void {
  const palette = dayNight.palette;
  const sun = dayNight.sunAndMoon.sunDirection;
  const { moonDirection, moonAboveHorizon } = dayNight.sunAndMoon;
  // How much of the moon's face is lit: full when it stands opposite the sun.
  const moonLit = (1 - Vector3.Dot(sun, moonDirection)) / 2;
  paint.stars.update(seconds, dayNight.totalHours, sun.y, moonAboveHorizon, moonLit);
  paint.horizon.set(palette.background.r, palette.background.g, palette.background.b);
  paint.zenith.copyFrom(palette.zenith);
  paint.cloudsShown = 1 - dayNight.murk;
  paint.sunDirection.copyFrom(sun);
  paint.sunGlow
    .copyFrom(palette.lightColor)
    .scaleInPlace(palette.lightIntensity * dayNight.sunAndMoon.sunAboveHorizon * 0.9);
  // Strongest with the sun at the horizon; gone once it is high, or well below.
  const low = clamp01((0.35 - sun.y) / 0.4) * clamp01((sun.y + 0.14) / 0.14);
  paint.duskGlow.set(DUSK_COLOUR[0] * low, DUSK_COLOUR[1] * low, DUSK_COLOUR[2] * low);

  const cloudsSeeSun = smooth(clamp01((sun.y + 0.12) / 0.16));
  if (cloudsSeeSun > 0.001) {
    const strength = Math.max(palette.lightIntensity, 0.55) * cloudsSeeSun * 1.1;
    const warm = low * 0.7;
    lighting.direction.copyFrom(sun);
    lighting.colour.set(
      (palette.lightColor.r + (DUSK_COLOUR[0] - palette.lightColor.r) * warm) * strength,
      (palette.lightColor.g + (DUSK_COLOUR[1] - palette.lightColor.g) * warm) * strength,
      (palette.lightColor.b + (DUSK_COLOUR[2] - palette.lightColor.b) * warm) * strength,
    );
  } else {
    const moonUp = dayNight.sunAndMoon.moonAboveHorizon * MOON_ON_CLOUDS;
    lighting.direction.copyFrom(dayNight.sunAndMoon.moonDirection);
    lighting.colour.set(MOON_COLOUR[0] * moonUp, MOON_COLOUR[1] * moonUp, MOON_COLOUR[2] * moonUp);
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
