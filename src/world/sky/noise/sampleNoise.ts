/**
 * Reads the cloud noise on the CPU exactly as the GPU filters it: linear
 * between texel centres, wrapping at every edge. Four numbers out, one per
 * channel, into `out`.
 */
export function sampleWrapped(
  bytes: Uint8Array,
  size: number,
  dimensions: 2 | 3,
  coords: readonly [number, number, number],
  out: number[],
): number[] {
  const cell = coords.map((value) => value * size - 0.5);
  const base = cell.map(Math.floor);
  const frac = cell.map((value, axis) => value - base[axis]!);
  out.fill(0, 0, 4);
  const corners = dimensions === 3 ? 8 : 4;
  for (let corner = 0; corner < corners; corner += 1) {
    let weight = 1;
    let index = 0;
    for (let axis = dimensions - 1; axis >= 0; axis -= 1) {
      const step = (corner >> axis) & 1;
      weight *= step ? frac[axis]! : 1 - frac[axis]!;
      const wrapped = (((base[axis]! + step) % size) + size) % size;
      index = index * size + wrapped;
    }
    for (let channel = 0; channel < 4; channel += 1) {
      out[channel] = out[channel]! + (bytes[index * 4 + channel]! / 255) * weight;
    }
  }
  return out;
}
