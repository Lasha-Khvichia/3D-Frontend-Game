import { buildCloudNoise } from "./buildCloudNoise";

type WorkerScope = {
  onmessage: (() => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
};

// Two thirds of a second of arithmetic, kept off the thread that draws frames.
const scope = self as unknown as WorkerScope;
scope.onmessage = () => {
  const noise = buildCloudNoise();
  scope.postMessage(noise, [noise.shape.buffer, noise.detail.buffer, noise.weather.buffer]);
};
