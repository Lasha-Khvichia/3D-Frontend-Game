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
import { cloudShadowField, noCloudTexture, noCloudVolume } from "./cloudShadowField";
import { CLOUD_SHADOW_GLSL, CLOUD_SHADOW_WGSL } from "./shaders/cloudShadowCode";

/**
 * Cloud shadows on anything drawn with a standard material: ground, grass,
 * houses, trees, stones, water.
 *
 * Registered for every standard material created after `registerCloudShadows`
 * runs — Babylon only adds a registered plugin to materials made later, so it
 * must run before the world is built. Written in both shader languages, so it
 * works on WebGPU too; a GLSL-only plugin would silently not attach there.
 */
export class CloudShadowPlugin extends MaterialPluginBase {
  constructor(material: Material) {
    super(material, "CloudShadow", 150, { CLOUDSHADOW: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "CloudShadowPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["CLOUDSHADOW"] = true;
  }

  override getSamplers(samplers: string[]): void {
    samplers.push("cloudWeatherMap", "cloudShapeMap");
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo = [
      { name: "cloudShadowState", size: 4, type: "vec4" },
      { name: "cloudShadowToward", size: 4, type: "vec4" },
    ];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return { ubo, fragment: "uniform vec4 cloudShadowState;\nuniform vec4 cloudShadowToward;" };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    scene: Scene,
    _engine: AbstractEngine,
  ): void {
    const field = cloudShadowField;
    const { toward } = field;
    uniformBuffer.updateFloat4(
      "cloudShadowState",
      field.cover,
      field.driftX,
      field.driftZ,
      field.rise,
    );
    uniformBuffer.updateFloat4("cloudShadowToward", toward.x, toward.y, toward.z, field.strength);
    uniformBuffer.setTexture("cloudWeatherMap", field.weather ?? noCloudTexture(scene));
    uniformBuffer.setTexture("cloudShapeMap", field.shape ?? noCloudVolume(scene));
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? CLOUD_SHADOW_WGSL : CLOUD_SHADOW_GLSL;
  }
}

/** Gives every standard material made from now on cloud shadows. Call before building the world. */
export function registerCloudShadows(): void {
  // A hot reload runs this again; twice registered, every material would get two.
  UnregisterMaterialPlugin("CloudShadow");
  RegisterMaterialPlugin("CloudShadow", (material) =>
    material instanceof StandardMaterial ? new CloudShadowPlugin(material) : null,
  );
}
