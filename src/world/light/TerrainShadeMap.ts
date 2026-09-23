import type { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "../terrain/HeightGrid";
import { createShadeTexture, packShade, sampleShadeHeights, shadeLightAt } from "./shadeHeights";
import { sweepShade, type ShadeHeights } from "./terrainShade";
import type { ShadeReply, ShadeRequest } from "./terrainShade.worker";
import { SHADE_LOWEST, terrainShadeField } from "./terrainShadeField";

/** How far the light must turn before the shade is worked out again: half a degree. */
const TURNED = Math.cos((0.5 * Math.PI) / 180);
/** A light this low or lower is below the horizon: it lights nothing to shade. */
const BELOW = 0.02;

/**
 * Mountains shading the valleys: the shade of the whole island's terrain for
 * whichever of the sun and moon is lighting it, worked out in a worker and
 * laid out as a map every standard material reads (`TerrainShadePlugin`).
 * Worked out again whenever the light has turned half a degree — about every
 * two real seconds while the sun moves — and nothing is drawn to make it.
 */
export class TerrainShadeMap {
  private readonly grid: ShadeHeights;
  private readonly texture: RawTexture;
  private readonly bytes: Uint8Array;
  private shade: Float32Array;
  private readonly asked = { x: 0, y: -1, z: 0 };
  private readonly worker: Worker | null = null;
  private busy = false;
  private ready = false;

  constructor(scene: Scene, heights: HeightGrid) {
    this.grid = sampleShadeHeights(heights);
    const { size } = this.grid;
    this.shade = new Float32Array(size * size).fill(SHADE_LOWEST);
    this.bytes = new Uint8Array(size * size * 4);
    this.texture = createShadeTexture(scene, this.bytes, size);
    terrainShadeField.size = size;
    if (typeof Worker === "undefined") return;
    this.worker = new Worker(new URL("./terrainShade.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event: MessageEvent<ShadeReply>) => this.receive(event.data);
    this.worker.postMessage({ kind: "heights", grid: this.grid } satisfies ShadeRequest);
  }

  /** Every step, toward the light the island is lit by now. */
  update(toward: Vector3): void {
    const up = toward.y >= BELOW;
    terrainShadeField.strength = up && this.ready ? 1 : 0;
    const { x, y, z } = this.asked;
    if (!up || this.busy || toward.x * x + toward.y * y + toward.z * z > TURNED) return;
    this.asked.x = toward.x;
    this.asked.y = toward.y;
    this.asked.z = toward.z;
    const request: ShadeRequest = { kind: "light", toward: [toward.x, toward.y, toward.z] };
    if (this.worker) {
      this.busy = true;
      this.worker.postMessage(request);
      return;
    }
    const shade = new Float32Array(this.grid.heights.length);
    sweepShade(this.grid, request.toward, shade);
    this.receive({ toward: request.toward, shade });
  }

  /** How much of the light reaches a point, 0 in a mountain's shadow to 1, as the shader has it. */
  lightAt(x: number, z: number, y: number): number {
    if (terrainShadeField.strength <= 0) return 1;
    return shadeLightAt(this.shade, this.grid.size, x, z, y);
  }

  dispose(): void {
    this.worker?.terminate();
    this.texture.dispose();
  }

  private receive(reply: ShadeReply): void {
    this.busy = false;
    this.ready = true;
    this.shade = reply.shade;
    packShade(reply.shade, this.bytes);
    this.texture.update(this.bytes);
    terrainShadeField.map = this.texture;
    // Asked only for a light above the horizon; on at once, even while paused.
    terrainShadeField.strength = 1;
  }
}
