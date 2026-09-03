export type MiniMapDecor = {
  playerYaw: number;
  sunBearing: number;
  moonBearing: number;
  sunUp: boolean;
  moonUp: boolean;
  /** 0 over the shoulder, 1 straight overhead. */
  overheadBlend: number;
  /**
   * sin(camera pitch). A tilted camera foreshortens the ground, so the compass
   * ring has to squash into the same ellipse the ground projects to. 1 when
   * looking straight down, about 0.55 in the chase pose.
   */
  groundSquash: number;
};

const FRAME_COLOUR = "rgba(226, 232, 245, 0.55)";
const PLAYER_COLOUR = "#e8603c";
const LETTER_COLOUR = "rgba(226, 232, 245, 0.85)";
const SUN_COLOUR = "#ffcf5c";
const MOON_COLOUR = "#c9d2ee";
const BELOW_HORIZON_ALPHA = 0.28;

const COMPASS_POINTS: readonly { label: string; bearing: number }[] = [
  { label: "N", bearing: 0 },
  { label: "E", bearing: Math.PI / 2 },
  { label: "S", bearing: Math.PI },
  { label: "W", bearing: -Math.PI / 2 },
];

/**
 * Paints the frame, compass letters and sky markers over the 3D mini-map.
 *
 * The map is player-up, so everything sits at `bearing - playerYaw` measured
 * clockwise from the top of the map.
 */
export function drawMiniMapDecor(canvas: HTMLCanvasElement | null, decor: MiniMapDecor): void {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const size = canvas.width;
  const centre = size / 2;
  context.clearRect(0, 0, size, size);

  drawFrame(context, size);
  drawSkyMarker(
    context,
    centre,
    size,
    decor.sunBearing - decor.playerYaw,
    decor.groundSquash,
    SUN_COLOUR,
    decor.sunUp,
  );
  drawSkyMarker(
    context,
    centre,
    size,
    decor.moonBearing - decor.playerYaw,
    decor.groundSquash,
    MOON_COLOUR,
    decor.moonUp,
  );
  drawCompassLetters(context, centre, size, decor.playerYaw, decor.groundSquash);
  drawPlayerMarker(context, centre, size, decor.overheadBlend);
}

function drawFrame(context: CanvasRenderingContext2D, size: number): void {
  const inset = size * 0.012;
  context.strokeStyle = FRAME_COLOUR;
  context.lineWidth = Math.max(1, size * 0.012);
  context.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
}

function drawCompassLetters(
  context: CanvasRenderingContext2D,
  centre: number,
  size: number,
  playerYaw: number,
  groundSquash: number,
): void {
  const radius = centre - size * 0.085;
  context.font = `600 ${Math.round(size * 0.1)}px ui-monospace, Menlo, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const point of COMPASS_POINTS) {
    const angle = point.bearing - playerYaw;
    context.fillStyle = point.label === "N" ? PLAYER_COLOUR : LETTER_COLOUR;
    context.fillText(
      point.label,
      centre + Math.sin(angle) * radius,
      centre - Math.cos(angle) * radius * groundSquash,
    );
  }
}

function drawSkyMarker(
  context: CanvasRenderingContext2D,
  centre: number,
  size: number,
  angle: number,
  groundSquash: number,
  colour: string,
  aboveHorizon: boolean,
): void {
  const radius = centre - size * 0.185;
  const x = centre + Math.sin(angle) * radius;
  const y = centre - Math.cos(angle) * radius * groundSquash;

  context.save();
  context.globalAlpha = aboveHorizon ? 1 : BELOW_HORIZON_ALPHA;
  context.fillStyle = colour;
  context.beginPath();
  context.arc(x, y, size * 0.035, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * Always points straight up: on a player-up map, you never turn.
 *
 * Fades out as the camera drops behind you, because down there the real bean is
 * on screen and a marker on top of it would just be clutter.
 */
function drawPlayerMarker(
  context: CanvasRenderingContext2D,
  centre: number,
  size: number,
  overheadBlend: number,
): void {
  if (overheadBlend <= 0.01) return;
  const length = size * 0.07;
  context.save();
  context.globalAlpha = overheadBlend;
  context.fillStyle = PLAYER_COLOUR;
  context.beginPath();
  context.moveTo(centre, centre - length);
  context.lineTo(centre + length * 0.62, centre + length * 0.7);
  context.lineTo(centre, centre + length * 0.35);
  context.lineTo(centre - length * 0.62, centre + length * 0.7);
  context.closePath();
  context.fill();
  context.restore();
}
