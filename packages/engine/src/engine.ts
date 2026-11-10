import { assertValidScenario, type ScenarioRules } from "./scenario"
import {
  DOOR_CYCLE_TICKS,
  FLOOR_TRAVEL_TICKS,
  TICK_MS,
  type Command,
  type Direction,
  type ElevatorSnapshot,
  type Engine,
  type Event,
  type FleetSpec,
  type Runtime,
  type RuntimeError,
  type SimulationState,
} from "./types"

export type EngineOptions = {
  runtime: Runtime
  scenario?: ScenarioRules
  directionalCalls?: boolean
  fleet?: FleetSpec
}

const SANDBOX = { building: { min_floor: 0, max_floor: 10 }, start_floor: 0, passengers: [] }

type Pax = {
  id: string
  from: number
  to: number
  state: "waiting" | "riding" | "arrived"
  service: boolean
  elevator: number | null
}
type CallButton = { floor: number; direction: Direction; service: boolean }
type Press = { kind: "call" | "cabin"; floor: number; direction: Direction; service: boolean; elevator: number }

type Car = {
  id: number
  service: boolean
  pos: number
  currentFloor: number
  target: number | null
  direction: Direction
  doorTicks: number
  justOpened: boolean
  serving: Direction
  cabinButtons: Set<number>
}

const callKey = ({ floor, direction, service }: CallButton) => `${floor}:${direction}:${service}`
const directionRank = (direction: Direction) => (direction === "down" ? 1 : 0)

