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
import { Waist } from "./Waist";

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
  private readonly waist: Waist;
  private seconds = 0;

  /** Where the lantern hangs in the world, for the lamps the shaders are given. */
  readonly lampPlace = new Vector3();

  constructor(
    scene: Scene,
    private readonly camera: Camera,
    godRays: SunGodRays,
  ) {
    this.hoe = createHoe(scene);
    this.lantern = createLantern(scene);
    this.waist = new Waist(scene, camera as Camera & { rotation: { x: number; z: number } });
    this.hoe.parent = camera;
    this.lantern.root.parent = camera;
    for (const node of [this.hoe, ...this.lantern.root.getChildMeshes(), ...this.waist.belt]) {
      node.isPickable = false;
      node.checkCollisions = false;
      node.receiveShadows = false;
      node.renderingGroupId = IN_HAND;
      godRays.excludeFromOcclusion(node);
    }
  }

  /** Once per drawn frame, after the camera has been turned: keeps the waist level. */
  present(): void {
    this.waist.present();
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
      // On the belt it hangs from the waist; in the hand, from the camera.
      this.lantern.root.parent = places.onBelt ? this.waist.node : this.camera;
      this.lantern.root.position.copyFrom(places.lantern.at).addInPlace(sway);
      this.lantern.root.rotation.copyFrom(places.lantern.turn);
      this.lantern.root.scaling.setAll(places.lantern.scale);
      this.lantern.root.computeWorldMatrix(true);
      this.lampPlace.copyFrom(this.lantern.root.absolutePosition);
    }
  }
}
