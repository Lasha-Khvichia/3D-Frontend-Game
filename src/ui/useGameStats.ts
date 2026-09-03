import { useSyncExternalStore } from "react";
import { readStats, subscribeToStats, type GameStats } from "./bridge";

export function useGameStats(): GameStats {
  return useSyncExternalStore(subscribeToStats, readStats, readStats);
}
