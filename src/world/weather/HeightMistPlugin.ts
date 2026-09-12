import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Material } from "@babylonjs/core/Materials/material";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import {
  RegisterMaterialPlugin,
  UnregisterMaterialPlugin,
} from "@babylonjs/core/Materials/materialPluginManager";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HEIGHT_MIST_GLSL, HEIGHT_MIST_WGSL } from "./heightMistCode";

/** How thick the mist is at its floor, per metre of sight: full mist hides the flat at about 250 m. */
export const MIST_DENSITY = 0.012;
/** Per metre of height: the mist thins to a third every 15 m, lying in a layer tens of metres deep. */
const MIST_FALLOFF = 1 / 15;
/** Where it settles: the lowland floor, just above the sea. */
const MIST_FLOOR = 0;

/** This step's mist, shared by every standard material. `DayNightCycle` sets it. */
export const mistField = { density: 0, colour: new Color3(0.8, 0.82, 0.85) };

/**
 * Ground mist on everything drawn with a standard material.
 *
 * Babylon's fog knows only distance, so mist made of it turned the whole
 * mountain into a flat grey cut-out under a clear dawn sky. This is the
 * standard exponential height fog instead: dense at the floor, thinning
 * upward, integrated along each line of sight. In a valley the fields go
 * white and the peaks stand clear; from a hill you look down on a sea of it.
 *
 * It replaces Babylon's fog line, mixing the mist in first, so it works with
 * the ordinary fog rather than instead of it. Written in both shader languages.
 */
class HeightMistPlugin extends MaterialPluginBase {
  constructor(material: Material) {
    super(material, "HeightMist", 160, { HEIGHTMIST: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "HeightMistPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["HEIGHTMIST"] = true;
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo = [
      { name: "mistShape", size: 4, type: "vec4" },
      { name: "mistColour", size: 3, type: "vec3" },
    ];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return { ubo, fragment: "uniform vec4 mistShape;\nuniform vec3 mistColour;" };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    _scene: unknown,
    _engine: AbstractEngine,
  ): void {
    uniformBuffer.updateFloat4("mistShape", mistField.density, MIST_FALLOFF, MIST_FLOOR, 0);
    uniformBuffer.updateColor3("mistColour", mistField.colour);
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? HEIGHT_MIST_WGSL : HEIGHT_MIST_GLSL;
  }
}

/** Before any material exists: Babylon only gives a registered plugin to materials made after it. */
export function registerHeightMist(): void {
  UnregisterMaterialPlugin("HeightMist");
  RegisterMaterialPlugin("HeightMist", (material) =>
    material instanceof StandardMaterial ? new HeightMistPlugin(material) : null,
  );
}
