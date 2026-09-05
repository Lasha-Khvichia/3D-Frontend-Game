import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/** The three arrays a Babylon VertexData is built from, while still growing. */
export type TriangleBuffers = {
  readonly positions: number[];
  readonly normals: number[];
  readonly indices: number[];
};

/**
 * Adds one flat-shaded triangle, wound so its normal points away from `centre`.
 *
 * Deriving the winding beats getting it right by hand on every face: a triangle
 * wound the wrong way is simply invisible from outside, with no error and no
 * warning to say why. Vertices are not shared between triangles, which is what
 * keeps each face's normal flat instead of averaged with its neighbours.
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
  const ordered = pointsOutward ? [a, b, c] : [a, c, b];
  if (!pointsOutward) normal.scaleInPlace(-1);

  const first = buffers.positions.length / 3;
  for (const corner of ordered) {
    buffers.positions.push(corner.x, corner.y, corner.z);
    buffers.normals.push(normal.x, normal.y, normal.z);
  }
  buffers.indices.push(first, first + 1, first + 2);
}
