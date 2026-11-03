import type { EventBatch, Runtime, RuntimeError } from "@elevator/engine"
import type { HandleResult, WorkerPort, WorkerReply, WorkerRequest } from "./protocol.ts"

export const HANDLE_TIMEOUT_MS = 1000

export type PythonRuntime = Runtime & { ready(): Promise<void> }

export type PythonRuntimeOptions = {
  createWorker?: () => WorkerPort
  timeout_ms?: number
}

type RequestBody = WorkerRequest extends infer R ? (R extends unknown ? Omit<R, "id"> : never) : never

type Reply = Extract<WorkerReply, { id: number }>["result"]

type Session = {
  port: WorkerPort
  ready: Promise<void>
  pending: Map<number, (reply: Reply | RuntimeError) => void>
}

const timeoutError = (ms: number): RuntimeError => ({
  kind: "timeout",
  message: `Tempo esgotado: o código passou de ${ms} ms sem responder (loop infinito?)`,
})

const failure = (message: string): RuntimeError => ({ kind: "exception", message })

export function browserWorker(): WorkerPort {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  return {
    postMessage: (message) => worker.postMessage(message),
    onMessage: (listener) => worker.addEventListener("message", (e) => listener(e.data)),
    onError: (listener) => worker.addEventListener("error", (e) => listener(e.message)),
    terminate: () => worker.terminate(),
  }
}

export function createPythonRuntime({
  createWorker = browserWorker,
  timeout_ms = HANDLE_TIMEOUT_MS,
}: PythonRuntimeOptions = {}): PythonRuntime {
  let session: Session | null = null
  let nextId = 0

  function start(): Session {
    const port = createWorker()
    const pending: Session["pending"] = new Map()
    const s: Session = { port, pending, ready: Promise.resolve() }
    s.ready = new Promise<void>((resolve, reject) => {
      port.onMessage((reply) => {
        if (reply.type === "ready") return resolve()
        if (reply.type === "boot_error") {
          stop(s, reply.message)
          return reject(new Error(reply.message))
        }
        const settle = pending.get(reply.id)
        pending.delete(reply.id)
        settle?.(reply.result)
      })
      port.onError((message) => {
        stop(s, message)
        reject(new Error(message))
      })
    })
    s.ready.catch(() => undefined)
    return s
  }

  function stop(s: Session, reason: string) {
    s.port.terminate()
    for (const settle of s.pending.values()) settle(failure(reason))
    s.pending.clear()
    if (session === s) session = null
  }

  async function call(s: Session, request: RequestBody): Promise<Reply | RuntimeError> {
    try {
      await s.ready
    } catch (e) {
      return failure(`Falha ao carregar o Python: ${e instanceof Error ? e.message : String(e)}`)
    }
    return new Promise((resolve) => {
      const id = ++nextId
      const timer = setTimeout(() => {
        s.pending.delete(id)
        stop(s, "encerrado")
        resolve(timeoutError(timeout_ms))
      }, timeout_ms)
      s.pending.set(id, (reply) => {
        clearTimeout(timer)
        resolve(reply)
      })
      s.port.postMessage({ ...request, id } as WorkerRequest)
    })
  }

  const isError = (reply: unknown): reply is RuntimeError =>
    typeof reply === "object" && reply !== null && "kind" in reply

  session = start()

  return {
    ready() {
      return (session ??= start()).ready
    },
    async load(code) {
      const reply = await call((session ??= start()), { type: "load", code })
      return reply as RuntimeError | null
    },
    async handle(batch: EventBatch): Promise<HandleResult> {
      if (!session) return { error: failure("Nenhum código carregado: rode load antes de handle") }
      const reply = await call(session, { type: "handle", batch })
      return isError(reply) ? { error: reply } : (reply as HandleResult)
    },
    dispose() {
      if (session) stop(session, "Runtime encerrado")
    },
  }
}
