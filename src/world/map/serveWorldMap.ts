import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { publishStats, setWorldMap, subscribeToCommands } from "../../ui/bridge";
import type { Terrain } from "../terrain/Terrain";
import { paintWorldMap } from "./paintWorldMap";

/**
 * Answers the UI's "open-map": paints the map if it never has been, hands it
 * over, and says where the player is standing and facing. The world is paused
 * while the map is open, so saying it once is enough.
 */
export function serveWorldMap(terrain: Terrain, bean: AbstractMesh, camera: Camera): () => void {
  return subscribeToCommands((command) => {
    if (command.type !== "open-map") return;
    setWorldMap(paintWorldMap(terrain));
    // Which way the camera faces, flattened: 0 is north, a quarter turn is east.
    const facing = camera.getDirection(Vector3.Forward());
    const yaw = Math.atan2(facing.x, facing.z);
    publishStats({ playerPose: { x: bean.position.x, z: bean.position.z, yaw } });
  });
}
