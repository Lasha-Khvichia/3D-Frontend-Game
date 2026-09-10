import { chimneyWallFor } from "./chimneyWallFor";
import type { Side } from "./houseBlueprint";
import { HOUSE_SHAPES, type HouseName } from "./houseShapes";
import { createSeededRandom, seedFromText } from "./seededRandom";
import type { PlacedHouse } from "./villageHouses";

/**
 * The outlying hamlets, in metres from the middle of the map.
 *
 * Spread around the compass and 400 m to 800 m out, so that from most of the
 * map there is a roof on the horizon in some direction, and from none of it
 * are there two hamlets close enough together to read as one place.
 */
export const HAMLET_SITES: readonly { name: string; x: number; z: number }[] = [
  { name: "millbrook", x: -560, z: 430 },
  { name: "thornhollow", x: 610, z: 250 },
  { name: "greyfen", x: -380, z: -640 },
  { name: "oxmead", x: 520, z: -540 },
  { name: "harrowgate", x: -730, z: -160 },
];

/** Cottages round a green rather than a street. Three is a hamlet, ten is a village. */
const HOUSES_PER_HAMLET = 3;
/**
 * How far each cottage stands from the middle of its green. Three houses this
 * far apart leave 26 m between neighbours, and the widest of these is 7.5 m.
 */
const GREEN_RADIUS = 15;

/** The small shapes only. The barn, the longhouse and the hall belong to the village. */
const HAMLET_SHAPES: readonly HouseName[] = [
  "cottageWest",
  "cottageEast",
  "weavers",
  "bakehouse",
  "stable",
  "storehouse",
  "workshop",
];

/** Places one hamlet's cottages in a ring, every door facing the green. */
export function hamletHouses(site: { name: string; x: number; z: number }): PlacedHouse[] {
  const random = createSeededRandom(seedFromText(site.name));
  const spare = [...HAMLET_SHAPES];
  const turn = random() * Math.PI * 2;

  const houses: PlacedHouse[] = [];
  for (let index = 0; index < HOUSES_PER_HAMLET; index += 1) {
    const angle = turn + (index / HOUSES_PER_HAMLET) * Math.PI * 2;
    const offsetX = Math.sin(angle) * GREEN_RADIUS;
    const offsetZ = Math.cos(angle) * GREEN_RADIUS;

    // Drawn without replacement, so no hamlet is the same cottage three times.
    const shapeName = spare.splice(Math.floor(random() * spare.length), 1)[0] ?? "weavers";
    const shape = HOUSE_SHAPES[shapeName];
    const name = `${site.name}-${shapeName}`;
    const doorWall = facing(offsetX, offsetZ);

    houses.push({
      blueprint: {
        ...shape,
        name,
        doorWall,
        chimneyWall: chimneyWallFor(name, shape.ridgeAxis, doorWall),
      },
      centreX: site.x + offsetX,
      centreZ: site.z + offsetZ,
    });
  }
  return houses;
}

/**
 * Which wall to cut the door into, for a house standing this far off the green.
 *
 * The door goes on the side pointing back at the middle. Whichever offset is
 * larger decides the wall, so a house to the north-east of the green faces
 * whichever of south or west it is more nearly opposite.
 */
function facing(offsetX: number, offsetZ: number): Side {
  if (Math.abs(offsetX) > Math.abs(offsetZ)) return offsetX > 0 ? "west" : "east";
  return offsetZ > 0 ? "south" : "north";
}
