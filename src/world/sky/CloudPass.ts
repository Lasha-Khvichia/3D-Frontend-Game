import type { Camera } from "@babylonjs/core/Cameras/camera";
import { EffectRenderer, type EffectWrapper } from "@babylonjs/core/Materials/effectRenderer";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { Scene } from "@babylonjs/core/scene";
import { readPaused } from "../../ui/bridge";
import { advanceCloudFrame } from "./advanceCloudFrame";
import { CameraBasis } from "./CameraBasis";
import type { CloudTextures } from "./createCloudTextures";
import {
  bindCloudUniforms,
  createCloudFrame,
  type CloudFrame,
  type CloudLighting,
} from "./bindCloudUniforms";
import { cloudTargetWidth, type CloudQuality } from "./cloudQuality";
import type { CloudWeather } from "./CloudWeather";
import { buildCloudMarch } from "./createCloudMarch";
import { PausedCloudSettle } from "./PausedCloudSettle";

/**
 * Traces the clouds into a small off-screen target every frame, before the
 * scene is drawn, for the veil to lay into it. Two targets take turns: each
 * frame blends into the one the last frame wrote, and writes the other.
 *
 * Paused, the clouds hold still but for settling a change (`PausedCloudSettle`).
 */
export class CloudPass {
  /** The camera as this frame's clouds were traced for it. */
  readonly view = new CameraBasis();
  private readonly settle = new PausedCloudSettle();
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
    const before = new CameraBasis();
    this.state = createCloudFrame(camera(), this.view, before, textures, weather, lighting);
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

  /** Traces a few more frames while paused: the sky the clouds are lit by has changed. */
  refresh(): void {
    this.settle.restart();
  }

  render(): void {
    const wrapper = this.wrapper;
    if (!wrapper?.effect.isReady()) return;
    if (this.targets[0]?.getRenderWidth() !== this.targetWidth()) return this.rebuild();
    const [camera, engine] = [this.camera(), this.scene.getEngine()];
    if (readPaused() && !this.settle.shouldTrace(camera, engine, this.view)) return;
    const target = this.targets[1 - this.latest]!;
    advanceCloudFrame(this.state, camera, engine, this.targets[this.latest]!, target);
    this.renderer.render(wrapper, target);
    this.latest = 1 - this.latest;
  }

  dispose(): void {
    this.wrapper?.dispose();
    for (const target of this.targets) target.dispose();
    this.renderer.dispose();
  }

  private targetWidth(): number {
    return cloudTargetWidth(this.scene.getEngine().getRenderWidth(), this.quality);
  }

  private rebuild(): void {
    this.wrapper?.dispose();
    for (const target of this.targets) target.dispose();
    [this.wrapper, this.targets] = [null, []];
    this.state.history = null;
    this.settle.restart();
    if (this.quality === "off") return;
    const { wrapper, targets } = buildCloudMarch(this.scene, this.quality);
    [this.wrapper, this.targets] = [wrapper, targets];
    wrapper.onApplyObservable.add(() => bindCloudUniforms(wrapper.effect, this.state));
  }
}
