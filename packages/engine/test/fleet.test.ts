import { describe, expect, it } from "vitest"
import {
  createEngine,
  validateScenario,
  type Command,
  type Engine,
  type EventBatch,
  type Runtime,
  type SimulationState,
} from "../src"

type Controller = (batch: EventBatch) => Command[]

function recordingRuntime(controller: Controller = () => []) {
  const batches: EventBatch[] = []
  const runtime: Runtime = {
    async load() {
      return null
    },
    async handle(batch) {
      batches.push(structuredClone(batch))
      return { commands: controller(batch), logs: [] }
    },
    dispose() {},
  }
  return { runtime, batches }
}

const building = { min_floor: 0, max_floor: 10 }
const pax = (id: string, at_s: number, from: number, to: number, service?: boolean) => ({
  id,
  at_s,
  from,
  to,
  ...(service && { service }),
})
const moveTo = (floor: number, elevator?: number): Command => ({ type: "move_to", floor, elevator })
const social = { service: false }
const service = { service: true }

async function until(engine: Engine, done: (s: SimulationState) => boolean, max = 1000) {
  for (let i = 0; i < max; i++) {
    const s = await engine.step()
    if (done(s)) return s
  }
  throw new Error("condição não atingida")
}

describe("fleet", () => {
  it("um elevador mantém o formato de antes com a frota no batch", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({ runtime })
    const state = await engine.step()
    expect(batches[0]!.events).toEqual([{ type: "idle" }])
    expect(batches[0]!.elevators).toHaveLength(1)
    expect(batches[0]!.elevator).toEqual(batches[0]!.elevators[0])
    expect(state.elevators).toHaveLength(1)
  })

  it("move_to com elevator move só aquele elevador", async () => {
    const { runtime } = recordingRuntime((b) => (b.tick === 0 ? [moveTo(3, 1)] : []))
    const engine = createEngine({ runtime, fleet: [social, social] })
    const state = await until(engine, (s) => s.elevators![1]!.doors_open)
    expect(state.elevators![1]!.position).toBe(3)
    expect(state.elevators![0]!.position).toBe(0)
  })

  it("stop e idle trazem o elevador que os gerou", async () => {
    const { runtime, batches } = recordingRuntime((b) => (b.tick === 0 ? [moveTo(2, 1)] : []))
    const engine = createEngine({ runtime, fleet: [social, social] })
    await engine.step()
    expect(batches[0]!.events).toEqual([
      { type: "idle", elevator: 0 },
      { type: "idle", elevator: 1 },
    ])
    await until(engine, (s) => s.elevators![1]!.doors_open)
    const stop = batches.flatMap((b) => b.events).find((e) => e.type === "stop")
    expect(stop).toEqual({ type: "stop", floor: 2, elevator: 1 })
  })

  it("elevador de serviço não embarca passageiro comum e o contrário", async () => {
    const { runtime } = recordingRuntime((b) => {
      const stops = b.events.some((e) => e.type === "call_button")
      return stops ? [moveTo(4, 1), moveTo(4, 0)] : []
    })
    const engine = createEngine({
      runtime,
      fleet: [social, service],
      scenario: { building, start_floor: 0, passengers: [pax("A", 0, 4, 8), pax("S", 0, 4, 9, true)] },
    })
    const state = await until(engine, (s) => s.passengers.every((p) => p.state !== "waiting"))
    const byId = Object.fromEntries(state.passengers.map((p) => [p.id, p]))
    expect(byId.A!.elevator).toBe(0)
    expect(byId.S!.elevator).toBe(1)
  })

  it("chamada de serviço é um botão independente da comum", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({
      runtime,
      fleet: [social, service],
      scenario: { building, start_floor: 0, passengers: [pax("A", 0, 4, 8), pax("S", 0, 4, 9, true)] },
    })
    const state = await engine.step()
    expect(state.call_buttons).toEqual([{ floor: 4, direction: null }, { floor: 4, direction: null, service: true }])
    const calls = batches[0]!.events.filter((e) => e.type === "call_button")
    expect(calls).toEqual([
      { type: "call_button", floor: 4, direction: null },
      { type: "call_button", floor: 4, direction: null, service: true },
    ])
  })

  it("elevador comum parado no andar não apaga o botão de serviço", async () => {
    const { runtime } = recordingRuntime((b) => (b.tick === 0 ? [moveTo(0, 0)] : []))
    const engine = createEngine({
      runtime,
      fleet: [social, service],
      scenario: { building, start_floor: 0, passengers: [pax("S", 0, 0, 5, true)] },
    })
    const state = await until(engine, (s) => s.elevators![0]!.doors_open)
    expect(state.call_buttons).toEqual([{ floor: 0, direction: null, service: true }])
  })

  it("press de serviço só vale com elevador de serviço", async () => {
    const { runtime } = recordingRuntime()
    const alone = createEngine({ runtime })
    alone.press("call", 3, undefined, { service: true })
    expect((await alone.step()).call_buttons).toEqual([])
    const both = createEngine({ runtime, fleet: [social, service] })
    both.press("call", 3, undefined, { service: true })
    expect((await both.step()).call_buttons).toEqual([{ floor: 3, direction: null, service: true }])
  })

  it("press de cabine acende o painel do elevador escolhido", async () => {
    const { runtime } = recordingRuntime()
    const engine = createEngine({ runtime, fleet: [social, social] })
    engine.press("cabin", 6, undefined, { elevator: 1 })
    const state = await engine.step()
    expect(state.elevators!.map((e) => e.cabin_buttons)).toEqual([[], [6]])
    expect(state.cabin_buttons).toEqual([])
  })

  it("Scenario inválido: frota fora de 1 a 3, primeiro de serviço ou passageiro sem elevador de serviço", () => {
    const base = { start_floor: 0, passengers: [] }
    const fleet = (elevators: { service: boolean }[]) => validateScenario({ ...base, building: { ...building, elevators } })
    expect(fleet([social, social, social, social])).toMatch(/elevadores/)
    expect(fleet([service, social])).toMatch(/primeiro elevador/)
    expect(fleet([social, service])).toBeNull()
    const lonely = { building, start_floor: 0, passengers: [pax("S", 0, 1, 2, true)] }
    expect(validateScenario(lonely)).toMatch(/Passenger S.*serviço/)
  })
})
