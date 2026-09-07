import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { addFlatTriangle, type TriangleBuffers } from "./addFlatTriangle";
import type { GableRoofSpec } from "./createGableRoof";

/**
 * Builds the invisible solid the player stands on when they get onto a roof.
 *
 * It is the loft: the two roof planes on top, a flat floor at the top of the
 * walls, and a triangle closing each gable end. Eight triangles. The roof mesh
 * itself cannot do this job — it is a single sheet with nothing behind it, and
 * a sheet is something to fall through rather than something to stand on.
 *
 * **This is the one place in the game with collision on a sloping face**, and
 * it took being wrong twice to land here:
 *
 * - A single sheet is not solid. You fall through it.
 * - A staircase of upright boxes, the trick the tree colliders use, is solid
 *   but unstandable. The player's collision shape is a 0.4 m ellipsoid and the
 *   steps are centimetres, so it never rests on a step's face — it wedges
 *   between two corners and gets squeezed along them. In play that reads as
 *   sinking into the roof and then creeping up it on its own.
 *
 * A smooth slope is what Babylon's solver is built for, and the reason to
 * avoid one does not reach here. The danger of a sloped collider is that it
 * works like a ramp and lifts a player who walks into it. The lowest point of
 * this one is the top of the walls, 2.4 m up on the shortest house in the
 * village — above a 1.11 m jump and above the 2.0 m a climb can reach. There
 * is no way to walk into it.
 *
 * It stops at the walls, so the 0.4 m eave overhang carries no collision: a
 * solid out there would hang below the wall top, and be an invisible thing to
 * hit your head on while walking round the house. Standing on a roof, the
 * floor runs out 0.4 m before the edge you can see.
 */
export function createRoofCollider(name: string, spec: GableRoofSpec, scene: Scene): Mesh {
  const alongRidge = (spec.ridgeAxis === "x" ? spec.width : spec.depth) / 2;
  const toWall = (spec.ridgeAxis === "x" ? spec.depth : spec.width) / 2;

  // Local roof coordinates: `a` runs along the ridge, `b` across it.
  const point = (a: number, b: number, y: number): Vector3 =>
    spec.ridgeAxis === "x"
      ? new Vector3(spec.centreX + a, y, spec.centreZ + b)
      : new Vector3(spec.centreX + b, y, spec.centreZ + a);

  const ridgeLow = point(-alongRidge, 0, spec.ridgeY);
  const ridgeHigh = point(alongRidge, 0, spec.ridgeY);
  const nearLow = point(-alongRidge, -toWall, spec.eaveY);
  const nearHigh = point(alongRidge, -toWall, spec.eaveY);
  const farLow = point(-alongRidge, toWall, spec.eaveY);
  const farHigh = point(alongRidge, toWall, spec.eaveY);

  const buffers: TriangleBuffers = { positions: [], normals: [], indices: [] };
  // Inside the loft, so every face can be wound to point away from it.
  const inside = point(0, 0, spec.eaveY + (spec.ridgeY - spec.eaveY) / 3);
  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3): void => {
    addFlatTriangle(buffers, inside, a, b, c);
    addFlatTriangle(buffers, inside, a, c, d);
  };

  quad(nearLow, nearHigh, ridgeHigh, ridgeLow);
  quad(farLow, ridgeLow, ridgeHigh, farHigh);
  quad(nearLow, ridgeLow, farLow, farHigh);
  addFlatTriangle(buffers, inside, nearLow, farLow, ridgeLow);
  addFlatTriangle(buffers, inside, nearHigh, ridgeHigh, farHigh);

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = buffers.positions;
  data.indices = buffers.indices;
  data.applyToMesh(mesh);
  mesh.isVisible = false;
  mesh.isPickable = false;
  mesh.checkCollisions = true;
  mesh.freezeWorldMatrix();
  return mesh;
}
