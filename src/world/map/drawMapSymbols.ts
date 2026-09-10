import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ALL_HOUSES } from "../houses/settlements";
import { TREE_PLACEMENTS } from "../trees/treeLayout";
import { drawMapFurniture } from "./drawMapFurniture";
import { METRES_PER_PIXEL, toMapPixel } from "./mapFrame";

const INK = "rgb(72, 50, 30)";
const ROOF = "rgb(150, 78, 52)";
const CROWN = "rgb(108, 124, 70)";

/**
 * What a mapmaker draws by hand over the land: every house as a little roofed
 * block, every tree as a crown, every bridge as a plank across its river.
 */
export function drawMapSymbols(context: CanvasRenderingContext2D, bridges: readonly Mesh[]): void {
  context.lineWidth = 1.5;
  context.strokeStyle = INK;
  for (const { blueprint, centreX, centreZ } of ALL_HOUSES) {
    const { px, py } = toMapPixel(centreX, centreZ);
    const width = Math.max(5, blueprint.width / METRES_PER_PIXEL);
    const depth = Math.max(5, blueprint.depth / METRES_PER_PIXEL);
    context.fillStyle = ROOF;
    context.fillRect(px - width / 2, py - depth / 2, width, depth);
    context.strokeRect(px - width / 2, py - depth / 2, width, depth);
  }
  for (const spot of TREE_PLACEMENTS) {
    const { px, py } = toMapPixel(spot.x, spot.z);
    context.fillStyle = CROWN;
    context.beginPath();
    if (spot.species === "pine") {
      context.moveTo(px, py - 6);
      context.lineTo(px + 4, py + 4);
      context.lineTo(px - 4, py + 4);
      context.closePath();
    } else {
      context.arc(px, py, 4.5, 0, Math.PI * 2);
    }
    context.fill();
    context.stroke();
  }
  for (const bridge of bridges) {
    const { px, py } = toMapPixel(bridge.position.x, bridge.position.z);
    context.save();
    context.translate(px, py);
    context.rotate(bridge.rotation.y);
    context.fillStyle = INK;
    context.fillRect(-2.5, -7, 5, 14);
    context.restore();
  }
  drawMapFurniture(context);
}
