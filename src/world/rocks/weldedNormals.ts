/**
 * Smooth normals for a mesh whose vertices are duplicated along seams.
 *
 * Babylon's sphere repeats a vertex wherever two faces meet at a seam, and a
 * normal worked out per copy is a normal per face — which shades the rock as
 * flat triangles, every edge showing. Here each face's normal is added to
 * every copy of a position, keyed by the position itself, so all copies of a
 * point come out with the same averaged normal and the surface reads smooth.
 */
export function weldedNormals(positions: readonly number[], indices: readonly number[]): number[] {
  const key = (vertex: number): string =>
    `${(positions[vertex * 3] ?? 0).toFixed(4)},${(positions[vertex * 3 + 1] ?? 0).toFixed(4)},${(positions[vertex * 3 + 2] ?? 0).toFixed(4)}`;
  const sums = new Map<string, [number, number, number]>();

  for (let face = 0; face < indices.length; face += 3) {
    const [a, b, c] = [indices[face] ?? 0, indices[face + 1] ?? 0, indices[face + 2] ?? 0];
    const ax = positions[a * 3] ?? 0,
      ay = positions[a * 3 + 1] ?? 0,
      az = positions[a * 3 + 2] ?? 0;
    const ux = (positions[b * 3] ?? 0) - ax,
      uy = (positions[b * 3 + 1] ?? 0) - ay,
      uz = (positions[b * 3 + 2] ?? 0) - az;
    const vx = (positions[c * 3] ?? 0) - ax,
      vy = (positions[c * 3 + 1] ?? 0) - ay,
      vz = (positions[c * 3 + 2] ?? 0) - az;
    const normal: [number, number, number] = [
      uy * vz - uz * vy,
      uz * vx - ux * vz,
      ux * vy - uy * vx,
    ];
    for (const vertex of [a, b, c]) {
      const sum = sums.get(key(vertex)) ?? [0, 0, 0];
      sums.set(key(vertex), [sum[0] + normal[0], sum[1] + normal[1], sum[2] + normal[2]]);
    }
  }

  const normals: number[] = [];
  for (let vertex = 0; vertex < positions.length / 3; vertex += 1) {
    const [x, y, z] = sums.get(key(vertex)) ?? [0, 1, 0];
    const length = Math.hypot(x, y, z) || 1;
    normals.push(x / length, y / length, z / length);
  }
  return normals;
}
