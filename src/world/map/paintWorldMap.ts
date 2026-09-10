import type { Terrain } from "../terrain/Terrain";
import { drawMapSymbols } from "./drawMapSymbols";
import { MAP_HALF_EXTENT, MAP_PIXELS } from "./mapFrame";
import { mapLabels, type MapLabel } from "./mapLabels";
import { paintMapGround } from "./paintMapGround";

/** The world map as the UI shows it: the painted picture, and the names to write over it. */
export type WorldMapPicture = {
  readonly canvas: HTMLCanvasElement;
  readonly labels: readonly MapLabel[];
  /** Metres from the island's middle to each edge of the picture. */
  readonly halfExtent: number;
};

let painted: WorldMapPicture | null = null;

/**
 * Paints the world map, once, the first time it is asked for. The island
 * never changes shape, so there is nothing to repaint; and painting four
 * million pixels at startup would slow every load for a map few loads open.
 */
export function paintWorldMap(terrain: Terrain): WorldMapPicture {
  if (painted) return painted;
  const canvas = document.createElement("canvas");
  canvas.width = MAP_PIXELS;
  canvas.height = MAP_PIXELS;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("the browser gave no 2D canvas for the world map");
  paintMapGround(context, terrain);
  drawMapSymbols(context, terrain.rivers.bridges);
  painted = { canvas, labels: mapLabels(), halfExtent: MAP_HALF_EXTENT };
  return painted;
}
