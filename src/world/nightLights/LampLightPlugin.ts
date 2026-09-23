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
import type { Scene } from "@babylonjs/core/scene";
import { LAMP_SLOTS, lampField } from "./lampField";
import { LAMP_LIGHT_GLSL, LAMP_LIGHT_WGSL } from "./lampLightCode";

/**
 * Lanterns and lit windows lighting anything drawn with a standard material.
 *
 * The scene is at its four lights, and a fifth would silently stop one of the
 * others being used, so the lamps are not Babylon lights at all: their places
 * go to every shader as a short list, and this adds their light. Registered
 * before the world is built, like the cloud shadows, and in both shader
 * languages, or on WebGPU it silently does not attach. Unlit materials —
 * the glowing panes themselves — are left alone.
 */
export class LampLightPlugin extends MaterialPluginBase {
  constructor(material: Material) {
    super(material, "LampLight", 160, { LAMPLIGHT: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "LampLightPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["LAMPLIGHT"] = !(this._material as StandardMaterial).disableLighting;
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo = [
      { name: "lampInfo", size: 4, type: "vec4" },
      { name: "lampPlaces", size: 4, type: "vec4", arraySize: LAMP_SLOTS },
      { name: "lampGlows", size: 4, type: "vec4", arraySize: LAMP_SLOTS },
      { name: "lampWalls", size: 4, type: "vec4", arraySize: LAMP_SLOTS },
    ];
    if (language === ShaderLanguage.WGSL) return { ubo };
    const arrays = ["lampPlaces", "lampGlows", "lampWalls"];
    const fragment = arrays.map((name) => `uniform vec4 ${name}[${LAMP_SLOTS}];`).join("\n");
    return { ubo, fragment: `uniform vec4 lampInfo;\n${fragment}` };
  }

  override bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine) {
    uniformBuffer.updateFloat4("lampInfo", lampField.count, 0, 0, 0);
    if (lampField.count === 0) return;
    uniformBuffer.updateArray("lampPlaces", lampField.places);
    uniformBuffer.updateArray("lampGlows", lampField.glows);
    uniformBuffer.updateArray("lampWalls", lampField.walls);
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? LAMP_LIGHT_WGSL : LAMP_LIGHT_GLSL;
  }
}

/** Gives every standard material made from now on the lamps' light. Call before building the world. */
export function registerLampLight(): void {
  // A hot reload runs this again; twice registered, every material would get two.
  UnregisterMaterialPlugin("LampLight");
  RegisterMaterialPlugin("LampLight", (material) =>
    material instanceof StandardMaterial ? new LampLightPlugin(material) : null,
  );
}
