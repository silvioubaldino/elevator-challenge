import { readFileSync } from "node:fs"
import { afterEach, describe, expect, it } from "vitest"
import type { Event, EventBatch, RuntimeError } from "@elevator/engine"
import { createPythonRuntime, type PythonRuntime } from "../src/runtime.ts"
import { nodeWorker } from "./node-port.ts"

const elevator = {
  id: 0,
  service: false,
  current_floor: 0,
  target_floor: null,
  direction: null,
  idle: true,
  min_floor: 0,
  max_floor: 10,
} as const

const batch = (...events: Event[]): EventBatch => ({
  tick: 0,
  elevator: { ...elevator },
  elevators: [{ ...elevator }],
  events,
})
const fleetBatch = (...events: Event[]): EventBatch => {
  const second = { ...elevator, id: 1, service: true, current_floor: 5 }
  return { tick: 0, elevator: { ...elevator }, elevators: [{ ...elevator }, second], events }
}
const template = readFileSync(new URL("../src/template.py", import.meta.url), "utf8")

let runtime: PythonRuntime

async function boot(code: string, timeout_ms?: number) {
  runtime = createPythonRuntime({ createWorker: nodeWorker, timeout_ms })
  await runtime.ready()
  return runtime.load(code)
}

afterEach(() => runtime?.dispose())

