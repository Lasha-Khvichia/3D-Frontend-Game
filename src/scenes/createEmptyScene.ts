import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

/**
 * A scene with no game content. It holds only what Babylon needs to render at
 * all: an active camera and one light. Meshes, materials and systems go in
 * their own scene factories.
 */
export function createEmptyScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.05, 0.06, 0.09, 1);

  const camera = new ArcRotateCamera(
    "orbit-camera",
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
  camera.attachControl(true);

  const keyLight = new HemisphericLight("key-light", new Vector3(0, 1, 0), scene);
  keyLight.intensity = 0.9;

  return scene;
}
