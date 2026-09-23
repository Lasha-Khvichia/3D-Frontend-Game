import { roadField, ROAD_HALF_WIDTH } from "../roads/roadField";
import { METRES_PER_PIXEL, toMapPixel } from "./mapFrame";

/** Ink for the casing either side of a road, and what fills it. */
const CASING = "rgba(72, 50, 30, 0.45)";
const DIRT = "rgb(158, 120, 80)";
const STONE = "rgb(150, 146, 138)";
/** Half widths past this are the village street rather than a country road. */
const A_STREET = 5;
/** Pixels of casing either side, and the thinnest a road may be drawn. */
const EDGE = 0.9;
const THINNEST = 2.0;

/**
 * The roads, drawn as a mapmaker draws them: a line for each run, cased in
 * ink so it reads against the fields, the village street wider and stone
 * grey. Laid under the houses and trees, which are drawn over the top.
 */
export function drawMapRoads(context: CanvasRenderingContext2D): void {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const pass of ["casing", "fill"] as const) {
    for (const road of roadField.segments) {
      const half = road.halfWidth ?? ROAD_HALF_WIDTH;
      const wide = Math.max(THINNEST, (half * 2) / METRES_PER_PIXEL);
      const from = toMapPixel(road.ax, road.az);
      const to = toMapPixel(road.bx, road.bz);
      context.strokeStyle = pass === "casing" ? CASING : half >= A_STREET ? STONE : DIRT;
      context.lineWidth = pass === "casing" ? wide + EDGE * 2 : wide;
      context.beginPath();
      context.moveTo(from.px, from.py);
      context.lineTo(to.px, to.py);
      context.stroke();
    }
  }
  context.restore();
}
