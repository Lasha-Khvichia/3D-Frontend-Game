/** A rectangle of ground an object stands on, in world metres. */
export type Footprint = {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
};
