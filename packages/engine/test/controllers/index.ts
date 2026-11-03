import type { Command, EventBatch, Runtime } from "../../src"

type Controller = (batch: EventBatch) => Command[]

const moveTo = (floor: number): Command => ({ type: "move_to", floor })

const buttonFloors = (batch: EventBatch) =>
  batch.events.flatMap((e) => (e.type === "call_button" || e.type === "cabin_button" ? [e.floor] : []))

export function asRuntime(controller: Controller): Runtime {
  return {
    async load() {
      return null
    },
    async handle(batch) {
      return { commands: controller(batch), logs: [] }
    },
    dispose() {},
  }
}

export function fifoController(): Controller {
  const queue: number[] = []
  return (batch) => {
    queue.push(...buttonFloors(batch))
    const free = batch.elevator.idle || batch.events.some((e) => e.type === "stop" || e.type === "idle")
    const next = free ? queue.shift() : undefined
    return next === undefined ? [] : [moveTo(next)]
  }
}

export function lastWinsController(): Controller {
  return (batch) => {
    const floors = buttonFloors(batch)
    const last = floors[floors.length - 1]
    return last === undefined ? [] : [moveTo(last)]
  }
}

export function optimalController(): Controller {
  const wanted = new Set<number>()
  let sweep: "up" | "down" = "up"
  const ahead = (from: number, dir: "up" | "down", inclusive: boolean) => {
    const floors = [...wanted].filter((f) =>
      dir === "up" ? (inclusive ? f >= from : f > from) : inclusive ? f <= from : f < from,
    )
    return dir === "up" ? Math.min(...floors) : Math.max(...floors)
  }
  return (batch) => {
    for (const f of buttonFloors(batch)) wanted.add(f)
    for (const e of batch.events) if (e.type === "stop") wanted.delete(e.floor)
    if (wanted.size === 0) return []
    const { current_floor, direction } = batch.elevator
    const inclusive = direction === null
    for (const dir of [sweep, sweep === "up" ? "down" : "up"] as const) {
      const target = ahead(current_floor, dir, inclusive)
      if (Number.isFinite(target)) {
        sweep = dir
        return [moveTo(target)]
      }
    }
    return []
  }
}
