import type { Command, EventBatch, Runtime, RuntimeError } from "@elevator/engine"
import type { PythonRuntime } from "@elevator/runtime-python"
import { act, render, screen } from "@testing-library/react"
import { App } from "../src/App"
import type { Clock } from "../src/simulation"

type Controller = (batch: EventBatch) => Command[]

export type FakeRuntime = PythonRuntime & {
  loads: string[]
  makeReady(): void
}

export function fifoController(): Controller {
  const queue: number[] = []
  return (batch) => {
    for (const e of batch.events) {
      if (e.type === "call_button" || e.type === "cabin_button") queue.push(e.floor)
    }
    const free = batch.elevator.idle || batch.events.some((e) => e.type === "stop" || e.type === "idle")
    const next = free ? queue.shift() : undefined
    return next === undefined ? [] : [{ type: "move_to", floor: next }]
  }
}

export function fakeRuntime(
  controller: Controller = fifoController(),
  failure?: RuntimeError,
): FakeRuntime {
  let makeReady = () => {}
  const ready = new Promise<void>((resolve) => (makeReady = resolve))
  const loads: string[] = []
  const runtime: Runtime = {
    async load(code) {
      loads.push(code)
      return null
    },
    async handle(batch) {
      if (failure) return { error: failure }
      return { commands: controller(batch), logs: [] }
    },
    dispose() {},
  }
  return { ...runtime, ready: () => ready, loads, makeReady: () => makeReady() }
}

export type FakeClock = Clock & { advance(ms: number): Promise<void> }

export function fakeClock(): FakeClock {
  let now = 0
  let waiting: (() => void) | null = null
  return {
    now: () => now,
    nextFrame: () => new Promise<void>((resolve) => (waiting = resolve)),
    async advance(ms) {
      await act(async () => {
        now += ms
        waiting?.()
        waiting = null
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    },
  }
}

export function renderApp(runtime: FakeRuntime = fakeRuntime(), clock: FakeClock = fakeClock()) {
  runtime.makeReady()
  const result = render(<App createRuntime={() => runtime} clock={clock} />)
  return { runtime, clock, ...result }
}

export const button = (name: RegExp | string) => screen.getByRole("button", { name })
