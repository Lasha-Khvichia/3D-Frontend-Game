import type { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector4 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CatchMap } from "./CatchMap";
import { createDropMesh } from "./createDropMesh";
import { createFallingMaterial } from "./createFallingMaterial";
import {
  SPLASH_CELLS,
  SPLASH_FRAGMENT_GLSL,
  SPLASH_PER_CELL,
  SPLASH_VERTEX_GLSL,
} from "./splashShadersGlsl";
import { SPLASH_FRAGMENT_WGSL, SPLASH_VERTEX_WGSL } from "./splashShadersWgsl";

/** Metres across one square of ground: ten squares cover 9 m either side of the eye. */
const CELL = 1.8;
const SPLASHES = SPLASH_CELLS * SPLASH_CELLS * SPLASH_PER_CELL;
/** Seconds a ring lasts before it starts again elsewhere. */
const LIFE = 0.35;
const OPACITY = 0.45;
const SHADERS = {
  vertexGlsl: SPLASH_VERTEX_GLSL,
  fragmentGlsl: SPLASH_FRAGMENT_GLSL,
  vertexWgsl: SPLASH_VERTEX_WGSL,
  fragmentWgsl: SPLASH_FRAGMENT_WGSL,
};

/** Rings where rain lands round the player — on the ground, and on the roofs. One draw call. */
export class SplashLayer {
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly splash = new Vector4();
  private readonly tint = new Vector4();

  constructor(
    scene: Scene,
    private readonly catchMap: CatchMap,
  ) {
    // Each quad is one splash of one square, counted from the eye's square (`splashShadersGlsl.ts`).
    this.mesh = createDropMesh(scene, "rain-splashes", SPLASHES, (drop) => [
      (Math.floor(drop / (SPLASH_CELLS * SPLASH_PER_CELL)) + 0.5) / SPLASH_CELLS,
      ((Math.floor(drop / SPLASH_PER_CELL) % SPLASH_CELLS) + 0.5) / SPLASH_CELLS,
      ((drop % SPLASH_PER_CELL) + 0.5) / SPLASH_PER_CELL,
      0,
    ]);
    this.material = createFallingMaterial(
      scene,
      "rain-splashes-material",
      SHADERS,
      ["splash", "tint"],
      [],
      catchMap,
    );
    this.mesh.material = this.material;
    this.mesh.alphaIndex = 1;
  }

  /** One frame, with the share of splashes shown: 0 hides them. */
  draw(share: number, clock: number, colour: Color3): void {
    this.mesh.setEnabled(share > 0);
    if (share <= 0) return;
    this.material.setVector4("splash", this.splash.set(clock, CELL, share, LIFE));
    this.material.setVector4("tint", this.tint.set(colour.r, colour.g, colour.b, OPACITY));
    this.catchMap.bindTo(this.material);
  }
}
