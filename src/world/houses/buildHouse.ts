import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Footprint } from "../footprint";
import { buildWallSegments } from "./buildWallSegments";
import { createRoofCollider } from "./collideRoof";
import { createGableRoof } from "./createGableRoof";
import { buildDecorMeshes, decorateHouse } from "./decorateHouse";
import { planHouseWalls, type HouseBlueprint } from "./houseBlueprint";
import { mergeBoxes } from "./mergeBoxes";
import { placeOpenings, type PlacedOpening } from "./placeOpenings";

export type House = {
  /** The numbers it was built from, and where it stands. */
  readonly blueprint: HouseBlueprint;
  readonly centreX: number;
  readonly centreZ: number;
  /** One mesh for all four walls. This is also what the player collides with. */
  readonly walls: Mesh;
  readonly roof: Mesh;
  /** Invisible steps under the roof, so it can be stood on and not fallen through. */
  readonly roofCollider: Mesh;
  /** Stone and timber. Decoration only: no collision, no shadow casting. */
  readonly decor: Mesh[];
  /** Every doorway and window hole, located, ready to hang a leaf in. */
  readonly openings: PlacedOpening[];
  /** The ground the house stands on, so grass can be kept from growing inside. */
  readonly footprint: Footprint;
};

export type HouseMaterials = {
  readonly walls: Material;
  readonly roof: Material;
  readonly stone: Material;
  readonly timber: Material;
};

/** Grass is cleared a little past the walls, so none pokes through their base. */
const GRASS_MARGIN = 0.2;

/**
 * Builds one house: four walls with a doorway and windows cut out, under a
 * pitched roof, dressed in stone and timber. Hollow, so the player can walk in
 * through the door.
 *
 * The walls carry the collision themselves rather than a separate hidden
 * collider. There is nothing to gain from a second copy: the wall geometry is
 * already nothing but thick axis-aligned boxes, which is exactly what a good
 * collider would be. The decoration is the opposite case — a stone standing
 * 4 cm off a wall you already cannot walk through is not worth testing.
 */
export function buildHouse(
  scene: Scene,
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
  materials: HouseMaterials,
): House {
  const planned = planHouseWalls(blueprint, centreX, centreZ);
  const walls = mergeBoxes(scene, `${blueprint.name}-walls`, planned.flatMap(buildWallSegments));
  if (!walls) throw new Error(`${blueprint.name} produced no wall geometry`);
  walls.material = materials.walls;
  walls.receiveShadows = true;
  walls.checkCollisions = true;

  const roofSpec = {
    centreX,
    centreZ,
    width: blueprint.width,
    depth: blueprint.depth,
    eaveY: blueprint.wallHeight,
    ridgeY: blueprint.wallHeight + blueprint.roofRise,
    ridgeAxis: blueprint.ridgeAxis,
  };
  const roof = createGableRoof(`${blueprint.name}-roof`, roofSpec, scene);
  roof.material = materials.roof;
  roof.receiveShadows = true;
  roof.freezeWorldMatrix();

  // The roof mesh itself carries no collision. It is a single sheet, which is
  // something to fall through; the solid loft behind it does the stopping.
  const roofCollider = createRoofCollider(`${blueprint.name}-roof-solid`, roofSpec, scene);

  const decoration = decorateHouse(blueprint, centreX, centreZ, planned);
  const decor = buildDecorMeshes(scene, blueprint.name, decoration, materials);

  return {
    blueprint,
    centreX,
    centreZ,
    walls,
    roof,
    roofCollider,
    decor,
    openings: planned.flatMap((wall) => placeOpenings(wall, blueprint.name)),
    footprint: {
      minX: centreX - blueprint.width / 2 - GRASS_MARGIN,
      maxX: centreX + blueprint.width / 2 + GRASS_MARGIN,
      minZ: centreZ - blueprint.depth / 2 - GRASS_MARGIN,
      maxZ: centreZ + blueprint.depth / 2 + GRASS_MARGIN,
    },
  };
}
