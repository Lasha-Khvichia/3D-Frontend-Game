import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { RIVER_ICE_GLSL, RIVER_ICE_WGSL } from "./riverIceShaders";
import { SNOW_BANDS } from "./snowAndIceHour";
import { snowField } from "./snowField";

/**
 * River water that freezes in deep winter, and takes snow once it can carry
 * it. Attached by hand to the river water only: the sea never freezes.
 */
class RiverIcePlugin extends MaterialPluginBase {
  constructor(material: StandardMaterial) {
    super(material, "RiverIce", 180, { RIVERICE: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "RiverIcePlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["RIVERICE"] = true;
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const vectors = SNOW_BANDS / 4;
    const ubo = [
      { name: "iceDeep", size: 4, type: "vec4", arraySize: vectors },
      { name: "snowDeep", size: 4, type: "vec4", arraySize: vectors },
    ];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return {
      ubo,
      fragment: `uniform vec4 iceDeep[${vectors}];\nuniform vec4 snowDeep[${vectors}];`,
    };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    _scene: unknown,
    _engine: AbstractEngine,
  ): void {
    uniformBuffer.updateArray("iceDeep", snowField.ice);
    uniformBuffer.updateArray("snowDeep", snowField.deep);
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? RIVER_ICE_WGSL : RIVER_ICE_GLSL;
  }
}

/** Lets river water freeze with the winter. */
export function iceSurface(material: StandardMaterial): void {
  new RiverIcePlugin(material);
}
