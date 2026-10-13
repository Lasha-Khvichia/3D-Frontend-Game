import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Inventory } from "../../items/Inventory";
import type { SunGodRays } from "../../world/SunGodRays";
import { createHoe } from "./createHoe";
import { createLantern, type HeldLantern } from "./createLantern";
import { restPlaces, swayAt } from "./handPlaces";

/** After the world and after the aiming mark, so nothing is ever drawn over your hands. */
const IN_HAND = 2;

/**
 * What the player is carrying, drawn in front of the camera.
 *
 * Both are parented to the camera itself, so they inherit the smoothing it
 * already gets between simulation steps — the rule anything the player watches
 * move at speed has to follow, got for free rather than written twice.
 *
 * They are kept off the god rays' occlusion pass. A hoe a handspan from the
 * lens would otherwise blot out the sun. And they are drawn last, over
 * everything, with the depth cleared: a hoe held against a wall stays in your
 * hand instead of disappearing into the stone.
 */
export class HeldItems {
  private readonly hoe: Mesh;
  private readonly lantern: HeldLantern;
  private seconds = 0;

  /** Where the lantern hangs in the world, for the lamps the shaders are given. */
  readonly lampPlace = new Vector3();

  constructor(scene: Scene, camera: Camera, godRays: SunGodRays) {
    this.hoe = createHoe(scene);
    this.lantern = createLantern(scene);
    this.hoe.parent = camera;
    this.lantern.root.parent = camera;
    for (const node of [this.hoe, ...this.lantern.root.getChildMeshes()]) {
      node.isPickable = false;
      node.checkCollisions = false;
      node.receiveShadows = false;
      node.renderingGroupId = IN_HAND;
      godRays.excludeFromOcclusion(node);
    }
  }

  /** The flame's own material, for whoever decides how brightly it burns. */
  get flame(): StandardMaterial {
    return this.lantern.flame;
  }

  /** True while a lantern is out of the bag, in hand or on the belt. */
  get lanternShowing(): boolean {
    return this.lantern.root.isEnabled();
  }

  update(seconds: number, inventory: Inventory, walkShare: number): void {
    this.seconds += seconds;
    const places = restPlaces(inventory);
    this.hoe.setEnabled(places.hoe !== null);
    this.lantern.root.setEnabled(places.lantern !== null);

    const sway = swayAt(this.seconds, walkShare);
    if (places.hoe) {
      this.hoe.position.copyFrom(places.hoe.at).addInPlace(sway);
      this.hoe.rotation.copyFrom(places.hoe.turn);
      this.hoe.scaling.setAll(places.hoe.scale);
    }
    if (places.lantern) {
      this.lantern.root.position.copyFrom(places.lantern.at).addInPlace(sway);
      this.lantern.root.rotation.copyFrom(places.lantern.turn);
      this.lantern.root.scaling.setAll(places.lantern.scale);
      this.lantern.root.computeWorldMatrix(true);
      this.lampPlace.copyFrom(this.lantern.root.absolutePosition);
    }
  }
}
