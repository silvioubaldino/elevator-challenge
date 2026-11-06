import { describe, expect, it } from "vitest"
import { createEngine, type Command, type Engine, type EventBatch, type Runtime, type SimulationState } from "../src"

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
const pax = (id: string, at_s: number, from: number, to: number) => ({ id, at_s, from, to })
const moveTo = (floor: number): Command => ({ type: "move_to", floor })
const stoppedAt = (floor: number) => (batch: EventBatch) =>
  batch.events.some((e) => e.type === "stop" && e.floor === floor)
const callEvents = (batches: EventBatch[]) =>
  batches.flatMap((b) => b.events).filter((e) => e.type === "call_button")

async function until(engine: Engine, done: (s: SimulationState) => boolean, max = 1000) {
  for (let i = 0; i < max; i++) {
    const s = await engine.step()
    if (done(s)) return s
  }
  throw new Error("condição não atingida")
}

const waitingAt = (state: SimulationState, id: string) =>
  state.passengers.find((p) => p.id === id)!.state

function liftTo(...stops: number[]): Controller {
  const route = [...stops]
  return (batch) => {
    const arrived = batch.events.some((e) => e.type === "stop" || e.type === "idle")
    const next = arrived ? route.shift() : undefined
    return next === undefined ? [] : [moveTo(next)]
  }
}

describe("directional calls", () => {
  it("botões subir e descer do mesmo andar acendem de forma independente", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: { building, start_floor: 0, passengers: [pax("A", 0, 3, 7), pax("B", 0, 3, 1)] },
    })
    const state = await engine.step()
    expect(callEvents(batches)).toEqual([
      { type: "call_button", floor: 3, direction: "up" },
      { type: "call_button", floor: 3, direction: "down" },
    ])
    expect(state.call_buttons).toEqual([
      { floor: 3, direction: "up" },
      { floor: 3, direction: "down" },
    ])
  })

  it("andares extremos têm um botão só", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({ runtime, directionalCalls: true })
    engine.press("call", 0, "down")
    engine.press("call", 10, "up")
    engine.press("call", 5)
    const state = await engine.step()
    expect(state.call_buttons).toEqual([])
    expect(callEvents(batches)).toEqual([])
  })

  it("press com direção acende o botão do Sandbox", async () => {
    const { runtime } = recordingRuntime()
    const engine = createEngine({ runtime, directionalCalls: true })
    engine.press("call", 4, "down")
    const state = await engine.step()
    expect(state.call_buttons).toEqual([{ floor: 4, direction: "down" }])
    expect(state.log.map((l) => l.text)).toContain("call_button(4, down)")
  })

  it("não embarca quem vai no sentido contrário e o Elevator segue", async () => {
    const { runtime, batches } = recordingRuntime(liftTo(5, 10))
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: { building, start_floor: 0, passengers: [pax("B", 0, 5, 2)] },
    })
    const atFive = await until(engine, () => batches.some(stoppedAt(5)))
    expect(atFive.elevator.doors_open).toBe(true)
    expect(waitingAt(atFive, "B")).toBe("waiting")
    expect(atFive.call_buttons).toEqual([{ floor: 5, direction: "down" }])
    await until(engine, () => batches.some(stoppedAt(10)))
    expect(batches.flatMap((b) => b.events).some((e) => e.type === "cabin_button")).toBe(false)
  })

  it("embarca só quem vai no mesmo sentido e apaga só o botão atendido", async () => {
    const { runtime, batches } = recordingRuntime(liftTo(5))
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: {
        building,
        start_floor: 0,
        passengers: [pax("A", 0, 5, 8), pax("B", 0, 5, 2)],
      },
    })
    const state = await until(engine, () => batches.some(stoppedAt(5)))
    expect(waitingAt(state, "A")).toBe("riding")
    expect(waitingAt(state, "B")).toBe("waiting")
    expect(state.call_buttons).toEqual([{ floor: 5, direction: "down" }])
    expect(state.cabin_buttons).toEqual([8])
    const stopBatch = batches.find(stoppedAt(5))!
    expect(stopBatch.events.map((e) => e.type)).toEqual(["stop", "cabin_button"])
  })

  it("Elevator parado atende qualquer sentido", async () => {
    const { runtime } = recordingRuntime((batch) =>
      batch.events.some((e) => e.type === "call_button") ? [moveTo(5)] : [],
    )
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: { building, start_floor: 5, passengers: [pax("B", 0, 5, 2)] },
    })
    const state = await until(engine, (s) => waitingAt(s, "B") === "riding")
    expect(state.call_buttons).toEqual([])
    expect(state.cabin_buttons).toEqual([2])
  })

  it("no andar mais alto o sentido se inverte e embarca quem desce", async () => {
    const { runtime, batches } = recordingRuntime(liftTo(10))
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: { building, start_floor: 0, passengers: [pax("B", 0, 10, 4)] },
    })
    const state = await until(engine, () => batches.some(stoppedAt(10)))
    expect(waitingAt(state, "B")).toBe("riding")
    expect(state.call_buttons).toEqual([])
  })

  it("Passenger que aparece com as portas abertas contra o sentido espera", async () => {
    const { runtime, batches } = recordingRuntime(liftTo(5))
    const engine = createEngine({
      runtime,
      directionalCalls: true,
      scenario: { building, start_floor: 0, passengers: [pax("B", 6, 5, 2)] },
    })
    await until(engine, () => batches.some(stoppedAt(5)))
    const state = await until(engine, (s) => s.passengers.length === 1)
    expect(state.elevator.doors_open).toBe(true)
    expect(waitingAt(state, "B")).toBe("waiting")
    expect(state.call_buttons).toEqual([{ floor: 5, direction: "down" }])
  })

  it("sem DirectionalCalls o botão é único e todos embarcam", async () => {
    const { runtime, batches } = recordingRuntime(liftTo(5))
    const engine = createEngine({
      runtime,
      scenario: { building, start_floor: 0, passengers: [pax("B", 0, 5, 2)] },
    })
    const state = await until(engine, () => batches.some(stoppedAt(5)))
    expect(callEvents(batches)).toEqual([{ type: "call_button", floor: 5, direction: null }])
    expect(waitingAt(state, "B")).toBe("riding")
  })

  it("building.directional_calls liga o modo no Scenario", async () => {
    const { runtime } = recordingRuntime()
    const engine = createEngine({
      runtime,
      scenario: { building: { ...building, directional_calls: true }, start_floor: 0, passengers: [pax("A", 0, 3, 7)] },
    })
    const state = await engine.step()
    expect(state.call_buttons).toEqual([{ floor: 3, direction: "up" }])
  })
})
