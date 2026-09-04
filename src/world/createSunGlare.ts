import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Constants } from "@babylonjs/core/Engines/constants";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Across the sky, in world units at the celestial distance. */
export const GLARE_DIAMETER = 260;
const TEXTURE_SIZE = 512;

/** Four long spikes and four short ones, the way a lens splits a point of light. */
const LONG_SPIKE_COUNT = 4;
const LONG_SPIKE_REACH = 0.97;
const SHORT_SPIKE_REACH = 0.44;
const SPIKE_HALF_WIDTH = 0.009;
const CORE_RADIUS = 0.085;

export type SunGlare = {
  readonly mesh: Mesh;
  readonly material: StandardMaterial;
};

/**
 * The starburst around the sun.
 *
 * A screen-facing plane, added rather than blended, so it behaves like light
 * arriving at a lens instead of a decal hanging in the sky. Because it always
 * faces the camera, the spikes stay slim and screen-aligned however you turn.
 */
export function createSunGlare(scene: Scene): SunGlare {
  const mesh = CreatePlane("sun-glare", { size: GLARE_DIAMETER }, scene);
  mesh.billboardMode = TransformNode.BILLBOARDMODE_ALL;
  mesh.isPickable = false;
  mesh.applyFog = false;
  mesh.receiveShadows = false;

  const texture = new DynamicTexture("sun-glare-texture", TEXTURE_SIZE, scene, true);
  paintStarburst(texture);
  texture.hasAlpha = true;

  const material = new StandardMaterial("sun-glare-material", scene);
  material.disableLighting = true;
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.emissiveTexture = texture;
  material.emissiveColor = Color3.Black();
  material.opacityTexture = texture;
  // Light adds, it does not paint over. Additive also hides the plane's edges.
  material.alphaMode = Constants.ALPHA_ADD;
  material.backFaceCulling = false;
  mesh.material = material;

  return { mesh, material };
}

type Context2d = ReturnType<DynamicTexture["getContext"]>;

function paintStarburst(texture: DynamicTexture): void {
  const context = texture.getContext();
  const centre = TEXTURE_SIZE / 2;
  context.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let index = 0; index < LONG_SPIKE_COUNT * 2; index += 1) {
    const angle = (index * Math.PI) / LONG_SPIKE_COUNT;
    const reach = index % 2 === 0 ? LONG_SPIKE_REACH : SHORT_SPIKE_REACH;
    paintSpike(context, centre, angle, reach);
  }
  paintCore(context, centre);
  texture.update(true);
}

/** One spike is a very thin triangle fading to nothing at its tip. */
function paintSpike(context: Context2d, centre: number, angle: number, reach: number): void {
  const length = centre * reach;
  const halfWidth = centre * SPIKE_HALF_WIDTH;

  const gradient = context.createLinearGradient(0, 0, 0, -length);
  gradient.addColorStop(0, "rgba(255, 246, 224, 0.95)");
  gradient.addColorStop(0.25, "rgba(255, 232, 178, 0.38)");
  gradient.addColorStop(1, "rgba(255, 220, 150, 0)");

  context.save();
  context.translate(centre, centre);
  context.rotate(angle);
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(-halfWidth, 0);
  context.lineTo(0, -length);
  context.lineTo(halfWidth, 0);
  context.closePath();
  context.fill();
  // The same spike mirrored, so one draw makes an opposed pair.
  context.beginPath();
  context.moveTo(-halfWidth, 0);
  context.lineTo(0, length);
  context.lineTo(halfWidth, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function paintCore(context: Context2d, centre: number): void {
  const radius = centre * CORE_RADIUS;
  const gradient = context.createRadialGradient(centre, centre, 0, centre, centre, radius);
  gradient.addColorStop(0, "rgba(255, 253, 244, 1)");
  gradient.addColorStop(0.35, "rgba(255, 240, 196, 0.55)");
  gradient.addColorStop(1, "rgba(255, 228, 160, 0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centre, centre, radius, 0, Math.PI * 2);
  context.fill();
}
