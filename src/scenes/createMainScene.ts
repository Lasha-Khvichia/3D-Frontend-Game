import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";
import { createEmptyScene } from "./createEmptyScene";
import { createGround } from "../world/createGround";
import { createPlatformWalls } from "../world/createPlatformWalls";

/**
 * The scene the game boots into. Camera and light come from the empty base,
 * so that base stays reusable for menus and loading screens.
 */
export function createMainScene(engine: AbstractEngine): Scene {
  const scene = createEmptyScene(engine);
  createGround(scene);
  createPlatformWalls(scene);
  return scene;
}
