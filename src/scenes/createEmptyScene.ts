// Registers the collision coordinator that moveWithCollisions needs.
import "@babylonjs/core/Collisions/collisionCoordinator";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

/** DayNightCycle looks the ambient fill light up by this name. */
export const AMBIENT_LIGHT_NAME = "ambient-light";

/** attachPlayer looks the orbit camera up by this name. */
export const ORBIT_CAMERA_NAME = "orbit-camera";

/**
 * A scene with no game content. It holds only what Babylon needs to render at
 * all: an active camera and one light. Meshes, materials and systems go in
 * their own scene factories.
 */
export function createEmptyScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  scene.clearColor = new Color4(0.05, 0.06, 0.09, 1);

  const camera = new ArcRotateCamera(
    ORBIT_CAMERA_NAME,
    -Math.PI / 2,
    Math.PI / 2.6,
    12,
    Vector3.Zero(),
    scene,
  );
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 200;
  camera.wheelPrecision = 20;
  camera.minZ = 0.1;
  // Far enough to include the sun disc, close enough to keep depth precision.
  camera.maxZ = 2000;
  camera.attachControl(true);

  const ambientLight = new HemisphericLight(AMBIENT_LIGHT_NAME, new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.9;

  return scene;
}
