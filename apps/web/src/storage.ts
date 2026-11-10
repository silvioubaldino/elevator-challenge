import { MAX_ELEVATORS, type FleetSpec } from "@elevator/engine"
import { parseCustomScenario, type CustomScenario } from "./customScenario"

const CODE_KEY = "elevator-challenge:code"

export function loadSavedCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY)
  } catch {
    return null
  }
}

export function saveCode(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code)
  } catch {
    return
  }
}

const CUSTOM_SCENARIO_KEY = "elevator-challenge:custom-scenario"

export function loadCustomScenario(): CustomScenario | null {
  try {
    const raw = localStorage.getItem(CUSTOM_SCENARIO_KEY)
    return raw === null ? null : parseCustomScenario(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveCustomScenario(custom: CustomScenario): void {
  try {
    localStorage.setItem(CUSTOM_SCENARIO_KEY, JSON.stringify(custom))
  } catch {
    return
  }
}

const DIRECTIONAL_CALLS_KEY = "elevator-challenge:directional-calls"

export function loadDirectionalCalls(): boolean {
  try {
    return localStorage.getItem(DIRECTIONAL_CALLS_KEY) === "true"
  } catch {
    return false
  }
}

export function saveDirectionalCalls(on: boolean): void {
  try {
    localStorage.setItem(DIRECTIONAL_CALLS_KEY, String(on))
  } catch {
    return
  }
}

const FLEET_KEY = "elevator-challenge:fleet"
export const DEFAULT_FLEET: FleetSpec = [{ service: false }]

export function parseFleet(raw: unknown): FleetSpec {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_ELEVATORS) return DEFAULT_FLEET
  const fleet = raw.map((e) => ({ service: typeof e === "object" && e !== null && (e as { service?: unknown }).service === true }))
  return fleet[0]!.service ? DEFAULT_FLEET : fleet
}

export function loadFleet(): FleetSpec {
  try {
    const raw = localStorage.getItem(FLEET_KEY)
    return raw === null ? DEFAULT_FLEET : parseFleet(JSON.parse(raw))
  } catch {
    return DEFAULT_FLEET
  }
}

export function saveFleet(fleet: FleetSpec): void {
  try {
    localStorage.setItem(FLEET_KEY, JSON.stringify(fleet))
  } catch {
    return
  }
}