export function createEngine({ runtime, scenario = SANDBOX, directionalCalls, fleet }: EngineOptions): Engine {
  const specs: FleetSpec = fleet ?? scenario.building.elevators ?? [{ service: false }]
  assertValidScenario({ ...scenario, building: { ...scenario.building, elevators: specs } })
  const { min_floor, max_floor } = scenario.building
  const directional = directionalCalls ?? scenario.building.directional_calls === true
  const multi = specs.length > 1
  const timeLimitTicks =
    scenario.time_limit_s === undefined ? null : Math.round((scenario.time_limit_s * 1000) / TICK_MS)

  let tick = 0
  let status: SimulationState["status"] = "running"
  let error: RuntimeError | undefined
  const log: SimulationState["log"] = []

  const cars: Car[] = specs.map(({ service }, id) => ({
    id,
    service,
    pos: scenario.start_floor * FLOOR_TRAVEL_TICKS,
    currentFloor: scenario.start_floor,
    target: null,
    direction: null,
    doorTicks: 0,
    justOpened: false,
    serving: null,
    cabinButtons: new Set<number>(),
  }))
  const hasServiceCar = specs.some((s) => s.service)

  const callButtons = new Map<string, CallButton>()
  const passengers: Pax[] = []
  const upcoming = scenario.passengers
    .map((p) => ({ ...p, at_tick: Math.round((p.at_s * 1000) / TICK_MS) }))
    .sort((a, b) => a.at_tick - b.at_tick)
  let presses: Press[] = []
  let pending: Event[] = cars.map((car) => idleEvent(car))

  const inRange = (floor: number) =>
    Number.isInteger(floor) && floor >= min_floor && floor <= max_floor
  const atFloor = (car: Car) => car.pos % FLOOR_TRAVEL_TICKS === 0
  const doorsOpen = (car: Car) => car.doorTicks > 0

  function idleEvent(car: Car): Event {
    return multi ? { type: "idle", elevator: car.id } : { type: "idle" }
  }

  function floorEvent(type: "cabin_button" | "stop", floor: number, car: Car): Event {
    return multi ? { type, floor, elevator: car.id } : { type, floor }
  }

  function eventText(e: Event) {
    if (e.type === "idle") return multi ? `idle(elevador ${e.elevator})` : "idle"
    const args: (string | number)[] = [e.floor]
    if (e.type === "call_button") {
      if (e.direction) args.push(e.direction)
      if (e.service) args.push("serviço")
    } else if (e.elevator !== undefined) {
      args.push(`elevador ${e.elevator}`)
    }
    return `${e.type}(${args.join(", ")})`
  }

  const callExists = ({ floor, direction, service }: CallButton) => {
    if (service && !hasServiceCar) return false
    if (!directional) return direction === null
    return (direction === "up" && floor < max_floor) || (direction === "down" && floor > min_floor)
  }
  const directionOf = (p: Pax): Direction => (!directional ? null : p.to > p.from ? "up" : "down")
  const buttonOf = (p: Pax): CallButton => ({ floor: p.from, direction: directionOf(p), service: p.service })
  const canBoard = (car: Car, p: Pax) =>
    p.service === car.service && (car.serving === null || directionOf(p) === car.serving)

  function lightCall(button: CallButton, events: Event[]) {
    const key = callKey(button)
    if (callButtons.has(key)) return
    callButtons.set(key, button)
    events.push({
      type: "call_button",
      floor: button.floor,
      direction: button.direction,
      ...(button.service && { service: true as const }),
    })
  }

  function clearCalls(car: Car) {
    for (const [key, button] of callButtons) {
      if (button.floor !== car.currentFloor || button.service !== car.service) continue
      if (car.serving === null || button.direction === car.serving) callButtons.delete(key)
    }
  }

  function arrivalDirection(car: Car): Direction {
    if (!directional) return null
    if (car.currentFloor === max_floor) return "down"
    if (car.currentFloor === min_floor) return "up"
    return car.direction
  }

  function lightCabin(car: Car, floor: number, events: Event[]) {
    if (car.cabinButtons.has(floor)) return
    car.cabinButtons.add(floor)
    events.push(floorEvent("cabin_button", floor, car))
  }

  function board(car: Car, p: Pax, events: Event[]) {
    p.state = "riding"
    p.elevator = car.id
    callButtons.delete(callKey(buttonOf(p)))
    lightCabin(car, p.to, events)
  }

  function arrive(car: Car, events: Event[]) {
    car.serving = arrivalDirection(car)
    car.direction = null
    car.target = null
    car.doorTicks = DOOR_CYCLE_TICKS
    car.justOpened = true
    events.push(floorEvent("stop", car.currentFloor, car))
    car.cabinButtons.delete(car.currentFloor)
    clearCalls(car)
    for (const p of passengers) {
      if (p.state === "riding" && p.elevator === car.id && p.to === car.currentFloor) p.state = "arrived"
    }
    for (const p of passengers) {
      if (p.state === "waiting" && p.from === car.currentFloor && canBoard(car, p)) board(car, p, events)
    }
  }

  function resolveAtFloor(car: Car, events: Event[]) {
    if (car.target === null) car.direction = null
    else if (car.target === car.currentFloor) arrive(car, events)
    else car.direction = car.target > car.currentFloor ? "up" : "down"
  }

  function applyPresses(events: Event[]) {
    const batch = presses
    presses = []
    for (const { kind, floor, direction, service, elevator } of batch) {
      if (kind === "call") lightCall({ floor, direction, service }, events)
      else lightCabin(cars[elevator]!, floor, events)
    }
  }

  function spawnPassengers(events: Event[]) {
    while (upcoming[0] && upcoming[0].at_tick <= tick) {
      const { id, from, to, service = false } = upcoming.shift()!
      const p: Pax = { id, from, to, service, state: "waiting", elevator: null }
      passengers.push(p)
      const open = cars.find((c) => doorsOpen(c) && c.currentFloor === from && canBoard(c, p))
      if (open) board(open, p, events)
      else lightCall(buttonOf(p), events)
    }
  }

  function move(car: Car, events: Event[]) {
    if (doorsOpen(car) || car.direction === null) return
    car.pos += car.direction === "up" ? 1 : -1
    if (!atFloor(car)) return
    car.currentFloor = car.pos / FLOOR_TRAVEL_TICKS
    resolveAtFloor(car, events)
  }

  function runDoors(car: Car, events: Event[]) {
    if (!doorsOpen(car) || car.justOpened) return
    car.doorTicks -= 1
    if (car.doorTicks > 0) return
    if (car.target === null) events.push(idleEvent(car))
    else car.direction = car.target > car.currentFloor ? "up" : "down"
  }

  function snapshot(car: Car): ElevatorSnapshot {
    return {
      id: car.id,
      service: car.service,
      current_floor: car.currentFloor,
      target_floor: car.target,
      direction: car.direction,
      idle: !doorsOpen(car) && car.direction === null && car.target === null,
      min_floor,
      max_floor,
    }
  }

  function applyCommand(cmd: Command) {
    const id = cmd.elevator ?? 0
    const where = multi ? `, elevador ${id}` : ""
    const text = `${cmd.type}(${cmd.floor}${where})`
    const car = cars[id]
    if (cmd.type !== "move_to" || !inRange(cmd.floor) || !car) {
      const reason = car ? "fora do prédio" : "elevador inexistente"
      log.push({ tick, kind: "command", text: `${text} ignorado: ${reason}` })
      return
    }
    log.push({ tick, kind: "command", text })
    if (doorsOpen(car)) {
      car.target = cmd.floor === car.currentFloor ? null : cmd.floor
      return
    }
    car.target = cmd.floor
    if (atFloor(car)) resolveAtFloor(car, pending)
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
    for (const car of cars) move(car, events)
    for (const car of cars) runDoors(car, events)
    for (const e of events) {
      log.push({ tick, kind: "event", text: eventText(e) })
    }

    if (events.length > 0) {
      let result: Awaited<ReturnType<Runtime["handle"]>>
      try {
        const elevators = cars.map(snapshot)
        result = await runtime.handle({ tick, elevator: elevators[0]!, elevators, events })
      } catch (e) {
        result = { error: { kind: "exception", message: e instanceof Error ? e.message : String(e) } }
      }
      if ("error" in result) return fail(result.error)
      for (const text of result.logs) log.push({ tick, kind: "print", text })
      for (const cmd of result.commands) applyCommand(cmd)
    }
    for (const car of cars) car.justOpened = false
    finishScenario()
    if (status === "running") tick += 1
  }

  function finishScenario() {
    if (scenario.passengers.length === 0) return
    const allArrived =
      upcoming.length === 0 && passengers.every((p) => p.state === "arrived")
    if (allArrived) {
      status = "success"
      return
    }
    if (timeLimitTicks !== null && tick >= timeLimitTicks) {
      status = "timeout"
      for (const { id, from, to, service = false } of upcoming.splice(0)) {
        passengers.push({ id, from, to, service, state: "waiting", elevator: null })
      }
    }
  }

  function state(): SimulationState {
    const sorted = (s: Set<number>) => [...s].sort((a, b) => a - b)
    const view = (car: Car) => ({
      position: car.pos / FLOOR_TRAVEL_TICKS,
      direction: car.direction,
      target_floor: car.target,
      doors_open: doorsOpen(car),
    })
    return {
      tick,
      status,
      elevator: view(cars[0]!),
      elevators: cars.map((car) => ({
        ...view(car),
        id: car.id,
        service: car.service,
        cabin_buttons: sorted(car.cabinButtons),
      })),
      call_buttons: [...callButtons.values()]
        .sort(
          (a, b) =>
            a.floor - b.floor ||
            Number(a.service) - Number(b.service) ||
            directionRank(a.direction) - directionRank(b.direction),
        )
        .map(({ floor, direction, service }) => ({ floor, direction, ...(service && { service: true as const }) })),
      cabin_buttons: sorted(cars[0]!.cabinButtons),
      passengers: passengers.map((p) => ({
        id: p.id,
        from: p.from,
        to: p.to,
        state: p.state,
        ...(p.service && { service: true as const }),
        ...(multi && { elevator: p.elevator }),
      })),
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
    press(kind, floor, direction, opts) {
      if (!inRange(floor)) return
      if (kind === "cabin") {
        const elevator = opts?.elevator ?? 0
        if (cars[elevator]) presses.push({ kind, floor, direction: null, service: false, elevator })
        return
      }
      const pressed = directional ? (direction ?? null) : null
      const service = opts?.service === true
      if (callExists({ floor, direction: pressed, service })) {
        presses.push({ kind, floor, direction: pressed, service, elevator: 0 })
      }
    },
    state,
  }
}
