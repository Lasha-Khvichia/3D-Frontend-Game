import type { Camera } from "@babylonjs/core/Cameras/camera";
import { EffectRenderer, type EffectWrapper } from "@babylonjs/core/Materials/effectRenderer";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { Scene } from "@babylonjs/core/scene";
import { CameraBasis } from "./CameraBasis";
import type { CloudTextures } from "./createCloudTextures";
import {
  bindCloudUniforms,
  createCloudFrame,
  type CloudFrame,
  type CloudLighting,
} from "./bindCloudUniforms";
import { CLOUD_HISTORY_KEEP, CLOUD_QUALITY, type CloudQuality } from "./cloudQuality";
import type { CloudWeather } from "./CloudWeather";
import { createCloudMarch, createCloudTargets } from "./createCloudMarch";

/**
 * Traces the clouds into a small off-screen target every frame, before the
 * scene is drawn, for the veil to lay into it. Two targets take turns: each
 * frame blends into the one the last frame wrote, and writes the other.
 */
export class CloudPass {
  /** The camera as this frame's clouds were traced for it. */
  readonly view = new CameraBasis();
  private readonly before = new CameraBasis();
  private readonly renderer: EffectRenderer;
  private wrapper: EffectWrapper | null = null;
  private targets: RenderTargetTexture[] = [];
  private latest = 0;
  private quality: CloudQuality = "high";
  private readonly state: CloudFrame;

  constructor(
    private readonly scene: Scene,
    private readonly camera: () => Camera,
    textures: CloudTextures,
    weather: CloudWeather,
    lighting: CloudLighting,
  ) {
    this.renderer = new EffectRenderer(scene.getEngine());
    this.state = createCloudFrame(camera(), this.view, this.before, textures, weather, lighting);
    this.rebuild();
  }

  /** This frame's clouds, or null when they are switched off. */
  get output(): RenderTargetTexture | null {
    return this.wrapper ? (this.targets[this.latest] ?? null) : null;
  }

  setQuality(quality: CloudQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.rebuild();
  }

  render(): void {
    const wrapper = this.wrapper;
    if (!wrapper?.effect.isReady()) return;
    if (this.targets[0]?.getRenderWidth() !== this.targetWidth()) return this.rebuild();
    this.before.copyFrom(this.view);
    this.state.camera = this.camera();
    this.view.readFrom(this.state.camera, this.scene.getEngine());
    const target = this.targets[1 - this.latest]!;
    const first = this.state.history === null;
    this.state.history = this.targets[this.latest]!;
    this.state.frame[0] = (this.state.frame[0] + 0.618034) % 1;
    this.state.frame[1] = first ? 0 : CLOUD_HISTORY_KEEP;
    this.state.size[0] = target.getRenderWidth();
    this.state.size[1] = target.getRenderHeight();
    this.renderer.render(wrapper, target);
    this.latest = 1 - this.latest;
  }

  dispose(): void {
    this.wrapper?.dispose();
    for (const target of this.targets) target.dispose();
    this.renderer.dispose();
  }

  private targetWidth(): number {
    const scale = this.quality === "off" ? 0 : CLOUD_QUALITY[this.quality].scale;
    return Math.max(1, Math.round(this.scene.getEngine().getRenderWidth() * scale));
  }

  private rebuild(): void {
    this.wrapper?.dispose();
    for (const target of this.targets) target.dispose();
    this.wrapper = null;
    this.targets = [];
    this.state.history = null;
    if (this.quality === "off") return;
    const { scale, steps, lightSteps } = CLOUD_QUALITY[this.quality];
    const height = Math.round(this.scene.getEngine().getRenderHeight() * scale);
    this.targets = createCloudTargets(this.scene, this.targetWidth(), Math.max(1, height));
    this.wrapper = createCloudMarch(this.scene, steps, lightSteps);
    const wrapper = this.wrapper;
    wrapper.onApplyObservable.add(() => bindCloudUniforms(wrapper.effect, this.state));
  }
}
