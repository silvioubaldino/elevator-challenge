import type { Scenario, SimulationState } from "@elevator/engine"
import { moodForWait, type Mood } from "../avatar/mood"
import { exitX, queueX, riderX, VISIBLE_RIDERS, type Geometry } from "./geometry"

export type AvatarStatus = SimulationState["passengers"][number]["state"]

export type AvatarPlacement = {
  id: string
  to: number
  status: AvatarStatus
  x: number
  y: number
  scale: number
  mood: Mood
  visible: boolean
}

const RIDER_SCALE = 0.78

export function placeAvatars(
  state: SimulationState,
  scenario: Scenario | null,
  geometry: Geometry,
): AvatarPlacement[] {
  const appearedAt = new Map(scenario?.passengers.map((p) => [p.id, p.at_s]) ?? [])
  const now = state.tick / 10
  const queues = new Map<number, string[]>()
  for (const p of state.passengers) {
    if (p.state !== "waiting") continue
    queues.set(p.from, [...(queues.get(p.from) ?? []), p.id])
  }
  const riders = state.passengers.filter((p) => p.state === "riding").map((p) => p.id)
  const cabinFloorY = geometry.floorBase(state.elevator.position)

  return state.passengers.map((p) => {
    const base = { id: p.id, to: p.to, status: p.state }
    if (p.state === "waiting") {
      const waited = now - (appearedAt.get(p.id) ?? now)
      const slot = queues.get(p.from)!.indexOf(p.id)
      return { ...base, x: queueX(slot), y: geometry.floorBase(p.from), scale: 1, mood: moodForWait(waited), visible: true }
    }
    if (p.state === "riding") {
      const slot = riders.indexOf(p.id)
      return { ...base, x: riderX(slot), y: cabinFloorY, scale: RIDER_SCALE, mood: "happy", visible: slot < VISIBLE_RIDERS }
    }
    return { ...base, x: exitX(p.id), y: geometry.floorBase(p.to), scale: 1, mood: "joy", visible: true }
  })
}
