import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Inventory } from "../../items/Inventory";
import type { SunGodRays } from "../../world/SunGodRays";
import { createHoe } from "./createHoe";
import { createLantern, type HeldLantern } from "./createLantern";
import { createSword } from "./createSword";
import { restPlaces, show, swayAt } from "./handPlaces";
import { SwordSwing } from "./SwordSwing";
import { SWORD_REST, swordPose } from "./swordPoses";
import { Waist } from "./Waist";

/** After the world and after the aiming mark, so nothing is ever drawn over your hands. */
const IN_HAND = 2;

/**
 * What the player is carrying, drawn in front of the camera.
 *
 * Everything is parented to the camera itself, so it inherits the smoothing the
 * camera already gets between simulation steps — the rule anything the player
 * watches move at speed has to follow, got for free rather than written twice.
 *
 * Kept off the god rays' occlusion pass, or a hoe a handspan from the lens
 * blots out the sun; and drawn last, over everything, with the depth cleared,
 * so a sword held against a wall stays in your hand instead of in the stone.
 */
export class HeldItems {
  private readonly hoe: Mesh;
  private readonly sword: Mesh;
  private readonly lantern: HeldLantern;
  private readonly waist: Waist;
  private readonly swing = new SwordSwing();
  private seconds = 0;

  /** Where the lantern hangs in the world, for the lamps the shaders are given. */
  readonly lampPlace = new Vector3();

  constructor(
    scene: Scene,
    private readonly camera: Camera,
    godRays: SunGodRays,
  ) {
    this.hoe = createHoe(scene);
    this.sword = createSword(scene);
    this.lantern = createLantern(scene);
    this.waist = new Waist(scene, camera as Camera & { rotation: { x: number; z: number } });
    for (const held of [this.hoe, this.sword, this.lantern.root]) held.parent = camera;
    const lantern = this.lantern.root.getChildMeshes();
    for (const node of [this.hoe, this.sword, ...lantern, ...this.waist.belt]) {
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

  /** Places everything for this step. True on the one step a swung sword bites. */
  update(seconds: number, inventory: Inventory, walkShare: number, attack: boolean): boolean {
    this.seconds += seconds;
    const places = restPlaces(inventory);
    const holdingSword = inventory.mainHand?.id === "sword";
    const struck = this.swing.update(seconds, attack, holdingSword);
    const sway = swayAt(this.seconds, walkShare);
    const swingAt = this.swing.progress;

    show(this.hoe, places.hoe, sway);
    show(
      this.sword,
      holdingSword ? (swingAt === null ? SWORD_REST : swordPose(swingAt)) : null,
      sway,
    );
    // On the belt the lantern hangs from the waist; in the hand, from the camera.
    if (places.lantern) this.lantern.root.parent = places.onBelt ? this.waist.node : this.camera;
    show(this.lantern.root, places.lantern, sway);
    if (places.lantern) {
      this.lantern.root.computeWorldMatrix(true);
      this.lampPlace.copyFrom(this.lantern.root.absolutePosition);
    }
    return struck;
  }
}
