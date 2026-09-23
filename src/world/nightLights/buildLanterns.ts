import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";
import { circleBlocker, type GrassBlocker } from "../grassBlockers";
import type { House } from "../houses/buildHouse";
import { mergeBoxes } from "../houses/mergeBoxes";
import { SETTLEMENTS } from "../houses/settlements";
import type { DistanceGroup } from "../ShownByDistance";
import { lanternPlaces, type LanternPlace } from "./lanternPlaces";
import { bracketBoxes, cageBoxes, glassBox, POST_RADIUS, postBox } from "./lanternSizes";

export type Lanterns = ReturnType<typeof buildLanterns>;

/**
 * Every lantern, as three meshes a settlement — iron, wooden posts, glowing
 * glass — and an invisible block round each post to walk into. The glass is
 * seen from as far as the houses are; the iron and posts only as far as the
 * houses' trim. `NightLights` turns the glass up at dusk.
 */
export function buildLanterns(scene: Scene, houses: readonly House[]) {
  const places = lanternPlaces(houses);
  const iron = material(scene, "lantern-iron", new Color3(0.13, 0.12, 0.11));
  const wood = material(scene, "lantern-post", new Color3(0.27, 0.2, 0.13));
  const glass = new StandardMaterial("lantern-glass", scene);
  glass.disableLighting = true;
  glass.emissiveColor = new Color3(0.1, 0.07, 0.04);
  const bodies: DistanceGroup[] = [];
  const details: DistanceGroup[] = [];
  const shadowCasters: Mesh[] = [];
  const drawn: Mesh[] = [];
  SETTLEMENTS.forEach((settlement, index) => {
    const own = places.filter((place) => place.settlement === index);
    const posts = own.filter((place) => !place.wall).map((p) => postBox(p.x, p.z));
    const name = `${settlement.name}-lantern`;
    const frames = mergeBoxes(scene, `${name}-iron`, own.flatMap(ironOf));
    const glowing = mergeBoxes(
      scene,
      `${name}-glass`,
      own.map((p) => glassBox(p.x, p.y, p.z)),
    );
    const wooden = mergeBoxes(scene, `${name}-posts`, posts);
    const blocks = mergeBoxes(scene, `${name}-post-blocks`, posts);
    for (const [mesh, look] of [
      [frames, iron],
      [glowing, glass],
      [wooden, wood],
    ] as const) {
      if (!mesh) continue;
      mesh.material = look;
      mesh.receiveShadows = look !== glass;
      mesh.layerMask = FINE_DETAIL_LAYER;
    }
    if (blocks) {
      // No material: a collider with one is solid from inside too (see CLAUDE.md).
      blocks.isVisible = false;
      blocks.checkCollisions = true;
    }
    const place = { x: settlement.centreX, z: settlement.centreZ, radius: settlement.clearance };
    if (glowing) bodies.push({ ...place, nodes: [glowing] });
    details.push({ ...place, nodes: [frames, wooden, blocks].filter((m): m is Mesh => !!m) });
    shadowCasters.push(...[frames, wooden].filter((m): m is Mesh => !!m));
    drawn.push(...[frames, glowing, wooden].filter((m): m is Mesh => !!m));
  });
  const grassBlockers: GrassBlocker[] = places
    .filter((place) => !place.wall)
    .map((place) => circleBlocker(place.x, place.z, POST_RADIUS));
  // Too small to block a sun shaft worth drawing.
  const occlusionSkips = drawn;
  return {
    places,
    glass,
    groups: { bodies, details },
    shadowCasters,
    occlusionSkips,
    grassBlockers,
  };
}

function ironOf(place: LanternPlace) {
  const { x, y, z, wall } = place;
  return [...cageBoxes(x, y, z), ...(wall ? bracketBoxes(x, y, z, wall.outX, wall.outZ) : [])];
}

function material(scene: Scene, name: string, colour: Color3): StandardMaterial {
  const look = new StandardMaterial(name, scene);
  look.diffuseColor = colour;
  look.specularColor = Color3.Black();
  return look;
}
