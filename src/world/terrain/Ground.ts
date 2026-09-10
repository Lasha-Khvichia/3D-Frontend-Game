/**
 * What anything standing on the world needs to know about the ground under it.
 *
 * The player depends on this and not on the terrain itself, so the rules for
 * walking — slopes, wading, the edge of the world — can be exercised against
 * a hand-made surface without growing an island first.
 */
export type Ground = {
  /** Height of the drawn surface. */
  heightAt(x: number, z: number): number;
  /** Rise per metre along x and along z. */
  slopeAt(x: number, z: number, out: { x: number; z: number }): void;
  /** Height of whatever water is here — the sea, or a river running downhill. */
  waterSurfaceAt(x: number, z: number): number;
  /** How deep the water is standing here, or 0 on dry land. */
  waterDepthAt(x: number, z: number): number;
  /** Metres inside the coast; negative out at sea. */
  inlandAt(x: number, z: number): number;
};
