import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Material } from "@babylonjs/core/Materials/material";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import type { Scene } from "@babylonjs/core/scene";
import type { SubMesh } from "@babylonjs/core/Meshes/subMesh";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { WIND_VERTEX_CODE } from "./windVertexCode";

/** How hard each of the three motions pushes, for one material. */
export type WindStrength = {
  /** Metres of lean at one metre up, before the square of height is applied. */
  readonly bend: number;
  /** Metres of sway per metre out from the trunk. */
  readonly sway: number;
  /** Metres of high-frequency shiver. Leaves only; wood does not flutter. */
  readonly flutter: number;
};

/** The wind every tree shares: its clock, the way it blows, and how hard (1 is a 5 m/s breeze). */
export type WindField = {
  time: number;
  directionX: number;
  directionZ: number;
  strength: number;
};

/**
 * Adds wind to a standard material without replacing it.
 *
 * A plugin rather than a material of our own, because a material of our own
 * would have to re-implement lighting, shadows and fog to keep the trees
 * looking like everything else. This injects a few lines into the shader the
 * standard material already builds and leaves the rest alone.
 */
export class WindMaterialPlugin extends MaterialPluginBase {
  constructor(
    material: Material,
    private readonly strength: WindStrength,
    private readonly field: WindField,
  ) {
    super(material, "TreeWind", 200, { TREEWIND: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "WindMaterialPlugin";
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["TREEWIND"] = true;
  }

  override getUniforms() {
    return {
      ubo: [
        { name: "windTime", size: 1, type: "float" },
        { name: "windBend", size: 1, type: "float" },
        { name: "windSway", size: 1, type: "float" },
        { name: "windFlutter", size: 1, type: "float" },
        { name: "windDirection", size: 2, type: "vec2" },
      ],
      vertex: `
        uniform float windTime;
        uniform float windBend;
        uniform float windSway;
        uniform float windFlutter;
        uniform vec2 windDirection;
      `,
    };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    _scene: Scene,
    _engine: AbstractEngine,
    _subMesh: SubMesh,
  ): void {
    uniformBuffer.updateFloat("windTime", this.field.time);
    uniformBuffer.updateFloat("windBend", this.strength.bend * this.field.strength);
    uniformBuffer.updateFloat("windSway", this.strength.sway * this.field.strength);
    uniformBuffer.updateFloat("windFlutter", this.strength.flutter * this.field.strength);
    uniformBuffer.updateFloat2("windDirection", this.field.directionX, this.field.directionZ);
  }

  override getCustomCode(shaderType: string): { [name: string]: string } | null {
    if (shaderType !== "vertex") return null;
    return { CUSTOM_VERTEX_UPDATE_WORLDPOS: WIND_VERTEX_CODE };
  }
}
