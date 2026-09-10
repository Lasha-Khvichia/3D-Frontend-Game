import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { createRockLump } from "../../rocks/createRockLump";
import type { HeightGrid } from "../HeightGrid";
import type { RiverPoint } from "./traceRiver";
import { springRocks } from "./springRocks";
import { lowestUnder, springDarkSolid, springRockSolid } from "./springSolids";

/** Headroom under the arch, above the water. */
const OPENING_HEIGHT = 3;
/** How far the darkness reaches back into the hill. */
const DARK_DEPTH = 7;

/**
 * The cave a river comes out of: two rock pillars, a rock slab across them,
 * and darkness behind.
 *
 * The ground cannot make this on its own. A height map holds one height per
 * point, and a cave is a roof above a floor — two heights at once — so the arch
 * is separate rock set into the hillside, the way games do it.
 *
 * The darkness is what sells it. It is a plain unlit black block filling the
 * channel behind the arch, so the water runs into it and is simply not seen
 * again; it is also solid, because walking into it would show the inside of
 * a black box.
 */
export function createSpringMouth(
  scene: Scene,
  name: string,
  mouth: RiverPoint,
  water: { surface: number; bed: number; halfWidth: number },
  grid: HeightGrid,
  stone: Material,
  darkness: Material,
): Mesh[] {
  const yaw = Math.atan2(mouth.flowX, mouth.flowZ);
  const acrossX = mouth.flowZ;
  const acrossZ = -mouth.flowX;
  const halfOpening = water.halfWidth + 0.8;
  const top = water.surface + OPENING_HEIGHT;
  const at = (across: number, back: number, y: number): Vector3 =>
    new Vector3(
      mouth.x + acrossX * across - mouth.flowX * back,
      y,
      mouth.z + acrossZ * across - mouth.flowZ * back,
    );

  const meshes: Mesh[] = [];
  springRocks(name, halfOpening, OPENING_HEIGHT).forEach((rock, index) => {
    const spot = at(rock.across, rock.back, 0);
    // The slab across the top is set by the water; everything else by the ground.
    const isSlab = rock.up > OPENING_HEIGHT;
    const ground = isSlab ? null : lowestUnder(grid, at, rock);
    spot.y = ground === null ? water.surface + rock.up : ground + rock.up;
    meshes.push(
      createRockLump(scene, `${name}-rock-${index}`, spot, rock.radii, yaw, rock.seed, stone),
    );
    meshes.push(springRockSolid(scene, `${name}-rock-${index}-solid`, at, rock, spot.y, ground));
  });

  const floor = water.bed - 0.6;
  const dark = CreateBox(
    `${name}-dark`,
    { width: halfOpening * 2 + 0.6, height: top + 0.6 - floor, depth: DARK_DEPTH },
    scene,
  );
  dark.position.copyFrom(at(0, 1.1 + DARK_DEPTH / 2, (floor + top + 0.6) / 2));
  dark.rotation.y = yaw;
  dark.material = darkness;
  dark.isPickable = false;
  // Only to look at: a black block with a material would trap anyone who got
  // inside it. Its solid has no material, so it can only be walked out of.
  dark.checkCollisions = false;
  dark.computeWorldMatrix(true);
  dark.freezeWorldMatrix();
  meshes.push(dark);
  meshes.push(
    springDarkSolid(
      scene,
      `${name}-dark-solid`,
      at,
      halfOpening + 0.3,
      1.1,
      DARK_DEPTH,
      floor,
      top + 0.6,
    ),
  );
  return meshes;
}
