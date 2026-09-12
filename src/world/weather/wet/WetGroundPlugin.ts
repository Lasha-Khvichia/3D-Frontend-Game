import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { SHELTER_SLOTS, wetField } from "./wetField";
import { wetGroundGlsl } from "./wetGroundGlsl";
import { wetGroundWgsl } from "./wetGroundWgsl";

/** How dark each surface goes when soaked: earth holds the water, grass sheds most of it. */
const GROUND_DARKEN = 0.6;
const OTHER_DARKEN = 0.78;

/**
 * Rain darkening a surface and shining on it, and — on the ground — standing
 * in puddles where it is flat and out in the open.
 *
 * Attached by hand rather than registered for every standard material: only
 * the ground and the grass show this, and the ground alone carries the roofs
 * and the puddle code. Attaching it by name would break silently when a
 * material is renamed, so `wetSurface` is called where the material is made.
 */
class WetGroundPlugin extends MaterialPluginBase {
  constructor(
    material: StandardMaterial,
    private readonly ground: boolean,
  ) {
    super(material, "WetGround", 170, { WETSURFACE: false, WETGROUND: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "WetGroundPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["WETSURFACE"] = true;
    defines["WETGROUND"] = this.ground;
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const ubo: { name: string; size: number; type: string; arraySize?: number }[] = [
      { name: "wetLook", size: 4, type: "vec4" },
      { name: "wetSky", size: 4, type: "vec4" },
      { name: "wetSun", size: 4, type: "vec4" },
    ];
    const declaration = "uniform vec4 wetLook;\nuniform vec4 wetSky;\nuniform vec4 wetSun;\n";
    if (!this.ground) {
      return language === ShaderLanguage.WGSL ? { ubo } : { ubo, fragment: declaration };
    }
    const slots = SHELTER_SLOTS * 2;
    ubo.push({ name: "wetRoofs", size: 4, type: "vec4", arraySize: slots });
    if (language === ShaderLanguage.WGSL) return { ubo };
    return { ubo, fragment: `${declaration}uniform vec4 wetRoofs[${slots}];` };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    _scene: unknown,
    _engine: AbstractEngine,
  ): void {
    const field = wetField;
    uniformBuffer.updateFloat4("wetLook", field.wet, field.puddles, field.rain, field.clock);
    const { sky, toSun } = field;
    uniformBuffer.updateFloat4("wetSky", sky.r, sky.g, sky.b, field.skyStrength);
    uniformBuffer.updateFloat4("wetSun", toSun.x, toSun.y, toSun.z, field.sunStrength);
    if (this.ground) uniformBuffer.updateArray("wetRoofs", field.roofs);
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    const darken = this.ground ? GROUND_DARKEN : OTHER_DARKEN;
    return language === ShaderLanguage.WGSL ? wetGroundWgsl(darken) : wetGroundGlsl(darken);
  }
}

/**
 * Makes one material show the rain. `ground` adds the puddles and the dry
 * ground under roofs; without it the surface only darkens and shines.
 */
export function wetSurface(material: StandardMaterial, ground: boolean): void {
  new WetGroundPlugin(material, ground);
}
