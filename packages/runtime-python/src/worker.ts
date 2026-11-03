import { loadPyodide, version } from "pyodide"
import apiSource from "./elevator_api.py?raw"
import type { WorkerReply, WorkerRequest } from "./protocol.ts"
import { serve } from "./worker-core.ts"

export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`

serve(
  {
    post: (message: WorkerReply) => self.postMessage(message),
    listen: (listener) =>
      self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => listener(event.data)),
  },
  () => loadPyodide({ indexURL: PYODIDE_CDN }),
  apiSource,
)
