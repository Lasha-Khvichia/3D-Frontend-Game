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
import { TERRAIN_SHADE_GLSL, TERRAIN_SHADE_WGSL } from "./terrainShadeCode";
import { noShadeTexture, terrainShadeField } from "./terrainShadeField";

/**
 * Mountains' shadows on anything drawn with a standard material, from the map
 * `TerrainShadeMap` keeps. Registered for every standard material created
 * after `registerTerrainShade` runs, so it must run before the world is built,
 * as the cloud shadows do; and in both shader languages, or on WebGPU it
 * silently does not attach.
 */
export class TerrainShadePlugin extends MaterialPluginBase {
  constructor(material: Material) {
    super(material, "TerrainShade", 155, { TERRAINSHADE: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "TerrainShadePlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["TERRAINSHADE"] = true;
  }

  override getSamplers(samplers: string[]): void {
    samplers.push("terrainShadeMap");
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo = [{ name: "terrainShadeInfo", size: 4, type: "vec4" }];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return { ubo, fragment: "uniform vec4 terrainShadeInfo;" };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    scene: Scene,
    _engine: AbstractEngine,
  ): void {
    const field = terrainShadeField;
    uniformBuffer.updateFloat4(
      "terrainShadeInfo",
      field.originX,
      field.originZ,
      field.size,
      field.strength,
    );
    uniformBuffer.setTexture("terrainShadeMap", field.map ?? noShadeTexture(scene));
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? TERRAIN_SHADE_WGSL : TERRAIN_SHADE_GLSL;
  }
}

/** Gives every standard material made from now on the mountains' shade. Call before building the world. */
export function registerTerrainShade(): void {
  // A hot reload runs this again; twice registered, every material would get two.
  UnregisterMaterialPlugin("TerrainShade");
  RegisterMaterialPlugin("TerrainShade", (material) =>
    material instanceof StandardMaterial ? new TerrainShadePlugin(material) : null,
  );
}
