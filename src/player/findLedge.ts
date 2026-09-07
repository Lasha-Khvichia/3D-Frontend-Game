// Registers Scene.pickWithRay. Without it the method is a stub that throws:
// Babylon 9 keeps ray support in a side-effect module of its own.
import "@babylonjs/core/Culling/ray";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { PLAYER_HEIGHT, PLAYER_RADIUS } from "./createPlayerBean";

/** How far past the player's own shoulders a wall counts as within reach. */
const REACH = 0.55;
/** The grabbable band, measured from the feet: knee to 20 cm over the head. */
const MIN_RISE = 0.5;
const MAX_RISE = PLAYER_HEIGHT + 0.2;
/**
 * How high above the feet to look for the wall's face.
 *
 * Below the lowest grabbable ledge on purpose. Cast from the chest, the ray
 * sails clean over a knee-high wall and finds nothing to climb.
 */
const FACE_HEIGHT = 0.3;
/** How far past the wall face to look down for its top. */
const TOP_PROBE = 0.25;
/** How far past the face to look for somewhere to put your feet. */
const LANDING_PROBE = 1.1;
/** A top within this of the ledge is a platform; anything lower is a thin wall. */
const PLATFORM_DROP = 0.35;
/** To stand on a ledge the player needs room to stand. */
const HEADROOM = PLAYER_HEIGHT + 0.05;
/**
 * To go *over* something you only need room to pass, not to stand.
 *
 * This is what makes a window climbable. The wall under a window is a thin wall
 * with a gap above it, which is exactly the case the move is for; demanding
 * standing room there would refuse every window in the village.
 */
const VAULT_CLEARANCE = 0.9;
/** No landing found within this far below the ledge means nowhere to go. */
const MAX_DROP = 6;

export type Ledge = {
  /** Where the player's middle ends up when the climb finishes. */
  readonly landing: Vector3;
  /** Height of the ledge's top edge, in world coordinates. */
  readonly topY: number;
  /** True when the top is broad enough to stand on rather than cross. */
  readonly isPlatform: boolean;
};

/**
 * Looks for a ledge the player could climb, straight ahead.
 *
 * Four rays, each carrying a predicate: **anything the player already collides
 * with**. That is not optional. Everything solid here is invisible, unpickable
 * or both, and Babylon's default filter wants a mesh to be enabled, visible and
 * pickable — of the eleven solid meshes in the game only the ground is all three.
 */
export function findLedge(scene: Scene, bean: AbstractMesh, yaw: number): Ledge | null {
  const solid = (mesh: AbstractMesh): boolean => mesh.checkCollisions && mesh !== bean;
  const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const down = new Vector3(0, -1, 0);
  const middle = bean.position;
  const feet = middle.y - PLAYER_HEIGHT / 2;

  // Probed low: cast from the chest, the ray sails over a knee-high wall.
  const from = new Vector3(middle.x, feet + FACE_HEIGHT, middle.z);
  const face = scene.pickWithRay(new Ray(from, forward, PLAYER_RADIUS + REACH), solid);
  if (!face?.hit || face.distance === undefined) return null;

  const overTheEdge = (past: number): Vector3 => from.add(forward.scale(face.distance + past));

  const topFrom = overTheEdge(TOP_PROBE);
  topFrom.y = feet + MAX_RISE + 0.05;
  const top = scene.pickWithRay(new Ray(topFrom, down, MAX_RISE - MIN_RISE + 0.1), solid);
  if (!top?.hit || !top.pickedPoint) return null;

  const topY = top.pickedPoint.y;
  const rise = topY - feet;
  if (rise < MIN_RISE || rise > MAX_RISE) return null;

  // How much room there is over the ledge. How much is needed depends on
  // whether the player is going to stand there, which is not known yet.
  const above = new Vector3(top.pickedPoint.x, topY + 0.05, top.pickedPoint.z);
  const ceiling = scene.pickWithRay(new Ray(above, new Vector3(0, 1, 0), HEADROOM), solid);
  const clearance = ceiling?.hit ? (ceiling.distance ?? 0) : HEADROOM;

  const landFrom = overTheEdge(LANDING_PROBE);
  landFrom.y = topY + 0.2;
  const landing = scene.pickWithRay(new Ray(landFrom, down, MAX_DROP), solid);
  if (!landing?.hit || !landing.pickedPoint) return null;

  const isPlatform = topY - landing.pickedPoint.y < PLATFORM_DROP;
  if (clearance < (isPlatform ? HEADROOM : VAULT_CLEARANCE)) return null;

  return {
    landing: new Vector3(landFrom.x, landing.pickedPoint.y + PLAYER_HEIGHT / 2, landFrom.z),
    topY,
    isPlatform,
  };
}
