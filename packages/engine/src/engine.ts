import type { Scenario } from "./scenario"
import {
  DOOR_CYCLE_TICKS,
  FLOOR_TRAVEL_TICKS,
  TICK_MS,
  type Command,
  type Direction,
  type ElevatorSnapshot,
  type Engine,
  type Event,
  type Runtime,
  type RuntimeError,
  type SimulationState,
} from "./types"

export type EngineOptions = {
  runtime: Runtime
  scenario?: Pick<Scenario, "building" | "start_floor" | "passengers">
}

const SANDBOX = { building: { min_floor: 0, max_floor: 10 }, start_floor: 0, passengers: [] }

type Pax = { id: string; from: number; to: number; state: "waiting" | "riding" | "arrived" }

export function createEngine({ runtime, scenario = SANDBOX }: EngineOptions): Engine {
  const { min_floor, max_floor } = scenario.building

  let tick = 0
  let status: SimulationState["status"] = "running"
  let error: RuntimeError | undefined
  const log: SimulationState["log"] = []

  let pos = scenario.start_floor * FLOOR_TRAVEL_TICKS
  let currentFloor = scenario.start_floor
  let target: number | null = null
  let direction: Direction = null
  let doorTicks = 0
  let justOpened = false

  const callButtons = new Set<number>()
  const cabinButtons = new Set<number>()
  const passengers: Pax[] = []
  const upcoming = scenario.passengers
    .map((p) => ({ ...p, at_tick: Math.round((p.at_s * 1000) / TICK_MS) }))
    .sort((a, b) => a.at_tick - b.at_tick)
  let presses: { kind: "call" | "cabin"; floor: number }[] = []
  let pending: Event[] = [{ type: "idle" }]

  const inRange = (floor: number) =>
    Number.isInteger(floor) && floor >= min_floor && floor <= max_floor
  const atFloor = () => pos % FLOOR_TRAVEL_TICKS === 0
  const doorsOpen = () => doorTicks > 0

  function lightCall(floor: number, events: Event[]) {
    if (callButtons.has(floor)) return
    callButtons.add(floor)
    events.push({ type: "call_button", floor })
  }

  function lightCabin(floor: number, events: Event[]) {
    if (cabinButtons.has(floor)) return
    cabinButtons.add(floor)
    events.push({ type: "cabin_button", floor })
  }

  function board(p: Pax, events: Event[]) {
    p.state = "riding"
    callButtons.delete(p.from)
    lightCabin(p.to, events)
  }

  function arrive(events: Event[]) {
    direction = null
    target = null
    doorTicks = DOOR_CYCLE_TICKS
    justOpened = true
    events.push({ type: "stop", floor: currentFloor })
    cabinButtons.delete(currentFloor)
    callButtons.delete(currentFloor)
    for (const p of passengers) if (p.state === "riding" && p.to === currentFloor) p.state = "arrived"
    for (const p of passengers) if (p.state === "waiting" && p.from === currentFloor) board(p, events)
  }

  function resolveAtFloor(events: Event[]) {
    if (target === null) direction = null
    else if (target === currentFloor) arrive(events)
    else direction = target > currentFloor ? "up" : "down"
  }

  function applyPresses(events: Event[]) {
    const batch = presses
    presses = []
    for (const { kind, floor } of batch) {
      if (kind === "call") lightCall(floor, events)
      else lightCabin(floor, events)
    }
  }

  function spawnPassengers(events: Event[]) {
    while (upcoming[0] && upcoming[0].at_tick <= tick) {
      const { id, from, to } = upcoming.shift()!
      const p: Pax = { id, from, to, state: "waiting" }
      passengers.push(p)
      if (doorsOpen() && currentFloor === from) board(p, events)
      else lightCall(from, events)
    }
  }

  function move(events: Event[]) {
    if (doorsOpen() || direction === null) return
    pos += direction === "up" ? 1 : -1
    if (!atFloor()) return
    currentFloor = pos / FLOOR_TRAVEL_TICKS
    resolveAtFloor(events)
  }

  function runDoors(events: Event[]) {
    if (!doorsOpen() || justOpened) return
    doorTicks -= 1
    if (doorTicks > 0) return
    if (target === null) events.push({ type: "idle" })
    else direction = target > currentFloor ? "up" : "down"
  }

  function snapshot(): ElevatorSnapshot {
    return {
      current_floor: currentFloor,
      target_floor: target,
      direction,
      idle: !doorsOpen() && direction === null && target === null,
      min_floor,
      max_floor,
    }
  }

  function applyCommand(cmd: Command) {
    const text = `${cmd.type}(${cmd.floor})`
    if (cmd.type !== "move_to" || !inRange(cmd.floor)) {
      log.push({ tick, kind: "command", text: `${text} ignorado: fora do prédio` })
      return
    }
    log.push({ tick, kind: "command", text })
    if (doorsOpen()) {
      target = cmd.floor === currentFloor ? null : cmd.floor
      return
    }
    target = cmd.floor
    if (atFloor()) resolveAtFloor(pending)
  }

  function fail(err: RuntimeError) {
    status = "error"
    error = err
    const where = err.line === undefined ? "" : ` (linha ${err.line})`
    log.push({ tick, kind: "error", text: `${err.message}${where}` })
  }

  async function runTick() {
    if (status !== "running") return
    const events = pending
    pending = []
    applyPresses(events)
    spawnPassengers(events)
    move(events)
    runDoors(events)
    for (const e of events) {
      log.push({ tick, kind: "event", text: e.type === "idle" ? "idle" : `${e.type}(${e.floor})` })
    }

    if (events.length > 0) {
      let result: Awaited<ReturnType<Runtime["handle"]>>
      try {
        result = await runtime.handle({ tick, elevator: snapshot(), events })
      } catch (e) {
        result = { error: { kind: "exception", message: e instanceof Error ? e.message : String(e) } }
      }
      if ("error" in result) return fail(result.error)
      for (const text of result.logs) log.push({ tick, kind: "print", text })
      for (const cmd of result.commands) applyCommand(cmd)
    }
    justOpened = false
    tick += 1
  }

  function state(): SimulationState {
    const sorted = (s: Set<number>) => [...s].sort((a, b) => a - b)
    return {
      tick,
      status,
      elevator: {
        position: pos / FLOOR_TRAVEL_TICKS,
        direction,
        target_floor: target,
        doors_open: doorsOpen(),
      },
      call_buttons: sorted(callButtons),
      cabin_buttons: sorted(cabinButtons),
      passengers: passengers.map((p) => ({ ...p })),
      log: log.map((l) => ({ ...l })),
      ...(error && { error: { ...error } }),
    }
  }

  let queue: Promise<unknown> = Promise.resolve()
  return {
    step() {
      const run = queue.then(runTick).then(state)
      queue = run.catch(() => undefined)
      return run
    },
    press(kind, floor) {
      if (inRange(floor)) presses.push({ kind, floor })
    },
    state,
  }
}
