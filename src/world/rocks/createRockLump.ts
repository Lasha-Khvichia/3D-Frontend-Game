import { CreateIcoSphereVertexData } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder";
import type { Material } from "@babylonjs/core/Materials/material";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { createNoise2D } from "../terrain/noise2d";
import { rockColours } from "./rockColours";
import { weldedNormals } from "./weldedNormals";

/** How far the surface is pushed in and out from its smooth shape. */
const ROUGHNESS = 0.2;
/**
 * How boxy the rock is before the noise goes on. 2 is a sphere, which reads
 * as a ball of dough; around 2.6 it is a box with soft corners — flat-ish
 * faces and no hard edge anywhere, which is what weathered stone looks like.
 */
const BLOCKINESS = 2.6;

const lumpNoise = createNoise2D(1409);

/**
 * A rock that is solid all the way round: a sphere, pushed in and out by noise
 * and stretched to size.
 *
 * The loose stones are domes grown up from the ground, with no underside,
 * which is fine lying on the ground and wrong anywhere else — seen from below,
 * or with a gap under it, a dome is see-through. This is for rock that has to
 * stand free or bridge a gap: a lintel over a cave, a boulder on a boulder.
 *
 * Babylon's own sphere, so its winding is right; smooth-shaded, so it has no
 * edges; and `radii` are along the rock's own x (across), y and z (along its
 * `yaw`), so one lump can be a slab and another a pillar.
 */
export function createRockLump(
  scene: Scene,
  name: string,
  centre: Vector3,
  radii: { x: number; y: number; z: number },
  yaw: number,
  seed: number,
  material: Material,
): Mesh {
  const sphere = CreateIcoSphereVertexData({ radius: 1, subdivisions: 4, flat: false });
  const positions = Array.from(sphere.positions ?? []);
  for (let index = 0; index < positions.length; index += 3) {
    const x = positions[index] ?? 0;
    const y = positions[index + 1] ?? 0;
    const z = positions[index + 2] ?? 0;
    // Broad swells, then smaller ones; nothing fine enough to break into facets.
    const wobble =
      0.62 * lumpNoise(x * 1.5 + seed, z * 1.5 + y * 0.6) +
      0.3 * lumpNoise(y * 2.8 - seed, x * 2.8 + z) +
      0.08 * lumpNoise(z * 5 + seed * 0.5, y * 5);
    // Pulled out from the sphere to a rounded box: the point is moved along its
    // own direction until it lands on the surface |x|^n + |y|^n + |z|^n = 1.
    const box =
      (Math.abs(x) ** BLOCKINESS + Math.abs(y) ** BLOCKINESS + Math.abs(z) ** BLOCKINESS) **
      (1 / BLOCKINESS);
    const reach = (1 + ROUGHNESS * wobble) / box;
    positions[index] = x * reach * radii.x;
    positions[index + 1] = y * reach * radii.y;
    positions[index + 2] = z * reach * radii.z;
  }

  const indices = Array.from(sphere.indices ?? []);
  // Welded, not computed per copy: the sphere repeats vertices along its seams,
  // and normals worked out per copy shade every face flat.
  const normals = weldedNormals(positions, indices);
  // Babylon winds its faces the other way round from the usual rule, so the
  // cross products may all point into the rock. The topmost point of a rock
  // faces up; if its normal says down, every normal is inside out.
  let top = 0;
  for (let vertex = 1; vertex < positions.length / 3; vertex += 1) {
    if ((positions[vertex * 3 + 1] ?? 0) > (positions[top * 3 + 1] ?? 0)) top = vertex;
  }
  if ((normals[top * 3 + 1] ?? 0) < 0)
    for (let index = 0; index < normals.length; index += 1) normals[index] = -(normals[index] ?? 0);

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.normals = normals;
  data.colors = rockColours(normals);
  data.applyToMesh(mesh);
  mesh.material = material;
  mesh.position.copyFrom(centre);
  mesh.rotation.y = yaw;
  mesh.isPickable = false;
  // Only to look at. What the player bumps into is `createRockCollider`.
  mesh.checkCollisions = false;
  mesh.receiveShadows = true;
  mesh.computeWorldMatrix(true);
  mesh.freezeWorldMatrix();
  return mesh;
}
