import { PATCH_CELLS } from "./patchSizes";

type PatchArrays = {
  readonly positions: number[];
  readonly normals: number[];
  readonly colours: number[];
  readonly indices: number[];
};

/**
 * Hangs a strip straight down from each edge of a patch, so the slit between
 * two patches at different levels shows the strip rather than the sky.
 *
 * Each strip vertex copies the edge vertex above it — colour and normal too —
 * so what shows through a slit is lit and painted like the ground beside it.
 * Strips face outward only: a slit is only ever looked into from the side the
 * lower patch is on, which is outside the patch whose strip covers it.
 *
 * Babylon's front face is the one whose wound edges cross to point **away**
 * from the viewer, and each edge picks its winding from that rule at run time
 * rather than trusting a hand-worked table.
 */
export function addPatchSkirts(arrays: PatchArrays, depth: number): void {
  const stride = PATCH_CELLS + 1;
  const last = PATCH_CELLS;
  // Each edge in order of increasing column or row, with the way out of the patch.
  const edges: { vertexAt: (along: number) => number; outX: number; outZ: number }[] = [
    { vertexAt: (along) => along, outX: 0, outZ: -1 },
    { vertexAt: (along) => last * stride + along, outX: 0, outZ: 1 },
    { vertexAt: (along) => along * stride, outX: -1, outZ: 0 },
    { vertexAt: (along) => along * stride + last, outX: 1, outZ: 0 },
  ];

  for (const { vertexAt, outX, outZ } of edges) {
    const first = arrays.positions.length / 3;
    for (let along = 0; along <= last; along += 1) copyBelow(arrays, vertexAt(along), depth);

    for (let along = 0; along < last; along += 1) {
      const a = vertexAt(along);
      const b = vertexAt(along + 1);
      const aLow = first + along;
      const bLow = first + along + 1;
      // The cross of (down, along the edge) must point into the patch.
      const edgeX = arrays.positions[b * 3]! - arrays.positions[a * 3]!;
      const edgeZ = arrays.positions[b * 3 + 2]! - arrays.positions[a * 3 + 2]!;
      const pointsOut = -edgeZ * outX + edgeX * outZ > 0;
      if (pointsOut) arrays.indices.push(b, bLow, a, a, bLow, aLow);
      else arrays.indices.push(a, aLow, b, b, aLow, bLow);
    }
  }
}

function copyBelow(arrays: PatchArrays, vertex: number, depth: number): void {
  const { positions, normals, colours } = arrays;
  positions.push(
    positions[vertex * 3]!,
    positions[vertex * 3 + 1]! - depth,
    positions[vertex * 3 + 2]!,
  );
  normals.push(normals[vertex * 3]!, normals[vertex * 3 + 1]!, normals[vertex * 3 + 2]!);
  colours.push(
    colours[vertex * 4]!,
    colours[vertex * 4 + 1]!,
    colours[vertex * 4 + 2]!,
    colours[vertex * 4 + 3]!,
  );
}
