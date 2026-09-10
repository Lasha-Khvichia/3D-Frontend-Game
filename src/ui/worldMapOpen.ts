import { useSyncExternalStore } from "react";

/**
 * Whether the world map is open. UI state, so it lives on this side of the
 * bridge; only the pause menu and the map itself need it.
 */
let open = false;
const listeners = new Set<() => void>();

export function isMapOpen(): boolean {
  return open;
}

export function setMapOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export function useMapOpen(): boolean {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, isMapOpen);
}
