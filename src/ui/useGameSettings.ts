import { useSyncExternalStore } from "react";
import { readSettings, subscribeToSettings } from "../settings/settingsStore";
import type { GameSettings } from "../settings/gameSettings";

export function useGameSettings(): GameSettings {
  return useSyncExternalStore(subscribeToSettings, readSettings, readSettings);
}
