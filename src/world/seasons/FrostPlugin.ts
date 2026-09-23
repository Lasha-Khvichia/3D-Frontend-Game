import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import type { Scene } from "@babylonjs/core/scene";
import { FROST_GLSL, FROST_WGSL } from "./frostCode";
import { frostField } from "./frostField";

/**
 * A rime on a cold morning, on whatever this material draws.
 *
 * Attached **by hand** (`frostSurface`), like the wet and the snow, to the
 * ground, the houses, the stones, the bridges and the trees — not registered
 * for every standard material, because the sky, the water and the lamps have
 * no business frosting over. Its priority puts it before the snow, so snow
 * covers frost rather than the other way about.
 */
export class FrostPlugin extends MaterialPluginBase {
  constructor(material: StandardMaterial) {
    super(material, "Frost", 175, { FROSTSURFACE: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "FrostPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["FROSTSURFACE"] = true;
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo = [{ name: "frostLook", size: 4, type: "vec4" }];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return { ubo, fragment: "uniform vec4 frostLook;" };
  }

  override bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine) {
    uniformBuffer.updateFloat4("frostLook", frostField.amount, 0, 0, 0);
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? FROST_WGSL : FROST_GLSL;
  }
}

/** Gives one material frost on its sky-facing sides. */
export function frostSurface(material: StandardMaterial): void {
  new FrostPlugin(material);
}
