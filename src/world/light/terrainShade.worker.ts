import { sweepShade, type ShadeHeights } from "./terrainShade";

/** First the island's heights, once; then a light direction whenever the shade must follow it. */
export type ShadeRequest =
  | { readonly kind: "heights"; readonly grid: ShadeHeights }
  | { readonly kind: "light"; readonly toward: readonly number[] };

/** The shade for the direction it was asked for. */
export type ShadeReply = { readonly toward: readonly number[]; readonly shade: Float32Array };

type WorkerScope = {
  onmessage: ((event: MessageEvent<ShadeRequest>) => void) | null;
  postMessage(message: ShadeReply, transfer: Transferable[]): void;
};

// A few milliseconds of arithmetic every couple of seconds, kept off the thread that draws.
const scope = self as unknown as WorkerScope;
let grid: ShadeHeights | null = null;
scope.onmessage = (event) => {
  const request = event.data;
  if (request.kind === "heights") {
    grid = request.grid;
    return;
  }
  if (!grid) return;
  const shade = new Float32Array(grid.heights.length);
  sweepShade(grid, request.toward, shade);
  scope.postMessage({ toward: request.toward, shade }, [shade.buffer]);
};
