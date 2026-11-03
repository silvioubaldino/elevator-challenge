import { readFileSync } from "node:fs"
import { parentPort } from "node:worker_threads"
import { loadPyodide } from "pyodide"
import type { WorkerRequest } from "../src/protocol.ts"
import { serve } from "../src/worker-core.ts"

const port = parentPort!
serve(
  {
    post: (message) => port.postMessage(message),
    listen: (listener) => port.on("message", (message: WorkerRequest) => listener(message)),
  },
  () => loadPyodide(),
  readFileSync(new URL("../src/elevator_api.py", import.meta.url), "utf8"),
)
