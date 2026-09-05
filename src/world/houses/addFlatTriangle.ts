import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** The three arrays a Babylon VertexData is built from, while still growing. */
export type TriangleBuffers = {
  readonly positions: number[];
  readonly normals: number[];
  readonly indices: number[];
};

/**
 * Adds one flat-shaded triangle facing away from `centre`.
 *
 * Deriving the facing beats getting it right by hand on every face: a triangle
 * wound the wrong way is invisible from the side you want to see it from, and
 * solid from the side you do not, with no error to say why.
 *
 * **Babylon winds its front faces the opposite way to the usual right-handed
 * rule.** Measured against `CreateBox`: on all twelve of its triangles, the
 * cross product of the wound edges points *into* the box, not out of it. So the
 * corners go out in the order whose cross product points inward, while the
 * stored normal, which lighting uses, still points outward.
 *
 * Vertices are not shared between triangles, which is what keeps each face's
 * normal flat instead of averaged with its neighbours.
 */
export function addFlatTriangle(
  buffers: TriangleBuffers,
  centre: Vector3,
  a: Vector3,
  b: Vector3,
  c: Vector3,
): void {
  const normal = Vector3.Cross(b.subtract(a), c.subtract(a)).normalize();
  const pointsOutward = normal.dot(a.subtract(centre)) >= 0;
  // Swapped, because the front face is the one whose cross product points in.
  const ordered = pointsOutward ? [a, c, b] : [a, b, c];
  if (!pointsOutward) normal.scaleInPlace(-1);

  const first = buffers.positions.length / 3;
  for (const corner of ordered) {
    buffers.positions.push(corner.x, corner.y, corner.z);
    buffers.normals.push(normal.x, normal.y, normal.z);
  }
  buffers.indices.push(first, first + 1, first + 2);
}
