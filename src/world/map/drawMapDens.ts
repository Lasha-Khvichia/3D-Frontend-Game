import { knownDens } from "../creatures/boarDens";
import { toMapPixel } from "./mapFrame";

const INK = "rgb(72, 50, 30)";
const HIDE = "rgb(92, 58, 34)";
const IVORY = "rgb(236, 226, 200)";

/**
 * Every boar den, as a mapmaker would mark one: a dark round head with two
 * tusks curling up from it, so you know where not to go wandering — or where
 * to go looking.
 */
export function drawMapDens(context: CanvasRenderingContext2D): void {
  for (const den of knownDens()) {
    const { px, py } = toMapPixel(den.x, den.z);
    context.fillStyle = HIDE;
    context.strokeStyle = INK;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(px, py, 7, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.strokeStyle = IVORY;
    context.lineWidth = 2;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(px + side * 3, py + 3);
      context.quadraticCurveTo(px + side * 9, py + 4, px + side * 8, py - 4);
      context.stroke();
    }
  }
}
