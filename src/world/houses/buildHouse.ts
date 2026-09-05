import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import type { Footprint } from "../footprint";
import { buildWallSegments, type BoxSpec } from "./buildWallSegments";
import { createGableRoof } from "./createGableRoof";
import { planHouseWalls, type HouseBlueprint } from "./houseBlueprint";

export type House = {
  /** One mesh for all four walls. This is also what the player collides with. */
  readonly walls: Mesh;
  readonly roof: Mesh;
  /** The ground the house stands on, so grass can be kept from growing inside. */
  readonly footprint: Footprint;
};

export type HouseMaterials = {
  readonly walls: Material;
  readonly roof: Material;
};

/** Grass is cleared a little past the walls, so none pokes through their base. */
const GRASS_MARGIN = 0.2;

/**
 * Builds one house: four walls with a doorway and windows cut out, under a
 * pitched roof. Hollow, so the player can walk in through the door.
 *
 * The wall pieces are merged into a single mesh. Twenty-odd boxes per house
 * would otherwise be twenty-odd draw calls each, and ten houses would cost more
 * draw calls than the rest of the world put together. Merging is safe here
 * because every piece shares one material.
 *
 * The merged mesh keeps the collision, rather than a separate hidden collider.
 * There is nothing to gain from a second copy: the visible geometry is already
 * nothing but thick axis-aligned boxes, which is exactly what a good collider
 * would be.
 */
export function buildHouse(
  scene: Scene,
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
  materials: HouseMaterials,
): House {
  const pieces = planHouseWalls(blueprint, centreX, centreZ)
    .flatMap(buildWallSegments)
    .map((box, index) => createPiece(scene, `${blueprint.name}-wall-${index}`, box));

  const walls = Mesh.MergeMeshes(pieces, true, true);
  if (!walls) throw new Error(`${blueprint.name} produced no wall geometry`);
  walls.name = `${blueprint.name}-walls`;
  walls.material = materials.walls;
  walls.receiveShadows = true;
  walls.checkCollisions = true;
  walls.isPickable = false;
  walls.freezeWorldMatrix();

  const roof = createGableRoof(
    `${blueprint.name}-roof`,
    {
      centreX,
      centreZ,
      width: blueprint.width,
      depth: blueprint.depth,
      eaveY: blueprint.wallHeight,
      ridgeY: blueprint.wallHeight + blueprint.roofRise,
      ridgeAxis: blueprint.ridgeAxis,
    },
    scene,
  );
  roof.material = materials.roof;
  roof.receiveShadows = true;
  roof.freezeWorldMatrix();

  return {
    walls,
    roof,
    footprint: {
      minX: centreX - blueprint.width / 2 - GRASS_MARGIN,
      maxX: centreX + blueprint.width / 2 + GRASS_MARGIN,
      minZ: centreZ - blueprint.depth / 2 - GRASS_MARGIN,
      maxZ: centreZ + blueprint.depth / 2 + GRASS_MARGIN,
    },
  };
}

function createPiece(scene: Scene, name: string, box: BoxSpec): Mesh {
  const piece = CreateBox(name, { width: box.width, height: box.height, depth: box.depth }, scene);
  piece.position.set(box.x, box.y, box.z);
  return piece;
}
