import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "../HeightGrid";
import { carveRiver } from "./carveRiver";
import { createRiverWater } from "./createRiverWater";
import { createSpringMouth } from "./createSpringMouth";
import { RIVER_COURSES } from "./riverCourses";
import { createRiverMaterials } from "./riverMaterials";
import { riverProfile } from "./riverProfile";
import { placeBridges } from "./placeBridges";
import { raiseSpringHill, reachIntoHill } from "./springHill";
import { traceRiver } from "./traceRiver";
import { WaterLevels } from "./WaterLevels";

/**
 * Every river on the island: the hills they rise from, the channels cut into
 * the ground, the water in them, and the bridges over them.
 *
 * The order matters. Hills go up first, then channels are cut, then meshes
 * are built — a hill raised after a channel was cut would bury it, and a
 * channel cut after the terrain mesh was built would be water floating over
 * unbroken meadow.
 */
export class Rivers {
  readonly water: WaterLevels;
  readonly waterMeshes: Mesh[] = [];
  readonly bridges: Mesh[] = [];
  /** The rock arches the rivers come out of, and the darkness behind them. */
  readonly springs: Mesh[] = [];

  constructor(scene: Scene, grid: HeightGrid) {
    this.water = new WaterLevels(grid.size);
    const courses = RIVER_COURSES.map((course, index) => ({
      course,
      ...reachIntoHill(traceRiver(course, index * 13.7)),
    }));
    for (const { points, mouth } of courses) raiseSpringHill(grid, points[mouth]!);
    const traced = courses.map(({ course, points, mouth }) => {
      const profile = riverProfile(grid, course, points, mouth);
      carveRiver(grid, points, profile, this.water);
      return { course, river: points, profile };
    });

    const materials = createRiverMaterials(scene);
    for (const { course, river, profile } of traced) {
      const water = createRiverWater(
        scene,
        `${course.name}-water`,
        river,
        profile,
        grid,
        materials.water,
      );
      if (water) this.waterMeshes.push(water);

      const mouth = profile.mouth;
      const level = profile.surface[mouth] ?? 0;
      const opening = {
        surface: level,
        bed: level - (profile.depth[mouth] ?? 0),
        halfWidth: profile.halfWidth[mouth] ?? 0,
      };
      this.springs.push(
        ...createSpringMouth(
          scene,
          `${course.name}-spring`,
          river[mouth]!,
          opening,
          grid,
          materials.rock,
          materials.darkness,
        ),
      );

      this.bridges.push(...placeBridges(scene, course, river, profile, grid, materials.timber));
    }
  }

  /** River surface at a point, or minus infinity away from any river. */
  surfaceAt(x: number, z: number): number {
    return this.water.surfaceAt(x, z);
  }

  dispose(): void {
    for (const mesh of [...this.waterMeshes, ...this.bridges, ...this.springs]) mesh.dispose();
  }
}
