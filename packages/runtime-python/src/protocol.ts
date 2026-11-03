import type { Command, EventBatch, RuntimeError } from "@elevator/engine"

export type HandleResult = { commands: Command[]; logs: string[] } | { error: RuntimeError }

export type WorkerRequest =
  | { id: number; type: "load"; code: string }
  | { id: number; type: "handle"; batch: EventBatch }

export type WorkerReply =
  | { type: "ready" }
  | { type: "boot_error"; message: string }
  | { id: number; type: "load"; result: RuntimeError | null }
  | { id: number; type: "handle"; result: HandleResult }

export interface WorkerPort {
  postMessage(message: WorkerRequest): void
  onMessage(listener: (message: WorkerReply) => void): void
  onError(listener: (message: string) => void): void
  terminate(): void
}