describe("runtime-python", () => {
  it("template não faz nada", async () => {
    expect(await boot(template)).toBeNull()
    for (const event of [
      { type: "idle" },
      { type: "call_button", floor: 3, direction: null },
      { type: "cabin_button", floor: 5 },
      { type: "stop", floor: 2 },
    ] as Event[]) {
      expect(await runtime.handle(batch(event))).toEqual({ commands: [], logs: [] })
    }
  }, 60_000)

  it("move_to vira Command", async () => {
    await boot("def on_call_button(elevator, floor):\n    elevator.move_to(floor)\n")
    expect(await runtime.handle(batch({ type: "call_button", floor: 7, direction: null }))).toEqual({
      commands: [{ type: "move_to", floor: 7 }],
      logs: [],
    })
  }, 60_000)

  it("Handler na ordem do batch", async () => {
    await boot(
      "def on_stop(elevator, floor):\n    print('stop', floor)\n" +
        "def on_cabin_button(elevator, floor):\n    print('cabin', floor)\n",
    )
    const result = await runtime.handle(
      batch({ type: "stop", floor: 4 }, { type: "cabin_button", floor: 8 }),
    )
    expect(result).toEqual({ commands: [], logs: ["stop 4", "cabin 8"] })
  }, 60_000)

  it("estado do aluno persiste", async () => {
    await boot(
      "calls = []\n" +
        "def on_call_button(elevator, floor):\n    calls.append(floor)\n    print(calls)\n",
    )
    await runtime.handle(batch({ type: "call_button", floor: 3, direction: null }))
    const second = await runtime.handle(batch({ type: "call_button", floor: 5, direction: null }))
    expect(second).toEqual({ commands: [], logs: ["[3, 5]"] })
  }, 60_000)

  it("target_floor reflete o move_to do batch", async () => {
    await boot(
      "def on_call_button(elevator, floor):\n    elevator.move_to(6)\n    print(elevator.target_floor())\n",
    )
    const result = await runtime.handle(batch({ type: "call_button", floor: 1, direction: null }))
    expect(result).toMatchObject({ logs: ["6"] })
  }, 60_000)

  it("move_to fora do prédio", async () => {
    await boot("def on_call_button(elevator, floor):\n    elevator.move_to(11)\n")
    const result = await runtime.handle(batch({ type: "call_button", floor: 1, direction: null }))
    expect(result).toMatchObject({ error: { kind: "exception", line: 2 } })
    const { error } = result as { error: RuntimeError }
    expect(error.message).toContain("fora do prédio")
  }, 60_000)

  it("erro de sintaxe", async () => {
    const error = await boot("def on_idle(elevator):\n    pass\nx = = 1\n")
    expect(error).toMatchObject({ kind: "syntax", line: 3 })
  }, 60_000)

  it("loop infinito", async () => {
    await boot("def on_idle(elevator):\n    while True:\n        pass\n")
    const started = Date.now()
    const result = await runtime.handle(batch({ type: "idle" }))
    expect(result).toMatchObject({ error: { kind: "timeout" } })
    expect(Date.now() - started).toBeLessThan(1500)
    expect(await runtime.load("def on_idle(elevator):\n    print('ok')\n")).toBeNull()
    expect(await runtime.handle(batch({ type: "idle" }))).toEqual({ commands: [], logs: ["ok"] })
  }, 60_000)

  it("Handler de chamada recebe a direção quando aceita três parâmetros", async () => {
    await boot("def on_call_button(elevator, floor, direction):\n    print(floor, direction)\n")
    const result = await runtime.handle(batch({ type: "call_button", floor: 3, direction: "down" }))
    expect(result).toEqual({ commands: [], logs: ["3 down"] })
    const single = await runtime.handle(batch({ type: "call_button", floor: 4, direction: null }))
    expect(single).toEqual({ commands: [], logs: ["4 None"] })
  }, 60_000)

  it("Handler de chamada com dois parâmetros segue funcionando com direção", async () => {
    await boot("def on_call_button(elevator, floor):\n    print(floor)\n")
    const result = await runtime.handle(batch({ type: "call_button", floor: 3, direction: "up" }))
    expect(result).toEqual({ commands: [], logs: ["3"] })
  }, 60_000)

  it("Handler ausente", async () => {
    await boot("def on_call_button(elevator, floor):\n    pass\n")
    expect(await runtime.handle(batch({ type: "idle" }))).toEqual({ commands: [], logs: [] })
  }, 60_000)

  it("Handler de chamada com quatro parâmetros recebe o tipo do botão", async () => {
    await boot("def on_call_button(elevator, floor, direction, service):\n    print(floor, direction, service, elevator.id())\n")
    const social = await runtime.handle(fleetBatch({ type: "call_button", floor: 3, direction: null }))
    expect(social).toEqual({ commands: [], logs: ["3 None False 0"] })
    const serviceCall = await runtime.handle(fleetBatch({ type: "call_button", floor: 4, direction: null, service: true }))
    expect(serviceCall).toEqual({ commands: [], logs: ["4 None True 1"] })
  }, 60_000)

  it("Handler de chamada com dois parâmetros segue valendo com frota", async () => {
    await boot("def on_call_button(elevator, floor):\n    print(floor)\n    elevator.move_to(floor)\n")
    const result = await runtime.handle(fleetBatch({ type: "call_button", floor: 4, direction: null, service: true }))
    expect(result).toEqual({ commands: [{ type: "move_to", floor: 4, elevator: 1 }], logs: ["4"] })
  }, 60_000)

  it("fleet lista todos os elevadores e move_to vale para o escolhido", async () => {
    await boot(
      "def on_idle(elevator):\n" +
        "    print([(e.id(), e.is_service(), e.current_floor()) for e in elevator.fleet()])\n" +
        "    elevator.fleet()[1].move_to(8)\n",
    )
    const result = await runtime.handle(fleetBatch({ type: "idle", elevator: 0 }))
    expect(result).toEqual({
      commands: [{ type: "move_to", floor: 8, elevator: 1 }],
      logs: ["[(0, False, 0), (1, True, 5)]"],
    })
  }, 60_000)

  it("stop e idle chegam com o elevador que os gerou", async () => {
    await boot("def on_stop(elevator, floor):\n    print(elevator.id(), floor)\n")
    const result = await runtime.handle(fleetBatch({ type: "stop", floor: 5, elevator: 1 }))
    expect(result).toEqual({ commands: [], logs: ["1 5"] })
  }, 60_000)
})
