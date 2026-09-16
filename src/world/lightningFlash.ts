import type { TimeOfDayLighting } from "./timeOfDayPalette";

/** The flat fill a full, near flash adds to the ambient light. */
export const FLASH_FILL = 1.6;
/** The pale blue-white a lightning flash turns the sky. */
const FLASH_SKY = [0.78, 0.8, 0.92] as const;

/**
 * Lightning lighting the sky for an instant: the dome, the air, the clouds.
 *
 * Only the sky's colours and the flat fill are raised, never the sun or the
 * moon — their lights cast shadows, and a flash from the sun's direction
 * would throw a daylight shadow across a black storm.
 */
export function flashSky(lighting: TimeOfDayLighting, amount: number): void {
  const share = Math.min(1, amount) * 0.65;
  const { background, zenith } = lighting;
  background.r += (FLASH_SKY[0] - background.r) * share;
  background.g += (FLASH_SKY[1] - background.g) * share;
  background.b += (FLASH_SKY[2] - background.b) * share;
  zenith.r += (FLASH_SKY[0] - zenith.r) * share;
  zenith.g += (FLASH_SKY[1] - zenith.g) * share;
  zenith.b += (FLASH_SKY[2] - zenith.b) * share;
}
