import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { PlacedOpening } from "../houses/placeOpenings";
import { mergeBoxes } from "../houses/mergeBoxes";

const BEAM_HEIGHT = 0.13;
const BEAM_DEPTH = 0.09;
/** How far past each jamb the beam reaches when it is across the door. */
const BEAM_OVERLAP = 0.32;
/** Clearance between the beam and the inside face of the wall. */
const STAND_OFF = 0.055;
/** Height above the floor the beam sits at. */
const BEAM_HEIGHT_ABOVE_FLOOR = 1.05;

/** Higher is faster. The beam is heavy, so it is slower than the door. */
const SLIDE_RATE = 7;

/**
 * The beam that bars a door from inside, and the two brackets it slides in.
 *
 * A drawbar rather than something on a hinge: this is how it was actually done,
 * and sliding is one number to animate with no rotation to get the wrong way
 * round.
 *
 * It waits for the door to shut before sliding across, so it is never seen
 * lying over an open doorway.
 */
export class DoorBar {
  private down = false;
  private slide = 0;
  private readonly beam: Mesh;
  private readonly travel: number;
  readonly meshes: Mesh[];

  constructor(scene: Scene, opening: PlacedOpening, material: Material) {
    const built = buildBar(scene, opening, material);
    this.beam = built.beam;
    this.travel = built.travel;
    this.meshes = built.meshes;
    this.beam.position.x = -this.travel;
  }

  get isDown(): boolean {
    return this.down;
  }

  toggle(): void {
    this.down = !this.down;
  }

  update(seconds: number, doorIsShut: boolean): void {
    const wanted = this.down && doorIsShut ? 1 : 0;
    this.slide += (wanted - this.slide) * Math.min(1, seconds * SLIDE_RATE);
    this.beam.position.x = (this.slide - 1) * this.travel;
  }
}

function buildBar(scene: Scene, opening: PlacedOpening, material: Material) {
  const length = opening.width + BEAM_OVERLAP * 2;
  const travel = length - BEAM_OVERLAP;
  const node = new TransformNode(`${opening.houseName}-bar-node`, scene);
  node.position
    .copyFrom(opening.centre)
    .subtractInPlace(opening.outward.scale(opening.wallThickness / 2 + STAND_OFF))
    .addInPlace(opening.along.scale(-length / 2));
  node.position.y = BEAM_HEIGHT_ABOVE_FLOOR;
  node.rotation.y = Math.atan2(-opening.along.z, opening.along.x);

  const beam = mergeBoxes(scene, `${opening.houseName}-bar`, [
    { x: length / 2, y: 0, z: 0, width: length, height: BEAM_HEIGHT, depth: BEAM_DEPTH },
  ]);
  if (!beam) throw new Error(`${opening.houseName} bar produced no geometry`);
  beam.material = material;
  beam.parent = node;
  beam.isPickable = false;
  // Merged meshes come back frozen, and a frozen matrix ignores the slide.
  beam.unfreezeWorldMatrix();

  const brackets = mergeBoxes(
    scene,
    `${opening.houseName}-bar-brackets`,
    [0.12, length - 0.12].map((along) => ({
      x: along,
      y: 0,
      z: 0,
      width: 0.11,
      height: BEAM_HEIGHT + 0.09,
      depth: BEAM_DEPTH + 0.05,
    })),
  );
  if (brackets) {
    brackets.material = material;
    brackets.parent = node;
    brackets.isPickable = false;
  }

  return { beam, travel, meshes: brackets ? [beam, brackets] : [beam] };
}
