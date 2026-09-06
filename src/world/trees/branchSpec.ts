import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** One length of wood. A limb is several of these end to end. */
export type BranchSpec = {
  readonly start: Vector3;
  readonly end: Vector3;
  /** Radius at the start. The mesh tapers to a fixed fraction of it. */
  readonly radius: number;
  /** 0 for the trunk, 1 for its children, and so on. */
  readonly depth: number;
  /** The segment this grew out of, or -1 for the foot of the trunk. */
  readonly parent: number;
  /** 0 at the ground, 1 at the highest point. Drives trunk bend in the wind. */
  heightShare: number;
  /** 0 on the trunk, 1 on the outermost twigs. Drives branch sway. */
  readonly tipShare: number;
};

/**
 * How much thinner a segment is at its tip than at its base.
 *
 * Shared between the growing and the mesh, and they must agree exactly. The
 * mesh tapers by this much, so the next segment along has to *start* at this
 * much of its predecessor or there is a visible collar at every joint.
 */
export const SEGMENT_TAPER = 0.88;

/** Where a limb starts and which way it sets off. */
export type Growth = { from: Vector3; direction: Vector3 };

/** How big a limb is and where it hangs from. */
export type Limb = { length: number; radius: number; depth: number; parent: number };
