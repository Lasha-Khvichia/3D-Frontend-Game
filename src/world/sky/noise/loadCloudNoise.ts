import { buildCloudNoise, type CloudNoise } from "./buildCloudNoise";

/**
 * The cloud noise, built in a worker so the game keeps drawing while it is.
 *
 * It takes about two thirds of a second, which on the main thread would be a
 * visible stall at startup. The sky is drawn without clouds until it arrives.
 * Where there are no workers — the headless test harness — it is built in
 * place instead.
 */
export function loadCloudNoise(): Promise<CloudNoise> {
  if (typeof Worker === "undefined") return Promise.resolve(buildCloudNoise());
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./cloudNoise.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<CloudNoise>) => {
      resolve(event.data);
      worker.terminate();
    };
    worker.onerror = (error) => {
      reject(new Error(`cloud noise worker failed: ${error.message}`));
      worker.terminate();
    };
    worker.postMessage("build");
  });
}
