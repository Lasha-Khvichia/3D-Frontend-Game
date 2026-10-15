/** Which hand a thing belongs in when you take it out. */
export type Hand = "main" | "off";

export type ItemKind = {
  readonly id: string;
  /** What the player is told it is. */
  readonly name: string;
  /** How many fit in one slot. A tool is one; seeds will stack. */
  readonly maxStack: number;
  /** The hand it is drawn in. A hoe is swung, a lantern is carried. */
  readonly hand: Hand;
  /** Two or three letters for its slot until there are pictures. */
  readonly mark: string;
  /** The slot's tint on parchment, so a full bar can be read at a glance. */
  readonly tint: string;
};

/** Everything that can be carried. One entry per kind, never per thing held. */
export const ITEM_KINDS: Record<string, ItemKind> = {
  hoe: {
    id: "hoe",
    name: "Hoe",
    maxStack: 1,
    hand: "main",
    mark: "HOE",
    tint: "#5a3a20",
  },
  sword: {
    id: "sword",
    name: "Sword",
    maxStack: 1,
    hand: "main",
    mark: "SWD",
    tint: "#3d4650",
  },
  lantern: {
    id: "lantern",
    name: "Lantern",
    maxStack: 1,
    hand: "off",
    mark: "LMP",
    tint: "#94681f",
  },
};

export function itemKind(id: string): ItemKind | null {
  return ITEM_KINDS[id] ?? null;
}
