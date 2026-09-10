/**
 * One normal per vertex, averaged from every face that touches it.
 *
 * Averaging is the whole difference between rock and a heap of blocks: with a
 * normal per face you see every triangle in the surface.
 *
 * Written out rather than taken from `VertexData.ComputeNormals` so the sign
 * is certain: the faces are wound with their cross products pointing into the
 * rock, Babylon's front face, and lighting wants them pointing out.
 */
export function smoothNormals(positions: readonly number[], indices: readonly number[]): number[] {
  const normals = new Array<number>(positions.length).fill(0);
  for (let face = 0; face < indices.length; face += 3) {
    const [a, b, c] = [indices[face]! * 3, indices[face + 1]! * 3, indices[face + 2]! * 3];
    const ux = positions[b]! - positions[a]!;
    const uy = positions[b + 1]! - positions[a + 1]!;
    const uz = positions[b + 2]! - positions[a + 2]!;
    const vx = positions[c]! - positions[a]!;
    const vy = positions[c + 1]! - positions[a + 1]!;
    const vz = positions[c + 2]! - positions[a + 2]!;
    // Negated: the faces are wound with their cross products pointing into the
    // rock, which is how Babylon marks a front face, and lighting wants out.
    const nx = -(uy * vz - uz * vy);
    const ny = -(uz * vx - ux * vz);
    const nz = -(ux * vy - uy * vx);
    for (const corner of [a, b, c]) {
      normals[corner] = (normals[corner] ?? 0) + nx;
      normals[corner + 1] = (normals[corner + 1] ?? 0) + ny;
      normals[corner + 2] = (normals[corner + 2] ?? 0) + nz;
    }
  }
  for (let corner = 0; corner < normals.length; corner += 3) {
    const length = Math.hypot(normals[corner]!, normals[corner + 1]!, normals[corner + 2]!) || 1;
    normals[corner] = (normals[corner] ?? 0) / length;
    normals[corner + 1] = (normals[corner + 1] ?? 0) / length;
    normals[corner + 2] = (normals[corner + 2] ?? 0) / length;
  }
  return normals;
}
