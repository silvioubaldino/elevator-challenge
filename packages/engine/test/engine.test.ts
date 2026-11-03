import { describe, expect, it } from "vitest"
import {
  createEngine,
  type Command,
  type Engine,
  type Event,
  type EventBatch,
  type Runtime,
  type RuntimeError,
  type SimulationState,
} from "../src"

type Reply = { commands: Command[]; logs: string[] } | { error: RuntimeError }

function fakeRuntime(react: (batch: EventBatch) => Command[] | { error: RuntimeError }, delay_ms = 0) {
  const batches: EventBatch[] = []
  const runtime: Runtime = {
    async load() {
      return null
    },
    async handle(batch): Promise<Reply> {
      batches.push(structuredClone(batch))
      if (delay_ms > 0) await new Promise((r) => setTimeout(r, delay_ms))
      const out = react(batch)
      return Array.isArray(out) ? { commands: out, logs: [] } : out
    },
    dispose() {},
  }
  return { runtime, batches }
}

const moveTo = (floor: number): Command => ({ type: "move_to", floor })
const has = (events: Event[], type: Event["type"], floor?: number) =>
  events.some((e) => e.type === type && (floor === undefined || ("floor" in e && e.floor === floor)))

const goToButtons = (batch: EventBatch): Command[] =>
  batch.events.flatMap((e) =>
    e.type === "call_button" || e.type === "cabin_button" ? [moveTo(e.floor)] : [],
  )

async function steps(engine: Engine, n: number): Promise<SimulationState> {
  let s = engine.state()
  for (let i = 0; i < n; i++) s = await engine.step()
  return s
}

async function until(engine: Engine, done: (s: SimulationState) => boolean, max = 1000) {
  for (let i = 0; i < max; i++) {
    const s = await engine.step()
    if (done(s)) return s
  }
  throw new Error("condição não atingida")
}

const pax = (id: string, at_s: number, from: number, to: number) => ({ id, at_s, from, to })
const building = { min_floor: 0, max_floor: 10 }

