import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

const SIZE_METRES = 28;
const TEXTURE_SIZE = 512;
/** Just above the ground so the two surfaces never fight for the same depth. */
const HEIGHT_ABOVE_GROUND = 0.02;

const NORTH_COLOUR = "#e8603c";
const LINE_COLOUR = "rgba(226, 232, 245, 0.75)";
const FAINT_COLOUR = "rgba(226, 232, 245, 0.32)";

/**
 * A compass painted flat on the ground so you always know which way you face.
 *
 * The ground's UVs put u=1 at +x and v=1 at +z, and DynamicTexture uploads the
 * canvas flipped, so the top of the canvas lands on +z. North is +z, east +x.
 */
export function createCompassRose(scene: Scene): Mesh {
  const mesh = CreateGround(
    "compass-rose",
    { width: SIZE_METRES, height: SIZE_METRES, subdivisions: 1 },
    scene,
  );
  mesh.position.y = HEIGHT_ABOVE_GROUND;
  mesh.isPickable = false;

  const texture = new DynamicTexture("compass-rose-texture", TEXTURE_SIZE, scene, true);
  paintRose(texture);
  texture.hasAlpha = true;

  const material = new StandardMaterial("compass-rose-material", scene);
  material.diffuseTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  // Emissive stays black so the glow layer leaves the compass alone.
  material.emissiveColor = Color3.Black();
  // Unlit, so it stays readable at midnight when everything else goes dark.
  material.disableLighting = true;
  mesh.material = material;

  mesh.freezeWorldMatrix();
  return mesh;
}

function paintRose(texture: DynamicTexture): void {
  const context = texture.getContext() as Context2d;
  const centre = TEXTURE_SIZE / 2;
  const outerRadius = TEXTURE_SIZE * 0.44;

  context.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  context.lineCap = "round";

  context.strokeStyle = FAINT_COLOUR;
  context.lineWidth = 4;
  context.beginPath();
  context.arc(centre, centre, outerRadius, 0, Math.PI * 2);
  context.stroke();

  drawAxis(context, centre, outerRadius, 0, -1, NORTH_COLOUR, 8);
  drawAxis(context, centre, outerRadius, 0, 1, LINE_COLOUR, 5);
  drawAxis(context, centre, outerRadius, 1, 0, LINE_COLOUR, 5);
  drawAxis(context, centre, outerRadius, -1, 0, LINE_COLOUR, 5);

  const labelRadius = outerRadius * 0.78;
  context.font = `bold ${Math.round(TEXTURE_SIZE * 0.115)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  drawLabel(context, "N", centre, centre - labelRadius, NORTH_COLOUR);
  drawLabel(context, "S", centre, centre + labelRadius, LINE_COLOUR);
  drawLabel(context, "E", centre + labelRadius, centre, LINE_COLOUR);
  drawLabel(context, "W", centre - labelRadius, centre, LINE_COLOUR);

  // invertY: canvas row 0 must land on v=1, which is +z, which is north.
  texture.update(true);
}

/**
 * Babylon's canvas interface leaves out text alignment and line caps, but every
 * browser 2D context has them and DynamicTexture hands us a real one.
 */
type Context2d = ReturnType<DynamicTexture["getContext"]> & {
  textAlign: string;
  textBaseline: string;
  lineCap: string;
};

function drawAxis(
  context: Context2d,
  centre: number,
  radius: number,
  dirX: number,
  dirY: number,
  colour: string,
  width: number,
): void {
  context.strokeStyle = colour;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(centre + dirX * radius * 0.18, centre + dirY * radius * 0.18);
  context.lineTo(centre + dirX * radius * 0.62, centre + dirY * radius * 0.62);
  context.stroke();
}

function drawLabel(context: Context2d, text: string, x: number, y: number, colour: string): void {
  context.fillStyle = colour;
  context.fillText(text, x, y);
}
