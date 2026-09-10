import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { rockHeightAt } from "./rockHeight";
import { rockColours } from "./rockColours";
import { smoothNormals } from "./smoothNormals";
import type { RockShape } from "./rockShape";

/**
 * How far the rim is sunk into the ground, and how fast the sinking tapers.
 * Only the outer skirt moves, so the stone above ground keeps its shape and no
 * edge of it stands proud of the grass.
 */
const BURY = 0.35;
const BURY_TAPER = 4;

/** Rings and spokes, from the size of the rock. A boulder needs neither many. */
const spokes = (reach: number): number => Math.min(34, Math.max(10, Math.round(9 + reach)));
const rings = (reach: number): number => Math.min(18, Math.max(4, Math.round(3 + reach * 0.6)));

/**
 * The rock, as one smooth surface with no edge anywhere on it.
 *
 * A ring of spokes around a summit, sampled off the blended lobes, with
 * **normals averaged between neighbouring faces**. That averaging is the whole
 * difference between rock and a stack of blocks: with a normal per face you
 * see every triangle, and the earlier version of this file was a step pyramid
 * for exactly that reason.
 *
 * This mesh is also the collider. Its faces are as steep as they look, and a
 * separate simplified solid would only be a chance for the two to disagree.
 * What stops the player walking up a rock face is the slope limit in
 * `standableGround.ts`, not the shape of a hidden box.
 */
export function createRockMesh(
  shape: RockShape,
  scene: Scene,
  groundAt: (x: number, z: number) => number,
): Mesh {
  const sides = spokes(shape.reach);
  const steps = rings(shape.reach);
  const positions: number[] = [
    shape.x,
    groundAt(shape.x, shape.z) + rockHeightAt(shape, 0, 0),
    shape.z,
  ];
  const indices: number[] = [];

  for (let ring = 1; ring <= steps; ring += 1) {
    const radius = (shape.reach * ring) / steps;
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2;
      const offsetX = Math.sin(angle) * radius;
      const offsetZ = Math.cos(angle) * radius;
      const sink = BURY * (ring / steps) ** BURY_TAPER;
      // Grown up from the ground under each point, not from one height for the
      // whole stone: on a slope a stone set at one height hangs over the
      // downhill side, and the gap under it shows the ground straight through.
      const ground = groundAt(shape.x + offsetX, shape.z + offsetZ);
      const height = ground + rockHeightAt(shape, offsetX, offsetZ) - sink;
      positions.push(shape.x + offsetX, height, shape.z + offsetZ);
    }
  }

  // Wound so each face's cross product points INTO the rock: Babylon's front
  // face. Once flipped "by eye", every stone was drawn inside out, because an
  // inside-out convex shape has the same outline as a solid one. A red ball
  // inside a stone shows through only when the winding is wrong: test that way.
  const vertex = (ring: number, side: number): number => 1 + (ring - 1) * sides + (side % sides);
  for (let side = 0; side < sides; side += 1) {
    indices.push(0, vertex(1, side + 1), vertex(1, side));
  }
  for (let ring = 1; ring < steps; ring += 1) {
    for (let side = 0; side < sides; side += 1) {
      const inner = vertex(ring, side);
      const innerNext = vertex(ring, side + 1);
      const outer = vertex(ring + 1, side);
      const outerNext = vertex(ring + 1, side + 1);
      indices.push(inner, innerNext, outerNext, inner, outerNext, outer);
    }
  }

  const normals = smoothNormals(positions, indices);
  const colours = rockColours(normals);

  const mesh = new Mesh(shape.name, scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.normals = normals;
  data.colors = colours;
  data.applyToMesh(mesh);
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  // Only to look at. What the player bumps into is `createRockCollider`.
  mesh.checkCollisions = false;
  mesh.freezeWorldMatrix();
  return mesh;
}
