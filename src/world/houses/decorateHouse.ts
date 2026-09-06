import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";
import { buildWallSegments, type BoxSpec } from "./buildWallSegments";
import { mergeBoxes } from "./mergeBoxes";
import { frameWallTimber } from "./frameWallTimber";
import type { HouseBlueprint, PlannedWall } from "./houseBlueprint";
import { scatterWallStones } from "./scatterWallStones";
import { createSeededRandom, seedFromText } from "./seededRandom";
import { stackCornerQuoins } from "./stackCornerQuoins";

/** Everything hung on a house's walls, split by what it is made of. */
export type HouseDecor = {
  readonly stone: BoxSpec[];
  readonly timber: BoxSpec[];
};

/**
 * Phase 1: dresses a bare shell in stone and timber.
 *
 * None of this collides or casts a shadow. Every piece is a few centimetres
 * proud of a wall that already does both, so paying twice would buy nothing
 * you could see.
 *
 * Stone and timber run on separate random streams, seeded from the house's
 * name. Two streams rather than one so that changing how stone is scattered
 * does not also reshuffle every beam in the village.
 */
export function decorateHouse(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
  walls: readonly PlannedWall[],
): HouseDecor {
  const stoneRandom = createSeededRandom(seedFromText(`${blueprint.name}-stone`));
  const timberRandom = createSeededRandom(seedFromText(`${blueprint.name}-timber`));

  const stone: BoxSpec[] = [];
  const timber: BoxSpec[] = [];
  for (const wall of walls) {
    const segments = buildWallSegments(wall);
    stone.push(...scatterWallStones(wall, wall.side, segments, stoneRandom));
    timber.push(...frameWallTimber(wall, wall.side, segments, timberRandom));
  }
  stone.push(...stackCornerQuoins(blueprint, centreX, centreZ, stoneRandom));

  return { stone, timber };
}

/**
 * Welds the decoration into one mesh per material and puts it on the layer that
 * close-up detail belongs to.
 */
export function buildDecorMeshes(
  scene: Scene,
  houseName: string,
  decor: HouseDecor,
  materials: { readonly stone: Material; readonly timber: Material },
): Mesh[] {
  const meshes: Mesh[] = [];
  for (const [boxes, material] of [
    [decor.stone, materials.stone],
    [decor.timber, materials.timber],
  ] as const) {
    const mesh = mergeBoxes(scene, `${houseName}-${material.name}`, boxes);
    if (!mesh) continue;
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.layerMask = FINE_DETAIL_LAYER;
    meshes.push(mesh);
  }
  return meshes;
}
