import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Scene } from "@babylonjs/core/scene";

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 256;

const SURFACE_COLOUR = "#c9cee2";
const MARIA_CORE = "rgba(58, 65, 90, 0.92)";
const MARIA_EDGE = "rgba(58, 65, 90, 0)";
const CRATER_RIM = "rgba(232, 236, 248, 0.5)";
const CRATER_FLOOR = "rgba(104, 112, 142, 0.55)";

/**
 * The dark patches on the near side of the moon, as fractions of the texture.
 * These are the maria: old lava plains, which is why the moon has a face.
 */
const MARIA: readonly { x: number; y: number; radiusX: number; radiusY: number }[] = [
  { x: 0.34, y: 0.32, radiusX: 0.1, radiusY: 0.16 },
  { x: 0.46, y: 0.28, radiusX: 0.07, radiusY: 0.12 },
  { x: 0.5, y: 0.45, radiusX: 0.08, radiusY: 0.13 },
  { x: 0.62, y: 0.36, radiusX: 0.05, radiusY: 0.09 },
  { x: 0.26, y: 0.52, radiusX: 0.09, radiusY: 0.14 },
  { x: 0.4, y: 0.66, radiusX: 0.06, radiusY: 0.1 },
  { x: 0.78, y: 0.45, radiusX: 0.06, radiusY: 0.1 },
];

const CRATER_COUNT = 34;

/** The moon's surface. The disc carries all its brightness here, not in a colour. */
export function createMoonTexture(scene: Scene): DynamicTexture {
  const texture = new DynamicTexture(
    "moon-texture",
    { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT },
    scene,
    true,
  );
  const context = texture.getContext();

  context.fillStyle = SURFACE_COLOUR;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  for (const [index, mare] of MARIA.entries()) {
    paintMare(context, mare, index + 1);
  }
  paintCraters(context);

  texture.update(true);
  return texture;
}

type Context2d = ReturnType<DynamicTexture["getContext"]>;

/** A mare is drawn as several soft overlapping blots so its edge is ragged. */
function paintMare(
  context: Context2d,
  mare: { x: number; y: number; radiusX: number; radiusY: number },
  seed: number,
): void {
  const random = createRandom(seed * 9176);
  const centreX = mare.x * TEXTURE_WIDTH;
  const centreY = mare.y * TEXTURE_HEIGHT;
  const spreadX = mare.radiusX * TEXTURE_WIDTH;
  const spreadY = mare.radiusY * TEXTURE_HEIGHT;

  for (let blot = 0; blot < 7; blot += 1) {
    const x = centreX + (random() - 0.5) * spreadX;
    const y = centreY + (random() - 0.5) * spreadY;
    const radius = (0.5 + random() * 0.6) * Math.max(spreadX, spreadY) * 0.7;
    const gradient = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    gradient.addColorStop(0, MARIA_CORE);
    gradient.addColorStop(1, MARIA_EDGE);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function paintCraters(context: Context2d): void {
  const random = createRandom(20260903);
  for (let crater = 0; crater < CRATER_COUNT; crater += 1) {
    const x = random() * TEXTURE_WIDTH;
    const y = random() * TEXTURE_HEIGHT;
    const radius = 2 + random() * 11;

    context.fillStyle = CRATER_RIM;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = CRATER_FLOOR;
    context.beginPath();
    context.arc(x + radius * 0.12, y + radius * 0.12, radius * 0.7, 0, Math.PI * 2);
    context.fill();
  }
}

/** Deterministic, so the moon looks the same on every run. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
