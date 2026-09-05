import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { addFlatTriangle, type TriangleBuffers } from "./addFlatTriangle";

export type GableRoofSpec = {
  readonly centreX: number;
  readonly centreZ: number;
  readonly width: number;
  readonly depth: number;
  /** Height of the eaves, where the roof meets the top of the walls. */
  readonly eaveY: number;
  /** Height of the ridge, the line along the very top. */
  readonly ridgeY: number;
  /** The ridge runs along this axis. */
  readonly ridgeAxis: "x" | "z";
};

/** How far the roof hangs past the wall on the two sloping sides. */
const EAVE_OVERHANG = 0.4;
/**
 * How far it hangs past the two gable ends. Small, but it must not be zero:
 * at zero the gable triangle is exactly coplanar with the wall below it, and
 * two surfaces in the same plane flicker against each other as the camera moves.
 */
const GABLE_OVERHANG = 0.06;

/**
 * A pitched roof: two sloping faces meeting at a ridge, closed at each end by
 * a triangular gable.
 *
 * Built as raw geometry rather than from boxes because a box cannot be a
 * triangle, and the gable ends are what stop the house looking like a shed.
 * It carries no collision at all. A sloped face is the one shape Babylon's
 * collision solver handles badly: it slides the player along whatever is hit,
 * so a roof lifts you up it instead of stopping you.
 */
export function createGableRoof(name: string, spec: GableRoofSpec, scene: Scene): Mesh {
  const alongRidge = (spec.ridgeAxis === "x" ? spec.width : spec.depth) / 2 + GABLE_OVERHANG;
  const toWall = (spec.ridgeAxis === "x" ? spec.depth : spec.width) / 2;
  const acrossRidge = toWall + EAVE_OVERHANG;

  // The slope is fixed by the wall, then continued outwards past it. Starting
  // the overhang level with the wall top instead would tilt the whole roof up
  // off the walls, leaving a slot along both eaves that you can see sky
  // through from inside the house.
  const fallPerMetre = (spec.ridgeY - spec.eaveY) / toWall;
  const eaveEdgeY = spec.eaveY - EAVE_OVERHANG * fallPerMetre;

  // Local coordinates: `a` runs along the ridge, `b` across it.
  const point = (a: number, b: number, y: number): Vector3 =>
    spec.ridgeAxis === "x"
      ? new Vector3(spec.centreX + a, y, spec.centreZ + b)
      : new Vector3(spec.centreX + b, y, spec.centreZ + a);

  const eaveLow = point(-alongRidge, -acrossRidge, eaveEdgeY);
  const eaveHigh = point(alongRidge, -acrossRidge, eaveEdgeY);
  const eaveLowFar = point(-alongRidge, acrossRidge, eaveEdgeY);
  const eaveHighFar = point(alongRidge, acrossRidge, eaveEdgeY);
  const ridgeLow = point(-alongRidge, 0, spec.ridgeY);
  const ridgeHigh = point(alongRidge, 0, spec.ridgeY);

  const buffers: TriangleBuffers = { positions: [], normals: [], indices: [] };
  const centre = new Vector3(spec.centreX, (spec.eaveY + spec.ridgeY) / 2, spec.centreZ);
  const add = (a: Vector3, b: Vector3, c: Vector3): void =>
    addFlatTriangle(buffers, centre, a, b, c);

  add(eaveLow, eaveHigh, ridgeHigh);
  add(eaveLow, ridgeHigh, ridgeLow);
  add(eaveLowFar, ridgeLow, ridgeHigh);
  add(eaveLowFar, ridgeHigh, eaveHighFar);
  add(eaveLow, ridgeLow, eaveLowFar);
  add(eaveHigh, eaveHighFar, ridgeHigh);

  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = buffers.positions;
  data.normals = buffers.normals;
  data.indices = buffers.indices;
  data.applyToMesh(mesh);
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  return mesh;
}
