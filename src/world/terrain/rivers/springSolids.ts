import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { createRockCollider } from "../../rocks/createRockCollider";
import type { SpringRock } from "./springRocks";
import type { HeightGrid } from "../HeightGrid";

/** Turns a point in the cave mouth's frame — across the river, back into the hill — into the world. */
export type MouthFrame = (across: number, back: number, y: number) => Vector3;

/** Corners round each rock's collider, and how far in from its rough surface it sits. */
const CORNERS = 12;
const INSET = 0.85;

/**
 * The solid for one rock of a cave mouth: an invisible upright prism a little
 * inside the rock's rough surface, so the player stops at the stone rather than
 * in thin air. Rocks that stand on the ground reach down into it; the slab
 * over the opening does not, or it would close the cave.
 */
export function springRockSolid(
  scene: Scene,
  name: string,
  frame: MouthFrame,
  rock: SpringRock,
  middleY: number,
  standsOn: number | null,
): Mesh {
  const outline: [number, number][] = [];
  for (let corner = 0; corner < CORNERS; corner += 1) {
    const turn = (corner / CORNERS) * Math.PI * 2;
    const point = frame(
      rock.across + Math.cos(turn) * rock.radii.x * INSET,
      rock.back + Math.sin(turn) * rock.radii.z * INSET,
      0,
    );
    outline.push([point.x, point.z]);
  }
  const middle = frame(rock.across, rock.back, 0);
  const bottom = standsOn === null ? middleY - rock.radii.y * 0.75 : standsOn - 0.3;
  return createRockCollider(
    scene,
    name,
    outline,
    [middle.x, middle.z],
    bottom,
    middleY + rock.radii.y * 0.8,
  );
}

/** The solid behind the darkness: the black block is only for looking at. */
export function springDarkSolid(
  scene: Scene,
  name: string,
  frame: MouthFrame,
  halfWidth: number,
  from: number,
  depth: number,
  floor: number,
  top: number,
): Mesh {
  const corners = [
    [-halfWidth, from],
    [halfWidth, from],
    [halfWidth, from + depth],
    [-halfWidth, from + depth],
  ].map(([across, back]) => {
    const point = frame(across ?? 0, back ?? 0, 0);
    return [point.x, point.z] as [number, number];
  });
  const middle = frame(0, from + depth / 2, 0);
  return createRockCollider(scene, name, corners, [middle.x, middle.z], floor, top);
}

/**
 * The lowest ground anywhere under a rock. Each rock stands on this, not on the
 * ground under its middle: on a hillside the middle is higher than the downhill
 * edge, and a rock set by its middle hangs over the slope below it.
 */
export function lowestUnder(grid: HeightGrid, frame: MouthFrame, rock: SpringRock): number {
  let low = Infinity;
  for (const [dx, dz] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const spot = frame(rock.across + dx * rock.radii.x, rock.back + dz * rock.radii.z, 0);
    low = Math.min(low, grid.heightAt(spot.x, spot.z));
  }
  return low;
}
