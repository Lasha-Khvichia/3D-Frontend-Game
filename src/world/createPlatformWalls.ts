import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { GROUND_SIZE_METRES } from "./createGround";

const WALL_HEIGHT = 8;
const WALL_THICKNESS = 1;

/**
 * Invisible walls around the platform edge, so walking off does not drop you
 * into an endless fall. They are never drawn, only collided with.
 */
export function createPlatformWalls(scene: Scene): Mesh[] {
  const half = GROUND_SIZE_METRES / 2;
  const edges: readonly { x: number; z: number; width: number; depth: number }[] = [
    { x: 0, z: half, width: GROUND_SIZE_METRES, depth: WALL_THICKNESS },
    { x: 0, z: -half, width: GROUND_SIZE_METRES, depth: WALL_THICKNESS },
    { x: half, z: 0, width: WALL_THICKNESS, depth: GROUND_SIZE_METRES },
    { x: -half, z: 0, width: WALL_THICKNESS, depth: GROUND_SIZE_METRES },
  ];

  return edges.map((edge, index) => {
    const wall = CreateBox(
      `platform-wall-${index}`,
      { width: edge.width, height: WALL_HEIGHT, depth: edge.depth },
      scene,
    );
    wall.position.set(edge.x, WALL_HEIGHT / 2, edge.z);
    wall.isVisible = false;
    wall.isPickable = false;
    wall.checkCollisions = true;
    wall.freezeWorldMatrix();
    return wall;
  });
}
