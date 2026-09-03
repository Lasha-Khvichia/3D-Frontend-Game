import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Overlay } from "./Overlay";

let root: Root | null = null;

export function mountOverlay(container: HTMLElement): void {
  root ??= createRoot(container);
  root.render(
    <StrictMode>
      <Overlay />
    </StrictMode>,
  );
}

export function unmountOverlay(): void {
  root?.unmount();
  root = null;
}
