import type { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CatchMap } from "./CatchMap";
import { createDropMesh } from "./createDropMesh";
import { createFallingMaterial } from "./createFallingMaterial";
import { DROP_FRAGMENT_GLSL, DROP_VERTEX_GLSL } from "./dropShadersGlsl";
import { DROP_FRAGMENT_WGSL, DROP_VERTEX_WGSL } from "./dropShadersWgsl";
import type { Falling } from "./fallingLooks";

/** `box` is how many metres across the box of drops round the eye is. */
export type DropLayerSpec = { name: string; count: number; box: number; flakes: boolean };

/** What every layer shares in one frame. `pixel` is the metres one pixel covers, a metre from the eye. */
export type DropFrame = { seconds: number; clock: number; readonly wind: Vector3; pixel: number };

const SHADERS = {
  vertexGlsl: DROP_VERTEX_GLSL,
  fragmentGlsl: DROP_FRAGMENT_GLSL,
  vertexWgsl: DROP_VERTEX_WGSL,
  fragmentWgsl: DROP_FRAGMENT_WGSL,
};
const UNIFORMS = ["travelled", "fall", "drift", "dropSize", "tint"];

/**
 * One kind of falling drop — streaks, or flakes — as one mesh and one draw
 * call, moved entirely by its shader (`dropShadersGlsl.ts`).
 */
export class DropLayer {
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  /** How far the fall and the wind have carried the drops, wrapped to the box so it stays precise. */
  private readonly travelled = new Vector3();
  private readonly fall = new Vector4();
  private readonly drift = new Vector4();
  private readonly size = new Vector4();
  private readonly tint = new Vector4();

  constructor(
    scene: Scene,
    private readonly spec: DropLayerSpec,
    private readonly catchMap: CatchMap,
  ) {
    this.mesh = createDropMesh(scene, spec.name, spec.count, spec.count + (spec.flakes ? 7 : 3));
    const defines = spec.flakes ? ["#define FLAKES"] : [];
    this.material = createFallingMaterial(
      scene,
      `${spec.name}-material`,
      SHADERS,
      UNIFORMS,
      defines,
      catchMap,
    );
    this.mesh.material = this.material;
    // Drawn after the cloud veil, which sits at 0: rain is in front of every cloud.
    this.mesh.alphaIndex = 1;
  }

  /** One frame: shows the layer as `falling` says, or hides it when nothing of its kind falls. */
  draw(falling: Falling | null, frame: DropFrame, colour: Color3): void {
    this.mesh.setEnabled(falling !== null);
    if (!falling) return;
    const { box } = this.spec;
    const { seconds, wind } = frame;
    const carried = falling.carried;
    const t = this.travelled;
    t.set(
      wrap(t.x + wind.x * carried * seconds, box),
      wrap(t.y - falling.speed * seconds, box),
      wrap(t.z + wind.z * carried * seconds, box),
    );
    const m = this.material;
    m.setVector3("travelled", t);
    m.setVector4("fall", this.fall.set(falling.speed, box, falling.share, falling.shutter));
    m.setVector4(
      "drift",
      this.drift.set(wind.x * carried, falling.sway, wind.z * carried, frame.clock),
    );
    m.setVector4("dropSize", this.size.set(falling.width, falling.flake, frame.pixel, 0));
    m.setVector4("tint", this.tint.set(colour.r, colour.g, colour.b, falling.opacity));
    this.catchMap.bindTo(m);
  }
}

function wrap(value: number, span: number): number {
  return value - span * Math.floor(value / span);
}
