/** A rectangle of ground an object stands on, in world metres. */
export type Footprint = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};

/** Whether a point on the ground lies on this footprint. */
export function insideFootprint(footprint: Footprint, x: number, z: number): boolean {
  return x >= footprint.minX && x <= footprint.maxX && z >= footprint.minZ && z <= footprint.maxZ;
}
