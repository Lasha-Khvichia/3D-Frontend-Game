import "@babylonjs/core/Shaders/pass.fragment";
import "@babylonjs/core/ShadersWGSL/pass.fragment";
import "@babylonjs/core/Shaders/postprocess.vertex";
import "@babylonjs/core/ShadersWGSL/postprocess.vertex";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { EffectRenderer, EffectWrapper } from "@babylonjs/core/Materials/effectRenderer";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { Viewport } from "@babylonjs/core/Maths/math.viewport";
import type { Scene } from "@babylonjs/core/scene";
import { miniMapCorner } from "./miniMapCorner";
import { ViewBoxFilter } from "./ViewBoxFilter";

/** Real milliseconds between redraws: 20 a second, whatever the screen's rate. */
const REDRAW_MS = 50;

/**
 * The mini-map's picture: drawn into its own texture 20 times a second and
 * laid into the bottom-left corner of every frame, in one draw. As a second
 * camera it redrew the scene, halo pass and all, every frame, for a picture
 * 220 pixels wide that barely changes between frames.
 */
export class MiniMapPicture {
  private target: RenderTargetTexture | null = null;
  private corner: Viewport | null = null;
  private readonly renderer: EffectRenderer;
  private readonly copy: EffectWrapper;
  private lastDrawn = -Infinity;
  private shown = true;
  private readonly filter: ViewBoxFilter;
  /** Called whenever a new picture is ordered, to repaint what sits on top of it. */
  onRedraw: () => void = () => {};

  constructor(
    private readonly scene: Scene,
    private readonly camera: Camera,
  ) {
    const engine = scene.getEngine();
    this.filter = new ViewBoxFilter(camera);
    this.renderer = new EffectRenderer(engine);
    this.copy = new EffectWrapper({
      engine,
      name: "mini-map-copy",
      fragmentShader: "pass",
      useShaderStore: true,
      samplerNames: ["textureSampler"],
      shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
    });
    this.copy.onApplyObservable.add(() =>
      this.copy.effect.setTexture("textureSampler", this.target),
    );
    this.rebuild();
    engine.onResizeObservable.add(() => this.rebuild());
    scene.onBeforeRenderObservable.add(() => this.orderRedraw());
    scene.onAfterRenderObservable.add(() => this.layIn());
  }

  /** Hidden in the orbit view: no picture drawn, nothing laid in. */
  setShown(shown: boolean): void {
    this.shown = shown;
  }

  private orderRedraw(): void {
    const now = performance.now();
    if (!this.shown || !this.target || now - this.lastDrawn < REDRAW_MS) return;
    this.lastDrawn = now;
    this.filter.update();
    this.target.resetRefreshCounter();
    this.onRedraw();
  }

  private layIn(): void {
    if (!this.shown || !this.target || !this.corner || !this.copy.effect.isReady()) return;
    this.renderer.saveStates();
    this.renderer.setViewport(this.corner);
    this.renderer.applyEffectWrapper(this.copy);
    this.renderer.draw();
    this.renderer.setViewport();
    this.renderer.restoreStates();
  }

  /** A square target the size of the corner in real pixels, remade when that changes. */
  private rebuild(): void {
    const engine = this.scene.getEngine();
    this.corner = miniMapCorner(engine);
    const size = this.corner ? Math.round(this.corner.width * engine.getRenderWidth()) : 0;
    if (size <= 0 || this.target?.getRenderWidth() === size) return;
    if (this.target) {
      this.scene.customRenderTargets.splice(this.scene.customRenderTargets.indexOf(this.target), 1);
      this.target.dispose();
    }
    const target = new RenderTargetTexture("mini-map", { width: size, height: size }, this.scene);
    target.activeCamera = this.camera;
    target.renderListPredicate = this.filter.accepts;
    target.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    this.scene.customRenderTargets.push(target);
    this.target = target;
    this.lastDrawn = -Infinity;
  }
}
