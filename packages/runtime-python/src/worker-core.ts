import type { PyodideAPI } from "pyodide"
import type { WorkerReply, WorkerRequest } from "./protocol.ts"

export type WorkerScope = {
  post(message: WorkerReply): void
  listen(listener: (message: WorkerRequest) => void): void
}

export function serve(scope: WorkerScope, boot: () => Promise<PyodideAPI>, apiSource: string) {
  const api = boot().then((pyodide) => {
    const module = pyodide.globals.get("dict")()
    pyodide.runPython(apiSource, { globals: module })
    return {
      load: module.get("load") as (code: string) => string,
      handle: module.get("handle") as (batch: string) => string,
    }
  })

  api.then(
    () => scope.post({ type: "ready" }),
    (error: unknown) => scope.post({ type: "boot_error", message: String(error) }),
  )

  scope.listen(async (request) => {
    const { load, handle } = await api
    if (request.type === "load") {
      scope.post({ id: request.id, type: "load", result: JSON.parse(load(request.code)) })
    } else {
      scope.post({ id: request.id, type: "handle", result: JSON.parse(handle(JSON.stringify(request.batch))) })
    }
  })
}
