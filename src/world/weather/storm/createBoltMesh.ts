import type { Material } from "@babylonjs/core/Materials/material";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { createSeededRandom } from "../../houses/seededRandom";
import { FINE_DETAIL_LAYER } from "../../fineDetailLayer";

/** Metres from cloud base to ground, as a real bolt from a storm cloud. */
export const BOLT_HEIGHT = 1500;
const SEGMENTS = 18;
/** Metres a bolt wanders sideways at each kink. */
const KINK = 55;
/** Metres wide: a few pixels at the distance it is drawn, which is how lightning looks. */
const WIDTH = 7;

/**
 * One lightning bolt as a flat ribbon: a jagged line from the cloud base to the
 * ground, with a fork part way down. Built once per shape, unlit; turned to
 * face the camera round the vertical (`billboardMode`), since a bolt is seen
 * edge-on from nowhere.
 */
export function createBoltMesh(scene: Scene, shape: number, material: Material): Mesh {
  const random = createSeededRandom(9100 + shape);
  const positions: number[] = [];
  const indices: number[] = [];
  const addRibbon = (points: readonly [number, number][], width: number): void => {
    for (let i = 0; i + 1 < points.length; i += 1) {
      const [ax, ay] = points[i]!;
      const [bx, by] = points[i + 1]!;
      const length = Math.hypot(bx - ax, by - ay) || 1;
      // Across the segment, in the ribbon's plane.
      const sideX = ((by - ay) / length) * (width / 2);
      const sideY = (-(bx - ax) / length) * (width / 2);
      const first = positions.length / 3;
      positions.push(ax - sideX, ay - sideY, 0, ax + sideX, ay + sideY, 0);
      positions.push(bx - sideX, by - sideY, 0, bx + sideX, by + sideY, 0);
      indices.push(first, first + 1, first + 2, first + 1, first + 3, first + 2);
    }
  };
  const trunk: [number, number][] = [];
  let x = 0;
  for (let i = 0; i <= SEGMENTS; i += 1) {
    trunk.push([x, BOLT_HEIGHT * (1 - i / SEGMENTS)]);
    x += (random() - 0.5) * 2 * KINK;
  }
  addRibbon(trunk, WIDTH);
  // A fork, thinner, leaving the trunk a third of the way down and dying out.
  const from = Math.floor(SEGMENTS / 3 + random() * 3);
  const fork: [number, number][] = [trunk[from]!];
  let forkX = trunk[from]![0];
  for (let i = 1; i <= 6; i += 1) {
    forkX += (random() < 0.5 ? -1 : 1) * KINK * (0.6 + random());
    fork.push([forkX, trunk[from]![1] - (BOLT_HEIGHT / SEGMENTS) * i]);
  }
  addRibbon(fork, WIDTH * 0.5);

  const mesh = new Mesh(`lightning-bolt-${shape}`, scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.applyToMesh(mesh);
  mesh.material = material;
  mesh.billboardMode = Mesh.BILLBOARDMODE_Y;
  mesh.isPickable = false;
  mesh.layerMask = FINE_DETAIL_LAYER;
  mesh.setEnabled(false);
  return mesh;
}
