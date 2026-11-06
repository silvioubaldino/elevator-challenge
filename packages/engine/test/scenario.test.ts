import { describe, expect, it } from "vitest"
import {
  createEngine,
  SCENARIOS,
  ScenarioError,
  type Command,
  type Engine,
  type EventBatch,
  type Runtime,
  type Scenario,
  type SimulationState,
} from "../src"
import { asRuntime, fifoController, lastWinsController, optimalController } from "./controllers"

function recordingRuntime(): { runtime: Runtime; batches: EventBatch[] } {
  const batches: EventBatch[] = []
  const inner = asRuntime(() => [] as Command[])
  return {
    batches,
    runtime: {
      ...inner,
      async handle(batch) {
        batches.push(structuredClone(batch))
        return inner.handle(batch)
      },
    },
  }
}

const building = { min_floor: 0, max_floor: 10 }
const pax = (id: string, at_s: number, from: number, to: number) => ({ id, at_s, from, to })

async function runToEnd(engine: Engine, max = 2000): Promise<SimulationState> {
  let s = engine.state()
  for (let i = 0; i < max && s.status === "running"; i++) s = await engine.step()
  return s
}

const scenarioById = (id: string): Scenario => SCENARIOS.find((s) => s.id === id)!

async function runWith(id: string, controller: Parameters<typeof asRuntime>[0]) {
  const scenario = scenarioById(id)
  return runToEnd(createEngine({ runtime: asRuntime(controller), scenario }))
}

describe("scenario", () => {
  it("Passenger aparece no instante certo e aperta o CallButton", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({
      runtime,
      scenario: { building, start_floor: 0, time_limit_s: 60, passengers: [pax("A", 2, 4, 8)] },
    })
    for (let i = 0; i < 20; i++) await engine.step()
    expect(engine.state().passengers).toEqual([])
    expect(batches.flatMap((b) => b.events)).not.toContainEqual({ type: "call_button", floor: 4, direction: null })

    await engine.step()
    expect(engine.state().passengers).toEqual([{ id: "A", from: 4, to: 8, state: "waiting" }])
    expect(batches.at(-1)).toMatchObject({ tick: 20, events: [{ type: "call_button", floor: 4, direction: null }] })
  })

  it("Passenger que aparece com as portas abertas embarca sem call_button", async () => {
    const { runtime, batches } = recordingRuntime()
    const engine = createEngine({
      runtime: {
        ...runtime,
        async handle(batch) {
          const out = await runtime.handle(batch)
          const arrived = batch.events.some((e) => e.type === "idle") && batch.tick === 0
          return arrived && "commands" in out ? { ...out, commands: [{ type: "move_to", floor: 0 }] } : out
        },
      },
      scenario: { building, start_floor: 0, time_limit_s: 60, passengers: [pax("A", 0.5, 0, 6)] },
    })
    for (let i = 0; i < 8; i++) await engine.step()

    const events = batches.flatMap((b) => b.events)
    expect(events).not.toContainEqual({ type: "call_button", floor: 0, direction: null })
    expect(events).toContainEqual({ type: "cabin_button", floor: 6 })
    expect(engine.state().passengers[0]!.state).toBe("riding")
  })

  it("último Passenger a chegar encerra com sucesso no tick da chegada", async () => {
    const final = await runWith("first-ride", optimalController())
    expect(final.status).toBe("success")
    expect(final.passengers.every((p) => p.state === "arrived")).toBe(true)

    const stopAtSeven = final.log.find((l) => l.kind === "event" && l.text === "stop(7)")!
    expect(final.tick).toBe(stopAtSeven.tick)
  })

  it("passa do limite com Passenger pendente e termina em timeout listando quem não chegou", async () => {
    const final = await runWith("on-the-way", lastWinsController())
    expect(final.status).toBe("timeout")
    expect(final.tick).toBe(600)
    expect(final.passengers.filter((p) => p.state !== "arrived").map((p) => p.id)).toEqual(["A"])
  })

  it("timeout lista também Passenger que nem chegou a aparecer", async () => {
    const engine = createEngine({
      runtime: asRuntime(() => []),
      scenario: { building, start_floor: 0, time_limit_s: 1, passengers: [pax("A", 5, 1, 2)] },
    })
    const final = await runToEnd(engine)
    expect(final.status).toBe("timeout")
    expect(final.passengers).toEqual([{ id: "A", from: 1, to: 2, state: "waiting" }])
  })

  it("step não avança depois do fim do Scenario", async () => {
    const final = await runWith("first-ride", optimalController())
    const engine = createEngine({
      runtime: asRuntime(optimalController()),
      scenario: scenarioById("first-ride"),
    })
    await runToEnd(engine)
    const after = await engine.step()
    expect(after.tick).toBe(final.tick)
    expect(after.status).toBe("success")
  })

  it.each([
    ["origem igual ao destino", [pax("A", 0, 3, 3)], /Passenger A.*iguais/],
    ["andar fora do prédio", [pax("A", 0, 3, 11)], /Passenger A.*fora do prédio/],
    ["id repetido", [pax("A", 0, 1, 2), pax("A", 1, 2, 3)], /Passenger A.*repetido/],
    ["instante fora da grade de Tick", [pax("A", 0.05, 1, 2)], /Passenger A.*0,1/],
  ])("rejeita Scenario inválido: %s", (_nome, passengers, message) => {
    expect(() =>
      createEngine({
        runtime: asRuntime(() => []),
        scenario: { building, start_floor: 0, time_limit_s: 30, passengers },
      }),
    ).toThrowError(ScenarioError)
    expect(() =>
      createEngine({
        runtime: asRuntime(() => []),
        scenario: { building, start_floor: 0, time_limit_s: 30, passengers },
      }),
    ).toThrowError(message)
  })

  it("cenários fixos são válidos", () => {
    for (const scenario of SCENARIOS) {
      expect(() => createEngine({ runtime: asRuntime(() => []), scenario })).not.toThrow()
    }
    expect(SCENARIOS.map((s) => s.id)).toEqual(["first-ride", "on-the-way", "zigzag"])
  })

  it("cenários fixos separam controladores bons e ruins", async () => {
    const results = {
      lastWins: await runWith("on-the-way", lastWinsController()),
      fifoOnTheWay: await runWith("on-the-way", fifoController()),
      optimalOnTheWay: await runWith("on-the-way", optimalController()),
      fifoZigzag: await runWith("zigzag", fifoController()),
      optimalZigzag: await runWith("zigzag", optimalController()),
    }
    expect(results.lastWins.status).toBe("timeout")
    for (const r of [results.fifoOnTheWay, results.optimalOnTheWay, results.fifoZigzag, results.optimalZigzag]) {
      expect(r.status).toBe("success")
    }
    expect(results.optimalOnTheWay.tick).toBeLessThan(results.fifoOnTheWay.tick)
    expect(results.optimalZigzag.tick).toBeLessThan(results.fifoZigzag.tick)
  })
})
