import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";

/** Furrows across one square, and how deep a trough sits below a crest. */
const FURROWS = 4;
const TROUGH = 0.34;

/**
 * One square of broken ground: a unit tile, ridged into furrows along z, with
 * a skirt hanging from every edge.
 *
 * One unit across and one tall, so a thin instance sizes it as it likes. The
 * skirt is what lets a flat tile sit on ground that is not flat: on the slopes
 * tilling is allowed at all, a corner of the square can be seven centimetres
 * off the middle, and without a skirt the daylight shows under it. Stones are
 * bedded into the ground the same way.
 */
export function createSoilTile(scene: Scene): Mesh {
  const mesh = new Mesh("soil", scene);
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Babylon winds a front face the opposite way to the usual rule: on its own
  // box every triangle's wound normal points inward. Checked against one.
  const face = (a: number, b: number, c: number, d: number): void => {
    indices.push(a, b, c, a, c, d);
  };

  const ridgeY = (step: number): number => (step % 2 === 0 ? 0.5 : 0.5 - TROUGH * (1 / FURROWS));

  // The ridged top, as a strip of quads across x running the length of z.
  const steps = FURROWS * 2;
  for (let step = 0; step <= steps; step += 1) {
    const x = -0.5 + step / steps;
    const y = ridgeY(step);
    positions.push(x, y, -0.5, x, y, 0.5);
    normals.push(0, 1, 0, 0, 1, 0);
  }
  for (let step = 0; step < steps; step += 1) {
    const near = step * 2;
    face(near, near + 2, near + 3, near + 1);
  }

  // A skirt down from each edge, so no gap shows where the ground falls away.
  const skirt = (
    corners: readonly (readonly [number, number, number])[],
    nx: number,
    nz: number,
  ): void => {
    const base = positions.length / 3;
    for (const [x, y, z] of corners) {
      positions.push(x, y, z, x, -0.5, z);
      normals.push(nx, 0, nz, nx, 0, nz);
    }
    for (let corner = 0; corner + 1 < corners.length; corner += 1) {
      const at = base + corner * 2;
      face(at, at + 2, at + 3, at + 1);
    }
  };

  const front: [number, number, number][] = [];
  const back: [number, number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const x = -0.5 + step / steps;
    front.push([x, ridgeY(step), 0.5]);
    back.unshift([x, ridgeY(step), -0.5]);
  }
  skirt(front, 0, 1);
  skirt(back, 0, -1);
  skirt(
    [
      [0.5, ridgeY(steps), 0.5],
      [0.5, ridgeY(steps), -0.5],
    ],
    1,
    0,
  );
  skirt(
    [
      [-0.5, ridgeY(0), -0.5],
      [-0.5, ridgeY(0), 0.5],
    ],
    -1,
    0,
  );

  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.indices = indices;
  data.applyToMesh(mesh);
  return mesh;
}
