import { Worker } from "node:worker_threads"
import type { WorkerPort } from "../src/protocol.ts"

export function nodeWorker(): WorkerPort {
  const worker = new Worker(new URL("./node-worker.ts", import.meta.url))
  return {
    postMessage: (message) => worker.postMessage(message),
    onMessage: (listener) => worker.on("message", listener),
    onError: (listener) => worker.on("error", (e) => listener(e.message)),
    terminate: () => void worker.terminate(),
  }
}
