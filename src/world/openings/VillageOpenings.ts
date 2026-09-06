import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { House } from "../houses/buildHouse";
import { Door } from "./Door";
import { hangDoor, hangShutters } from "./hangOpenings";
import { ShutteredWindow } from "./ShutteredWindow";

export type OpeningKeys = {
  /** The key that opens shutters. */
  readonly open: boolean;
  /** The key that bars a door or bolts a window. */
  readonly lock: boolean;
};

/**
 * Every door and shutter in the village, and the one place they are worked.
 *
 * Doors need no key at all: walking into one opens it. The keys are only for
 * the things a body cannot do, which is barring a door and bolting a window.
 */
export class VillageOpenings {
  readonly doors: Door[] = [];
  readonly windows: ShutteredWindow[] = [];

  constructor(scene: Scene, houses: readonly House[]) {
    const materials = {
      door: createMaterial(scene, "oak", new Color3(0.33, 0.22, 0.13)),
      ironwork: createMaterial(scene, "ironwork", new Color3(0.21, 0.16, 0.12)),
    };

    for (const house of houses) {
      for (const opening of house.openings) {
        if (opening.kind === "door") this.doors.push(hangDoor(scene, opening, materials));
        else this.windows.push(hangShutters(scene, opening, materials));
      }
    }
  }

  /** Doors are worth a shadow each. A hundred shutters are not. */
  get shadowCasters(): AbstractMesh[] {
    return this.doors.map((door) => door.panel);
  }

  /** Flat against walls that already block the light, so they occlude nothing. */
  get occlusionSkips(): AbstractMesh[] {
    return [...this.doors.map((d) => d.panel), ...this.windows.flatMap((w) => w.panels)];
  }

  /** Returns the line to show the player, or an empty string for nothing near. */
  update(seconds: number, player: Vector3, keys: OpeningKeys): string {
    for (const door of this.doors) door.update(seconds);
    for (const window of this.windows) window.update(seconds);

    for (const door of this.doors) door.pushFrom(player);

    const door = this.doors.find((candidate) => candidate.isInReach(player));
    if (door) {
      if (keys.lock) door.toggleBar(player);
      return doorPrompt(door, player);
    }

    const window = this.windows.find((candidate) => candidate.isInReach(player));
    if (!window) return "";
    if (keys.open) window.toggleOpen(player);
    if (keys.lock) window.toggleLatch(player);
    return windowPrompt(window);
  }
}

function doorPrompt(door: Door, player: Vector3): string {
  if (!door.canBarFrom(player)) return door.isBarred ? "Barred from the inside" : "";
  return door.isBarred ? "F  lift the bar" : "F  bar the door";
}

function windowPrompt(window: ShutteredWindow): string {
  if (window.isLocked) return "F  unbolt the shutters";
  return `${window.isOpen ? "E  close" : "E  open"} the shutters    F  bolt them`;
}

function createMaterial(scene: Scene, name: string, colour: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = colour;
  material.specularColor = Color3.Black();
  return material;
}
