import { useSyncExternalStore } from "react";

/**
 * Whether the bag is open. UI state, like the world map's: only the overlay
 * needs it, and it has to work while the game is paused.
 */
let open = false;
const listeners = new Set<() => void>();

export function isBagOpen(): boolean {
  return open;
}

export function setBagOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export function useBagOpen(): boolean {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, isBagOpen);
}
