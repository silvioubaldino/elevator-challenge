import { createEngine } from "@elevator/engine"
import { createPythonRuntime, TEMPLATE } from "@elevator/runtime-python"
import { afterEach, describe, expect, it } from "vitest"
import solution from "../src/demo/solution.py?raw"
import { DEMO_SCENARIO } from "../src/demo"
import { Worker } from "node:worker_threads"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import type { WorkerPort } from "@elevator/runtime-python"

const workerFile = pathToFileURL(resolve(process.cwd(), "../../packages/runtime-python/test/node-worker.ts"))

function nodeWorker(): WorkerPort {
  const worker = new Worker(workerFile)
  return {
    postMessage: (message) => worker.postMessage(message),
    onMessage: (listener) => worker.on("message", listener),
    onError: (listener) => worker.on("error", (e) => listener(e.message)),
    terminate: () => void worker.terminate(),
  }
}


const runtimes: { dispose(): void }[] = []
afterEach(() => runtimes.splice(0).forEach((r) => r.dispose()))

async function play(code: string) {
  const runtime = createPythonRuntime({ createWorker: nodeWorker })
  runtimes.push(runtime)
  await runtime.ready()
  expect(await runtime.load(code)).toBeNull()
  const engine = createEngine({ runtime, scenario: DEMO_SCENARIO })
  let state = engine.state()
  while (state.status === "running") state = await engine.step()
  return state
}

describe("demo solution", () => {
  it("delivers every passenger within the time limit", async () => {
    const state = await play(solution)
    expect(state.status).toBe("success")
    expect(state.tick).toBeLessThan(DEMO_SCENARIO.time_limit_s * 10)
  }, 120000)

  it("finishes at the same instant on every run", async () => {
    const first = await play(solution)
    const second = await play(solution)
    expect(second.tick).toBe(first.tick)
  }, 120000)

  it("times out with the empty template", async () => {
    const state = await play(TEMPLATE)
    expect(state.status).toBe("timeout")
    expect(state.passengers.length).toBe(DEMO_SCENARIO.passengers.length)
  }, 120000)
})
