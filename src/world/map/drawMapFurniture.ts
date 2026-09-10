import { MAP_PIXELS, METRES_PER_PIXEL } from "./mapFrame";

const INK = "rgb(72, 50, 30)";

/** Round the edge: a double ruled frame, a compass rose and a scale. */
export function drawMapFurniture(context: CanvasRenderingContext2D): void {
  drawFrame(context);
  drawCompass(context, 190, MAP_PIXELS - 200, 110);
  drawScale(context, MAP_PIXELS - 560, MAP_PIXELS - 120);
}

function drawFrame(context: CanvasRenderingContext2D): void {
  context.strokeStyle = INK;
  context.lineWidth = 6;
  context.strokeRect(22, 22, MAP_PIXELS - 44, MAP_PIXELS - 44);
  context.lineWidth = 2;
  context.strokeRect(36, 36, MAP_PIXELS - 72, MAP_PIXELS - 72);
}

/** An eight-pointed star, north picked out dark and lettered. */
function drawCompass(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  for (let point = 0; point < 8; point += 1) {
    const angle = (point / 8) * Math.PI * 2;
    const reach = point % 2 === 0 ? radius : radius * 0.55;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.sin(angle) * reach, y - Math.cos(angle) * reach);
      context.lineTo(
        x + Math.sin(angle + side * 0.25) * radius * 0.22,
        y - Math.cos(angle + side * 0.25) * radius * 0.22,
      );
      context.closePath();
      context.fillStyle =
        point === 0 && side === 1 ? "rgb(140, 40, 30)" : side === 1 ? INK : "rgb(214, 196, 158)";
      context.fill();
      context.lineWidth = 1.2;
      context.stroke();
    }
  }
  context.fillStyle = INK;
  context.font = "bold 44px Georgia, 'Palatino Linotype', serif";
  context.textAlign = "center";
  context.fillText("N", x, y - radius - 16);
}

/** Half a kilometre, ruled in alternating ink and paper. */
function drawScale(context: CanvasRenderingContext2D, x: number, y: number): void {
  const length = 500 / METRES_PER_PIXEL;
  for (let part = 0; part < 4; part += 1) {
    context.fillStyle = part % 2 === 0 ? INK : "rgb(236, 222, 190)";
    context.fillRect(x + (part * length) / 4, y, length / 4, 12);
  }
  context.strokeStyle = INK;
  context.lineWidth = 2;
  context.strokeRect(x, y, length, 12);
  context.fillStyle = INK;
  context.font = "28px Georgia, 'Palatino Linotype', serif";
  context.textAlign = "center";
  context.fillText("0", x, y - 12);
  context.fillText("500 m", x + length, y - 12);
}
