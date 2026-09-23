import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { PlacedOpening } from "../houses/placeOpenings";

/** Metres the glow sits in from the wall's outer face, so it reads as light inside the hole. */
const SET_IN = 0.05;

/**
 * The warm light of a room seen through its window: one flat unlit sheet in
 * each lit window hole, drawn together in one call.
 *
 * The sheet faces out and has no back, so from inside the room it is not
 * there at all and the window looks out on the night. Shut shutters stand in
 * front of it, and it shows only through the gaps between their planks. Only
 * the lit windows are in the buffer, rewritten only when one goes on or off.
 */
export class WindowGlow {
  private readonly mesh: Mesh;
  private readonly places: Float32Array;
  private readonly colours: Float32Array;
  private shown: readonly (Color3 | null)[] = [];

  constructor(
    scene: Scene,
    private readonly windows: readonly PlacedOpening[],
  ) {
    this.mesh = CreatePlane("window-glow", { size: 1 }, scene);
    const look = new StandardMaterial("window-glow", scene);
    look.disableLighting = true;
    look.emissiveColor = Color3.White();
    this.mesh.material = look;
    this.mesh.isPickable = false;
    // Instances spread across the island; the mesh's own box is one square metre at the origin.
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.places = new Float32Array(windows.length * 16);
    this.colours = new Float32Array(windows.length * 4);
    this.mesh.thinInstanceSetBuffer("matrix", this.places, 16, false);
    this.mesh.thinInstanceSetBuffer("color", this.colours, 4, false);
    this.mesh.setEnabled(false);
  }

  /** `colourOf` gives each lit window's glow, or null for a dark one; the same colour object each time. */
  show(colourOf: (index: number) => Color3 | null): void {
    const lit = this.windows.map((_, index) => colourOf(index));
    if (lit.every((colour, index) => colour === this.shown[index])) return;
    this.shown = lit;
    let count = 0;
    lit.forEach((colour, index) => {
      if (!colour) return;
      placeInHole(this.windows[index]!).copyToArray(this.places, count * 16);
      colour.toArray(this.colours, count * 4);
      this.colours[count * 4 + 3] = 1;
      count += 1;
    });
    this.mesh.setEnabled(count > 0);
    this.mesh.thinInstanceCount = count;
    this.mesh.thinInstanceBufferUpdated("matrix");
    this.mesh.thinInstanceBufferUpdated("color");
  }
}

const turn = new Quaternion();
const size = new Vector3();
const middle = new Vector3();
const placed = new Matrix();

/** The sheet filling a window hole, just inside its outer face, facing out. */
function placeInHole(hole: PlacedOpening): Matrix {
  const { centre, outward } = hole;
  // A plane faces −Z; this turn points that way out of the wall.
  Quaternion.RotationYawPitchRollToRef(Math.atan2(-outward.x, -outward.z), 0, 0, turn);
  size.set(hole.width, hole.height, 1);
  middle.copyFrom(centre).addInPlace(outward.scale(hole.wallThickness / 2 - SET_IN));
  return Matrix.ComposeToRef(size, turn, middle, placed);
}
