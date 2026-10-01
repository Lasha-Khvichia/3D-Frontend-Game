import type { ComponentType } from "react";
import { GameplaySettings } from "./GameplaySettings";
import { GraphicsSettings } from "./GraphicsSettings";
import { SoundSettings } from "./SoundSettings";
import { WorldSettings } from "./WorldSettings";

/** The four names on the pause menu, in the order they are read. */
export const MENU_SECTIONS: readonly { name: string; Rows: ComponentType }[] = [
  { name: "Gameplay", Rows: GameplaySettings },
  { name: "Graphics", Rows: GraphicsSettings },
  { name: "World", Rows: WorldSettings },
  { name: "Sound", Rows: SoundSettings },
];