describe("engine", () => {
  it("início parado recebe idle no primeiro Tick", async () => {
    const { runtime, batches } = fakeRuntime(() => [])
    const engine = createEngine({ runtime })
    await engine.step()
    expect(batches).toHaveLength(1)
    expect(batches[0]!.tick).toBe(0)
    expect(batches[0]!.events).toEqual([{ type: "idle" }])
    expect(batches[0]!.elevator).toMatchObject({ current_floor: 0, idle: true, min_floor: 0, max_floor: 10 })
  })

  it("move_to leva ao andar em 30 Tick, abre as portas e envia stop", async () => {
    const { runtime, batches } = fakeRuntime((b) => (has(b.events, "idle") && b.tick === 0 ? [moveTo(3)] : []))
    const engine = createEngine({ runtime })
    await steps(engine, 1)
    const s = await until(engine, () => batches.some((b) => has(b.events, "stop", 3)))
    const stop = batches.find((b) => has(b.events, "stop", 3))!
    expect(stop.tick).toBe(30)
    expect(s.elevator).toMatchObject({ position: 3, doors_open: true, direction: null, target_floor: null })
  })

  it("passa direto por andar que não é Target", async () => {
    const { runtime, batches } = fakeRuntime((b) => (has(b.events, "idle") ? [moveTo(6)] : []))
    const engine = createEngine({ runtime })
    engine.press("call", 3)
    let passed = false
    await until(engine, (s) => {
      if (s.elevator.position === 3) {
        passed = true
        expect(s.elevator.doors_open).toBe(false)
        expect(s.call_buttons).toEqual([3])
      }
      return s.elevator.position >= 4
    })
    expect(passed).toBe(true)
    expect(batches.some((b) => has(b.events, "stop", 3))).toBe(false)
  })

  it("novo Target à frente substitui o anterior", async () => {
    const { runtime, batches } = fakeRuntime((b) => (has(b.events, "idle") ? [moveTo(10)] : goToButtons(b)))
    const engine = createEngine({ runtime })
    const mid = await steps(engine, 26)
    expect(mid.elevator.position).toBeGreaterThan(2)
    expect(mid.elevator.position).toBeLessThan(3)
    engine.press("cabin", 5)
    const s = await until(engine, (st) => st.elevator.doors_open)
    expect(s.elevator.position).toBe(5)
    expect(batches.filter((b) => has(b.events, "stop")).map((b) => b.events)).toEqual([[{ type: "stop", floor: 5 }]])
  })

  it("Target para trás inverte no próximo andar, sem abrir portas", async () => {
    const { runtime, batches } = fakeRuntime((b) => (has(b.events, "idle") ? [moveTo(10)] : goToButtons(b)))
    const engine = createEngine({ runtime })
    await steps(engine, 46)
    const before = engine.state()
    expect(before.elevator.position).toBeGreaterThan(4)
    expect(before.elevator.position).toBeLessThan(5)
    engine.press("cabin", 2)
    let peak = 0
    let openedAt5 = false
    const s = await until(engine, (st) => {
      peak = Math.max(peak, st.elevator.position)
      if (st.elevator.position === 5) openedAt5 ||= st.elevator.doors_open
      return st.elevator.doors_open
    })
    expect(peak).toBe(5)
    expect(openedAt5).toBe(false)
    expect(s.elevator.position).toBe(2)
    expect(batches.filter((b) => has(b.events, "stop")).flatMap((b) => b.events)).toEqual([{ type: "stop", floor: 2 }])
  })

  it("chamada no andar atual exige move_to", async () => {
    const { runtime } = fakeRuntime(() => [])
    const engine = createEngine({ runtime })
    engine.press("call", 0)
    const s = await steps(engine, 5)
    expect(s.elevator.doors_open).toBe(false)
    expect(s.call_buttons).toEqual([0])
  })

  it("ao parar desembarca, embarca, apaga o CallButton e envia stop antes de cabin_button", async () => {
    const { runtime, batches } = fakeRuntime(goToButtons)
    const engine = createEngine({
      runtime,
      scenario: {
        building,
        start_floor: 0,
        passengers: [pax("B", 0, 0, 4), pax("A", 2, 4, 8)],
      },
    })
    await until(engine, () => batches.some((b) => b.tick > 0 && has(b.events, "stop", 4)))
    const s = engine.state()
    const arrival = batches.find((b) => has(b.events, "stop", 4))!
    expect(arrival.events).toEqual([
      { type: "stop", floor: 4 },
      { type: "cabin_button", floor: 8 },
    ])
    expect(s.passengers).toEqual([
      { id: "B", from: 0, to: 4, state: "arrived" },
      { id: "A", from: 4, to: 8, state: "riding" },
    ])
    expect(s.call_buttons).toEqual([])
    expect(s.cabin_buttons).toEqual([8])
  })

  it("botão já aceso não gera Event", async () => {
    const { runtime, batches } = fakeRuntime(goToButtons)
    const engine = createEngine({
      runtime,
      scenario: { building, start_floor: 0, passengers: [pax("P1", 0, 0, 8), pax("P2", 1, 0, 8)] },
    })
    const s = await steps(engine, 15)
    expect(s.passengers.map((p) => p.state)).toEqual(["riding", "riding"])
    const cabin8 = batches.flatMap((b) => b.events).filter((e) => has([e], "cabin_button", 8))
    expect(cabin8).toHaveLength(1)
  })

  it("portas fecham após 20 Tick e o Runtime recebe idle", async () => {
    const { runtime, batches } = fakeRuntime((b) => (b.tick === 0 ? [moveTo(4)] : []))
    const engine = createEngine({ runtime })
    const opened = await until(engine, (s) => s.elevator.doors_open)
    const t0 = opened.tick - 1
    expect(opened.elevator.position).toBe(4)
    await steps(engine, 19)
    expect(engine.state().elevator.doors_open).toBe(true)
    const closed = await engine.step()
    expect(closed.elevator.doors_open).toBe(false)
    const last = batches[batches.length - 1]!
    expect(last.tick).toBe(t0 + 20)
    expect(last.events).toEqual([{ type: "idle" }])
    expect(last.elevator.idle).toBe(true)
  })

  it("determinismo independente do tempo de resposta do Runtime", async () => {
    const scenario = {
      building,
      start_floor: 5,
      passengers: [pax("A", 0, 1, 0), pax("B", 0.5, 9, 10), pax("C", 1, 2, 0)],
    }
    const run = async (delay_ms: number) => {
      const { runtime } = fakeRuntime(goToButtons, delay_ms)
      const engine = createEngine({ runtime, scenario })
      const trace: SimulationState[] = []
      for (let i = 0; i < 400; i++) trace.push(await engine.step())
      return trace
    }
    const fast = await run(0)
    const slow = await run(5)
    expect(slow).toEqual(fast)
    expect(fast[fast.length - 1]!.passengers.map((p) => p.state)).toContain("arrived")
  })

  it("erro do aluno para a simulação", async () => {
    const err: RuntimeError = { kind: "exception", message: "boom", line: 3 }
    const { runtime } = fakeRuntime((b) => (b.tick === 0 ? [] : { error: err }))
    const engine = createEngine({ runtime })
    engine.press("cabin", 2)
    await engine.step()
    engine.press("cabin", 3)
    const failed = await engine.step()
    expect(failed.status).toBe("error")
    expect(failed.error).toEqual(err)
    expect(failed.log.at(-1)).toMatchObject({ kind: "error", text: "boom (linha 3)" })
    const again = await engine.step()
    expect(again).toEqual(failed)
    expect(again.tick).toBe(failed.tick)
  })
})

