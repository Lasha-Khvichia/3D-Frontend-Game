import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import type { Scene } from "@babylonjs/core/scene";
import { SNOWY_RANGES } from "./snowCover";
import { SNOW_BANDS } from "./snowDepth";
import { snowField } from "./snowField";
import { SNOW_GROUND_GLSL } from "./snowGroundGlsl";
import { SNOW_GROUND_WGSL } from "./snowGroundWgsl";

let untrodden: RawTexture | null = null;

/** An empty map, for before the snow system is built. */
function noFootprints(scene: Scene): RawTexture {
  untrodden ??= RawTexture.CreateRGBATexture(new Uint8Array(4), 1, 1, scene, false, false, 1);
  return untrodden;
}

/**
 * Snow lying on the high ground of the two snowy ranges, with the player's
 * footprints trodden into it.
 *
 * On the ground material only, and **after `WetGroundPlugin`** (priority 180
 * against 170): it reaches into that plugin's `wetAmount` and `wetPuddle` to
 * take them over where snow lies, because snow is not wet ground. Attach both
 * or neither — `Terrain` does both, one after the other.
 */
class SnowGroundPlugin extends MaterialPluginBase {
  constructor(
    material: StandardMaterial,
    private readonly foliage: boolean,
  ) {
    super(material, "SnowGround", 180, { SNOWGROUND: false, SNOWFOLIAGE: false });
    this._enable(true);
  }

  override getClassName(): string {
    return "SnowGroundPlugin";
  }

  override isCompatible(language: ShaderLanguage): boolean {
    return language === ShaderLanguage.GLSL || language === ShaderLanguage.WGSL;
  }

  override prepareDefines(defines: MaterialDefines): void {
    defines["SNOWGROUND"] = true;
    defines["SNOWFOLIAGE"] = this.foliage;
  }

  override getSamplers(samplers: string[]): void {
    samplers.push("footprintMap");
  }

  override getUniforms(language: ShaderLanguage = ShaderLanguage.GLSL) {
    const deepVectors = SNOW_BANDS / 4;
    const ubo = [
      { name: "snowLook", size: 4, type: "vec4" },
      { name: "footArea", size: 4, type: "vec4" },
      { name: "snowRanges", size: 4, type: "vec4", arraySize: SNOWY_RANGES.length },
      { name: "snowDeep", size: 4, type: "vec4", arraySize: deepVectors },
    ];
    if (language === ShaderLanguage.WGSL) return { ubo };
    return {
      ubo,
      fragment:
        `uniform vec4 snowLook;\nuniform vec4 footArea;\n` +
        `uniform vec4 snowRanges[${SNOWY_RANGES.length}];\nuniform vec4 snowDeep[${deepVectors}];`,
    };
  }

  override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    scene: Scene,
    _engine: AbstractEngine,
  ): void {
    const { cap, nowShare, printLife, foot } = snowField;
    uniformBuffer.updateFloat4("snowLook", cap.line, cap.edge, cap.depth, printLife);
    uniformBuffer.updateFloat4("footArea", foot.x, foot.z, foot.size, nowShare);
    uniformBuffer.updateArray("snowRanges", snowField.ranges);
    uniformBuffer.updateArray("snowDeep", snowField.deep);
    uniformBuffer.setTexture("footprintMap", snowField.prints ?? noFootprints(scene));
  }

  override getCustomCode(
    shaderType: string,
    language?: ShaderLanguage,
  ): Record<string, string> | null {
    if (shaderType !== "fragment") return null;
    return language === ShaderLanguage.WGSL ? SNOW_GROUND_WGSL : SNOW_GROUND_GLSL;
  }
}

/** Gives the ground its lying snow and footprints. Call it after `wetSurface`. */
export function snowSurface(material: StandardMaterial, foliage = false): void {
  new SnowGroundPlugin(material, foliage);
}
