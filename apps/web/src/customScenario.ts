import { validateScenario, type FleetSpec, type Scenario } from "@elevator/engine"
import { t } from "./i18n/pt-BR"

export type CustomScenario = {
  time_limit_s: number
  passengers: Scenario["passengers"]
}

export const CUSTOM_BUILDING = { min_floor: 0, max_floor: 10 }
export const MAX_PASSENGERS = 26

const DEFAULT_TIME_LIMIT_S = 120
const NEW_PASSENGER_GAP_S = 2
const NEW_PASSENGER_FROM = 0
const NEW_PASSENGER_TO = 5
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const roundToTick = (seconds: number) => Math.round(seconds * 10) / 10
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function initialCustomScenario(): CustomScenario {
  return {
    time_limit_s: DEFAULT_TIME_LIMIT_S,
    passengers: [{ id: "A", at_s: 0, from: NEW_PASSENGER_FROM, to: NEW_PASSENGER_TO }],
  }
}

export function nextPassengerId(passengers: CustomScenario["passengers"]): string | null {
  const used = new Set(passengers.map((p) => p.id))
  return [...LETTERS].find((letter) => !used.has(letter)) ?? null
}

export function addPassenger(custom: CustomScenario): CustomScenario {
  const id = nextPassengerId(custom.passengers)
  if (id === null) return custom
  const lastAppearance = Math.max(0, ...custom.passengers.map((p) => p.at_s))
  const at_s = Math.min(lastAppearance + NEW_PASSENGER_GAP_S, custom.time_limit_s)
  return {
    ...custom,
    passengers: [...custom.passengers, { id, at_s, from: NEW_PASSENGER_FROM, to: NEW_PASSENGER_TO }],
  }
}

export function removePassenger(custom: CustomScenario, id: string): CustomScenario {
  if (custom.passengers.length <= 1) return custom
  return { ...custom, passengers: custom.passengers.filter((p) => p.id !== id) }
}

function editPassenger(
  custom: CustomScenario,
  id: string,
  edit: (p: Scenario["passengers"][number]) => Scenario["passengers"][number],
): CustomScenario {
  return { ...custom, passengers: custom.passengers.map((p) => (p.id === id ? edit(p) : p)) }
}

export function setAppearsAt(custom: CustomScenario, id: string, seconds: number): CustomScenario {
  return editPassenger(custom, id, (p) => ({
    ...p,
    at_s: clamp(roundToTick(seconds), 0, custom.time_limit_s),
  }))
}

export function setFrom(custom: CustomScenario, id: string, floor: number): CustomScenario {
  return editPassenger(custom, id, (p) => (floor === p.to ? { ...p, from: floor, to: p.from } : { ...p, from: floor }))
}

export function setTo(custom: CustomScenario, id: string, floor: number): CustomScenario {
  return editPassenger(custom, id, (p) => (floor === p.from ? p : { ...p, to: floor }))
}

export function setTimeLimit(custom: CustomScenario, seconds: number): CustomScenario {
  const time_limit_s = Math.max(1, Math.round(seconds))
  return {
    time_limit_s,
    passengers: custom.passengers.map((p) => ({ ...p, at_s: Math.min(p.at_s, time_limit_s) })),
  }
}

export const hasServiceElevator = (fleet: FleetSpec) => fleet.some((e) => e.service)

export function setService(custom: CustomScenario, id: string, on: boolean): CustomScenario {
  return editPassenger(custom, id, ({ service: _previous, ...rest }) => (on ? { ...rest, service: true } : rest))
}

export function toScenario(custom: CustomScenario, fleet: FleetSpec = [{ service: false }]): Scenario {
  const withService = hasServiceElevator(fleet)
  return {
    id: "custom",
    title: t.customMode,
    description: t.customScenarioDescription,
    building: CUSTOM_BUILDING,
    start_floor: 0,
    time_limit_s: custom.time_limit_s,
    passengers: custom.passengers.map(({ service, ...rest }) => (service && withService ? { ...rest, service } : rest)),
  }
}

const isPassengerShape = (p: unknown): p is Scenario["passengers"][number] => {
  if (typeof p !== "object" || p === null) return false
  const { id, at_s, from, to, service } = p as Record<string, unknown>
  const serviceOk = service === undefined || typeof service === "boolean"
  return typeof id === "string" && typeof at_s === "number" && typeof from === "number" && typeof to === "number" && serviceOk
}

export function parseCustomScenario(raw: unknown): CustomScenario | null {
  if (typeof raw !== "object" || raw === null) return null
  const { time_limit_s, passengers } = raw as Record<string, unknown>
  if (typeof time_limit_s !== "number" || !Array.isArray(passengers)) return null
  if (passengers.length === 0 || passengers.length > MAX_PASSENGERS) return null
  if (!passengers.every(isPassengerShape)) return null
  const custom = { time_limit_s, passengers }
  return validateScenario(toScenario(custom, [{ service: false }, { service: true }])) === null ? custom : null
}