describe("engine edge cases", () => {
  it("move_to fora do prédio é ignorado e registrado no log", async () => {
    const { runtime } = fakeRuntime((b) => (b.tick === 0 ? [moveTo(11), moveTo(-1), moveTo(2.5)] : []))
    const engine = createEngine({ runtime })
    const s = await steps(engine, 3)
    expect(s.elevator.target_floor).toBeNull()
    expect(s.log.filter((l) => l.kind === "command")).toHaveLength(3)
    expect(s.log.filter((l) => l.kind === "command").every((l) => l.text.includes("ignorado"))).toBe(true)
  })

  it("move_to(current_floor) com portas abertas limpa o Target sem novo DoorCycle", async () => {
    const { runtime, batches } = fakeRuntime((b) => {
      if (b.tick === 0) return [moveTo(2)]
      if (has(b.events, "stop", 2)) return [moveTo(5)]
      if (has(b.events, "call_button", 2)) return [moveTo(2)]
      return []
    })
    const engine = createEngine({ runtime })
    await until(engine, (s) => s.elevator.doors_open)
    expect(engine.state().elevator.target_floor).toBe(5)
    engine.press("call", 2)
    const s = await steps(engine, 2)
    expect(s.elevator).toMatchObject({ doors_open: true, target_floor: null })
    const last = await until(engine, (st) => !st.elevator.doors_open)
    expect(last.elevator.direction).toBeNull()
    expect(batches[batches.length - 1]!.events).toEqual([{ type: "idle" }])
  })

  it("move_to(current_floor) parado com portas fechadas abre as portas", async () => {
    const { runtime, batches } = fakeRuntime((b) => (has(b.events, "call_button", 0) ? [moveTo(0)] : []))
    const engine = createEngine({ runtime })
    engine.press("call", 0)
    const s = await steps(engine, 2)
    expect(s.elevator.doors_open).toBe(true)
    expect(s.call_buttons).toEqual([])
    expect(batches[1]!.events).toEqual([{ type: "stop", floor: 0 }])
  })
})
