/** Pixels along each side of the map picture. */
export const MAP_PIXELS = 2048;
/** Metres from the island's middle to each edge of the map: the whole coast and a margin of sea. */
export const MAP_HALF_EXTENT = 1400;
export const METRES_PER_PIXEL = (MAP_HALF_EXTENT * 2) / MAP_PIXELS;

/** A world position as a pixel on the map picture: north up, east to the right. */
export function toMapPixel(x: number, z: number): { px: number; py: number } {
  return {
    px: (x + MAP_HALF_EXTENT) / METRES_PER_PIXEL,
    py: (MAP_HALF_EXTENT - z) / METRES_PER_PIXEL,
  };
}
