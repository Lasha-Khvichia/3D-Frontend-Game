import { useEffect, useRef, useState } from "react";

/** How long the four names take to leave before the section arrives. */
const HANDOVER_MS = 180;

/**
 * Which settings section is open, with a beat in between.
 *
 * The four names cannot animate out once React has removed them, so the click
 * marks them leaving, waits for that to play, and only then swaps in the
 * section. The timer is cleared on unmount: the menu goes the moment the mouse
 * is taken back, which is well inside those 180 ms.
 */
export function useSectionDrill<T extends string>() {
  const [open, setOpen] = useState<T | null>(null);
  const [leaving, setLeaving] = useState<T | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return {
    open,
    leaving,
    enter(name: T): void {
      setLeaving(name);
      timer.current = window.setTimeout(() => {
        setOpen(name);
        setLeaving(null);
      }, HANDOVER_MS);
    },
    back(): void {
      setOpen(null);
    },
  };
}
