import type { Terrain } from "../terrain/Terrain";
import { GRID_HALF_EXTENT, GRID_SPACING, SEA_LEVEL } from "../terrain/terrainConstants";
import { MAP_HALF_EXTENT, MAP_PIXELS, METRES_PER_PIXEL } from "./mapFrame";
import { paperGrain } from "./paperGrain";
import { blendField, sampleMapFields } from "./sampleMapFields";

type Rgb = readonly [number, number, number];
const PAPER: Rgb = [0.93, 0.86, 0.7];
const SEA_INK: Rgb = [0.5, 0.63, 0.64];
const RIVER_INK: Rgb = [0.38, 0.53, 0.6];
const MEADOW: Rgb = [0.8, 0.8, 0.58];
const SAND: Rgb = [0.9, 0.8, 0.58];
const SEPIA: Rgb = [0.45, 0.32, 0.2];
const COAST_INK: Rgb = [0.3, 0.2, 0.12];
const HIGHLIGHT: Rgb = [0.97, 0.93, 0.83];

/**
 * The island on old paper: sea in a blue-green wash with ripples ruled round
 * the coast, meadows in pale ochre, hills and mountains shaded in sepia as if
 * lit from the north-west, rivers inked in, and a firm line along the shore.
 *
 * Everything that needs neighbours — relief, where rivers stand — is worked
 * out once per height sample, 4 m apart, and blended for each pixel between;
 * the coast and the ripples come from the depth of the sea alone. Asking the
 * coastline's noise for each of four million pixels took seconds.
 */
export function paintMapGround(context: CanvasRenderingContext2D, terrain: Terrain): void {
  const { grid } = terrain;
  const size = grid.size;
  const { river, shade, steepness } = sampleMapFields(terrain);
  const blend = (field: Float32Array, gx: number, gz: number): number =>
    blendField(field, size, gx, gz);

  const image = context.createImageData(MAP_PIXELS, MAP_PIXELS);
  const colour = [0, 0, 0];
  const mix = (ink: Rgb, share: number): void => {
    for (let channel = 0; channel < 3; channel += 1)
      colour[channel]! += (ink[channel]! - colour[channel]!) * share;
  };
  for (let py = 0; py < MAP_PIXELS; py += 1) {
    const z = MAP_HALF_EXTENT - (py + 0.5) * METRES_PER_PIXEL;
    for (let px = 0; px < MAP_PIXELS; px += 1) {
      const x = (px + 0.5) * METRES_PER_PIXEL - MAP_HALF_EXTENT;
      const gx = (x + GRID_HALF_EXTENT) / GRID_SPACING;
      const gz = (z + GRID_HALF_EXTENT) / GRID_SPACING;
      const depth = SEA_LEVEL - grid.heightAt(x, z);
      const grain = paperGrain(px, py);
      colour[0] = PAPER[0] * grain;
      colour[1] = PAPER[1] * grain;
      colour[2] = PAPER[2] * grain;
      if (depth > 0) {
        mix(SEA_INK, Math.min(0.75, 0.38 + depth * 0.018));
        // Ripples ruled round the shore, every 3 m of depth out to 20 m.
        if (depth < 20 && (depth / 3) % 1 < 0.1) mix(COAST_INK, 0.12);
      } else if (blend(river, gx, gz) > 0.5) {
        mix(RIVER_INK, 0.8);
      } else {
        mix(MEADOW, 0.35);
        if (depth > -1.3) mix(SAND, 0.55);
        const relief = blend(shade, gx, gz);
        mix(SEPIA, Math.min(0.5, Math.max(0, -relief) * 0.8));
        mix(HIGHLIGHT, Math.min(0.6, Math.max(0, relief) * 1.1));
        // Snow caps, left pale on the paper as a mapmaker would.
        if (depth < -120) mix(HIGHLIGHT, Math.min(0.7, (-depth - 120) / 60));
      }
      // The shore as a line a couple of pixels wide, however gently the beach
      // slopes: distance from the waterline is depth over steepness.
      const fromShore = Math.abs(depth) / Math.max(0.004, blend(steepness, gx, gz));
      if (fromShore < METRES_PER_PIXEL * 1.3) mix(COAST_INK, 0.85);
      const at = (py * MAP_PIXELS + px) * 4;
      image.data[at] = colour[0]! * 255;
      image.data[at + 1] = colour[1]! * 255;
      image.data[at + 2] = colour[2]! * 255;
      image.data[at + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
}
